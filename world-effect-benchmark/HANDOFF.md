# 引き継ぎ書 ─ フォークした World Effect Benchmark に「やさしく解説」を組み込む

> このドキュメントは、**フォークしたベンチマーク・リポジトリ側で作業する新スレッド**に
> 渡す引き継ぎ書です。この 1 枚だけで作業を始められるよう、必要な情報（連携コード・
> 元データの構造・注意点）はすべて中に書いてあります。元の `stock-screener` 側の
> ファイルを参照できなくても進められます。

---

## 0. まず新スレッドが確認すること

- [ ] **作業対象リポジトリ**: フォーク先 = `agewaller/World-Effect-Benchmark`。
  セッションのスコープにこのリポジトリが含まれているか確認し、無ければ
  `add_repo` で追加する。
  Pages 公開先は `https://agewaller.github.io/World-Effect-Benchmark/`。
- [ ] **開発ブランチ**: 新しい作業ブランチを切る（例: `claude/add-explain-button`）。
  いきなり `main`（＝GitHub Pages 本番）に push しない。
- [ ] フォーク元: `chiyo400/World-Effect-Benchmark`（37 か国 × 1180 因子の
  「社会戦略フォーラム / World Effect Evaluator」。D3.js v7 + Transformers.js の静的 SPA）。

---

## 1. ゴール（なぜやるか）

ベンチマークは相関係数・偏差値・4 象限などが充実しているが、**統計やグラフに
不慣れな人には数字の意味が伝わらない**。そこで「画面の数値を AI がやさしい日本語で
解説する」補助ページを別途用意済み。今回の作業は、**フォーク側に「やさしく解説」
ボタンを足して、見ている内容をワンクリックでその解説ページに渡す**こと。

解説ページが返すもの: ひとことで言うと → グラフの読み方（数字をたとえ話に翻訳）
→ ここがポイント → 💡 ちょっと意外な発見（something new）→ ⚠️ 相関≠因果の念押し
→ 次の一歩。

---

## 2. すでに完成しているもの（このリポジトリでは作らない）

解説ページ本体（プロンプト内蔵・AI 呼び出し込み）は **別リポジトリ
`agewaller/stock-screener` の `world-effect-benchmark/interpret.html`** に実装済みで、
本番公開先は:

```
https://cares.advisers.jp/world-effect-benchmark/interpret.html
```

- ブラウザは API キーを持たず、`cares-relay.agewaller.workers.dev` 経由で Claude を
  呼ぶ（鍵はサーバ側だけ）。
- このページは `#payload=<base64(JSON)>` で「いま見ている内容」を受け取り、自動で
  解説を生成する。

> ⚠️ **公開の前提**: 上記 URL は `stock-screener` の変更が `main` にマージされ
> GitHub Pages がデプロイされて初めて有効。まだ `main` 未反映なら、その旨をユーザーに
> 確認すること（現状はブランチ `claude/factor-analysis-prompts-2xihqo` にある）。

**フォーク側（このリポジトリ）の作業は、この解説ページに飛ばすボタンを足すだけ。**
プロンプトや AI 呼び出しをフォーク側に作る必要はない。

---

## 3. やること（フォーク側の実装）

### 推奨: 「やさしく解説」ボタン + payload 連携

ベンチマークの JS に次の関数を足し、各ビューに「やさしく解説」ボタンを置いて呼ぶ。

```js
// いま見ている内容を解説ページに渡して新しいタブで開く
function explainCurrentView(view, focus, dataLines) {
  const payload = { view, focus, data: dataLines.join("\n") };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const url = "https://cares.advisers.jp/world-effect-benchmark/interpret.html#payload="
            + encodeURIComponent(b64);
  window.open(url, "_blank");
}
```

ビュー別の呼び出し例（フィールド名は §4 を参照して実物に合わせる）:

```js
// (A) World Effect Map で因子 f を選んでいるとき
explainCurrentView(
  "World Effect Map (4象限)",
  `因子「${f.label}」`,
  [
    `GDP成長との相関 r = ${f.corr_growth.toFixed(3)}`,
    `幸福との相関 r = ${f.corr_happiness.toFixed(3)}`,
    `分類: ${quadrantLabel(f)}`,                       // SUCCESS / SPARTA / SPOIL / SABOTAGE / SLIGHT
    `日本の偏差値: ${f.deviation_scores?.JPN ?? "―"}`,
    `この因子と最も一緒に動く因子: ` +
      (DATA.factor_top_corr[f.key]?.top.slice(0,3)
        .map(([k,r]) => `${DATA.factors[k].label} (r=${r.toFixed(2)})`).join(" / ") || "―")
  ]
);

// (B) 国別スコアランキングを見ているとき
explainCurrentView(
  "国別スコアランキング",
  `因子「${f.label}」の国別順位`,
  rankedCountries.slice(0, 10)
    .map((c, i) => `${i+1}位 ${c.name}: 偏差値 ${c.deviation.toFixed(0)}`)
);

// (C) 2国比較
explainCurrentView(
  "2国比較",
  `${a.name} vs ${b.name}`,
  diffFactors.slice(0, 10)
    .map(d => `${d.label}: ${a.name} ${d.aScore} / ${b.name} ${d.bScore}`)
);
```

`view` に渡せる値（解説ページのセレクトと対応）:
`World Effect Map (4象限)` / `KGI相関` / `相関ランキング` / `国MAP (散布図)` /
`国別スコアランキング` / `国プロフィール` / `2国比較`

`#payload=` 付きで開かれると解説ページが自動で解説を出すので、フォーク側は
**payload を組み立てて URL を開くだけ**でよい。

### 最小構成（payload を作るのが難しい場合）

ただのリンクでも成立する（ユーザーが遷移先で画面種別を選び数字を貼る）:

```html
<a href="https://cares.advisers.jp/world-effect-benchmark/interpret.html"
   target="_blank" rel="noopener">このグラフをやさしく解説</a>
```

---

## 4. 元データの構造（解析済み。フィールド名はフォーク実物で要確認）

`data.json` を読み込み、概ね次の形（`chiyo400/World-Effect-Benchmark` の index.html から
読み取った構造。フォークで改変されている可能性があるので実物で確認すること）:

```js
DATA.factors[key] = {
  label,            // 因子名（日本語）
  category,
  selected,         // 「選抜148」に含まれるか
  corr_growth,      // GDP成長率との相関 r（Pearson）
  corr_happiness,   // 幸福(ポジティブ感情)との相関 r
  country_scores: { [countryId]: number },     // 国別スコア
  deviation_scores: { [countryId]: number },   // 国別 偏差値（50が中央, 60↑高い, 40↓低い）
  search_keywords: [ ... ]
};
DATA.countries[countryId] = {
  name, gdp_growth, happiness,
  factor_scores: { [factorKey]: { score, deviation, category, label } }
};
DATA.factor_top_corr[key] = { top: [[key, r], ...], bottom: [[key, r], ...] };
DATA.country_list = [ { id, name }, ... ];
```

**2 つの KGI**:
- GDP成長率: `gdp_growth` ＝ 1999–2019 の CAGR（年あたり平均成長率, PPP）
- 幸福: `happiness` ＝ ポジティブ感情 2020–2023

**World Effect Map の 4 象限ロジック**（X=`corr_happiness`, Y=`corr_growth`, 閾値 ±0.2）:

| 条件 | ラベル | 意味 |
|---|---|---|
| cg≥0.2 かつ ch≥0.2 | ✅ SUCCESS（両利き） | 成長にも幸福にも有効 |
| cg≥0.2 かつ ch≤−0.2 | ⚔️ SPARTA（成長優先） | 成長◯だが幸福を損なう |
| cg≤−0.2 かつ ch≥0.2 | 🌸 SPOIL（幸福優先） | 幸福◯だが成長を損なう |
| cg≤−0.2 かつ ch≤−0.2 | 🚫 SABOTAGE（逆効果） | どちらにも負 |
| いずれも |r|<0.2 | ⬜ SLIGHT（微力） | 効果限定的 |

相関の表示書式 `fmtCorr()` は `+0.123` / `-0.456`（3 桁）。

---

## 5. 重要な技術的注意（ハマりどころ）

- **AI 呼び出しはフォーク側で作らない**。解説ページ（`cares.advisers.jp` 配信）が
  呼ぶので、AI 呼び出しは `cares.advisers.jp` のオリジンから出る。フォーク側は
  ボタンで URL を開くだけ＝**relay の Origin 許可リストに触れる必要がない**。
- ❌ もし「解説機能をフォーク側に丸ごと埋め込む」方向に行くと、AI 呼び出しが
  `agewaller.github.io`（フォークの Pages オリジン）から出て **relay の
  Origin 許可リスト外で弾かれる**。その場合は relay 側の `ALLOWED_ORIGINS` に当該
  オリジンを追加する別作業が必要になる。**まずはリンク/ボタン方式（オリジン変更不要）を採用すること。**
- `btoa` は非 ASCII で例外を出すため、上記コードのとおり
  `btoa(unescape(encodeURIComponent(...)))` で UTF-8 を安全にエンコードする。
- 新規タブを開くリンクには `rel="noopener"` を付ける。

---

## 6. 受け入れ条件（完了の定義）

- [ ] 主要ビュー（最低でも World Effect Map）に「やさしく解説」ボタンがある。
- [ ] 押すと `interpret.html` が新タブで開き、その因子/国の数値を反映した解説が
  自動表示される（payload が正しく渡っている）。
- [ ] payload の非 ASCII（日本語の因子名）が文字化けしない。
- [ ] ボタンを足したことで既存のグラフ描画・検索が壊れていない。
- [ ] 作業ブランチに commit & push。`main` への反映可否はユーザーに確認。

---

## 7. 参考: 解説ページの動作（フォーク側で再実装しないが理解の助けに）

- `interpret.html` は §3 の `payload`（`{view, focus, data}`）を `#payload=` から読む。
- 内蔵プロンプト（システム＋本文テンプレート）で Claude（`claude-opus-4-8`）を呼ぶ。
  読者像は「統計が読めない生活者」、相関≠因果・OECD37か国/限定期間の限界を必ず明示、
  something new と次の一歩を 1 つずつ返す、という指示が固定で入っている。
- プロンプト全文は `agewaller/stock-screener` の
  `world-effect-benchmark/interpret-prompt.md` にある（文言調整したい場合はそちらを編集）。
