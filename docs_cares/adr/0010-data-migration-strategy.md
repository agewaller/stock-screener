# ADR-0010: データ移行戦略（自動移行 + クリーンカットオーバー）

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

## Context

旧仕様 cares.advisers.jp で稼働中のサービスを新仕様に置き換える。既存ユーザーは数十人規模。ドメインは継続使用。データ・アカウント両方を自動移行する方針が確定（論点 10）。

ただし「自動移行」には複数の実装上の論点がある:

- Firebase Auth → Keycloak の認証移行（特に Email + Password ユーザーのパスワード）
- 匿名認証ユーザーの扱い
- Firestore → PostgreSQL のスキーマ変換
- Firebase Storage → Cloud Storage の物理コピー
- カットオーバー時のダウンタイム最小化

## Decision

### 移行範囲と方法

| 対象 | 旧 | 新 | 移行方法 |
|---|---|---|---|
| ユーザーアカウント（Google OAuth） | Firebase Auth | Keycloak | Keycloak の Google IdP 設定で同じ Google アカウント → シームレスログイン |
| ユーザーアカウント（Email + Password） | Firebase Auth | Keycloak | パスワードハッシュは移行困難。**JIT 移行 + 強制パスワードリセット**（初回ログイン時にメールリンクで再設定） |
| ユーザーアカウント（匿名） | Firebase Auth Anonymous | （SSO 圏外） | 個別対応。希望者には事前に正規アカウント昇格を案内 |
| 健康データ（9 カテゴリ） | Firestore | Cloud SQL | 移行スクリプトで一括変換、新スキーマに合わせて整形 |
| AI 会話履歴 | Firestore | Cloud SQL | 同上 |
| 写真・添付 | Firebase Storage | Cloud Storage | gsutil で一括コピー、メタデータは DB に同期 |
| ユーザー設定 | Firestore | Cloud SQL `user_preferences` | 同上 |

### カットオーバー手順

1. **事前準備**: 新システムを staging に立て、移行スクリプトをドライラン
2. **事前通知**: 管理画面（`/api/admin/notifications`）から **送信タイミング・文面を管理者が制御**して既存ユーザーへ案内（初回ログイン時のパスワードリセット手順を含む）
3. **読み取り専用化**: 移行直前に旧 `cares.advisers.jp` を読み取り専用化（書き込みブロック）
4. **データ移行実行**: Firestore → Cloud SQL、Firebase Storage → Cloud Storage、ユーザー → Keycloak
5. **DNS 切替**: `cares.advisers.jp` を新システムに向ける
6. **旧システム保存**: `legacy.cares.advisers.jp` として 90 日間読み取り可能で残す
7. **完全終了**: 90 日後に旧システム停止、Firebase プロジェクト解約

### 移行スクリプトの場所

`apps/migration/` 等にモノレポ内で管理（ADR-0004）。Cloud Run Job として実行。

### ロールバック計画

- DNS 切戻し手順を事前準備
- Firebase 側のスナップショットを 30 日保持
- 30 日以内であれば DNS のみで旧 cares に戻せる状態を維持

## Consequences

### 良い面

- ユーザー視点では「同じ URL でアクセスして、初回だけパスワードリセット」という最小負担
- データ完全保持（移行スクリプトで全件変換）
- 90 日間の旧システム並走で、緊急時のロールバック余地を確保
- 既存ドメインを継続使用することで SEO・ブックマーク資産が維持される

### 悪い面

- Email + Password ユーザーはパスワードリセットを強制される（軽い UX 摩擦）
- 匿名ユーザーは「正規アカウント昇格 or データ放棄」を選ばされる
- 移行スクリプトの検証コストが大きい（ドライラン + 差分確認）
- 90 日間旧システムを残すコスト（Firebase 料金 + Cloudflare Worker）

### 派生タスク

- 移行スクリプトの設計と実装（フェーズ 6）
- 事前通知メール文面の作成（パスワードリセット UX を含む）
- staging での完全ドライラン手順策定
- ロールバック実行手順書
- 匿名ユーザー個別対応の進捗管理
- DNS 切替の TTL 短縮（カットオーバー数日前）

## Alternatives Considered

- **クリーンスタート（再登録要求）**: ユーザーが少ないため可能だが、信頼関係を損ねる。データ完全保全という cares の価値と矛盾。
- **並行運用（旧新両方をユーザーが選ぶ）**: 運用負荷が二重、データ整合性管理が複雑。
- **段階的移行（一部機能から）**: 認証基盤を最初に変える必要があるため、結局はカットオーバーが発生。中途半端に複雑化する。
- **別ドメインで新システムを立ち上げ、旧はそのまま自然消滅を待つ**: ブランド資産が分断される。旧ユーザーが移行しなければ価値が低い。
