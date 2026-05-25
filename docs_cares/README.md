# 新仕様（cares）設計ドキュメント

題材: 健康日記の **リアーキテクチャ版**。ブラウザ + Firebase 中心の現行構成から、GCP コンテナ + PostgreSQL を中核とするサーバサイド主体アーキテクチャへ全面的に設計し直す。

- 現行リポジトリ（参考実装）: `/Volumes/DATA/works/BMP/care_restruct`
- 新リポジトリ（実装先）: <https://github.com/agewaller/cares>
- 旧 as-built ドキュメント: [`../docs_restruct/`](../docs_restruct/README.md)（仕様の参照元）

> 本ディレクトリは **新仕様の設計ドキュメントの作業場所**。確定したものは順次 `agewaller/cares` リポジトリへ移植する。
> コード実装は許可があるまで行わない（フェーズ 0〜3 はドキュメント中心）。

## ドキュメント階層

| 階層 | 答えるべき問い | エントリ |
|---|---|---|
| 【A】要件定義 | **何を**作るか / なぜ作るか / 旧仕様との差分 | [`requirements/`](requirements/) |
| 【B】基本設計 | **どう**作るか（GCP アーキテクチャ・方式） | [`basic-design/`](basic-design/) |
| 【C】詳細設計 | **具体的に**どう作るか（API・スキーマ） | [`detail-design/`](detail-design/) |
| 【D】ADR | アーキテクチャ意思決定の記録 | [`adr/`](adr/) |

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

旧仕様 [`docs_restruct/README.md`](../docs_restruct/README.md) の ID 体系を引き継ぐ。新仕様で追加・変更されたものは末尾に `-NEW`、廃止は `-DEPRECATED` を付ける。

- 機能 ID: `FN-{ドメイン}-{連番}`
- 画面 ID: `SC-{連番}`
- API: `{METHOD} {path}`
- 意思決定: `ADR-{連番}`
