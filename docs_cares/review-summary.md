# フェーズ 2/3 全体レビュー結果

実施日: 2026-05-26
対象: `docs_cares/` 配下の全 30 ファイル（約 5,100 行）

## サマリ

| 項目 | 結果 |
|---|---|
| ADR 12 件すべて作成済み | ✓ |
| 全 12 論点が `[確定]` 状態 | ✓ |
| ER 図とスキーマ詳細の整合 | 修正済（CACHED_RESEARCH 追加） |
| API 一覧と OpenAPI 仕様 | ✓（OpenAPI は主要エンドポイントのみ。全 API は api-list.md が正本） |
| ADR の他文書からの参照 | ADR 9, 10 を基本設計書に追加（11 節） |
| 用語の一貫性 | DB は snake_case、API/JS は camelCase（Prisma 慣習）OK |
| 旧仕様への参照は ADR-0001 / 移行スクリプト等のみ | ✓ |

## 検出した不整合と修正

### 1. ER 図に `CACHED_RESEARCH` 欠落 → 修正済

スキーマ詳細 `er/schema.md` の §4.3 に定義されていたが、ER 図 `er.mmd` に書き忘れていた。`CACHED_RESEARCH` エンティティを追加。

### 2. ADR-0009 / ADR-0010 が基本設計書から参照されていない → 修正済

基本設計書 §11 に「外部連携・データ移行」を新設し、ADR-0009, ADR-0010 への参照を追加。

## レビューで確認した整合性

### 用語

- `global_uid`（DB / OIDC 仕様）と `globalUid`（API レスポンス / JS）の使い分けは Prisma の慣習として OK
- `tenant_id` / `user_id` の使い方は一貫
- 旧仕様の `localStorage` 言及は ADR-0001（廃止理由）/ ADR-0007（禁止原則）/ 詳細設計書（ESLint で禁止）の文脈で適切

### クロスリファレンス

すべての `[ADR-NNNN](../adr/NNNN-...)` リンクの整合を確認:

| ADR | 参照元数（adr/ 内除く） |
|---|---|
| 0001 リアーキテクチャ | 4 |
| 0002 SSO Keycloak | 6 |
| 0003 FE | 1 |
| 0004 BE | 2 |
| 0005 GCP | 2 |
| 0006 AI | 4 |
| 0007 ブラウザ PII | 5 |
| 0008 マルチテナント | 3 |
| 0009 外部連携（修正後） | 1 |
| 0010 データ移行（修正後） | 1 |
| 0011 管理者 | 3 |
| 0012 NFR | 1 |

### スキーマ vs API

- すべての CRUD エンドポイントが対応するテーブルを持つことを確認
- 9 カテゴリ（symptoms, vitals, blood_tests, medications, meals, sleep_records, photos, activities, moods, text_entries）はすべて schema + API 整合
- AI 関連テーブル（ai_conversations, ai_messages, analyses, doctor_reports, summaries）と API 整合
- 監査ログ（audit_logs / `/api/audit-logs/me`）整合
- ドラフト（drafts / `/api/drafts/{formKind}`）整合

### 設計上の継続原則の保持

旧仕様から引き継いだ「データ主権 5 原則」「鍵はサーバ側のみ」「管理者ロックアウト防止」等の原則が、新仕様の各文書で一貫して言及されている:

- データ主権原則 → ADR-0001 動機 / ADR-0007 ブラウザ PII / 要件定義書 §5.4
- サーバ専有鍵 → ADR-0006 / 詳細設計書 §2
- 管理者ロックアウト防止 → ADR-0011 三段フェイルセーフ / 詳細設計書 §1.3

## 既知の制限・未完了事項

以下は当該フェーズのスコープ外として意図的に保留:

- **画面一覧（SC-NN）**: 旧仕様にはあったが、新仕様 UI を React/Next.js で再設計する際の付属物として、フェーズ 4 で作成
- **OpenAPI 仕様の網羅**: 主要エンドポイントのみ記載。全エンドポイントは `api-list.md` が正本。実装時に Hono + `@hono/zod-openapi` で自動生成する想定
- **B2B 拡張の詳細設計**: スキーマ準備（tenant_id）のみ、業務 UI と権限モデルの詳細は将来
- **家族・医師共有 UX**: MVP 後フェーズで詳細化
- **画面遷移図**: フェーズ 4 で必要なら作成

## 追加インタビューラウンド（2026-05-26 同日）

レビュー後、暗黙的決定 / 矛盾の可能性がある **13 件** をユーザーに追加質問し、すべて確定:

| # | 論点 | 決定 | 反映先 |
|---|---|---|---|
| A | VM 中央 IdP 移行タイミング | cares 先ローンチ、VM は後追い | ADR-0002、詳細設計書 §6.9 |
| B | 匿名ユーザーのデータ保持期間 | 正規アカウントと同じ無期限 | ADR-0002、要件定義書 BR-22 |
| C | SSR HTML キャッシュと PII | PII 含む HTML は `Cache-Control: no-store` | ADR-0007、要件定義書 BR-16 |
| D | 写真の扱い | 画像も PII、表示中メモリのみ（Signed URL 都度フェッチ） | ADR-0007、要件定義書 BR-17 |
| E | AI モデル一覧管理 | DB `ai_models` テーブル + 管理画面 | schema.md §5.5、ADR-0006、要件定義書 FN-ADMIN-06 |
| F | 削除猶予 | アカウント・個別レコードとも 30 日 | 要件定義書 BR-21 |
| G | AI コストキャップ | 月次 1000 円、422 拒否（縮退なし） | ADR-0006、詳細設計書 §5.5、要件定義書 BR-20 |
| H | 監査ログ可視化と PII | PII 扱い、表示中メモリのみ | ADR-0007、要件定義書 BR-18 |
| I | ログアウト挙動 | 全サービス同時（Backchannel logout） | ADR-0002、詳細設計書 §1.4、§6.8、要件定義書 BR-19 |
| J | Plaud 受信機構 | SendGrid Inbound Parse | ADR-0009 |
| K | 開発体制 | オーナー 1 人中心 + Claude | （情報として記録） |
| L | 移行事前通知 | 管理画面で管理者が制御 | ADR-0010、要件定義書 FN-ADMIN-07、schema.md §5.6 |
| M | inbox.cares.advisers.jp | 継続使用 | ADR-0009 |

追加テーブル: `ai_models`、`notifications_config`
追加 API: `/api/admin/models/*`、`/api/admin/notifications/*`
追加要件: FN-ADMIN-06, FN-ADMIN-07, BR-16〜22

## 結論

ドキュメント群は **フェーズ 4（スケルトン実装）に着手できる完成度** に達している。13 件の追加確認で暗黙的決定も明文化された。

次工程として推奨:

1. **このまま新リポジトリ `agewaller/cares` を作成し、docs_cares/ を移植**
2. **Terraform 雛形と Docker Compose 雛形を準備（コード解禁）**
3. **Keycloak Realm 設定ファイル（JSON）の準備**
4. **Prisma スキーマファイル `schema.prisma` の初期版作成（schema.md からの転記）**

ただしフェーズ 3 までの方針なので、上記コード着手はユーザー承認が必要。
