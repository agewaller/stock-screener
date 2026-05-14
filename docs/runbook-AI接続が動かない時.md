# 🚨 AI が動かない時の対処マニュアル

> **このドキュメントは誰のため？**
> 健康日記の AI 分析が「Load failed」「接続できません」などのエラーで動かなくなった時、
> エンジニア以外でも復旧できるように手順をまとめたものです。
> 1 つずつ順番に試してください。途中で動いたらそこで終わって OK です。

---

## 全体像を 30 秒で理解する

健康日記の AI は、こういう経路を通っています：

```
あなたのスマホ
  ↓
cares.advisers.jp（健康日記の画面。GitHub Pages で配信）
  ↓
cares-relay（Cloudflare の小さなプログラム = "Worker"）
  ↓
stock-screener（同じく Cloudflare の Worker。ここで Anthropic API を呼ぶ）
  ↓
Anthropic（Claude を作ってる会社のサーバー）
```

途中の **どこか 1 箇所**が止まっていると、ユーザーには「AI が動かない」と見えます。
このマニュアルでは、よくある原因を上から順に潰していきます。

---

## レベル 1: まず 1 分でできる確認

### 1-1. ユーザー側の問題かどうかを切り分ける

- 自分のスマホ（または PC）の **シークレットモード**で https://cares.advisers.jp を開く
- ログインせずにゲストモードで「AI 分析を試す」みたいなボタンを押す
- **エラーが出る** → サーバー側の問題（このマニュアルを続行）
- **動く** → そのユーザーのスマホの問題（キャッシュ削除や再起動を案内）

### 1-2. Cloudflare 側がそもそも生きてるか

スマホやPC のブラウザのアドレスバーに以下を入れてアクセス：

```
https://cares-relay.agewaller.workers.dev/
```

| 表示されたもの | 意味 | 対処 |
|---|---|---|
| 403 エラー / "host_not_allowed" | Cloudflare の workers.dev サブドメインが **無効**になっている | → **レベル 2** へ |
| 何かの JSON や "service binding PROXY not configured" | Worker は生きてる。別の問題 | → **レベル 3** へ |
| 真っ白 / つながらない | Cloudflare 自体に障害？ | https://www.cloudflarestatus.com/ を確認 |

---

## レベル 2: Cloudflare の workers.dev を有効化する（最頻出原因）

これが今回起きた問題そのものです。**95% のケースはこれで直ります。**

### 2-1. Cloudflare ダッシュボードを開く

1. ブラウザで https://dash.cloudflare.com/ を開く
2. メールアドレスでログイン（agewaller@gmail.com）

### 2-2. cares-relay Worker を開く

1. 画面左の**ハンバーガーメニュー**（≡）から **「Workers & Pages」** をタップ
2. 一覧に Worker が並んでいる：
   - `stock-screener`（本体）
   - `cares-relay`（中継）
   - `plaud-inbox`（メール受信）
   - 他にもいくつかあるはず
3. **`cares-relay`** をタップ（`stock-screener` ではない！ここ間違えやすい）

> ⚠️ よくある間違い：`stock-screener` の方を開いてしまう。
> あれは Cloudflare Access で意図的に守られているので、workers.dev は OFF が正解。
> ON にすべきなのは `cares-relay` の方です。

### 2-3. 設定タブに移動

1. 上部のタブから **「設定」** をタップ
2. 下にスクロールして **「ドメインとルート」** セクションを探す

### 2-4. workers.dev トグルを ON にする

1. 「ドメインとルート」の中に **タイプ: workers.dev** という行がある
2. 値は `cares-relay.agewaller.workers.dev` になっているはず
3. その行の **「Access」→「公開 / 誰でもアクセスできます」** のトグルスイッチを確認
4. **OFF（グレー）になっていたら、タップして ON（青）にする**
5. 確認ダイアログが出たら **「公開する / Confirm」** をタップ

### 2-5. 動作確認

別のタブで以下を開く：

```
https://cares-relay.agewaller.workers.dev/
```

- 「403 / host_not_allowed」が出なくなれば成功 🎉
- まだ 403 が出る場合 → 5 分待ってもう一度（DNS 反映待ち）

---

## レベル 3: それでも動かない時

### 3-1. stock-screener に Anthropic API キーが入ってるか

1. Cloudflare ダッシュボード → Workers & Pages → **`stock-screener`** をタップ
2. **「設定」** タブ → **「変数とシークレット」** セクション
3. 以下があるか確認：
   - `ANTHROPIC_API_KEY` (タイプ: シークレット)
4. **ない場合** → エンジニアに連絡（コマンドで設定が必要）

### 3-2. cares-relay が stock-screener に正しく繋がってるか

1. Cloudflare ダッシュボード → Workers & Pages → **`cares-relay`** をタップ
2. **「設定」** タブ → **「バインディング」** セクション
3. 以下があるか確認：
   - `PROXY` → サービス: `stock-screener`
4. **ない、または別の Worker を指している場合** → エンジニアに連絡

### 3-3. リアルタイムログで本当のエラーを見る

1. Cloudflare ダッシュボード → Workers & Pages → **`stock-screener`** をタップ
2. 上部タブから **「ログ」** または **「Observability」→「Logs」** をタップ
3. **「Begin log stream / ログのストリーミングを開始」** をタップ
4. その状態で別タブから https://cares.advisers.jp で AI を動かしてみる
5. ログに出るエラーメッセージをコピーしてエンジニアに送る

---

## レベル 4: コード側の設定を直す（エンジニア向け）

ここまで来たら通常はエンジニア対応が必要ですが、参考に記載：

### 4-1. 管理パネルでプロキシ URL を確認

1. https://cares.advisers.jp に管理者アカウント（agewaller@gmail.com）でログイン
2. メニューから「管理パネル」を開く
3. **「APIプロキシURL」** が以下になっていることを確認：
   ```
   https://cares-relay.agewaller.workers.dev
   ```
4. 違っていたら上記に書き換えて **保存** をタップ
5. これで全ユーザーの設定が次回起動時に上書きされる

### 4-2. もし `ai.cares.advisers.jp` が入っていたら

2026年4月の構成変更で一旦 `ai.cares.advisers.jp` を使う計画だったが、
`advisers.jp` ドメインの DNS が Cloudflare 外（GitHub Pages 用）にあるため
DNS 解決ができず断念。今は `cares-relay.agewaller.workers.dev` が正解。

将来 `advisers.jp` ドメインを Cloudflare に移管したら `ai.cares.advisers.jp` を
再びプライマリに戻せる（コード側は対応済み、フォールバックとして残置中）。

---

## レベル 5: それでも直らない時

以下の情報を集めて Claude Code に渡してください：

1. **Cloudflare ダッシュボードのスクショ**：
   - `cares-relay` の「ドメインとルート」画面
   - `stock-screener` の「変数とシークレット」画面（API キーは黒塗りで OK）
   - `cares-relay` の「バインディング」画面

2. **ブラウザの開発者ツール情報**（PC の場合）：
   - F12 を押して開発者ツールを開く
   - **Network** タブで `v1/messages` のリクエストを探す
   - リクエスト URL / ステータスコード / レスポンスをコピー

3. **エラーメッセージ全文**：
   - 健康日記の画面に出た日本語のエラー
   - その下の「🔍 詳細」を開いてコピーした診断情報

これだけあれば、ほぼ確実に原因特定できます。

---

## 用語集（初心者向け）

| 用語 | 意味 |
|---|---|
| **Cloudflare** | 健康日記の AI サーバーを動かしてもらってる会社 |
| **Worker** | Cloudflare 上で動く小さなプログラム。健康日記には `stock-screener` と `cares-relay` の 2 つがある |
| **workers.dev** | Cloudflare が無料で配ってくれる標準ドメイン（例: `xxx.agewaller.workers.dev`） |
| **カスタムドメイン** | 自分で持ってるドメインを Worker に紐づけたもの（例: `ai.cares.advisers.jp` 計画）|
| **DNS** | ドメイン名を IP アドレスに変換する仕組み。これが設定されてないと「サーバーが見つからない」になる |
| **service binding** | Worker 同士を内部接続する仕組み。これを使うと Cloudflare Access の認証を迂回できる |
| **Cloudflare Access** | Worker に認証を強制する仕組み。`stock-screener` はこれで守られている |
| **シークレット** | 環境変数のうち、API キーなど秘密にする値。コードに書かずに Cloudflare 側で保管 |

---

## 過去にあったトラブル事例

### 2026-05-14: ai.cares.advisers.jp で全停止

- **症状**: iOS Safari で「Load failed」、全ユーザーで AI 動かず
- **原因**: 4 月に `ai.cares.advisers.jp` をプライマリに変えたが、`advisers.jp` ドメインが Cloudflare 外にあるため DNS が解決できなかった
- **対処**: `cares-relay.agewaller.workers.dev` をプライマリに戻し、workers.dev サブドメインを再有効化
- **再発防止**: このマニュアル作成。今後カスタムドメインに移行する時は **必ず DNS 移管を先に完了**してから設定変更すること
