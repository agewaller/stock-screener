# ADR-0005: GCP サービス選定と環境戦略

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

## Context

ADR-0001 で GCP への全面移行を確定。具体的にどの GCP サービスを使い、prod / staging / dev をどう分けるかを決める必要がある。

データ主権原則（個人情報・PHI を国内に保管）、ADR-0002 の Keycloak セルフホスト、ADR-0004 の Cloud Run 上の Next.js / Hono、これらすべてを成立させる構成を決める。

## Decision

### コアサービス

| カテゴリ | 採用 |
|---|---|
| コンピュート | **Cloud Run**（Next.js FE / Hono BE / Keycloak すべて） |
| RDB | **Cloud SQL for PostgreSQL** |
| キャッシュ | **MVP では不採用**（負荷で必要になったら Memorystore for Redis） |
| オブジェクトストレージ | **Cloud Storage** |
| シークレット管理 | **Secret Manager** |
| コンテナレジストリ | **Artifact Registry**（`shared` プロジェクトに集約） |
| 監視・ログ | **Cloud Logging + Cloud Monitoring** |
| IaC | **Terraform** |
| CI/CD | **GitHub Actions** |
| DNS | **Cloud DNS** |

### リージョン

**asia-northeast1（東京）** の単一リージョン。マルチリージョン DR は MVP スコープ外。

### 環境

**dev / staging / prod の 3 環境**。

### GCP プロジェクト構造（service × environment）

```
cares-dev          cares-staging          cares-prod
identity-dev       identity-staging       identity-prod
vm-dev             vm-staging             vm-prod          ← 既存 VM の整理対象
zen-track-dev      zen-track-staging      zen-track-prod   ← 将来
shared                                                      ← Artifact Registry / 集約監視 / 請求集約
```

- 障害隔離・コスト可視化・権限分離が明確
- Terraform でテンプレ化することで管理コストを抑制

### ネットワーキング

- 各環境内に **VPC を 1 つ**
- Cloud Run → Cloud SQL は **Private IP + Serverless VPC Access**
- Cloud SQL の Public IP は**無効化**
- 環境間（dev/staging/prod）は完全分離

### DNS マッピング

- `cares.advisers.jp` → cares-prod
- `staging.cares.advisers.jp` → cares-staging
- `dev.cares.advisers.jp` → cares-dev（または個別ブランチプレビュー）
- 同様に `identity.advisers.jp`, `vm.advisers.jp` 等を計画

## Consequences

### 良い面

- データ主権・規制対応の自由度が最大化（東京リージョン、自社管理）
- 環境完全分離で本番事故リスクを最小化
- プロジェクト単位でコスト・権限が見えるので運用が透明
- Cloud Run の従量課金で MVP コストを抑えやすい
- GitHub Actions 継続で既存 CI/CD ノウハウを活用

### 悪い面

- GCP プロジェクト数が多くなる（4 サービス × 3 環境 + shared = 13）。Terraform 必須
- VPC / Private IP 構成は初期セットアップが複雑（Serverless VPC Access、Cloud SQL Private IP 等の組み合わせ）
- Cloud Run の起動レイテンシ（コールドスタート）に注意

### 派生タスク

- Terraform モジュール設計（cares モジュール、identity モジュール等を環境横断で使い回す）
- IAM ロール設計（最小権限の原則、サービスアカウント分離）
- 監視・アラートルール設計（Error Rate / Latency / Cost）
- 災害復旧手順書（Cloud SQL PITR からの復元演習）
- DNS ゾーン管理方針（Cloud DNS で advisers.jp 全体を集約管理）

## Alternatives Considered

- **GKE（Kubernetes）**: Cloud Run で当面十分。GKE は学習コストと運用負荷が重く、MVP には過剰。
- **AlloyDB**: 高性能・ベクトル検索内蔵で魅力的だが、コスト高。Cloud SQL でも pgvector エクステンションは使えるので、当面 Cloud SQL で十分。
- **マルチリージョン**: 数十人規模 MVP には過剰。DR 要件が高まった段階で再検討。
- **us-central1 等の海外リージョン**: AI API には近いが、医療データを海外に置くのはデータ主権方針と矛盾。
- **1 プロジェクトに環境を同居**: シンプルだが障害隔離・権限分離が弱い。本番事故のリスクが高い。
- **Datadog / Grafana Cloud（外部 SaaS）**: 機能高いがコスト高、ログを外部に出すのはデータ主権方針と要レビュー。GCP ネイティブで十分。
