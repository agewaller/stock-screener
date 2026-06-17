# Architecture Decision Records (ADR)

新仕様 cares のアーキテクチャ意思決定を記録するディレクトリ。

## ADR とは

ある時点で、なぜそのアーキテクチャを選んだのかを残す軽量な記録。コードは変わるが「なぜそうした」は残る。後から振り返るとき、別の決定を検討するときの土台となる。

## フォーマット

各 ADR は以下の構造で記述する:

```markdown
# ADR-NNNN: 決定のタイトル

- Status: Proposed / Accepted / Deprecated / Superseded by ADR-XXXX
- Date: YYYY-MM-DD
- Deciders: ユーザー（オーナー）、Claude（提案）

## Context（背景）
何が問題か。どんな制約があるか。

## Decision（決定）
何を採用したか。

## Consequences（含意）
良い面、悪い面、トレードオフ、後で再検討すべきこと。

## Alternatives Considered（検討した代替案）
他に何があったか、なぜそれを採らなかったか。
```

## 索引

| # | タイトル | Status | 関連論点 |
|---|---|---|---|
| [0001](0001-rearchitecture-from-firebase-to-gcp.md) | Firebase 中心アーキテクチャから GCP + PostgreSQL への全面刷新 | Accepted | 論点 1 |
| [0002](0002-sso-lv2-with-keycloak.md) | SSO Lv2: Keycloak セルフホスト中央 IdP | **Superseded by ADR-0014** | 論点 2 |
| [0003](0003-frontend-stack-nextjs.md) | フロントエンド: Next.js + Tailwind + shadcn/ui | Accepted | 論点 3 |
| [0004](0004-backend-stack-typescript-hono-prisma.md) | バックエンド: TypeScript + Hono + Prisma（FE/BE 分離） | Accepted | 論点 4 |
| [0005](0005-gcp-services-and-environments.md) | GCP サービス選定と環境戦略 | Accepted | 論点 5 |
| [0006](0006-ai-provider-strategy.md) | AI プロバイダ戦略（3 社継続、サーバ専有鍵） | Accepted | 論点 6 |
| [0007](0007-browser-pii-prohibition.md) | ブラウザに PII を置かない原則 + IndexedDB 暗号化キャッシュ | Accepted | 論点 7 |
| [0008](0008-multi-tenant-ready-schema.md) | マルチテナント対応スキーマ（MVP は B2C） | Accepted | 論点 8 |
| [0009](0009-integration-porting-priorities.md) | 外部連携の移植優先度 | Accepted | 論点 9 |
| [0010](0010-data-migration-strategy.md) | データ移行戦略（自動移行 + クリーンカットオーバー） | Accepted | 論点 10 |
| [0011](0011-admin-model-with-failsafe.md) | 管理者モデル（三段フェイルセーフ） | Accepted (revised 2026-05-26 for ADR-0014) | 論点 11 |
| [0012](0012-nfr-baseline.md) | 非機能要件のベースライン | Accepted | 論点 12 |
| [0013](0013-2026-05-27-operational-supplements.md) | 2026-05-27 運用・実装補足束（入口 LB、RLS 不採用、Keycloak min1 (ADR-0014 で撤回)、CI/CD 規約、Terraform 規約、観測規約、AI cognition-shifting、匿名認証派生論点） | Accepted | 運用補足 |
| [0014](0014-auth-switch-to-identity-platform.md) | 認証基盤を GCP Identity Platform (Firebase Auth) に切替 | Accepted | 論点 2 改訂 |
| [0015](0015-staging-environment-in-prod-project.md) | ステージング環境を本番 GCP プロジェクト内に共存構築 | Accepted | 論点 5 改訂 |
| [0016](0016-public-trial-ai-endpoint.md) | ログイン不要のお試し AI 分析（公開 AI エンドポイント） | Accepted | Issue #27 |
| [0017](0017-revenue-model-and-gtm.md) | 収益モデルと Go-To-Market 戦略（B2B2C 主軸＋医師経由推奨） | Accepted | テスター FB |
| [0018](0018-physical-capital-profile-v2.md) | フィジカルキャピタル・プロフィール v2（機微カテゴリ拡張＋項目別同意） | Accepted | 健康学OS #47 |
