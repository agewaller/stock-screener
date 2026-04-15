# ME/CFS SEO #1 ランキング獲得プラン

**ターゲットクエリ**: 「ME/CFS」「筋痛性脳脊髄炎」「慢性疲労症候群」「ME/CFS 治療」「ME/CFS アプリ」等
**目標**: Google 日本検索で上記クエリの 1 位獲得
**作成日**: 2026-04-14

---

## 現状分析

### 既に完了している SEO 基盤（コード側）

| 項目 | 状態 |
|---|---|
| `<title>` に ME/CFS 完全ガイドとキーワード優先配置 | ✅ |
| `meta description` に診断基準・治療・ペーシング等のロングテールを含む | ✅ |
| `meta keywords` に 30+ のターゲットキーワード | ✅ |
| Open Graph / Twitter Card | ✅ |
| canonical / hreflang | ✅ |
| JSON-LD `MedicalCondition` (症状・原因・治療・リスクを含む詳細版) | ✅ |
| JSON-LD `MedicalWebPage` (審査済み医療ウェブページとして申告) | ✅ |
| JSON-LD `Article` (datePublished, dateModified, author) | ✅ |
| JSON-LD `FAQPage` (14 問の Q&A) | ✅ |
| `#seo-landing` 初期 HTML コンテンツ (SPA マウント前にクローラが読む) | ✅ |
| 見出し階層 H1→H2→H3 (ME/CFS 完全ガイドを H2 メインに) | ✅ |
| `robots.txt` + `sitemap.xml` | ✅ |
| Google Search Console + Bing Webmaster Tools 認証 | ✅ |
| 患者数データ (世界 + 日本) の数値的権威性 | ✅ |

### 未着手の重要要素（運用 / 外部）

| 項目 | 担当 | 難易度 | 優先度 |
|---|---|---|---|
| **外部被リンク (バックリンク)** | 運営者 | ★★★ | 最重要 |
| note 記事からの相互リンク設置 | 運営者 | ★ | 最重要 |
| 患者会サイトからの被リンク依頼 | 運営者 | ★★★ | 高 |
| Wikipedia 編集による言及 | コミュニティ | ★★★★ | 中 |
| OG 画像 (1200×630) の制作 | 運営者 | ★★ | 高 |
| X/Twitter 運用開始 | 運営者 | ★★ | 高 |
| 定期的なコンテンツ更新 | 運営者 | ★★ | 中 |
| プレスリリース配信 | 運営者 | ★★ | 中 |

---

## 1 位獲得のための 12 のアクション

### 🔴 即効性・最重要（今週中）

#### ① note 記事 2 本に相互リンクを埋め込む
- 既存記事 `nc8305ab7c124` と `n4f373bc7415a` の本文中 or 末尾に以下を追加:
  ```
  ■ 開発したアプリ: [健康日記 (cares.advisers.jp)](https://cares.advisers.jp/)
  ME/CFS の症状記録・PEM トラッキング・AI 分析が全て無料で使えます
  ```
- note.com はドメインオーソリティ (DA) が約 90 と非常に高く、たった 2 本の被リンクでも大きな SEO 効果が期待できる
- **今日 30 分で完了できる最も効率の良い一手**

#### ② Google Search Console で index リクエスト送信
1. https://search.google.com/search-console にログイン
2. プロパティ `cares.advisers.jp` を開く
3. 左メニュー「URL 検査」→ `https://cares.advisers.jp/` を入力
4. 「インデックス登録をリクエスト」ボタンをクリック
5. `sitemap.xml` も改めて送信しておく
- 数時間〜1 日で Google のクロールキューに優先追加される

#### ③ Bing Webmaster Tools でも同様に index リクエスト
- 手順は Google Search Console とほぼ同じ
- Bing は Yahoo! Japan のインデックスソースでもあるので、国内検索の大部分をカバー

### 🟠 短期（今月中）

#### ④ OG 画像の制作とデプロイ
- 1200×630 px の PNG/JPG 画像
- デザイン案:
  - 背景: 紫→ピンクのグラデーション (ブランドカラー)
  - 中央: 「健康日記」ロゴ + 「ME/CFS 完全ガイド」テキスト
  - サブキャッチ: 「症状記録・AI 分析・開発者は ME/CFS 当事者」
  - 世界 6,700 万人・日本 10-30 万人の数字をサブ要素として配置
- 保存場所: `/og-image.png` (リポジトリルート)
- 既に `<meta property="og:image" content="https://cares.advisers.jp/og-image.png">` で参照済み
- X/LINE/Facebook でシェアされた時のサムネが出るようになる

#### ⑤ X (Twitter) アカウント開設と運用開始
- アカウント名案: `@kenkou_nikki_me` または `@kenkou_nikki_app`
- プロフィールに `https://cares.advisers.jp/` を設置
- 投稿テンプレート: `docs/SNS投稿テンプレート.md` を参照
- 毎日の「今日の新処方軸」を自動で投稿するネタにする
- ME/CFS・Long COVID 関連のアカウントを 50-100 人フォロー

#### ⑥ 患者会サイトへの掲載依頼
- 筋痛性脳脊髄炎の会 (ME Association Japan) にメールで問い合わせ
- 依頼内容:
  - 「ME/CFS 患者向けの無料記録アプリを開発しました」
  - 「開発者は 2 年間の ME/CFS 闘病経験あり」
  - 「会員向けに紹介していただけるか?」
- 被リンク獲得 + ターゲット患者層への直接リーチ

#### ⑦ 医療系ブログ・個人ブログへの言及依頼
- ME/CFS を扱っている日本語ブログを 20 本検索
- 個人ブロガーに「記事内で言及していただけたら嬉しいです」とメール
- プロダクトハント的な告知を想定

### 🟡 中期（3 ヶ月以内）

#### ⑧ 定期的なコンテンツ更新 (月次)
- トップページの静的 SEO コンテンツは毎月以下を更新:
  - 最新の ME/CFS 研究 (PubMed から 1-3 本をピックアップ)
  - 最新の治療法・サプリメント
  - 「最終更新: YYYY-MM-DD」を可視化
- Google は「鮮度」も ranking factor にしているので効果大

#### ⑨ 医療ライター・ジャーナリストへのアプローチ
- 健康メディア (ヨミドクター、NHK ハートネット TV、日経 DUAL 等) の編集者にプレスリリース
- 「ME/CFS 当事者が開発した AI 記録アプリ」というナラティブでメディア掲載を狙う
- 掲載されると強力な被リンク + 信頼シグナル

#### ⑩ Wikipedia 編集 (慎重に、ルール遵守で)
- ME/CFS の Wikipedia 項目 (ja / en) に言及できる適切な文脈があれば、外部リンクとして追加を提案
- **注意**: ステマと判断されるので、アプリ自体の宣伝的な追加は NG
- 許容される例: 「日本語で利用可能な患者向け症状記録ツール」の一覧に含める
- 編集履歴で利益相反を開示する

#### ⑪ 学会・研究会への出展・発表
- 日本神経免疫学会、日本心身医学会、日本慢性疲労症候群研究会 等
- ポスター発表 or デモ展示
- 医療従事者への認知獲得 → 患者への紹介

### 🟢 長期（6 ヶ月以上）

#### ⑫ 同症状のコンテンツ拡張 (Long COVID, 線維筋痛症, POTS)
- ME/CFS 単独ではなく、関連疾患も同じレベルの完全ガイドを作る
- それぞれの疾患で #1 を狙うマルチキーワード戦略
- 同時に複数のロングテール検索から流入を獲得

---

## E-E-A-T 強化ポイント

Google は特に健康情報で **E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)** を重視します:

### Experience (体験)
- ✅ 開発者が ME/CFS 当事者 (JSON-LD Person schema に明記)
- ✅ note 記事での闘病体験
- → 追加: サイト内に「開発者ストーリー」ページを作る案

### Expertise (専門性)
- ✅ 診断基準の正確な引用 (IOM, CCC, Fukuda)
- ✅ 治療薬の用量・機序を具体的に記述
- ✅ 最新研究 (TRPM3, BC007, マイクロクロット) の言及
- → 追加: 論文の PubMed リンクをもっと多く

### Authoritativeness (権威性)
- ❌ 外部被リンクが少ない
- ❌ 医療専門家のレビューがない
- → 追加: ME/CFS 専門医や研究者に監修をお願いする (長期目標)

### Trustworthiness (信頼性)
- ✅ プライバシーポリシー (JIS Q 15001 形式)
- ✅ 3省2GL 準拠宣言
- ✅ Pマーク申請準備中の明示
- ✅ セキュリティ脆弱性窓口 (security.txt)
- ✅ 運営者情報 (シェアーズ株式会社) の明記

---

## 検証・計測

### 週次モニタリング (Google Search Console)
- **インプレッション数**: 「ME/CFS」「慢性疲労症候群」等のクエリで何回表示されたか
- **クリック数**: そのうち何回クリックされたか
- **平均順位**: 該当クエリでの平均順位 (目標: 1-3 位)
- **CTR**: クリック率 (目標: 5% 以上)

### 月次モニタリング
- 流入キーワードの多様性 (ロングテール対応の確認)
- 新規被リンクの数 (Search Console → リンクレポート)
- ページ速度 (PageSpeed Insights)
- Core Web Vitals

### 成功基準
- **Month 1**: インプレッション 100 以上、インデックス登録完了
- **Month 2**: 「ME/CFS アプリ」でトップ 5 入り
- **Month 3**: 「ME/CFS 記録」「慢性疲労症候群 アプリ」で 1-3 位
- **Month 6**: 「ME/CFS」単独クエリでトップ 10 入り、「ME/CFS 完全ガイド」で 1 位
- **Year 1**: 「ME/CFS」「筋痛性脳脊髄炎」「慢性疲労症候群」の主要クエリで安定的な上位 (1-5 位)

---

## 注意事項

### Black Hat は絶対 NG
- 自作自演の被リンク
- キーワードスタッフィング
- 有料リンクの購入
- 隠しテキスト
- これらは一度でもバレると永久的にインデックスから除外される

### 医療情報としての慎重さ
- YMYL (Your Money or Your Life) カテゴリなので、不正確な情報は SEO 以前の問題
- すべての治療法には「主治医と相談してください」を明記
- 断定的な表現は避ける (「治る」ではなく「報告されている」)

---

## 参考リンク

- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Google Search Central: 医療 YMYL ガイドライン](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Schema.org MedicalCondition](https://schema.org/MedicalCondition)
- [Schema.org MedicalWebPage](https://schema.org/MedicalWebPage)

## 更新履歴

| 版 | 日付 | 内容 |
|---|---|---|
| 1.0 | 2026-04-14 | 初版制定 |
