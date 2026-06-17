# ADR-0014: 認証基盤を GCP Identity Platform (Firebase Auth) に切替

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）
- Supersedes: [ADR-0002](0002-sso-lv2-with-keycloak.md) (Keycloak セルフホスト中央 IdP)

## Context

ADR-0002 では中央 IdP として Keycloak セルフホストを採用したが、オーナーから次の指示があった:

> 「Google アカウントでログインできる機能を GCP の Identity Platform で実装。
> Google アカウントでログインしたくない人のために一般的な ID/パスワードでログインも実装。
> admin (owner) 権限のアカウントは ID でログインする仕様にしてください」

つまり:

1. **GCP Identity Platform で実装** (Keycloak セルフホスト廃止)
2. Google sign-in + email/password sign-in の両方を提供
3. オーナーは email/password でログインしたときだけ admin (Google ログインでは admin にならない = アカウント乗っ取り時の管理画面遮断)

加えて、Keycloak セルフホストは運用負担が大きく (Realm 設定 / バックアップ / アップグレード / SSO 用の Identity Brokering 設定など)、フェーズ 5 中の cares 単体運用では over-engineering だった。

## Decision

### 認証基盤を GCP Identity Platform (= Firebase Auth) に切替

- Provider: Google + Email/Password
- dev / staging / prod すべてで本物の GCP Identity Platform を使う (Emulator は使わない)
- Authorized domains に `localhost` を追加して dev でも本物のフローを使う

### Session 戦略: Auth.js v5 + Credentials provider

クライアントが Firebase ID token を取得 → Auth.js の Credentials provider に POST → `firebase-admin` で `verifyIdToken` → Auth.js が HttpOnly cookie (`authjs.session-token`) に session 載せる → 既存の 19 個の SSR consumer (`auth()` / `session.accessToken`) は**変更不要**。

代替の「Firebase Admin の `createSessionCookie` 直接」は 19 個の caller を全部書き換える必要があり却下した。

### API token verify: `firebase-admin`

`apps/api/src/index.ts` の JWT verify middleware を `jose.createRemoteJWKSet` (Keycloak JWKS) から `firebase-admin` の `getAuth().verifyIdToken()` に置き換えた。Admin SDK は cert ローテーション自動、`DecodedIdToken` 型あり、`firebase.sign_in_provider` claim が型で見える。

### Admin 三段フェイルセーフ (ADR-0011 改訂)

| Tier | 旧 (Keycloak) | 新 (Firebase) |
|---|---|---|
| 1 | Keycloak realm role `admin` | Firebase **Custom Claim** `admin: true` |
| 2 | `email === OWNER_EMAIL` | `email === OWNER_EMAIL` **AND** `firebase.sign_in_provider === "password"` |
| 3 | Break-glass `x-admin-token` (未実装) | Break-glass `x-admin-token` (**実装した**) |

Tier 2 の "AND password" がオーナー指示の核心実装。詳細は ADR-0011 を参照。

### DB 主軸 identity を Firebase UID に

`User.global_uid String @unique` を追加。API middleware は `prisma.user.upsert({ where: { globalUid: decoded.uid } })` で UID ベースに upsert。email も unique のまま (Tier 2 判定で必要)。

### ブラウザ側 persistence: IndexedDB

ADR-0007 (ブラウザに PII を localStorage に置かない) を遵守するため、Firebase SDK の `setPersistence(indexedDBLocalPersistence)` を初期化時に強制。Auth.js session は HttpOnly cookie に格納。

### 新規アカウント作成ポリシー

- **Google**: 初回 sign-in で自動 provision (誰でも一般ユーザとして利用開始可能)
- **Email/Password**: admin script `apps/api/scripts/create-pw-user.ts <email>` で作成 + パスワード再設定リンク経由でセットアップ → UI からの signup は **提供しない** (email/password は admin 経路の防御も兼ねるため攻撃面を最小化)
- パスワードリセット: 通常の `sendPasswordResetEmail()` を login page から提供

### Owner の admin 付与手順

1. オーナーが email/password で Identity Platform に登録される (admin script で作成)
2. `pnpm tsx apps/api/scripts/grant-admin.ts agewaller@gmail.com` を実行 (custom claim 付与)
3. オーナーは email/password で login すると Tier 1 + Tier 2 の両方を満たして admin
4. 万一 Tier 1 が剥がれても Tier 2 (OWNER_EMAIL + password) で救済
5. 全てダメなら CLI から Tier 3 (`x-admin-token`) で復旧可能

## Consequences

### 良い面

- Keycloak / identity-db / Realm JSON / Identity Brokering 設定 の運用負担ゼロ
- Google sign-in と email/password が標準機能で提供される
- オーナーの管理画面が Google アカウント乗っ取りから守られる (Tier 2 password 縛り)
- Firebase Admin SDK が admin script (custom claim、user 作成、パスワードリセットメール送信) を一気通貫で提供
- `apiKey` は public で OK (Identity Platform 側で Authorized domains で守る)
- `firebase-admin` は無料枠で問題ない

### 悪い面

- ADR-0002 の SSO Lv2 (中央 IdP) 設計は撤回 → ValuationMatrix / zen-track との SSO は同じ Identity Platform を共有する形で再設計が必要 (本 ADR スコープ外)
- 本番では GCP Cloud Console での手動セットアップが必要 (provider 有効化、authorized domains、service account JSON ダウンロード)
- service account JSON の安全な配布が必要 (dev は .env、prod は Secret Manager)

### 派生タスク

- ValuationMatrix と同じ Identity Platform プロジェクトに乗り換える話 (アカウント共通化、別 ADR で議論)
- prod 環境の Secret Manager に `FIREBASE_SERVICE_ACCOUNT_JSON` と `ADMIN_BREAKGLASS_TOKEN` を保管
- Cloud Run の env からこの 2 つを参照する Terraform (フェーズ 6 以降)
- MFA 強制 (admin 用) の検討
- 既存ユーザデータの本番移行は不要 (dev のみで運用中、本番未デプロイ)

## Alternatives Considered

- **Keycloak で Google IDP を有効化**: ADR-0002 を維持しつつ Identity Brokering で Google login も可能だが、運用負担が変わらない + オーナー指示と一致しない。
- **Firebase Auth Emulator (dev のみ)**: 本物との挙動差で罠を踏むリスクあり、オーナー指示は「dev でも本物を使う」。
- **createSessionCookie 直接**: 既存 19 個の `auth()` caller を全書き換え。費用対効果が悪い。
- **NextAuth Firebase OAuth provider**: 既存にあるが email/password と Google の両方を1 provider にまとめにくい → Credentials provider で `firebase-admin` 経由が一番素直。

## Addendum 2026-06-09: セッション維持と ID トークン更新 (#63)

実機テスターから「毎回ログインが必要」との指摘 (#63)。原因は Auth.js セッションの
`maxAge` を Firebase ID token の TTL (1h) に合わせていたため、1 時間でセッション失効していたこと。

決定 (オーナー承認: リフレッシュトークン方式):

- Auth.js セッション `maxAge` を **30 日**に延長。
- ログイン時に Firebase **refresh token** も受け取り (`loginWith*` が `{idToken, refreshToken}` を返す
  → Credentials provider → jwt callback)、**jwt callback で ID token を自動更新** (securetoken
  エンドポイント) する。期限内は再利用、期限切れのみ更新。失敗時は `session.error =
  "RefreshAccessTokenError"` を立てる。
- refresh token は **Auth.js が暗号化する HttpOnly セッション Cookie 内のみ**に保持する。
  ブラウザ JS からは読めず、localStorage / IndexedDB には置かないため **ADR-0007 と整合**
  (ブラウザに PII を残さない)。
- これにより SSR (server component の fetch) でも常に有効なアクセストークンを保てる。

実装: `apps/web/auth.config.ts` (jwt rotation), `apps/web/auth.ts` (credentials),
`apps/web/lib/firebase-client.ts` (`LoginTokens`)。テスト: `tests/unit/lib/auth-config.test.ts`。

## Implementation reference

- API middleware: `apps/api/src/index.ts` (JWT verify + break-glass + 三段 admin)
- Web auth: `apps/web/auth.ts` (Credentials provider)
- Web client SDK: `apps/web/lib/firebase-client.ts`
- Login UI: `apps/web/components/LoginCard.tsx` + `apps/web/app/page.tsx`
- Admin scripts: `apps/api/scripts/grant-admin.ts`, `apps/api/scripts/create-pw-user.ts`
- Compose: `docker-compose.yml` (keycloak / identity-db 削除済)
- DB migration: `packages/db/prisma/migrations/<ts>_auth_firebase_uid/`
