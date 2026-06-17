# vm-suite

VM（Valuation Model）プロジェクトのモノレポ。企業バリュエーション分析のための API・Web アプリ・CLI を含む。

## 構成

```
apps/
  api/          Rust (Axum + SeaORM) - REST API & バッチジョブ
  cli/          Rust - CLI ツール
  admin-console/  SolidStart - 管理画面
  user-console/   SolidStart - ユーザー向け画面
  vm-app/         SolidStart + Tauri - デスクトップアプリ
db/
  migrations/   SQL マイグレーション (geni)
  migrate.sh    マイグレーション実行スクリプト
auth/           Firebase 認証関連
```

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| API | Rust, Axum, SeaORM, PostgreSQL |
| フロントエンド | SolidJS, SolidStart, Ark UI, Panda CSS |
| デスクトップ | Tauri |
| 認証 | Firebase Auth |
| インフラ | Google Cloud Run, Cloud Build, Artifact Registry |
| DB マイグレーション | geni |

## 開発

### API (Rust)

```bash
cd apps/api
cargo run        # API サーバー起動
cargo run --bin jobs  # バッチジョブ実行
```

### admin-console / user-console

```bash
cd apps/admin-console  # or apps/user-console
pnpm install
pnpm dev
```

### デスクトップアプリ

```bash
cd apps/vm-app
pnpm install
pnpm dev
```

### マイグレーション

```bash
cd db
./migrate.sh up      # マイグレーション適用
./migrate.sh create <name>  # 新規マイグレーション作成
```

## デプロイ

Cloud Build で Cloud Run にデプロイ。

- `cloudbuild-admin.yaml` - admin-console 用
- `cloudbuild-user.yaml` - user-console 用
- `cloudbuild.yaml` - API 用
