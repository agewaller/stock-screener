# アクセス解析（Analytics）設定手順

**対象ファイル**: `js/analytics.js`
**採用ツール**: Cloudflare Web Analytics（無料・Cookie 不使用・GDPR/個人情報保護法適合）

---

## なぜ Cloudflare Web Analytics か

1. **完全無料**（ページビュー無制限、Pro プランへのアップグレード不要）
2. **Cookie を一切使わない** — 追加の Cookie 同意 UI 不要、個人情報保護法の第 28 条照会義務にも抵触しにくい
3. **JS 1 ファイル（約 4KB）** — ページ表示速度への影響が最小
4. **CDN が既に Cloudflare** — 設定が既存スタックと整合
5. **Pマーク（JIS Q 15001:2017）と矛盾しない** — ユーザー識別子を保存しない集計モデル

---

## 設定手順（5 分）

### 1. Cloudflare ダッシュボードでトークンを取得

1. https://one.dash.cloudflare.com/ にログイン
2. 左メニュー → **Analytics & Logs** → **Web Analytics**
3. **Add a site** → `cares.advisers.jp` を入力
4. 表示される `<script>` タグから `data-cf-beacon='{"token": "XXXXXXXX"}'` の **XXXXXXXX** 部分（32-64 文字の英数字）をコピー

### 2. `js/analytics.js` の `CF_TOKEN` を更新

```js
var CF_TOKEN = 'REPLACE_ME_CF_TOKEN';
```

を

```js
var CF_TOKEN = 'ここにコピーしたトークン';
```

に置き換える。

### 3. コミット & デプロイ

```bash
git add js/analytics.js
git commit -m "Enable Cloudflare Web Analytics"
git push origin main
```

GitHub Pages が自動デプロイ（通常 30-60 秒）。

### 4. Cloudflare 側で確認

数分後、CF ダッシュボードの Web Analytics 画面で最初のページビューが見えれば成功。

---

## どのページに適用されているか

以下全ページ（`<script defer src="/js/analytics.js">` を含むもの）:

- `/` (トップ)
- `/me-cfs.html`
- `/long-covid.html`
- `/fibromyalgia.html`
- `/pots.html`
- `/mcas.html`
- `/eds.html`
- `/ibs.html`
- `/hashimoto.html`
- `/depression.html`
- `/insomnia.html`

**除外**:

- `/pitch.html`（内部資料、`robots: noindex`）
- `/learning.html`（社内学習教材）

---

## 無効化したい場合

`js/analytics.js` の `CF_TOKEN` を `REPLACE_ME_CF_TOKEN` に戻すか、
`return;` を関数の最初に追加する。サイトは通常どおり動作する（beacon が
読み込まれないだけ）。

---

## プライバシー

- **Do-Not-Track 自動対応**: ブラウザで DNT を有効にしているユーザーは
  自動的に計測対象外（`navigator.doNotTrack === '1'` で即 return）
- **データ保持**: CF Web Analytics はページビューと参照元を集計形式で
  6 ヶ月保持。個人を識別できる情報は保持されない。
- **IP アドレス**: CF が即時ハッシュ化して破棄。ログには残らない。
- **プライバシーポリシー記載**: `/docs/プライバシーポリシー.md` に
  「弊社はページビュー集計に Cloudflare Web Analytics を利用しており、
  個人を識別する情報は取得・保存しておりません」の一文を追加すること
  を推奨（現状は明示していない）。

---

## Plausible（代替選択肢）

Plausible を使いたい場合は `js/analytics.js` の下部にコメントアウト
されているブロックを有効化して、`PLAUSIBLE_DOMAIN = 'cares.advisers.jp'`
を設定する。月 $9〜 の有料だが、詳細なダッシュボードと API が利用可能。

---

## 更新履歴

| 版 | 日付 | 内容 |
|---|---|---|
| 1.0 | 2026-04-23 | 初版（CF Web Analytics 採用） |
