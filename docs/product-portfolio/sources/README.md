# sources/ ― 各プロダクトの全ドキュメント・ミラー

このディレクトリは、3プロダクトの**リポジトリ内ドキュメント一式を丸ごと複製（ミラー）**したものです。
vm-suite（`shares-dev/vm-suite`）と zentrack（`zen-track/zentrack`）は別オーナーのため外部から参照できないことがあり、
この `agewaller/stock-screener` に集約することで、**他のAI・協働者が全資料を1か所で読める**ようにしています。

- **複製日**: 2026-06-17
- **注意**: これはスナップショット（複製時点）です。各プロダクトの**正本は元リポジトリ**にあります。最新は元リポジトリを参照してください。

## 構成

| ディレクトリ | 元リポジトリ | 主な内容 |
|---|---|---|
| [`cares/`](cares/) | `agewaller/cares`（健康日記 GCP版） | `docs/`（要件定義・基本設計・詳細設計・ADR 0001〜0018・運用/インシデント・デザインシステム・product戦略）＋ README ＋ CLAUDE.md |
| [`vm-suite/`](vm-suite/) | `shares-dev/vm-suite`（バリューマトリクス） | `docs/`（API/DB/コンソール/デスクトップ設計・jQuantsパイプライン・財務スキーマ xlsx・トヨタ分析例・列定義）＋ README ＋ AGENTS.md |
| [`zentrack/`](zentrack/) | `zen-track/zentrack`（禅トラック） | `doc/`（システム設計 design.md・ローカルセットアップ）＋ README |

## 読み始めるなら

- 全体像と戦略 → 親ディレクトリの [`../README.md`](../README.md) と [`../00-vision-and-integrated-strategy.md`](../00-vision-and-integrated-strategy.md)
- 製品別サマリ → [`../01-cares.md`](../01-cares.md) / [`../02-vm-suite.md`](../02-vm-suite.md) / [`../03-zentrack.md`](../03-zentrack.md)
- 詳細を深掘り → 本ディレクトリの各プロダクト原典ドキュメント

### 各プロダクトの主要原典（抜粋）

**cares（健康日記）**
- `cares/docs/requirements/要件定義書.md` / `cares/docs/basic-design/基本設計書.md` / `cares/docs/detail-design/詳細設計書.md`
- `cares/docs/adr/README.md`（ADR 索引）/ `cares/docs/product/`（収益・GTM・戦略メモ）
- `cares/docs/detail-design/api/openapi.yaml`（API 定義）

**vm-suite（バリューマトリクス）**
- `vm-suite/docs/designs/`（api / db / user-console / admin-console / desktop-app の overview）
- `vm-suite/docs/jquants_pipeline.md` / `vm-suite/docs/setup.md` / `vm-suite/docs/toyota_7203_vm_2026-03-06.md`（分析出力例）

**zentrack（禅トラック）**
- `zentrack/doc/design.md`（システム設計・日次分析スキーマ・メール受信フロー）
