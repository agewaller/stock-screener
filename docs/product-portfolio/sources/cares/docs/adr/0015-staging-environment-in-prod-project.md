# ADR-0015: ステージング環境を本番 GCP プロジェクト内に共存構築

- Status: Accepted
- Date: 2026-06-02
- Deciders: オーナー、Claude（提案）

## Context（背景）

本番デプロイ前の検証ゲートとして、本番と同様の仕様のステージング環境が必要になった
（詳細設計書 §8 の CI/CD パイプライン「main → staging 検証 → 手動承認 → prod」の staging 部分）。

[ADR-0005](0005-gcp-services-and-environments.md) の原設計では dev / staging / prod を
**別 GCP プロジェクトに分離**する計画だった。しかし実装に着手した時点で次の制約が判明した:

- 本番プロジェクト `arctic-anvil-497002-q2` が属する**組織・課金アカウントに対し、
  運用担当アカウント (yano@bresson.biz) はプロジェクト作成権限を持たない**
- 新規プロジェクト作成には組織管理者（オーナー側）への権限付与依頼が必要で、構築がブロックされる
- プロジェクト分離はクロスプロジェクト IAM（SA 権限・Secret 共有・Identity Platform 連携）の
  複雑さも持ち込む

一方、本番プロジェクト内にはすでに dev 用リソース（`cares-photos-dev` バケット等）が
共存しており、「同一プロジェクト内での環境共存」には前例がある。

## Decision（決定）

**ステージング環境は本番と同じ GCP プロジェクト `arctic-anvil-497002-q2` 内に、
`-staging` 接尾辞のリソースとして構築する。** 相互干渉は命名分離 + IAM 分離で遮断する。

### リソース分離

| リソース | prod | staging |
|---|---|---|
| Cloud Run | `cares-api` / `cares-web` | `cares-api-staging` / `cares-web-staging` |
| Cloud SQL | `cares-db-prod` | `cares-db-staging`（普段は停止 = activation-policy NEVER） |
| GCS バケット | `cares-photos-prod` | `cares-photos-staging` |
| Artifact Registry | `cares-images` | `cares-images-staging`（repo ごと分離） |
| ランタイム SA | `cares-firebase-admin@...` | `cares-run-staging@...`（新規・専用） |
| Secret (DB) | `cares-db-url-prod` / `cares-db-password-prod` | `cares-db-url-staging` / `cares-db-password-staging` |
| Secret (auth/breakglass/AI) | `cares-auth-secret` 等 | 各 `-staging` 接尾辞（値も staging 専用） |
| Secret (フィールド暗号化鍵) | `cares-data-encryption-key` | `cares-data-encryption-key-staging`（値も staging 専用。一度決めたら不変） |
| Secret (Firebase SA JSON) | `cares-firebase-sa-json` | **共用**（同一 Identity Platform のため） |
| Identity Platform | 本番のもの | **共用**（staging の web URL を Authorized Domains に追加） |

### 相互干渉の遮断（IAM 分離）

- **staging ランタイム SA (`cares-run-staging`) には staging の secret だけ** accessor を付与する。
  prod の secret（DB パスワード / URL）を読めない = **prod DB に物理的に到達できない**
- prod の SA には staging の secret へのアクセス権を付与しない（逆方向も遮断）
- Artifact Registry を repo ごと分離し、staging ビルドが prod の `:latest` イメージタグを
  上書きする事故を構造的に排除
- prod 側への変更は 2 点のみ（どちらも追加的・既存動作に影響なし）:
  1. prod SA (`cares-firebase-admin`) に staging バケットの `storage.objectAdmin` を付与
     （GCS 署名付き URL はアプリが `FIREBASE_SERVICE_ACCOUNT_JSON` = prod SA の鍵で署名するため）
  2. 共用 secret `cares-firebase-sa-json` に staging SA の accessor を追加

### 環境切替の仕組み（CARES_ENV オーバーレイ）

`infra/scripts/_env.sh` に `CARES_ENV` スイッチを導入。`CARES_ENV=staging` のときだけ
`_env.staging.sh`（staging 差分の再 export）を末尾で読み込む。

- **prod（既定）のときは挙動が一切変わらない** = 本番デプロイフローへの回帰リスクゼロ
- 既存スクリプト 00〜08 / 99 は変数参照のみで構成されているため、オーバーレイだけで
  無変更のまま staging 対象に切り替わる（例外: `02-create-bucket-prod.sh` のみ署名用 SA への
  権限付与を staging 時に追加）

### コスト方針

- staging Cloud SQL は**検証時のみ起動**（`gcloud sql instances patch --activation-policy=ALWAYS/NEVER`）
- アイドル時の追加コストは月 $2-3 程度（SQL ストレージ + GCS + Secret/AR）

### AI (Anthropic) キー

- staging 専用 secret `cares-anthropic-api-key-staging` を作成し、**初期値は prod のキーをコピー**
  （staging でも AI 機能を検証可能にする）
- 後から staging 専用キーに差し替え可能（secret に新バージョン追加 + 再デプロイのみ。コード変更不要）
- アプリの月次キャップ（1000 円 / ADR-0006）は DB ごとに独立して効くため、staging の使用量は別カウント

## Consequences（含意）

### 良い面

- 外部依頼（組織管理者への権限付与）なしで即座に構築できる
- クロスプロジェクト IAM の複雑さがない（Identity Platform / Firebase SA JSON が自然に共用できる）
- IAM 分離により「staging から prod のデータに触れない」を構造的に保証
- 本番デプロイフロー（`infra/scripts/` / CLAUDE.md の手順）は無変更で従来どおり動く

### 悪い面・トレードオフ

- ADR-0005 の原設計（プロジェクト分離による障害隔離・コスト可視化・権限分離）より分離度は低い:
  - プロジェクト quota（Cloud Run 同時インスタンス数等）を prod と共有する
  - 課金がプロジェクト単位では分離されない（リソース単位の内訳では確認可能）
  - プロジェクトレベル IAM 事故（例: 誤って SA に project owner を付与）は両環境に波及しうる
- staging の Cloud SQL が停止中は staging アプリの DB 系 API が 500 を返す（仕様。検証時に起動する）
- Identity Platform 共用のため、staging での認証テストは本番のユーザープールに対して行われる
  （E2E がユーザーを作成/削除する場合は本番認証基盤に影響する点に注意 — dev ローカルと同じ制約）

### 後で再検討すべきこと

- 利用者が増えて障害隔離・権限分離の要件が高まったら、ADR-0005 の原設計（`cares-staging`
  プロジェクト分離）に移行する。その際は組織管理者にプロジェクト作成を依頼し、本 ADR の
  IAM 分離設計をクロスプロジェクト版に拡張する
- GitHub Actions による staging 自動デプロイ（ADR-0013 S-4 の「stg → 検証 → prd」フロー自動化）

## Alternatives Considered（検討した代替案）

- **新規 GCP プロジェクト `cares-staging` を作成（ADR-0005 原設計）**: 分離度は最高だが、
  組織・課金アカウントへの権限がなく構築がブロックされる。組織管理者への依頼と
  クロスプロジェクト IAM 設計が必要。利用者増加時の将来オプションとして維持。
- **prod の Cloud SQL インスタンスに staging 用 DB を同居**: 追加コストほぼゼロだが、
  マイグレーション検証の負荷が本番 DB インスタンスに乗る。インスタンス分離を採用。
- **prod のランタイム SA を staging でも共用**: セットアップは最小だが、staging Cloud Run が
  prod の secret を読める状態になり「干渉しない」要件を満たさない。SA 分離を採用。
- **Artifact Registry repo を共用しタグで分離**: `:latest` タグの上書き事故リスクが残るため不採用。
