# シーケンス: ログイン (Identity Platform → Auth.js セッション)

[ADR-0014](../../adr/0014-auth-switch-to-identity-platform.md) に従う実装。Google ログインと email/password の両方を 1 つのシーケンスで表す (provider 部分のみ分岐)。

```mermaid
sequenceDiagram
    autonumber
    actor U as ユーザ
    participant B as ブラウザ<br/>(Firebase JS SDK)
    participant W as Next.js<br/>(Auth.js v5 Credentials)
    participant IDP as Identity Platform<br/>(Firebase Auth)
    participant API as Hono API<br/>(firebase-admin)
    participant DB as Cloud SQL

    U->>B: /login で Google or email/password 選択
    alt Google
        B->>IDP: signInWithPopup(GoogleAuthProvider)
        IDP-->>B: Firebase ID token (1h TTL)<br/>provider="google.com"
    else Email/Password
        B->>IDP: signInWithEmailAndPassword(email, pw)
        IDP-->>B: Firebase ID token<br/>provider="password"
    end

    B->>W: POST /api/auth/callback/credentials<br/>{idToken}
    W->>IDP: firebase-admin.verifyIdToken(idToken)<br/>(JWKS は SDK が cache)
    IDP-->>W: DecodedIdToken<br/>{uid, email, name, firebase.sign_in_provider}
    W->>W: Auth.js が JWT cookie 発行<br/>(HttpOnly, SameSite=Lax)<br/>session.accessToken = idToken<br/>session.provider = provider
    W-->>B: Set-Cookie: authjs.session-token<br/>+ 302 to /timeline

    B->>W: GET /timeline (RSC)
    W->>API: GET /api/records<br/>Authorization: Bearer {idToken}
    API->>IDP: firebase-admin.verifyIdToken(idToken)
    IDP-->>API: DecodedIdToken<br/>{uid, email, provider, admin?}
    API->>API: 三段 isAdmin 判定<br/>(Tier 1: custom claim<br/> Tier 2: OWNER && provider=="password"<br/> Tier 3: x-admin-token)
    API->>DB: prisma.user.upsert<br/>where: {globalUid: uid}<br/>(初回ログインで自動 provision)
    DB-->>API: User row
    API->>DB: prisma.symptom.findMany 他<br/>where: {userId, deletedAt: null}
    DB-->>API: records[]
    API-->>W: { items: [...] }
    W-->>B: SSR HTML
```

## ポイント

- **ブラウザは ID token を直接 API に投げない**: Auth.js Credentials provider 経由で HttpOnly cookie に格納してから、SSR の RSC が `Authorization: Bearer` で API を呼ぶ。これにより `Cache-Control: no-store` の HTML 経路と整合
- **ID token は 1h TTL**: ブラウザ滞在が長くなると API 呼び出しで `expired` 401。Firebase SDK が refresh token で自動更新するが、Auth.js cookie 内の値は古いまま。長時間使う画面 (写真アップロード等) では `getCurrentIdToken()` で都度 fresh token を取り直す
- **Tier 2 の核心**: `OWNER_EMAIL && provider==="password"` の場合のみ admin。Google ログインで管理画面に入れない仕様 (ADR-0011 改訂)
- **break-glass (Tier 3)**: Firebase 完全停止時の救済。`x-admin-token` ヘッダ付き curl で API を直接叩く CLI 経路
- **初回ログイン**: `prisma.user.upsert` が User 行を自動作成 (`globalUid` = Firebase UID、`email`, `displayName` を Firebase から)

## 実装参照

- `apps/web/lib/firebase-client.ts` — Firebase JS SDK init + signIn helper
- `apps/web/components/LoginCard.tsx` — ログイン UI
- `apps/web/auth.ts` — Auth.js v5 Credentials provider
- `apps/web/auth.config.ts` — Edge-safe な NextAuth 設定 (middleware から import)
- `apps/api/src/index.ts` (auth middleware 内) — firebase-admin で ID token verify + 三段 admin 判定 + user upsert
