# アーキテクチャ図

新仕様 cares の全体構成を Mermaid で記述する。

| 図 | 用途 | ファイル |
|---|---|---|
| コンポーネント図 | システム全体の構成要素と依存関係 | [component.md](component.md) |
| デプロイ構成図 | GCP プロジェクト・VPC・サービス配置 | [deployment.md](deployment.md) |
| 認証シーケンス | Identity Platform (Firebase Auth) ログイン + IndexedDB 鍵払い出しのフロー | [sequence-auth.md](sequence-auth.md) |
| AI 呼び出しシーケンス | ブラウザ → BE → AI Provider のストリーミング経路 | [sequence-ai.md](sequence-ai.md) |

## 図の前提

- GitHub の Mermaid レンダラ対応
- 図上のサービス名・コンポーネント名は ADR-0001〜0012 と整合
- 単一プロジェクト・単一環境 (prod) を基準に図示。dev / staging は同型を Terraform で複製

## 凡例（共通）

| 表記 | 意味 |
|---|---|
| 矩形 | サービス・コンポーネント（Cloud Run 等） |
| 円柱 | データストア（Cloud SQL / Cloud Storage） |
| 平行四辺形 | 外部 SaaS（Anthropic / Google 等） |
| 実線矢印 | 同期的なリクエスト |
| 点線矢印 | 設定値・シークレット注入 |
