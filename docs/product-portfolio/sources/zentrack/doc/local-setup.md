# ローカル開発環境セットアップ手順（Windows）

このドキュメントは、**コードをデプロイする前に自分のPCでアプリ全体を起動して動作確認する**ための
ローカル環境（いわゆる「ローカルのステージング環境」）の作り方を、初めての人向けに一から説明します。

ZenTrack は次の3つを同時に動かして1つのアプリになります。

| 役割 | 中身 | 動かし方 | URL / ポート |
|---|---|---|---|
| バックエンド | Spring Boot (Java) | `run-local.ps1` | http://localhost:8080 |
| フロントエンド | Next.js | `pnpm dev` | http://localhost:3000 |
| データベース等 | PostgreSQL / メール / 管理画面 | Docker（バックエンド起動時に自動） | 5432 / 8025 / 8081 |

> 全体像のイメージ
> ```
> ブラウザ → フロント(3000) → バック(8080) → PostgreSQL(Docker)
>                                         ＼→ MailDev(送信メール確認 8025)
> ```

---

## 0. 事前に用意するもの（重要）

バックエンドは起動時に **Firebase の認証情報が必須**で、これが無いと起動に失敗します。
また、ログイン機能も Firebase を使うため、**開発用 Firebase プロジェクトの情報**が必要です。
以下を先に入手してください（分からなければ担当エンジニアに依頼するのが確実です）。

1. **Firebase サービスアカウントの秘密鍵（JSON）** … バックエンド用
   （Firebase コンソール → プロジェクトの設定 → サービス アカウント → 新しい秘密鍵を生成）
2. **Firebase ウェブアプリの設定値**（apiKey など） … フロントエンド用
   （Firebase コンソール → プロジェクトの設定 → 全般 → マイアプリ（ウェブ））
3. **OpenAI の API キー** … AI解析機能を試す場合のみ（起動だけなら無くても可）

> メモ: 上の 1・2 は「同じ開発用 Firebase プロジェクト」のものを使います。

---

## 1. 前提ソフトのインストール

すべて Windows 用です。インストール後、各「確認コマンド」をターミナル（PowerShell）で実行して、
バージョンが表示されればOKです。

### 1-1. Docker Desktop（データベース等を動かすのに必須）
- ダウンロード: https://www.docker.com/products/docker-desktop/
- インストール時に **WSL2 を有効化**（インストーラの指示に従えばOK。求められたら Windows を再起動）。
- インストール後、**Docker Desktop を起動**しておきます（タスクトレイのクジラのアイコンが安定したら準備完了）。
- 確認コマンド:
  ```powershell
  docker --version
  ```

### 1-2. Git（ソースコードの取得・管理）
- ダウンロード: https://git-scm.com/download/win
- 確認コマンド:
  ```powershell
  git --version
  ```

### 1-3. JDK 17（バックエンドを動かすのに必須）
- Eclipse Temurin 17 がおすすめ: https://adoptium.net/temurin/releases/?version=17
- インストーラで「Set JAVA_HOME」「Add to PATH」にチェックを入れると楽です。
- 確認コマンド（`17` で始まれば OK）:
  ```powershell
  java -version
  ```

### 1-4. Node.js（フロントを動かすのに必須）＋ pnpm
- Node.js LTS をダウンロード: https://nodejs.org/ja
- インストール後、**pnpm を有効化**します（このプロジェクトは pnpm を使います）:
  ```powershell
  corepack enable
  ```
- 確認コマンド:
  ```powershell
  node -v
  pnpm -v
  ```
  > `pnpm` が見つからない場合は、`corepack enable` を実行したターミナルを一度閉じて開き直してください。

---

## 2. ソースコードを取得する

すでにクローン済みならこの手順は飛ばしてOKです。

```powershell
git clone <リポジトリのURL> zentrack
cd zentrack
```

以降のコマンドはすべて、この `zentrack` フォルダを起点に説明します。

---

## 3. バックエンドを起動する

### 3-1. 環境変数ファイルを用意
```powershell
cd src\backend
Copy-Item .env.example .env
```
作成された `.env` をテキストエディタで開き、**手順0で入手した Firebase の秘密鍵(JSON)の値**を
それぞれの項目に転記します（各項目の説明はファイル内のコメントを参照）。
AI機能を試す場合は `CONFIG_OPENAI_API_KEY` も設定します。

> `.env` は Git の管理対象外（`.gitignore` 済み）なので、コミットされる心配はありません。

### 3-2. Docker Desktop が起動していることを確認
DB（PostgreSQL）はバックエンド起動時に **Docker で自動的に立ち上がります**。
そのため Docker Desktop が起動状態である必要があります。

### 3-3. バックエンドを起動
```powershell
.\run-local.ps1
```
このスクリプトが `.env` を読み込み、`gradlew.bat bootRun` でアプリを起動します。
- 初回は依存ライブラリのダウンロードで数分かかります。
- コンソールに `Started ... in X seconds` と表示されれば起動成功です。
- 停止するには `Ctrl + C`。

> もし「スクリプトの実行が無効です」と出たら、一度だけ次を実行してから再度試してください:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

起動確認:
```powershell
curl http://localhost:8080/actuator/health
```
`{"status":"UP"}` が返ればOKです（ブラウザで同URLを開いても確認できます）。

---

## 4. フロントエンドを起動する

**バックエンドを起動したまま、別の PowerShell ウィンドウ**を開いて作業します。

```powershell
cd src\frontend
Copy-Item .env.local.example .env.local
```
`.env.local` を開き、**手順0で入手した Firebase ウェブアプリの設定値**を埋めます。
`NEXT_PUBLIC_API_URL` は `http://localhost:8080` のままでOKです。

依存インストールと起動:
```powershell
pnpm install
pnpm dev
```
`http://localhost:3000` が案内されたら、ブラウザで開きます。

---

## 5. 動作確認（デプロイ前チェック）

すべて起動した状態で、以下を確認します。

1. **フロント**: http://localhost:3000 が表示される。
2. **登録/ログイン**: 画面から新規登録 → ログインができる（Firebase 認証が動いている証拠）。
3. **バックエンド疎通**: http://localhost:8080/actuator/health が `UP`。
4. **送信メールの確認**: http://localhost:8025 （MailDev）でアプリが送ったメールを確認できる。
5. **DBの確認（任意）**: http://localhost:8081 （pgAdmin / `example@example.com` / `password`）。
6. **主要画面の操作**: ログイン後にダッシュボード・設定・プロンプトなどを一通り触り、
   エラーが出ないことを確認する。

ここまで問題なければ、**ローカルでの動作確認は完了**です。
この確認をデプロイ前に毎回行うことで、本番に壊れたコードを上げてしまうのを防げます。

> ワークフローの考え方:
> 「コードを変更 → ローカルで起動して上の確認 → 問題なければデプロイ」。
> この“ローカルで一通り動かす”工程が、エンジニアの言う「ステージングでテストする」に当たります。

---

## 6. 2回目以降の起動（まとめ）

1. Docker Desktop を起動
2. PowerShell その1: `cd src\backend` → `.\run-local.ps1`
3. PowerShell その2: `cd src\frontend` → `pnpm dev`
4. ブラウザで http://localhost:3000

（`.env` / `.env.local` は一度作れば次回以降はそのまま使えます）

---

## 7. うまくいかないとき（トラブルシュート）

| 症状 | 原因と対処 |
|---|---|
| バックエンドが起動直後に落ちる | `.env` の Firebase 情報が未設定/誤り。特に `CONFIG_FIREBASE_PRIVATE_KEY` は `"..."` で囲み、改行を `\n` のままにする。 |
| `Cannot connect to the Docker daemon` 等 | Docker Desktop が起動していない。起動して安定するまで待つ。 |
| `run-local.ps1` が「実行が無効」 | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` を一度実行。 |
| `pnpm` が見つからない | `corepack enable` を実行し、ターミナルを開き直す。 |
| `port 8080 / 3000 is already in use` | 既に同じアプリや別アプリが使用中。該当プロセスを終了するかPCを再起動。 |
| ログインできない | フロントの `.env.local`（`NEXT_PUBLIC_FIREBASE_*`）が未設定/誤り。バックの Firebase と同じプロジェクトの値か確認。 |
| AI解析がエラー | `CONFIG_OPENAI_API_KEY` 未設定。起動はできるが解析機能には必要。 |

> 既知の制約: `src/backend/.devcontainer.json` は現状存在しない `../docker/docker-compose.yml` を参照しており、
> VS Code の DevContainer 機能はそのままでは使えません。本手順（PowerShell 直接起動）では不要です。
