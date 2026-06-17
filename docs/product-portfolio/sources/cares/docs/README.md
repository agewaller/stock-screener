# 新仕様（cares）設計ドキュメント

題材: 健康日記の **リアーキテクチャ版**。ブラウザ + Firebase 中心の現行構成から、GCP コンテナ + PostgreSQL を中核とするサーバサイド主体アーキテクチャへ全面的に設計し直す。

- このリポジトリ（実装先）: <https://github.com/agewaller/cares>
- 旧リポジトリ（参考実装、as-built）: <https://github.com/agewaller/stock-screener>
- 旧 as-built ドキュメント: [`docs_restruct/`](https://github.com/agewaller/stock-screener/tree/main/docs_restruct)（仕様の参照元）

> 本ディレクトリは新仕様の設計ドキュメント本体。フェーズ 0〜3 はドキュメント中心、フェーズ 4 以降でこのリポにスケルトン実装が入る。

## ドキュメント階層

| 階層 | 答えるべき問い | エントリ |
|---|---|---|
| 【A】要件定義 | **何を**作るか / なぜ作るか / 旧仕様との差分 | [`requirements/`](requirements/) |
| 【B】基本設計 | **どう**作るか（GCP アーキテクチャ・方式） | [`basic-design/`](basic-design/) |
| 【C】詳細設計 | **具体的に**どう作るか（API・スキーマ） | [`detail-design/`](detail-design/) |
| 【D】ADR | アーキテクチャ意思決定の記録 | [`adr/`](adr/) |
| 【E】Design System | UI / 画面のデザイン関連 | [`design-system/`](design-system/) |
| 【F】Architecture 図 | システム全体像 + Mermaid 構成図 / シーケンス図 | [`architecture/`](architecture/) |
| 【G】マニュアル | ユーザ向け / オーナー向け運用 / staging 手動デプロイ | [`MANUAL.md`](MANUAL.md) / [`OPERATIONS.md`](OPERATIONS.md) / [`DEPLOY_STAGING_GITHUB_ACTIONS.md`](DEPLOY_STAGING_GITHUB_ACTIONS.md) |
| 【H】障害記録 | 本番/テスト環境の障害の **原因調査と再発防止** (同じ症状を見たらまず引く) | [`incidents/`](incidents/README.md) |

## UML / 図の所在

参考: yanoshin/AI-Assisted-System-design の体系に倣う。

| 図 | 場所 | 形式 |
|---|---|---|
| ユースケース図 | [`requirements/use-case/`](requirements/use-case/) | Mermaid |
| アクティビティ図 | [`requirements/activity/`](requirements/activity/) | Mermaid |
| コンポーネント図 / デプロイ図 | [`basic-design/architecture/`](basic-design/architecture/) | Mermaid |
| シーケンス図 (認証 / AI / 日記投稿 / レポート / 削除 / 匿名昇格 / エクスポート) | [`basic-design/architecture/`](basic-design/architecture/) | Mermaid |
| システム全体構成図 (現状実装版) | [`architecture/system-overview.md`](architecture/system-overview.md) | Mermaid |
| シーケンス: 認証 / 写真アップ / 日次分析 (現状実装版) | [`architecture/sequence/`](architecture/sequence/) | Mermaid |
| 画面遷移図 | [`basic-design/screen-flow/`](basic-design/screen-flow/) | Mermaid |
| ER 図 | [`basic-design/er/`](basic-design/er/) | Mermaid |
| ドメインクラス図 | [`basic-design/data-model/`](basic-design/data-model/) | Mermaid + PlantUML |
| 状態遷移図 (text_entry / ai_conversation / account / draft) | [`detail-design/state/`](detail-design/state/) | Mermaid |
| OpenAPI 3.0 | [`detail-design/api/openapi.yaml`](detail-design/api/openapi.yaml) | YAML |
| API 一覧 | [`detail-design/api/api-list.md`](detail-design/api/api-list.md) | Markdown |
| テーブル定義書 (DDL) | [`detail-design/table/tables.md`](detail-design/table/tables.md) | Markdown |
| 画面ワイヤ sc-XX | [`design-system/screens/`](design-system/screens/) | Markdown (ASCII) |

## 進行中の作業

- [`requirements/interview-log.md`](requirements/interview-log.md) — ユーザーとのインタビュー記録（論点単位、進行中）

## フェーズ計画

| フェーズ | 目的 | 主な成果物 |
|---|---|---|
| 0. セットアップ | 作業環境・ドキュメント骨組み | この README、interview-log の枠 |
| 1. 要件再定義 | 旧仕様からの差分洗い出し | requirements 配下一式 |
| 2. アーキテクチャ設計 | GCP サービス選定・全体構成 | basic-design 配下、ADR |
| 3. 詳細設計 | DB・API・認可・テスト戦略 | detail-design 配下 |
| 4. スケルトン実装 | Docker / IaC / CI/CD / 1 機能 e2e | （新リポジトリ側） |
| 5. 機能移植 | 既存機能を順次移植 | （新リポジトリ側） |
| 6. データ移行 | Firestore → PostgreSQL | 移行スクリプト + 切替手順 |

## 識別子の体系（旧仕様から継続）

旧仕様 [`docs_restruct/README.md`](https://github.com/agewaller/stock-screener/blob/main/docs_restruct/README.md) の ID 体系を引き継ぐ。新仕様で追加・変更されたものは末尾に `-NEW`、廃止は `-DEPRECATED` を付ける。

- 機能 ID: `FN-{ドメイン}-{連番}`
- 画面 ID: `SC-{連番}`
- API: `{METHOD} {path}`
- 意思決定: `ADR-{連番}`
