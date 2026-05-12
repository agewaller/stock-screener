# デプロイ手順書

健康日記 (cares.advisers.jp) のステージング/本番デプロイ運用マニュアル。

> アーキテクチャや禁則事項は [CLAUDE.md](./CLAUDE.md) 参照。本書は
> 「コード変更がどうやって本番に届くか」「初回環境セットアップ」
> 「トラブル時にどこを見るか」だけを扱う。

---

## 目次

1. [環境マトリクス](#環境マトリクス)
2. [ブランチモデル](#ブランチモデル)
3. [ステージングへデプロイする](#ステージングへデプロイする)
4. [本番へデプロイする](#本番へデプロイする)
5. [ホットフィックス（緊急本番修正）](#ホットフィックス緊急本番修正)
6. [ロールバック](#ロールバック)
7. [初回セットアップ（管理者向け、1回だけ）](#初回セットアップ管理者向け1回だけ)
8. [Firebase config の仕組み](#firebase-config-の仕組み)
9. [トラブルシューティング](#トラブルシューティング)
10. [関連ファイル](#関連ファイル)

---

## 環境マトリクス

| 環境 | URL | Firebase | Worker | 駆動ブランチ | デプロイ手段 |
|------|-----|----------|--------|--------------|--------------|
| 本番 (production) | `cares.advisers.jp` | 本番プロジェクト | `stock-screener` 経由 `cares-relay` | `main` | GitHub Pages + GitHub Actions |
| ステージング (staging) | `staging.cares.advisers.jp` | staging プロジェクト | `stock-screener-staging` | `staging` | Cloudflare Pages + GitHub Actions |
| ローカル / プレビュー | `localhost`, `*.github.io` | 未注入 (admin パネルで手動設定) | デフォルト | 任意ブランチ | 手動 |

環境判定は `js/environment.js` が `location.hostname` だけで切り替える。
Firebase 値はソースに含まれず、デプロイ時に CI が
[`scripts/inject-firebase-config.sh`](./scripts/inject-firebase-config.sh)
で注入する（詳細は「Firebase config の仕組み」セクション）。

---

## ブランチモデル

```
feature/foo ──→ PR ──→ staging ──→ 検証 ──→ PR ──→ main ──→ 本番
                          │                          │
                          ▼                          ▼
              staging.cares.advisers.jp     cares.advisers.jp
```

- 機能開発は feature ブランチで
- `staging` に merge してステージングで動作確認
- 問題なければ `staging` → `main` の PR で本番反映
- `staging` は常に `main` 以上であること（hotfix のみ例外、後述）

---

## ステージングへデプロイする

### 手順

#### 1. feature ブランチで開発

```bash
git checkout staging
git pull origin staging
git checkout -b feature/<short-name>
# 編集...
git add -p
git commit -m "変更内容"
git push -u origin feature/<short-name>
```

#### 2. GitHub UI で PR 作成 → merge

- Base: `staging`
- Compare: `feature/<short-name>`
- レビュー後、**Merge pull request** ボタン

#### 3. 自動デプロイを待つ（〜1-2 分）

merge と同時に以下が並行で走る:

| 対象 | デプロイ手段 | 完了確認 |
|------|-------------|---------|
| Frontend (`staging.cares.advisers.jp`) | Cloudflare Pages | Cloudflare ダッシュボード → Pages → プロジェクト → Deployments タブ |
| Worker (`stock-screener-staging`) | GitHub Actions (`deploy-worker.yml`) | GitHub Actions タブで `Deploy Cloudflare Workers` が緑 |

本番 Worker (`stock-screener`, `cares-relay`, `plaud-inbox` 等) は
`staging` push では**デプロイされない**（`main` 限定にゲート済み）。

#### 4. 動作確認（このチェックリストを実施）

`https://staging.cares.advisers.jp` をブラウザで開き:

- [ ] HTTP 200 で表示される / 画面崩れ無し
- [ ] DevTools → Console に JS エラーが無い
- [ ] DevTools → Console で `Environment.current` が `'staging'` を返す
- [ ] DevTools → Network で Anthropic API のリクエスト先が
      `stock-screener-staging.agewaller.workers.dev` を指している
- [ ] DevTools → Application → Local Storage で `firebase_config` の
      `projectId` が staging プロジェクトを指している（または env 注入済み）
- [ ] ログイン画面 / 認証フロー
- [ ] AI チャットで Claude が応答する
- [ ] 主要画面遷移: ダッシュボード / 症状記録 / 設定 / 管理 (admin)
- [ ] モバイル幅 (DevTools 375px) で崩れない
- [ ] 変更した機能のゴールデンパス + エッジケース
- [ ] **本番データを汚していない**（別ブラウザプロファイル/シークレット推奨）

> **重要**: staging Firebase が未設定 (Phase 3 未完了) のうちは認証
> フローが動かない。UI 表示確認のみ可能。

---

## 本番へデプロイする

### 前提

- ステージングで上記チェックリストが全て通っていること
- 必須 GitHub Secrets が登録済みであること（[初回セットアップ](#初回セットアップ管理者向け1回だけ)参照）

### 手順

#### 1. GitHub UI で `staging` → `main` の PR を作成

- Base: `main`
- Compare: `staging`
- タイトル: 「リリース YYYY-MM-DD」など、まとめてリリースされる内容を要約

#### 2. Files changed タブで差分を最終確認

「本番に行く差分」がすべて意図したものか目で見る。未テストの commit
が紛れ込んでいないか・staging で確認していない範囲が無いかをここで止める。

#### 3. レビュー & merge

レビュアーが居る場合は approve を待つ。1 人運用なら自分で差分確認後
**Merge pull request**。

> 通常の merge を使う（squash しない）。`staging` ブランチを fast-forward
> 可能にするため、また将来 hotfix の back-merge が綺麗に通るため。

#### 4. 自動デプロイを待つ（〜2-3 分）

| 対象 | デプロイ手段 | 完了確認 |
|------|-------------|---------|
| Frontend (`cares.advisers.jp`) | GitHub Pages (`pages.yml`) | GitHub Actions → `Deploy to GitHub Pages` 緑 |
| Worker (`stock-screener` ほか本番 Worker 群) | GitHub Actions (`deploy-worker.yml`) | 同 → `Deploy Cloudflare Workers` 緑 |

`pages.yml` の **Inject Firebase production config** ステップが失敗した
場合（Secrets が未設定など）、deploy は走らない。本番は前バージョン
のままなのでサービスは継続する。

#### 5. 本番動作確認

`https://cares.advisers.jp` でステージングと同じチェックリストを軽く
実施。問題があれば即「[ロールバック](#ロールバック)」へ。

---

## ホットフィックス（緊急本番修正）

ステージング経由する余裕がない本番障害のみ:

#### 1. main から hotfix ブランチを切る

```bash
git checkout main
git pull origin main
git checkout -b hotfix/<short-name>
# 修正...
git commit -m "緊急修正: <内容>"
git push -u origin hotfix/<short-name>
```

#### 2. GitHub UI で `hotfix/foo` → `main` の PR → 即 merge

通常の検証チェックリストはスキップしてよい（緊急のため）。ただし
コードレビューは最低限実施。

#### 3. **事後処理（必須）**: main を staging へ back-merge

これを忘れると次の通常 promote (`staging` → `main`) で hotfix が
巻き戻り、同じ障害が再発する。

```bash
git checkout staging
git pull origin staging
git merge origin/main
git push origin staging
```

merge conflict が起きる場合は staging で feature を rebase し直すか、
別途調整 PR を作る。

---

## ロールバック

### 軽微な不具合（デプロイ直後に気づいた）

1. GitHub の問題コミットの PR ページを開く
2. 右上の **Revert** ボタン
3. 生成された Revert PR を `main` (or `staging`) に merge
4. 自動デプロイが走って前の状態に戻る（〜2 分）

### Worker が壊れた

Cloudflare ダッシュボード → Workers & Pages → 該当 Worker
(`stock-screener` / `cares-relay` 等) → **Deployments** タブ →
前バージョンの "..." → **Rollback to this deployment**。

数十秒で前バージョンに戻る。コード修正と並行して即時復旧できる。

### Frontend (GitHub Pages) が壊れた

GitHub Actions タブ → `Deploy to GitHub Pages` で前回の successful
run を開く → **Re-run all jobs**。前回 deploy したコミットの内容で
再 deploy される。

> または `main` で revert PR を作る方が痕跡が残るのでおすすめ。

### Firestore データの誤書き込み

Firestore は自動バックアップを取っていない。誤書き込みは個別に修正:

- 管理パネル `/admin` の「データ管理」から該当ドキュメントを修正
- 大規模な場合は Firebase コンソール → Firestore で直接編集

将来的にスケジュールエクスポート (`gcloud firestore export` を
Cloud Scheduler) を検討。

---

## 初回セットアップ（管理者向け、1 回だけ）

ステージング環境を立ち上げる時に管理者 (`agewaller@gmail.com`) が
手動で行う作業。順番に実施すること。

### Step 1. Firebase staging プロジェクト作成

> このステップが Phase 3。完了するまでステージングは UI 表示のみ
> 動作可能（認証/Firestore 不可）。

1. https://console.firebase.google.com → **プロジェクトを追加**
2. 設定:
   - プロジェクト名: `cares-staging`（任意、本番 `care-14c31` と
     被らない名前ならよい）
   - Google Analytics: 任意（既存 GA プロパティに紐付けるか、新規）
3. プロジェクト作成後、左メニュー **Authentication** → **始める**
   - **Sign-in method** タブ:
     - Google: 有効化（プロジェクト サポートメール = `agewaller@gmail.com`）
     - メール/パスワード: 有効化
   - **Settings** タブ → **承認済みドメイン** に
     `staging.cares.advisers.jp` を追加
4. 左メニュー **Firestore Database** → **データベースの作成**
   - 本番モード（後で `firestore.rules` を deploy するので問題なし）
   - ロケーション: `asia-northeast1` （本番と同じ）
5. 左メニュー **プロジェクト設定（歯車）** → **マイアプリ** →
   **ウェブアプリを追加** （`</>` アイコン）
   - アプリのニックネーム: `health-diary-staging` （任意）
   - Firebase Hosting は使わない（チェックを外す）
   - 表示される config の 7 つの値を控える:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`
     - `measurementId`
6. Firestore セキュリティルールを deploy:

   ```bash
   # ローカルから (firebase-tools 必要)
   npm i -g firebase-tools
   firebase login
   firebase use <staging-project-id>
   firebase deploy --only firestore:rules
   ```

   または GitHub Actions の `deploy-firestore-rules.yml` を staging
   対応に拡張（将来）。

### Step 2. GitHub Secrets 登録（本番用）

GitHub → リポジトリ → **Settings** → **Secrets and variables** →
**Actions** → **New repository secret** で以下 7 個を登録:

| Secret 名 | 値 |
|-----------|-----|
| `FB_PROD_API_KEY` | 本番 Firebase の `apiKey` |
| `FB_PROD_AUTH_DOMAIN` | 本番 Firebase の `authDomain` |
| `FB_PROD_PROJECT_ID` | 本番 Firebase の `projectId` |
| `FB_PROD_STORAGE_BUCKET` | 本番 Firebase の `storageBucket` |
| `FB_PROD_MESSAGING_SENDER_ID` | 本番 Firebase の `messagingSenderId` |
| `FB_PROD_APP_ID` | 本番 Firebase の `appId` |
| `FB_PROD_MEASUREMENT_ID` | 本番 Firebase の `measurementId` |

> 本番値は Firebase コンソール（本番プロジェクト）→ プロジェクト設定
> → マイアプリ から確認できる。

**この Secrets が未登録のまま main を merge すると pages.yml の
inject ステップが失敗し、deploy が走らない**（本番は前バージョンの
まま継続するので安全だが、明示的に登録すること）。

### Step 3. Cloudflare Pages プロジェクト作成（ステージング frontend）

1. Cloudflare ダッシュボード → **Workers & Pages** → **Create application**
   → **Pages** → **Connect to Git**
2. GitHub 連携を承認 → リポジトリ `agewaller/stock-screener` を選択
3. ビルド設定:
   - **Project name**: `cares-staging-site`（任意）
   - **Production branch**: `staging`（**`main` ではない**、重要）
   - **Framework preset**: None
   - **Build command**: `bash scripts/inject-firebase-config.sh STAGING`
   - **Build output directory**: `/`
4. **Environment variables (Production)** に以下 7 個を登録:

| 変数名 | 値 |
|--------|-----|
| `FB_STAGING_API_KEY` | staging Firebase の `apiKey` |
| `FB_STAGING_AUTH_DOMAIN` | staging Firebase の `authDomain` |
| `FB_STAGING_PROJECT_ID` | staging Firebase の `projectId` |
| `FB_STAGING_STORAGE_BUCKET` | staging Firebase の `storageBucket` |
| `FB_STAGING_MESSAGING_SENDER_ID` | staging Firebase の `messagingSenderId` |
| `FB_STAGING_APP_ID` | staging Firebase の `appId` |
| `FB_STAGING_MEASUREMENT_ID` | staging Firebase の `measurementId` |

5. **Save and Deploy**

### Step 4. ステージング用カスタムドメイン

Cloudflare Pages プロジェクト → **Custom domains** → **Set up a custom domain**
→ `staging.cares.advisers.jp`

`advisers.jp` の DNS を Cloudflare で管理している場合は自動で
CNAME が作られる。別レジストラの場合は Cloudflare の指示通り
`staging.cares.advisers.jp` → CNAME → `<project>.pages.dev` を
手動登録。

SSL 証明書は 5-30 分で自動発行される。

### Step 5. Worker secret (stock-screener-staging)

Cloudflare ダッシュボード → Workers & Pages → **stock-screener-staging**
→ **Settings** → **Variables** → **Add variable**

- Type: **Secret**
- Name: `ANTHROPIC_API_KEY`
- Value: Anthropic API key（本番と別キー推奨）

設定後、Workers の Deployments タブから直近 deploy が動いていること
を確認。

### Step 6. staging ブランチ作成

```bash
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

以降 `staging` ブランチは常に `main` 以上を保つ。

### Step 7. End-to-end 動作確認

すべて完了したら:

- [ ] `https://staging.cares.advisers.jp` が表示される
- [ ] DevTools → Console で `Environment.current === 'staging'`
- [ ] DevTools → Console で `FirebaseBackend.getConfig().projectId` が
      staging プロジェクトを指している
- [ ] DevTools → Network で Anthropic リクエストが
      `stock-screener-staging.agewaller.workers.dev` を指している
- [ ] ログインフロー（Google / Email）が通る
- [ ] Firestore に書き込んだデータが staging プロジェクトの Firestore
      コンソールに現れる（本番に紛れていない）

---

## Firebase config の仕組み

Firebase の `apiKey` 等の環境固有値は **ソースに含めず、deploy 時に
CI が注入する**:

```
js/environment.js (ソース)
  ├── apiKey: '__FB_PROD_API_KEY__'      ←─┐
  ├── ...                                   │ deploy 時に
  ├── apiKey: '__FB_STAGING_API_KEY__'   ←─┤ sed 置換
  └── ...                                   │
                                            │
GitHub Pages (pages.yml)                    │
  └── secrets.FB_PROD_*  ──────────────────┘ (本番のみ)

Cloudflare Pages (Build command)
  └── env.FB_STAGING_*  ────────────────────┘ (staging のみ)
```

注入スクリプト: [`scripts/inject-firebase-config.sh`](./scripts/inject-firebase-config.sh)

注入が走らなかった場合（ローカル開発、未注入の preview ビルド等）、
`environment.js` の値は `__FB_*__` プレースホルダのまま残る。
`Environment.firebaseConfig()` がそれを検出して `null` を返し、
`FirebaseBackend.getConfig()` は `localStorage.firebase_config`
（admin パネルで設定可能）にフォールバックする。

> Firebase の `apiKey` は技術的には「公開クライアント識別子」で、
> 実際のセキュリティは Firestore rules + 承認済みドメインで担保
> される。それでも環境を完全分離するため CI 注入方式を採用。

---

## トラブルシューティング

### `pages.yml` の "Inject Firebase production config" で失敗

- GitHub → Settings → Secrets で `FB_PROD_*` 7 個が全部登録されて
  いるか確認
- ログに `missing required env vars` と出る → 不足している変数名が
  表示される
- 値に意図しない文字（特に `|`）が入っていないか確認

### Cloudflare Pages のビルドで失敗

- Pages プロジェクト → 該当 deploy → ログを確認
- `bash scripts/inject-firebase-config.sh STAGING` の出力に
  `missing required env vars` が無いか
- Settings → Environment variables で `FB_STAGING_*` 7 個が登録
  されているか

### `staging.cares.advisers.jp` が 404 / SSL エラー

- Cloudflare Pages → Deployments タブで最新 deploy が **Success** か
- Custom domains タブで `staging.cares.advisers.jp` が **Active** か
- DNS 伝播待ち: `dig staging.cares.advisers.jp` で CNAME が返るか
- SSL 証明書発行待ち: 5-30 分かかる場合あり

### Worker が 401 / 502 を返す

- `stock-screener-staging` の Settings → Variables で
  `ANTHROPIC_API_KEY` が設定されているか
- Worker の **Logs** タブ（リアルタイム）でエラーを確認
- `curl -is https://stock-screener-staging.agewaller.workers.dev/`
  で Worker 自体が生きているか

### 「Firebase 未設定です」と出る

`js/environment.js` の Firebase 値が `__FB_*__` プレースホルダのまま
（注入が走らなかったか、未注入の環境にアクセスしている）。

- 本番なら: GitHub Actions の最新 run で inject ステップが成功した
  か確認
- staging なら: Cloudflare Pages の最新 deploy のビルドログを確認
- ローカルなら: admin パネルから手動で Firebase config を入力

### staging で本番 Firestore に書き込んでしまった

staging Firebase config が未注入だと `Environment.firebaseConfig()`
は `null` を返し、`FirebaseBackend.getConfig()` も `null` を返す
ので **Firebase は初期化されない**（書き込みも発生しない）。

書き込みが起きたとすれば admin パネルで本番 config を手動入力した
ケースのみ。staging で検証する時は admin パネルで本番 config を
入れないこと。

### staging push したのに Cloudflare Pages がデプロイしない

- Pages プロジェクト → Settings → Builds & deployments で
  Production branch が `staging` になっているか
- リポジトリ連携が切れていないか（Settings → Source）

### main にしか反映したくない変更を staging に混ぜたくない

`staging` を `main` に揃え直す:

```bash
git checkout staging
git reset --hard origin/main
git push --force-with-lease origin staging
```

> `--force-with-lease` は **staging だけ**にすること。
> **main で実行してはいけない**。

---

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `.github/workflows/pages.yml` | `main` push で GitHub Pages へデプロイ + Firebase prod config 注入 |
| `.github/workflows/deploy-worker.yml` | `main` / `staging` push で Worker デプロイ（ジョブ単位で `if` ゲート） |
| `wrangler.jsonc` | 本番 Worker (`stock-screener`) 設定 |
| `wrangler.staging.jsonc` | ステージング Worker (`stock-screener-staging`) 設定 |
| `wrangler.relay.jsonc` | `cares-relay`（本番のみ、service binding 経由） |
| `scripts/inject-firebase-config.sh` | Firebase config 注入スクリプト（pages.yml / CF Pages 双方から呼ぶ） |
| `js/environment.js` | hostname で環境判定 + Firebase / Worker URL 切替 |
| `js/firebase-backend.js` | `getConfig()` が Environment → localStorage の順で解決 |
| `firestore.rules` | Firestore セキュリティルール（本番/staging 双方に手動 deploy） |
| `CNAME` | 本番カスタムドメイン (`cares.advisers.jp`)。staging は Cloudflare Pages 側で管理 |
