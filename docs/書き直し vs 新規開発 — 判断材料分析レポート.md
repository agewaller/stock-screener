# (A) 書き直し vs (B) 新規開発 — 判断材料分析レポート

> **作成日**: 2026-05-19
> **コンテキスト**: 健康日記 (cares.advisers.jp / v1: Vanilla JS + Firebase + 4 Workers) を以下 3 要件で大幅刷新する検討にあたり、(A) 既存コード書き換え と (B) 新規設計し直して開発 のどちらを選ぶかを判断するための材料を、実測値とともに整理したもの。
>
> **3 要件**:
> 1. ブラウザクライアント内データ保存 → 全てサーバサイドへ
> 2. 個人情報・秘匿情報を全て安全に扱う仕組みへ作り変え
> 3. 将来 stock-screener 以外の別アプリと **ログインセッション共通化 (SSO)**
>
> 関連資料: `docs/renewal/health-diary-v2-spec.md` (v2 完全リビルド仕様書, 1,792 行)

---

## 1. 現状コード規模 (実測)

| 種別 | 行数 | ファイル数 | 補足 |
|---|---:|---:|---|
| **JS モジュール** (`js/`) | **23,965** | 21 | SPA 本体ロジック |
| Workers (`worker/`) | 1,381 | 6 | Cloudflare Workers (AI proxy / Plaud / メール / PubMed / 学習) |
| HTML — `index.html` | 3,194 | 1 | アプリシェル (CSS含む、ビューは JS で生成) |
| HTML — 疾患LP / 法務 | 11,779 | 70 | **静的、認証・データに依存しない** |
| Tests | 1,039 | 1 | smoke test のみ (テストカバレッジは薄い) |
| Firestore rules | 166 | 1 | |
| **合計** | **約 41,500** | 約 100 | |

参考: 同リポ内の別アプリ `jsrm/` (Next.js + Supabase) は **1,662 行**で日本参戦リスクモニターを稼働 — 新規スタックでの実装規模感の参考になる。

---

## 2. 責務別の分類 (3 要件への影響度)

| カテゴリ | LOC | 3要件への影響 | 流用可否 |
|---|---:|---|---|
| **データレイヤ** (`store.js` 419 / `idb.js` 142 / `firebase-backend.js` 1,060 / `privacy.js` 60) | **1,681** | ◎ 全面廃止対象 | ❌ 廃止 → API クライアントへ |
| **app.js** | **7,489** | ◎ 約 30-40% がデータ/認証/Firestore に依存 | △ 業務ロジックは流用、配線は全置換 |
| **pages.js** (画面レンダラ) | **4,074** | ○ 一部 (ログイン/設定/データ表示 〜20%) | ○ 大半流用可 |
| **AI engine** (`ai-engine.js` 860 / `prompts.js` 3,104) | **3,964** | ○ APIキー取得経路のみ書換、プロンプトは資産 | ◎ プロンプトは逐語流用 |
| **静的データ** (`config.js` の DISEASE/AXES/PROVIDERS/SUPPORT 等) | **2,621** | ✕ 影響なし | ◎ YAML/JSON に移植して流用 |
| **UI部品 / i18n / カレンダー / 統合** | 約 **3,800** | ○ 部分書換 | ○ 大半流用可 |
| **マーケ/LP補助** (newsletter / share / a11y / 等) | 約 **700** | ✕ 影響なし | ◎ 流用 |
| **Workers** | **1,381** | ◎ API サーバに統合または役割分担 | △ ロジック流用、配線書換 |
| **疾患LP/法務 HTML** | **11,779** | ✕ 影響なし | ◎ 完全流用 (SEO 資産) |
| **`index.html` (CSS/シェル)** | 3,194 | △ 構造は再利用、フレームワーク化で消滅 | △ CSS 変数のみ流用 |

### app.js 内の依存実数 (重要)

- Firebase / Firestore 呼出: **182 行** (約 2.4%)
- Auth 関連: **49 行**
- `store.*` 経由のデータ操作: **266 箇所** (約 3.6%)
- localStorage 直接: **30 箇所**
- → app.js 7,489 行のうち **データ / 認証への配線は数百箇所に散らばっている**

### 全体での「ブラウザ内ストレージ依存」分布

- `localStorage` / `sessionStorage` / `indexedDB` 使用: **94 箇所 / 14 ファイル**
- 最多: `app.js` 30 / `integrations.js` 14 / `pages.js` 13 / `firebase-backend.js` 10 / `store.js` 9
- → **特定ファイルに集約されておらず、横断的に散らばっている**

---

## 3. 3 要件それぞれが要求する変更

### 要件1: データを全部サーバサイドに

- 廃止対象: `store.js` (419) + `idb.js` (142) + `firebase-backend.js` の Firestore 同期部 (約 700 行)
- 新規 API クライアント (置換実装): 約 800〜1,200 行 (TanStack Query 相当の薄いラッパ)
- 配線書換: app.js / pages.js / integrations.js の `store.*` 呼出 約 **300+ 箇所**
- サーバ側 API 新規: 約 5,000〜8,000 行 (Fastify + DB)

### 要件2: 秘匿情報を全部安全に

- 廃止: `js/config.js` の Firebase apiKey ハードコード、localStorage 内 API キー、proxy URL の localStorage 上書き
- API キーをサーバ側 secret に集約 (Worker secret は既に部分対応済 / `worker/anthropic-proxy.js` を API に統合)
- PII マスキング (`js/privacy.js` 60 行) のサーバ側移植
- 認証付与方法: Cookie HttpOnly / Secure / SameSite=Lax で JWT 配布

### 要件3: SSO (他アプリと共通ログイン)

- Firebase Auth (1,060 行) を **全廃**
- OIDC Identity Provider を立てる:
  - 自前 OIDC サーバ (Fastify + oidc-provider など): 約 1,500〜3,000 行
  - または マネージド (Auth0 / Clerk / Supabase Auth / Keycloak セルフホスト)
- 各アプリは OIDC クライアントとして組込 (cookie domain を `*.advisers.jp` に拡張、または OIDC redirect)
- **SSO は (A) でも (B) でも追加コストはほぼ同じ** (どちらも別レイヤとして用意)

---

## 4. (A) 既存コード書き換え アプローチの試算

### 書換 / 削除 / 新規 の内訳

| 種別 | 行数 | 内容 |
|---|---:|---|
| **削除** | 約 **1,700** | `store.js` + `idb.js` + `firebase-backend.js` 大半 + `firestore.rules` |
| **大規模書換 (>50%)** | 約 **2,300** | app.js のデータ/認証配線部 (266 箇所), Firestore 直叩き (182 箇所) |
| **中規模書換 (20-30%)** | 約 **1,300** | pages.js (ログイン/設定/データ表示), ai-engine.js (キー取得), integrations.js |
| **小規模調整 (5-10%)** | 約 **500** | components.js, i18n.js, calendar.js, worker 群 |
| **新規追加 (サーバ側)** | 約 **8,000〜12,000** | Fastify API + DB schema + 認証 + OIDC + workers |
| **新規追加 (テスト)** | 約 **2,000〜4,000** | E2E + 統合テスト (現状 smoke のみ) |

**(A) の書換影響率**:

- 既存 v1 (約 26,400 行 = JS+Worker) のうち **約 5,800 行 touch (≒ 22%)**
- + 削除 1,700 行 = **約 28% が消える or 書き変わる**
- 新規追加 約 10,000〜16,000 行 (サーバ側)
- **総作業量 約 15,800〜21,800 行**

### (A) の利点

- LP / 疾患カタログ / プロンプト / i18n / CSS が **完全に温存** (約 18,000 行が無傷)
- 既存ユーザーのデータマイグレーションが **Firestore → 新DB の片道**で済む (ユーザー手動なし)
- リリースまでの期間が短い (6〜10 週間想定)
- リポジトリは 1 つ、CI/CD/デプロイの並走負担なし

### (A) のリスク

- vanilla JS / 型なし / テスト 1,039 行 (smoke only) — リファクタの安全網が薄い
- 「データを全部サーバ」へ移行する際、app.js の 266 箇所の `store.*` 呼出を一つずつ非同期 API 呼出に書き換える必要 → **同期 → 非同期化の連鎖**で予想外の副作用が出やすい
- データレイヤを抜本変更しても **app.js の手続き的構造 (7,489 行)** は残るため、3 年後の拡張性は今と同程度
- Firebase Auth の全廃 + OIDC 化は単独でかなり大手術。これが終わらないと SSO 提供できない
- v2-spec (§0) に挙げられた根本問題 (`onSnapshot` 初期空 / `enableAutoSync` race / `localStorage.clear()` 暴発) の **温床になっている vanilla JS 構造そのもの** は残るので、再発リスクあり

---

## 5. (B) 新規開発 アプローチの試算 (v2-spec ベース)

### 既存資産の流用度

| 資産 | 元LOC | 流用形態 | 移植コスト |
|---|---:|---|---:|
| プロンプト (`prompts.js`) | 3,104 | 逐語 → `packages/prompts/seed/*.md` | 約 1 日 (機械的変換) |
| 疾患カタログ等 (`config.js`) | 2,621 | YAML/JSON 化 → `packages/disease-data/seed/` | 約 2〜3 日 |
| i18n キー (`i18n.js`) | 384 | JSON 化 → `packages/shared/i18n/ja.json` | 約 1 日 |
| PII マスキング (`privacy.js`) | 60 | TS 移植 | 半日 |
| AI コンテキスト構築 (`ai-engine.js`) | 約 200 | TS 移植 | 1 日 |
| 疾患検出 73 パターン (`anthropic-proxy.js`) | 約 75 | TS 移植 | 半日 |
| ICS parser (`calendar.js`) | 約 60 | TS 移植 | 半日 |
| Plaud RFC5322 parser (`plaud-inbox.js`) | 約 160 | TS 移植 | 1 日 |
| Apple Health XML parser (`integrations.js`) | 約 100 | TS 移植 | 1 日 |
| 健康スコア / BMR (`store.js`) | 約 60 | TS 移植 | 半日 |
| 疾患LP HTML 70 ページ | 11,779 | **無改修で同居** (`/disease/*` ルート) | 0 |
| CSS 変数 (`index.html` :root) | 約 50 | `tokens.css` へ | 半日 |
| **流用合計** | **約 18,500** | データ + ユーティリティとして再利用 | 約 1〜2 週間 |

### 新規実装規模 (v2-spec から推定)

| パッケージ | 推定 LOC | 内容 |
|---|---:|---|
| `apps/web` (React+TS+Vite) | **15,000〜22,000** | 35 ルート / 主要コンポーネント / PWA |
| `apps/api` (Fastify+TS) | **10,000〜15,000** | 60 endpoints / OpenAPI / Auth / OIDC |
| `apps/worker` (BullMQ) | **1,500〜3,000** | PubMed / AI batch / メール / Auto-Sync |
| `packages/shared` | **1,500〜3,000** | 型 / zod schema / i18n / OpenAPI 共有 |
| `packages/{prompts,disease-data}` (data) | データ約 **5,000** 行 | seed |
| Migrations + seed | **1,000〜2,000** | 30+ テーブル |
| E2E (Playwright) | **2,000〜4,000** | 10 シナリオ |
| **新規実装合計** | **約 36,000〜54,000** | — |

**(B) の書換影響率**:

- 既存 v1 26,400 行のうち **流用 約 18,500 行 (=70%、ただしほぼ無改修)** + **廃止 約 7,900 行 (30%)**
- 新規実装 約 36,000〜54,000 行
- **総作業量 約 36,000〜54,000 行** (流用は移植のみ)
- 仕様書見積: **MVP 3〜4 ヶ月 (3-4 名並列) / 1 人 で約 9〜12 ヶ月**

### (B) の利点

- データ管理・秘匿情報・SSO の 3 要件が **設計レベルから織り込める**
- React + TypeScript で型安全、テスト容易、長期保守性 ◎
- monorepo (`packages/shared`) で **SSO 含む共通基盤を別アプリと最初から共有** できる
- v2-spec が **既に存在** (1,792 行) — 設計の認知コストは既に支払済
- vanilla JS の同期手続き的 → React 宣言的への構造転換で v2-spec §0 の根本問題が消える

### (B) のリスク

- 工数 大 (1 人作業なら 9〜12 ヶ月)
- v1 / v2 の二重メンテ期間あり (仕様書 §14 で 2 ヶ月移行期間 + 6 ヶ月共存)
- 既存ユーザーの **手動データ移行** が必要 (v1 export JSON → v2 import)
- SEO や Lighthouse スコアが切替直後に揺れるリスク
- リポジトリ / CI / デプロイが二系統で同時稼働

---

## 6. (A) vs (B) 比較表

| 観点 | (A) 既存書換 | (B) 新規開発 |
|---|---|---|
| 触る既存コード | **約 28% (7,500 行)** | **約 30% を廃止、70% を移植** |
| 新規実装コード | 約 10,000〜16,000 | 約 36,000〜54,000 |
| 総作業量 | **約 16,000〜22,000 行** | **約 36,000〜54,000 行** |
| 期間 (1 人) | **6〜10 週間** | **9〜12 ヶ月** |
| 期間 (3-4 名) | 3〜5 週間 | 3〜4 ヶ月 (仕様書見積) |
| データ移行 | 自動 (Firestore→DB 片道) | 手動 (ユーザーが export/import) |
| SEO / LP 資産 | 無傷 (11,779 行) | 無傷 (URL 維持で同居可) |
| プロンプト / 疾患カタログ | 無傷 (5,725 行) | 流用 (機械移植) |
| 型安全 / テスト | 既存のまま (薄い) | TypeScript strict + E2E 10 シナリオ |
| データ消失バグの根本解消 | △ 構造は残る | ◎ 設計から解消 |
| SSO 実装の難易度 | 中 (Firebase Auth 全廃が必要) | 中 (最初から OIDC で設計) |
| 3 年後の拡張性 | △ vanilla JS の限界が残る | ◎ React + TS + monorepo |
| 別アプリ (jsrm 等) との共通基盤化 | ✕ 言語 / 設計が違うので困難 | ◎ `packages/shared` で実現 |

---

## 7. 判断のための観点整理 (推奨ではなく材料)

### (A) を選ぶべきケース

- **早く SSO とサーバデータを実現したい** (3〜5 週間で形にしたい)
- **既存ユーザー数が多く、手動移行はトラブル要因** になる
- **直近の事業優先度がリビルドより新機能追加**
- 後に (B) へ進む選択肢は残る (アーキ刷新を遅らせるだけ)

### (B) を選ぶべきケース

- **将来 stock-screener 以外に複数アプリを並走させる前提が確実** (`packages/shared` の威力が最大化)
- **既存 v1 のデータ消失バグの再発を抜本的に避けたい**
- **3〜4 ヶ月以上の開発期間を確保できる** (チーム or 段階リリース)
- 既に v2-spec (1,792 行) を書き上げており、**設計の合意形成コストが沈下費用化されている**

### 折衷案 (検討余地)

- **(A) で SSO + データのサーバ化だけ先行**、(B) は別途立ち上げて 6 ヶ月後切替
  - (A) が "v1.5" として 8 週間で動く → SSO は既に他アプリで使える状態に
  - (B) を 3〜4 ヶ月かけて並行構築 → 切替準備
  - リスク: 二重投資。ただし SSO 基盤 (OIDC provider) は (A)(B) 共通で使い回せるので **完全な二重ではない**
  - jsrm が既に同リポにあるので、SSO 基盤を先に作るインセンティブは強い

---

## 8. 注意点

- 上記 LOC は実測ですが、新規実装の見積は **v2-spec の網羅範囲を全実装した場合** の上限です。MVP を絞れば (B) の規模は 60〜70% 程度に縮みます。
- (A) は「書き換え」ではなく **段階的リプレース** で進められる利点があります (例: data layer だけ先に API 化、後で React 化、と分割可能)。1 回のビッグバンに見えない設計にできる。
- 仕様書 §0 が指摘する v1 の致命的問題は **(A) で半分しか解消しない** (autosync race と onSnapshot 初期空は構造変更で消えるが、vanilla JS の同期 → 非同期化に伴う新バグの可能性は残る)。

---

## 9. 計測の根拠 (再現コマンド)

```bash
ROOT=/Volumes/DATA/works/BMP/github/stock-screener/stock-screener

# JS / Worker / Tests の行数
wc -l "$ROOT"/js/*.js | sort -rn
wc -l "$ROOT"/worker/*.js | sort -rn
wc -l "$ROOT"/tests/*.js

# HTML 総量
ls "$ROOT"/*.html | wc -l
wc -l "$ROOT"/*.html | tail -1

# 依存箇所カウント
grep -lE "localStorage|sessionStorage|indexedDB" "$ROOT"/js/*.js \
  | xargs -I {} sh -c 'echo -n "{}: "; grep -cE "localStorage|sessionStorage|indexedDB" {}'

grep -cE "firebase|firestore|Firestore|Firebase" "$ROOT"/js/app.js
grep -cE "signIn|signOut|onAuthStateChanged|currentUser|auth\\." "$ROOT"/js/app.js
grep -cE "store\\." "$ROOT"/js/app.js
```

---

**追加で材料が必要な箇所** (例: 「SSO 想定の他アプリは何個か」「直近事業優先度」「移行可能なユーザー数」) があれば、本ドキュメントに追記する形で更新する。
