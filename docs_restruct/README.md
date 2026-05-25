# 設計ドキュメント一覧（健康日記 / Health Diary）

題材: **健康日記**（旧称: 未病ダイアリー）。慢性疾患患者のための体調記録・情報整理 SPA。

- 本番サイト: <https://cares.advisers.jp>
- リポジトリ: github.com/agewaller/stock-screener（active branch: `restructure_project`）
- 運営: シェアーズ株式会社
- 管理者: `agewaller@gmail.com`

> 本ドキュメント群は **現状の既存コードから as-built で起こした仕様** である。MVP スコープに合わせ主要 3 出し（要件定義 / 基本設計 / 詳細設計）+ ER 図 + API 一覧 + コンポーネント図のみを整備する。jsrm/ サブプロジェクト（Next.js + Supabase）は対象外。

## ドキュメント階層

| 階層 | 答えるべき問い | エントリ |
|---|---|---|
| 【A】要件定義 | **何を**作るか / なぜ作るか | [要件定義書](requirements/要件定義書.md) |
| 【B】基本設計 | **どう**作るか（全体像・方式） | [基本設計書](basic-design/基本設計書.md) |
| 【C】詳細設計 | **具体的に**どう作るか | [詳細設計書](detail-design/詳細設計書.md) |

## 図・補足

| 図 / 補足 | 用途 | 場所 |
|---|---|---|
| コンポーネント図 | システム全体の構成要素と依存 | [basic-design/architecture/](basic-design/architecture/) |
| ER 図 | Firestore データモデル（論理） | [basic-design/er/](basic-design/er/) |
| API 一覧 | Cloudflare Worker / Firebase の API | [detail-design/api/api-list.md](detail-design/api/api-list.md) |

図は **Mermaid** で記述する（GitHub レンダリング対応）。

## 識別子の体系

ドキュメント横断のトレーサビリティのため、以下の ID 体系で参照する。

- 機能 ID: `FN-{ドメイン}-{連番}` 例: `FN-AUTH-01`, `FN-AI-03`
  - ドメイン: `AUTH`（認証）/ `DIARY`（日記入力）/ `AI`（AI 解析）/ `DATA`（データ管理）/ `INT`（外部連携）/ `ADMIN`（管理者機能）
- 画面 ID: `SC-{連番}` 例: `SC-02`
- API: `{METHOD} {path}` 例: `POST /v1/messages`
- Firestore コレクション: パス表記 例: `users/{uid}/symptoms/{id}`

## スコープ（要点）

詳細は要件定義書を参照。

- 対応疾患: **65 種類**の慢性疾患 + カスタム疾患（神経系・自己免疫・代謝・呼吸器・消化器・精神等）
- 主機能: **症状・バイタル・薬・睡眠・活動・食事・血液検査・気分・写真**の 9 カテゴリ記録 + **AI 解析**（Claude / GPT / Gemini）+ **論文検索**（PubMed）+ **専門家連携**
- 認証: Firebase Auth（Google OAuth / Email-Password / Anonymous の 3 方式）
- データ保管: localStorage（キャッシュ）+ Firestore（正本、東京リージョン）
- AI 経路: ブラウザ → Cloudflare Workers（cares-relay → stock-screener）→ Anthropic / OpenAI / Google。**API 鍵はサーバ側のみ保持**
- ホスティング: GitHub Pages（buildless 静的配信）+ Cloudflare Workers + Firebase
