# ADR-0001: Firebase 中心アーキテクチャから GCP + PostgreSQL への全面刷新

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

> **改訂注記 (2026-05-26)**: 本 ADR が言及する「認証 = Keycloak セルフホスト（中央 IdP）」は撤回された。
> 認証基盤は GCP Identity Platform (Firebase Auth) + Auth.js v5 に置き換え ([ADR-0014](0014-auth-switch-to-identity-platform.md))。
> Firebase → GCP 全面刷新という本 ADR の核の決定は引き続き有効。本文は当時の決定の記録として残す。

## Context

現行アーキテクチャは「ブラウザ vanilla JS SPA + Firebase Authentication + Firestore + Cloudflare Worker（AI プロキシ） + GitHub Pages（静的配信）」で構成されている。サービス継続中・数十人規模・1 年以上の運用実績がある。

しかし以下の構造的限界が顕在化:

1. **データ主権の問題**: 個人の医療情報（病気・症状・血液検査値・写真）を Firestore（Google 配下）に置いており、将来の規制対応・コンプライアンス・データ統制の自由度が低い。
2. **データモデルの限界**: Firestore のコレクション/ドキュメント構造ではリレーショナルクエリ・集計・JOIN が困難。健康データの相関分析・縦断解析が将来必要になる。
3. **パフォーマンス制御権の欠如**: Firestore の読み取り回数課金・スケーリング特性は外部からチューニング不可。負荷が増えるとコスト直撃。
4. **コード品質の限界**: vanilla JS + 13 モジュール構成は維持・拡張のコストが高い。型安全性・テスト容易性・チーム開発対応が困難。
5. **SSO 要件**: ValuationMatrix / zen-track 等の自社サービスと共通アカウントでの利用を将来要件として確定。Firebase Auth 単独構成では実現困難。

## Decision

アーキテクチャを以下に全面転換する:

- **ホスティング**: GitHub Pages → **Cloud Run（GCP）**
- **DB**: Firestore → **Cloud SQL for PostgreSQL**
- **認証**: Firebase Authentication → **Keycloak セルフホスト（中央 IdP）**（ADR-0002）
- **フロントエンド**: vanilla JS → **Next.js + TypeScript**（ADR-0003）
- **バックエンド**: Cloudflare Worker（薄いプロキシ） → **TypeScript + Hono BE on Cloud Run**（ADR-0004）
- **シークレット**: localStorage / Worker env → **Secret Manager**

サービス継続のため、既存ドメイン `cares.advisers.jp` を引き継ぎ、データ・アカウントは自動移行する（ADR-0010）。

## Consequences

### 良い面

- データを自社管理 DB に保管、リージョン・暗号化・アクセスログを完全に制御
- RDBMS によるリレーショナル設計で、複雑なクエリ・集計・縦断解析が可能に
- パフォーマンスは自前 API + DB チューニングで制御可能
- 型安全性・テスト容易性・コード品質の向上
- SSO 基盤を初期から組み込むことで、自社サービス群（ValuationMatrix / zen-track）との連携が実現
- GCP に集約することで運用ノウハウが ValuationMatrix 等と共有可能

### 悪い面

- 初期実装コストが大きい（フロントエンド・バックエンド・認証基盤すべてを再構築）
- 運用負荷の増加（Firebase は完全マネージドだったが、Keycloak / Cloud Run / Cloud SQL は自前運用）
- Firebase の便利機能（リアルタイム同期、Cloud Functions の容易さ）を捨てる
- 既存ユーザーへの移行リスク（パスワードリセット強制、匿名ユーザーの扱い）

### トレードオフ

- 完全マネージド SaaS の楽さ vs データ主権・実装自由度
- 短期コスト vs 長期戦略的価値

## Alternatives Considered

- **Firebase のまま継続**: コスト最小だがデータ主権・スケール・SSO 要件を満たせない。動機の各カテゴリすべてに該当する以上、現状維持は選べない。
- **Supabase（PostgreSQL ベースの Firebase 代替）**: PostgreSQL は手に入るが、データを Supabase に置くこと自体が外部依存。データ主権原則と矛盾。CLAUDE.md で既に却下済み。
- **AWS / Azure**: GCP 以外のクラウドも候補だが、ValuationMatrix が GCP Identity Platform で動いており、SSO 連携・運用ノウハウの観点で GCP を維持する方が合理的。
- **段階移行**: Firebase の一部を残しつつハイブリッド構成。複雑度が増し、データ主権原則が骨抜きになるため不採用。
