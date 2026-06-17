# ADR-0011: 管理者モデル（三段フェイルセーフ）

- Status: Accepted (revised 2026-05-26 to align with [ADR-0014](0014-auth-switch-to-identity-platform.md))
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

## Context

旧仕様の絶対原則として「管理者 `agewaller@gmail.com` を絶対にロックアウトしない」がある。設定ミスや認証基盤の障害で管理者が自分のサービスから締め出される事故は、これまで何度か対策コードを足してきた経緯がある。

ADR-0014 で認証基盤を Keycloak から GCP Identity Platform (Firebase Auth) に変更した。本 ADR はその新基盤に合わせて「三段フェイルセーフ」を再定義する。

**追加要件 (2026-05-26)**: オーナーが Google アカウント (Gmail) を乗っ取られた場合のリスクを最小化するため、**オーナーは email/password でログインしたときのみ admin 権限を取得**できる。Google ログインだけでは admin にならない。

## Decision

### 三段フェイルセーフ (新)

「オーナーを絶対にロックアウトしない」原則を 3 つの独立機構で担保する。

#### Tier 1: Firebase Custom Claim `admin: true`

- `firebase-admin` SDK の `setCustomUserClaims(uid, { admin: true })` で付与
- 付与スクリプト: `apps/api/scripts/grant-admin.ts`
- API middleware は ID token の `decoded.admin === true` を見て isAdmin = true
- 複数管理者をサポート (オーナー以外にも付与可能)
- **claim を持つユーザは Google login でも admin になる** (Tier 2 の「password 強制」はオーナー専用の追加保険)
- claim 付与後は `revokeRefreshTokens` を呼んで強制再ログインさせる (古い token に古い claim が残らない)

#### Tier 2: OWNER_EMAIL + password provider

- BE 側に `OWNER_EMAIL` 環境変数 (デフォルト `agewaller@gmail.com`)
- ID token の `email` が OWNER_EMAIL に一致 **かつ** `firebase.sign_in_provider === "password"` のときのみ admin
- Tier 1 が外れていても (例: 誤って custom claim を削除した)、オーナーは password でログインすれば admin に戻れる
- **Google ログインでは admin にならない**: Gmail アカウントが乗っ取られても管理画面は守られる

#### Tier 3: ブレークグラストークン

- 環境変数 `ADMIN_BREAKGLASS_TOKEN` (= `openssl rand -hex 32`)
- HTTP ヘッダ `x-admin-token` 一致で Firebase verify をスキップして admin として通す
- Firebase / Identity Platform 完全障害時の最終手段
- 使用時は `event: "breakglass_admin_used"` の警告ログを必ず出す (audit 可能)
- 通常ログインフローでは使わない (CLI からの緊急操作のみ)

### 複数管理者の運用

- Tier 1 で任意のユーザに admin を付与可能 (`pnpm tsx apps/api/scripts/grant-admin.ts <email>`)
- OWNER 以外の admin は Google login でも email/password login でも admin になれる (claim ベース)
- OWNER だけが「Google login では admin に**ならない**」例外運用

### 管理者向け機能

- プロンプト管理 (DB 駆動、`/admin/prompts` で 157 件編集可)
- API キー管理 (Secret Manager 相当を DB で実装、`/admin/secrets`。**鍵値は決して返さない**)
- データ管理、ユーザ一覧、監査ログ、AI モデル、通知キャンペーン

### 管理操作の監査ログ

- すべてユーザ本人にも公開 (ADR-0007 の監査ログ原則と整合)
- 「管理者があなたのデータに read/write/export した」が `/audit-log` で見える

### 認可ガード

すべての管理 API は共通 middleware で「Firebase custom claim OR (OWNER_EMAIL + password provider) OR break-glass token」の三重チェック。実装は `apps/api/src/index.ts` の認証 middleware 内。

### MFA

- Tier 1 (custom claim 持ち) の admin に対しては Identity Platform の MFA (SMS / TOTP) 強制を将来検討
- 現状は Tier 2 の「password provider 必須」で一段の追加保険を実装済み (本 ADR で追加)

## Consequences

### 良い面

- 単一障害点 (Identity Platform 障害、custom claim 設定ミス、Google アカウント乗っ取り) でオーナーがロックアウトされない
- Google アカウント乗っ取り時に admin 操作はできない (Tier 2 の password 必須)
- 複数管理者で運用可能 (custom claim 付与で簡単)
- ブレークグラスは緊急時のみ、通常運用に影響しない

### 悪い面

- オーナーは admin 操作のたびに email+password ログインが必要 (Google login だと一般ユーザ扱い)
- custom claim は token に焼き込まれるので、剥奪後も最大 1h は token に残る (`revokeRefreshTokens` で強制再ログインさせる必要あり)
- ブレークグラストークンの管理が必要 (環境変数のみ、誤って漏れないように)

## Alternatives Considered

- **Firebase custom claim のみ**: claim を誤って剥がしたらロックアウト。Tier 2 で救済。
- **OWNER_EMAIL のみハードコード (旧 ADR-0011)**: Google login だけで admin になれてしまい乗っ取りリスクが残る → 拒否。
- **ブレークグラスなし**: Identity Platform 完全障害時に管理操作が一切不可能。
- **MFA 強制**: 実装はできるが Tier 2 の password 縛りでも十分強い (現状は Tier 2 のみ)。
