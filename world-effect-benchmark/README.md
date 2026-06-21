# World Effect Benchmark ─ やさしい解説システム

[World Effect Benchmark](https://chiyo400.github.io/World-Effect-Benchmark/)
（37 か国 × 1180 因子。GDP 成長率・幸福との相関を可視化する社会戦略フォーラム）の
**グラフや数字を、統計に不慣れな人にもやさしく解説する**ための補助ツールです。

> グラフや相関係数・偏差値は、読める人には情報の宝庫ですが、読めない人には
> 「きれいな模様」でしかありません。このツールは、画面の数値を Claude に渡し、
> 「結局どういうこと？」「ちょっと意外な発見（something new）」「次の一歩」までを
> やさしい日本語に翻訳します。

## 中身

| ファイル | 役割 |
|---|---|
| `interpret-prompt.md` | 解説プロンプト本体（コピペで他の AI にも使える） |
| `interpret.html` | プロンプトを内蔵した動く解説ページ（解析システム） |
| `README.md` | これ |

## 仕組み（鍵を漏らさない単一経路）

`interpret.html` は健康日記アプリ（`cares.advisers.jp`）と**まったく同じ安全な経路**で
AI を呼びます:

```
ブラウザ ──(キーなし)──▶ cares-relay.agewaller.workers.dev/v1/messages
                              └─▶ proxy Worker がサーバ側の鍵を注入 ─▶ Anthropic
```

- ブラウザは API キーを一切持たず・送らず・受け取りません。
- relay の **Origin 許可リスト**により、許可オリジン（`cares.advisers.jp` など）から
  ホストされた場合のみ通ります。

## 使い方は 2 通り

### 1. 手で貼り付ける（今すぐ単体で使える）

`interpret.html` を開き、見ている画面の種類を選び、画面の数字を貼り付けて
「やさしく解説してもらう」を押すだけ。数字を読めない人は、見えているものを
そのまま書けば OK です。

### 2. ベンチマーク本体から自動連携（ワンクリック）

ベンチマーク側に「やさしく解説」ボタンを 1 つ足すだけで、いま見ている因子・国・
相関値を自動で渡して解説できます。`interpret.html` は URL の `#payload=` を読みます:

```js
// World-Effect-Benchmark 側に追加するコード例
function explainCurrentView(view, focus, data) {
  // data は文字列でも配列/オブジェクトでも可（例の中身は下記）
  const payload = { view, focus, data };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const url = "https://cares.advisers.jp/world-effect-benchmark/interpret.html#payload="
            + encodeURIComponent(b64);
  window.open(url, "_blank");
}

// 例: World Effect Map で因子を選んでいるとき
explainCurrentView(
  "World Effect Map (4象限)",
  `因子「${f.label}」`,
  [
    `GDP成長との相関 r = ${f.corr_growth.toFixed(3)}`,
    `幸福との相関 r = ${f.corr_happiness.toFixed(3)}`,
    `分類: ${quadrantLabel(f)}`,
    `日本の偏差値: ${f.deviation_scores.JPN ?? "―"}`,
    `この因子と最も一緒に動く因子: ` +
      (DATA.factor_top_corr[f.key]?.top.slice(0,3)
        .map(([k,r]) => `${DATA.factors[k].label} (r=${r.toFixed(2)})`).join(" / ") || "―")
  ].join("\n")
);
```

`#payload=` 付きで開かれると、ページは自動で解説を生成します（ボタン操作不要）。

> ⚠️ 本リポジトリ（`agewaller/stock-screener`）からは `chiyo400/World-Effect-Benchmark`
> を編集できません。上記ボタンは**ベンチマーク側のリポジトリで**追記してください。
> このフォルダのページ自体は、それ無しでも（手貼りで）単体動作します。

## 受け渡しデータ（`payload`）の形

```jsonc
{
  "view":  "World Effect Map (4象限)",     // 画面の種類
  "focus": "因子「教育への公的支出」",       // 注目対象（因子名・国名など）
  "data":  "GDP成長との相関 r = -0.12\n..." // 画面の数値（文字列 or 配列 or オブジェクト）
}
```

`view` に使える値（`interpret.html` のセレクトと対応）:
`World Effect Map (4象限)` / `KGI相関` / `相関ランキング` / `国MAP (散布図)` /
`国別スコアランキング` / `国プロフィール` / `2国比較`

## デプロイ

このフォルダは `agewaller/stock-screener` の GitHub Pages（`cares.advisers.jp`）に
含まれるため、`main` へ push すると
`https://cares.advisers.jp/world-effect-benchmark/interpret.html` で公開されます。
relay の Origin 許可リストに `cares.advisers.jp` が含まれているため追加設定は不要です。

別オリジン（例: `chiyo400.github.io`）に直接置いて relay を叩くと Origin が許可
リスト外となり弾かれます。その場合は relay の `ALLOWED_ORIGINS` に当該オリジンを
追加するか、本ツールを `cares.advisers.jp` 配下に置いてリンクで飛ばす構成にします。

## 設計上の原則（プロダクト共通）

- **データ → AI → 認知を変える出力 → 次の一歩**。単なる数値の反復ではなく、
  something new と具体的アクションを 1 つ返す（健康日記と同じ設計思想）。
- **相関 ≠ 因果** を必ず・やさしく念押し。OECD 37 か国・限られた期間という限界も明示。
- **鍵はサーバのみ**。ブラウザに鍵を置かず、単一の relay 経路だけを使う
  （フォールバック連鎖を足さない）。
