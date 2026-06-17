# ローカル開発環境の作り方（Windows）

> 対象: Windows 10/11。**Docker Desktop で web/api/DB をまとめて起動**する一番簡単な方法。
> ホストに Node や pnpm を入れる必要はありません。
> 困ったら各ステップの「うまくいかないとき」を見てください。

---

## このゴール

- **第1ゴール（まずここまで）**: アプリが起動して、ブラウザ `http://localhost:3000` で画面が見える。
  - ※ この段階では**ログインはまだできません**（Firebase 設定が未投入のため）。画面が出ればOK。
- **第2ゴール（あとで）**: ログインも動くように `.env` に Firebase の設定を入れる。

---

## Part 0. 必要なソフトを入れる（初回だけ）

### 0-1. Docker Desktop を入れる
1. ブラウザで **https://www.docker.com/products/docker-desktop/** を開く。
2. 「Download for Windows」をクリックしてインストーラを実行。
3. 途中で **「Use WSL 2 instead of Hyper-V」にチェックが入っている**ことを確認して進める。
4. インストール後、**PC を再起動**。
5. スタートメニューから **Docker Desktop** を起動。クジラのアイコンが「Running（緑）」になればOK。
   - 初回は「WSL2 をインストール/更新してください」と出ることがあります。表示された案内（ボタン or `wsl --install`）に従って進め、再起動してください。

> **うまくいかないとき（WSL2）**: PowerShell を「管理者として実行」で開き、`wsl --install` を実行 → 再起動。
> それでも出るなら `wsl --update` も実行。

### 0-2. Git を入れる
1. **https://git-scm.com/download/win** を開くと自動でダウンロードが始まります。
2. インストーラは**すべて「Next」既定のまま**で進めてOK。
3. 入ったか確認: スタートメニューで **「Git Bash」** が見つかればOK。

---

## Part 1. コードを取ってくる

PowerShell（スタートメニューで「PowerShell」と検索して起動）で、1行ずつ実行します。

```powershell
# 置き場所（例: ドキュメント）に移動
cd $HOME\Documents

# リポジトリを取得
git clone https://github.com/agewaller/cares.git

# 中に入る
cd cares
```

> **初回の git clone で認証を求められたら**: ブラウザでの GitHub ログイン（OAuth）に従ってください。
> うまくいかない場合は GitHub の「Sign in with your browser」を選べばOKです。

---

## Part 2. アプリを起動する（第1ゴール）

`cares` フォルダの中にいることを確認して、PowerShell で実行します。

```powershell
# 3つのサービス(DB / api / web)をビルドして起動。初回は数分かかります。
docker compose up -d --build
```

完了したら、DB の準備（テーブル作成）を1回だけ実行します。

```powershell
# DB が起動しきるのを少し待ってから（30秒ほど）↓
docker compose exec api sh -c "cd /app/packages/db && pnpm exec prisma migrate deploy"
```

動作確認:

```powershell
# api の生存確認（{"status":"ok"} が返ればOK）
curl http://localhost:8080/healthz
```

最後にブラウザで **http://localhost:3000** を開く → 画面が表示されれば **第1ゴール達成** です 🎉
（繰り返しますが、ログインはまだ動きません。画面が出ればOK。）

### よく使う操作

```powershell
# 状態を見る
docker compose ps

# ログを見る（Ctrl+C で抜ける）
docker compose logs -f api
docker compose logs -f web

# 止める（データ＝DBは残ります）
docker compose down

# もう一度起動（2回目以降は --build 不要で速い）
docker compose up -d
```

> **うまくいかないとき**
> - `docker: command not found` → Docker Desktop が起動していません。クジラが緑か確認。
> - web がエラー画面 → `docker compose logs -f web` でログ確認。初回はビルド中のことがあるので1〜2分待つ。
> - ポートが使用中（5432/8080/3000）→ 既に別のものが使っています。該当アプリを止めるか、教えてください。
> - migrate でエラー → DB がまだ準備中かも。1分待って再実行。

---

## Part 3.（あとで）ログインも動かす — Firebase 設定

ログイン（Google / メール）を動かすには、GCP の **Identity Platform（Firebase Auth）** の設定値を
`.env` に入れます。ここは値の取得に GCP コンソール操作が要るので、**準備ができたら一緒にやりましょう**。

1. リポジトリ直下の `.env.example` をコピーして `.env` を作る:
   ```powershell
   copy .env.example .env
   ```
2. `.env` をメモ帳などで開き、以下を実際の値に置き換える（取得手順は後述／伴走します）:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `FIREBASE_SERVICE_ACCOUNT_JSON`（サービスアカウントの JSON を1行で）
   - `AUTH_SECRET`（ランダム文字列。Git Bash で `openssl rand -hex 32`）
   - `ADMIN_BREAKGLASS_TOKEN`（同上）
3. 反映するため再起動:
   ```powershell
   docker compose down
   docker compose up -d --build
   ```

> Firebase の値の取り方（プロジェクト作成 → Web アプリ登録 → サービスアカウント鍵）は
> `README.md` の「認証セットアップ」にも記載があります。第2ゴールに進むときに、画面に沿って案内します。

---

## 困ったら

- エラーメッセージ（赤い文字）を**そのままコピペ**で教えてください。どこで詰まったか特定して直します。
- `docker compose logs -f web` / `... api` の最後の20行くらいを貼ってもらえると原因が早く分かります。
