# ADR-0013: 2026-05-27 運用・実装補足束

- Status: Accepted
- Date: 2026-05-27
- Deciders: ユーザー（オーナー）、Claude（提案）

> **改訂注記 (2026-05-26 ADR-0014 反映)**: 本 ADR の補足のうち Keycloak 前提のものは [ADR-0014](0014-auth-switch-to-identity-platform.md)（認証基盤を GCP Identity Platform に切替）で読み替える:
>
> - **S-2**: 「Keycloak ロール」による認可 → Firebase Custom Claim `admin:true`。OIDC トークン検証 → `firebase-admin` の `verifyIdToken`。`global_uid` は `users.global_uid` 直保管（`user_link` 廃止）
> - **S-3**: 「Keycloak は Cloud Run + min instance 1」→ Keycloak 廃止により無効（Identity Platform はマネージドで cold start の対象外）
> - **S-8**: 匿名認証派生論点は Keycloak 前提のため再整理が必要（Firebase は `signInAnonymously` / `linkWithCredential` を標準提供。ただし FN-AUTH-03 / FN-AUTH-08 は未実装）
>
> その他の運用補足 (S-1, S-4〜S-7) は引き続き有効。本文は当時の決定の記録として残す。

> **実装状況注記 (2026-06-01、フェーズ 6)**: 各補足の実装状況:
>
> | 補足 | 実装状況 |
> |---|---|
> | S-1 Cloud LB + Cloud Armor | ❌ 未実装（現状は Cloud Run 直公開。フェーズ 7 以降） |
> | S-2 row-level 認可 | ✅ 実装済（Firebase 読み替え版。`WHERE user_id` 強制） |
> | S-3 Keycloak min instance | —（ADR-0014 で無効） |
> | S-4 CI/CD 規約 | ⚠️ 部分（migrate 先行 = `05-migrate-prod.sh` は遵守。自動デプロイ自体が未実装で手動運用） |
> | S-5 Terraform 規約 | ❌ 未実装（現状は gcloud bash。Terraform 移行はフェーズ 7 以降） |
> | S-6 観測規約 | ⚠️ 部分（Cloud Logging は稼働。OpenTelemetry / Cloud Trace / アラートポリシーは未実装） |
> | S-7 AI cognition-shifting | ✅ 実装済（プロンプトに反映） |
> | S-8 匿名認証派生論点 | —（FN-AUTH-03 自体が未実装） |

## Context（背景）

`review-summary.md` 時点（2026-05-26）でフェーズ 0〜3 のドキュメントは完成済みだが、フェーズ 4（スケルトン実装）着手前のセッションで、既存 ADR では明示されていなかった運用規約・実装細則を確認した。それらを散発的に各 ADR に追記すると意思決定の発生時刻が読み取りづらくなるため、本 ADR に束ねて記録する。各補足は対応する既存 ADR を **補完** するものであり、矛盾する場合は対応 ADR 側を優先する。

## Decision（決定）

8 件の運用・実装補足を採用する。

### S-1: 入口は Cloud Run + グローバル Cloud Load Balancing（関連: ADR-0005）

Cloud Run サービス前段に Cloud Load Balancing を必ず置き、Cloud Armor / WAF / カスタムドメイン / IPv6 / 将来の Identity-Aware Proxy 連携を一括で扱う。GCP API Gateway は不採用（OpenAPI 連携の旨味より重さが上回る）。

### S-2: 認可は API 内部 row-level + Keycloak ロール、RLS / OPA は不採用（関連: ADR-0004）

- Postgres Row Level Security は不採用（デバッグ複雑化、Prisma との相性も悪い）。schema.md §10 の「将来検討」記述は本 ADR で **採用しない方針に変更**
- OPA / Cedar 等の外部ポリシーエンジンも不採用（個人〜中規模スコープでは over-engineering）
- 認可は Hono ミドルウェアで OIDC トークン検証 → `global_uid` から内部 `user_id` 解決 → 各クエリで `WHERE user_id = $1` を強制する共通ヘルパ経由、を唯一の経路とする

### S-3: Keycloak は Cloud Run + min instance 1（関連: ADR-0002、詳細設計書 §6）

cold start を回避するため `--min-instances=1` を設定。シングルノード運用、状態はすべて Cloud SQL に集約、Infinispan/JGroups クラスタは採用しない。HA 要件が高まった場合に GKE 移行を検討する。

### S-4: CI/CD 運用規約（関連: ADR-0005、詳細設計書 §8）

- **逆互換でない DB 変更は 2-step デプロイ** で分割: ①新カラム追加 + デュアル書き込み → リリース → ②旧カラム削除 → 別リリース。1 PR にまとめない
- **アプリ起動時 (Cloud Run startup) の migrate は採用しない**。複数インスタンス起動時の競合とロールバック困難のため。migrate は CI ジョブで先行実行し、成功後に Cloud Run デプロイ
- **canary は採用しない**。個人〜中規模スコープではシグナルが弱く、検知ノイズに埋もれる。Cloud Run リビジョン機能による即時ロールバックで代替
- **main マージ自動デプロイは採用しない**。stg → 検証 → prd の手動承認フローを守る

### S-5: Terraform 運用規約（関連: ADR-0005）

- 状態ファイルは GCS バックエンド + オブジェクトバージョニング + ステートロック
- 環境差分は Terraform workspace ではなく **明示的ディレクトリ分離** (`environments/dev`, `environments/stg`, `environments/prd`)
- Folder で `cares-*` / `identity-*` をまとめ、組織ポリシーは Folder 単位で一括適用
- 「コンソール手動作成 → 後で import」は禁止、新規リソースは常に Terraform から

### S-6: 観測運用ルール（関連: ADR-0005、ADR-0012）

- アプリケーションは **OpenTelemetry SDK** で trace を生成し OTLP → Cloud Trace。各サービス共通
- ログは **構造化 + ホワイトリスト方式**: Pino 等で「明示的に許可したフィールドだけ出力」。request/response body の無検査ダンプは PR で reject
- アラート閾値の最小セット: 5xx 率 (1 分窓) / p95 レイテンシ (5 分窓) / Cloud SQL CPU・disk・connection / エラーレベル log の急増
- PagerDuty / Opsgenie は個人運用フェーズでは不要、Cloud Monitoring → メール / Slack Incoming Webhook で十分

### S-7: AI 出力原則 — cognition-shifting output（関連: ADR-0006、`data-sovereignty-journaling` スキル）

AI 出力は単なる記録の繰り返しではなく、蓄積データを根拠に「最新・最適・新しい視点」を提示し、**具体的な次の 1 アクションを必ず 1 つ含める**。これは旧仕様 CLAUDE.md とスキル `.claude/skills/data-sovereignty-journaling/SKILL.md` の中核原則を ADR にも明示するもの。プロンプト設計・要約 (FN-AI-05〜07)・解析 (FN-AI-02〜03) すべてで本原則を満たすこと。

### S-8: 匿名認証の未解決派生論点を明示（関連: ADR-0002）

ADR-0002 で「匿名認証を残す」「正規アカウントへ昇格可能」とは決めたが、以下 3 点はフェーズ 4 で詳細設計が必要:

1. 匿名 `global_uid` の発行主体 — Keycloak は標準では匿名アカウントを持たないため、cares 側発行 + Keycloak 連携、Keycloak カスタム拡張、のどちらか
2. 匿名 → 正規昇格時の `user_link` 行マイグレーション手順、および `drafts` / `text_entries` 等の所有者付け替え UX
3. 匿名ユーザーへの `/api/cache-key` 発行ロジック — OIDC トークンがない状態でどう本人性を担保するか（デバイスバウンドトークン等）

## Consequences（含意）

- 既存 ADR を破壊せず、フェーズ 4 着手時に「2026-05-27 時点で追加合意された運用規約」を 1 ファイルで参照できる
- S-2 で schema.md §10 の「RLS 将来検討」記述を覆したため、schema.md 側の文言は次回更新時に修正する
- S-8 で挙げた 3 つの未解決論点はフェーズ 4 で詳細設計（ADR 追加 or 詳細設計書改訂）が必要

## Alternatives Considered（検討した代替案）

- **各既存 ADR に直接追記**: 履歴が追えなくなるため不採用。ただし将来の大幅な再構成時には既存 ADR にマージしてもよい
- **8 件を 8 本の独立 ADR に分割**: 厳密だが今日の確認は同一セッションでの運用補足が中心で、独立 ADR にする意思決定の重みではない
