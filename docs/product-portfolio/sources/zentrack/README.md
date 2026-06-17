# ZenTrack

音声文字起こし（Plaud等）をメール経由で受け取り、AIで解析して、健康・仕事・家計などの
日々のインサイトをダッシュボード表示する個人向け分析アプリです。

- バックエンド: Spring Boot (Java 17) … `src/backend`
- フロントエンド: Next.js (React) … `src/frontend`
- データベース: PostgreSQL（ローカルは Docker で自動起動）
- 設計ドキュメント: [`doc/design.md`](doc/design.md)

## ローカルで動かす（デプロイ前の動作確認）

自分のPCでアプリ全体を起動して確認するための手順は、こちらにまとめています:

➡️ **[`doc/local-setup.md`](doc/local-setup.md)（Windows 向け・一から解説）**

### 最短起動コマンド（セットアップ済みの場合）

事前に Docker Desktop / JDK 17 / Node.js+pnpm を導入し、
`src/backend/.env` と `src/frontend/.env.local` を用意済みであることが前提です（詳細は上記手順書）。

```powershell
# 1) Docker Desktop を起動しておく

# 2) バックエンド（PowerShell その1）
cd src\backend
.\run-local.ps1            # → http://localhost:8080

# 3) フロントエンド（PowerShell その2）
cd src\frontend
pnpm install
pnpm dev                   # → http://localhost:3000
```

| 用途 | URL |
|---|---|
| アプリ（フロント） | http://localhost:3000 |
| バックエンド ヘルスチェック | http://localhost:8080/actuator/health |
| 送信メール確認（MailDev） | http://localhost:8025 |
| DB管理画面（pgAdmin） | http://localhost:8081 |
