# ADR-0004: バックエンド: TypeScript + Hono + Prisma（FE/BE 分離）

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

## Context

ADR-0001 で「自前 WEB API でパフォーマンスを制御」が方針として確定。ADR-0003 でフロントエンドは Next.js + TypeScript に決定。バックエンドの言語・フレームワーク・API スタイル・DB アクセス層を決める必要がある。

AI API 統合（Anthropic / OpenAI / Gemini）が中核機能であり、SDK 成熟度の観点で TypeScript と Python が双璧。

## Decision

| 項目 | 採用 |
|---|---|
| 言語 | **TypeScript / Node.js** |
| FE/BE 境界 | **分離**（Next.js FE/BFF + 別 BE API on 別 Cloud Run サービス） |
| BE フレームワーク | **Hono**（軽量・Cloud Run と相性良し） |
| API スタイル | **REST + OpenAPI + Zod** |
| ORM | **Prisma** |
| 共有スキーマ | `packages/shared` で Zod スキーマを FE/BE で共有 |

### モノレポ構成（想定）

```
apps/
  web/        # Next.js FE（Cloud Run）
  api/        # Hono BE（Cloud Run）
  migration/  # データ移行スクリプト（ADR-0010）
packages/
  shared/     # 共有 Zod スキーマ・型定義・定数
  db/         # Prisma schema + client（apps/api と apps/migration が利用）
```

Turborepo または pnpm workspaces で管理。

### Python の扱い

MVP では不採用。将来 ML / RAG が必要になったら Cloud Run マイクロサービスまたは Pub/Sub ワーカーとして後追加（マイクロサービス追加 or 非同期ワーカー追加のパターン）。

### AI 統合の方針

- AI SaaS API（Anthropic / OpenAI / Gemini）の呼び出しは **BE 側に集約**
- 鍵は Secret Manager から BE のみが取得
- ブラウザに鍵を出さない原則を維持
- ストリーミングは BE → FE に SSE で転送

## Consequences

### 良い面

- FE / BE が同じ TypeScript で **型・Zod スキーマを共有可能**（生産性大）
- Anthropic SDK の最新機能（prompt caching、tool use、batch、extended thinking）を最速で利用可能
- Hono は Cloud Run でのコールドスタートが軽い
- Prisma はドキュメント・マイグレーションツールが充実、学習リソース最大
- FE/BE 分離により独立スケール・独立デプロイが可能

### 悪い面

- Node.js は計算系（数値処理・ML）で Python に劣る
- TypeScript 単一スタックなので、Python の AI/ML エコシステム（numpy / pandas / scikit-learn）は直接使えない
- Prisma は複雑クエリで N+1 や性能課題が出ることがある（最適化テクニック要習得）
- モノレポ管理は単体リポより複雑（ビルド・テスト・依存関係）

### 派生タスク

- モノレポツール選定（Turborepo vs pnpm workspaces のみ）
- 共有スキーマ設計（Zod for runtime validation + types）
- Prisma スキーマ初期設計（フェーズ 3 で詳細）
- AI Provider Adapter 層の設計（プロバイダ間の差異を吸収）

## Alternatives Considered

- **Go**: 低メモリ・高速だが、AI SDK の追従が遅い。FE/BE で型共有不可。
- **Python (FastAPI)**: AI/ML エコシステム強いが、TypeScript と型共有不可。MVP に Python は過剰。
- **Kotlin / Rust**: 学習曲線急、または起動メモリ大。今のフェーズに合わない。
- **Next.js 内に BE も全部入れる（モノリス）**: 開発速度は最速だが、データ主権・パフォーマンス制御権の観点で FE/BE は分離したい。BE を別チームに渡しやすい構造を維持。
- **tRPC**: 型完全自動共有は魅力的だが、外部 API 公開・SDK 自動生成が困難。FHIR エクスポート等（ADR-0007）の標準的な API も提供したいため REST + OpenAPI を採用。
- **GraphQL**: クライアント主導クエリは健康日記の複雑度では過剰。N+1 対策運用が重い。
- **Drizzle ORM**: SQL 透明性高く魅力的だが、Prisma の方がドキュメント・コミュニティが厚く、学習リソースが豊富。MVP は Prisma で安全側に倒す。
