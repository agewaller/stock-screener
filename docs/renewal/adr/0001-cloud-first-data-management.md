# ADR #0001: クラウドファースト・データ管理への移行

| 項目 | 内容 |
|------|------|
| **ID** | 0001 |
| **タイトル** | ブラウザ内ストレージを「真値」として扱う設計を廃止し、Firestore を一元的な真値とする |
| **ステータス** | **採択（Accepted）** — 方針確定、設計詳細は別 ADR で逐次決定 |
| **決定日** | 2026-05-12 |
| **決定者** | yanoshin |
| **対象範囲** | 健康日記 v2.0 リニューアル全体 |
| **関連** | [snapshot_v1.0_2026-05-12.md](../snapshot_v1.0_2026-05-12.md) §4 / §10 / `docs/ブラウザ内ストレージ棚卸し.md` |

---

## コンテキスト（決定の背景）

健康日記は 2026-04 のモジュール分割リファクタ以降、`index.html` + `js/*.js` 21 モジュールの SPA として運用されている。Firebase Authentication + Firestore + Cloudflare Workers を採用しており、表面的にはマルチデバイス対応のインフラが揃っている。

しかし実コードを精査した結果、**ブラウザ内ストレージ（localStorage / IndexedDB）が「データの真値」として機能しており、Firestore は二次的なレプリカに過ぎない** ことが判明している（詳細: [snapshot v1.0 §4.2](../snapshot_v1.0_2026-05-12.md#42-現状の真値の所在)）。

この構造に起因して、以下の致命的な問題が **3 件すべて未対応** のまま運用されている（出典: `docs/ブラウザ内ストレージ棚卸し.md` 2026-05-11、Tier 1 ランキング）:

1. **LLM API キー 3 種が全ユーザー共有・平文で localStorage 残置**
   - `apikey_anthropic` / `apikey_openai` / `apikey_google`
   - `firebase-backend.js:446-448` で Firestore `/admin/config` から起動時に localStorage へ降格
   - `store.js:381-383` の `PRESERVE_KEYS` に含まれ、ログアウトしても消えない
   - 結果: DevTools で誰でも生キーが読める / 共用端末で前ユーザーのキーが利用可能 / 即座に課金枠を奪える

2. **個人 OAuth トークン（Fitbit / Google Calendar / ICS / Plaud / Apple Health）がログアウト後も localStorage 残置**
   - `PRESERVE_KEYS` 構成は 2026-04 から不変
   - 結果: 共用 PC・端末譲渡時に次の利用者が前ユーザーのアカウントへ到達できる
   - 例外: `google_fit_token` のみ PRESERVE 外（5/9 新規追加分）

3. **医療 PII（要配慮個人情報）が暗号化なしで localStorage 平文**
   - `cc_textEntries`（自由記述・音声書き起こし、PII 含有率最高）/ `cc_medications` / `cc_bloodTests` / `cc_symptoms` / `cc_vitals` / `cc_userProfile`
   - コード全体に `encrypt` / `cipher` / `WebCrypto` が一切存在しない
   - `Privacy.anonymizeText()` は AI 送信直前のみ作用、かつ `privacy_anonymize_ai` は既定 OFF
   - 結果: 端末紛失・マルウェア・他拡張からの読取に対する防御層が無い

加えて、ユーザー体験上の問題として:

- **同一ユーザーが端末 A と端末 B で別物の状態を持つ**:
  - 健康記録 8 コレクション・設定は 2026-05-08 以降 `onSnapshot` で realtime 同期されるようになったが、それ以外の重要データ（API 課金ログ・PubMed キャッシュ・OAuth トークン・写真・分析履歴）は per-device のまま
  - ユーザー認知としては「クラウドに保存されているはず」だが、実際にはほとんどのデータが端末ローカル
- **同一端末で別アカウントへ切替えるとデータが混在する可能性**
  - 一度 `switchUser(uid)` が導入されたがデータ消失バグで撤去済（PR #25 / `cca607c`）
  - 結果として user 切替時の name-spacing は **存在しない**

これらは個別パッチで一つずつ直すよりも、**「ブラウザストレージを真値として扱う」という根本構造そのものをやめる** のが妥当という判断に至った。

---

## 決定（What）

**v2.0 リニューアルでは、Firestore を一元的な「データの真値」とし、ブラウザ内ストレージは原則として認証セッション・UI 言語設定・オフラインキャッシュに限定する。**

具体的な原則:

1. **ユーザーデータ（健康記録・設定・分析履歴・チャット履歴）の真値は Firestore とする**
   - ログイン中: 直接 Firestore へ書込・読込（`onSnapshot` で realtime）
   - localStorage は「読取専用キャッシュ」または「セッション内のみ揮発する状態」として再定義
2. **API キー（admin 投入）の localStorage 降格を廃止する**
   - すべての LLM 呼び出しは Cloudflare Worker 経由で行い、生キーはブラウザに一切露出させない
   - クライアントは「promptKey / disease / messages」のみ送信し、認証は Firebase ID Token を Worker で検証
3. **OAuth トークン（Fitbit / Google Fit / Google Calendar / ICS / Plaud）は Firestore に per-user で保存する**
   - 端末 A で連携した Fitbit が端末 B でも自動で使える
   - ログアウトで完全削除可能
   - 保存先は `/users/{uid}/private/integrations/{provider}` を想定（暗号化要否は別 ADR）
4. **写真の保存先は Cloud Storage または Firestore base64 のいずれかに決定する（別 ADR）**
   - IndexedDB `images` ストアは「アップロード前のローカル一時バッファ」のみに用途縮小
5. **マルチデバイス対応をユーザー認知に整合させる**
   - 全データがログイン直後に全端末で同一になる
   - 「ログアウト＝端末に何も残らない」を成立させる（PRESERVE_KEYS を最小化）
6. **ゲストモードの再設計**
   - 現状は未ログインでもダッシュボード入力可能（`enable_shared_guest_ai`）
   - v2.0 ではゲストモードを廃止するか、Firestore に揮発的な「ゲストセッション」を作るか別 ADR で決定

> **設計詳細（オフライン対応の粒度、API キーの保管先、写真の保存戦略、ゲストモードの扱い等）は本 ADR では未確定。** 次の ADR で個別に決定する。

---

## 代替案と比較

### 代替案 A: 現状の構造を維持し、Tier 1 致命的問題を個別パッチで直す

| 項目 | 評価 |
|------|------|
| 工数 | 小〜中 |
| マルチデバイス一貫性 | 改善しない（部分的に Firestore 同期は存在するが、依然 per-device データが残る） |
| API キー漏洩リスク | 残る（localStorage 降格の仕組み自体を温存するため） |
| OAuth トークン残置 | PRESERVE_KEYS を縮小すれば改善できる |
| 医療 PII 平文 | WebCrypto で端末側暗号化を導入すれば部分改善（ただし鍵管理が新たな課題） |
| ユーザー体験 | 「マルチデバイス対応」とは言えないまま |
| **却下理由** | **根本構造を温存するため、似た問題が将来再発する。今 5/11 時点で 3 件全件が「未対応」のまま残っているのは構造的負債が積み上がる典型** |

### 代替案 B: localStorage を完全廃止し、すべてサーバ依存にする

| 項目 | 評価 |
|------|------|
| 工数 | 大 |
| マルチデバイス一貫性 | 完全 |
| オフライン対応 | 失う（書込も読込も不可） |
| 起動速度 | 遅くなる（毎回 Firestore からフェッチ） |
| Firebase 課金 | 増える（読込回数増） |
| **却下理由** | **オフライン対応の喪失とユーザー体験悪化のトレードオフが大きすぎる。慢性疾患患者の利用シナリオ（自宅・外出先での記録）にオフラインは重要** |

### 代替案 C: クラウドファースト + 限定的なオフライン書込キュー（採択）

| 項目 | 評価 |
|------|------|
| 工数 | 大 |
| マルチデバイス一貫性 | 完全 |
| オフライン対応 | 限定的に維持（書込は IndexedDB `pendingWrites` キュー → 復帰時 flush。既存実装あり） |
| 起動速度 | Firestore SDK の `enablePersistence()` で初回以降キャッシュ可能 |
| Firebase 課金 | 増えるが許容範囲 |
| Tier 1 問題 | 構造的に解消（API キーは Worker 内に閉じ、OAuth トークンと PII は Firestore に集中。Firestore ACL で per-user 隔離） |
| **採択理由** | **致命的問題 3 件を構造的に解消しつつ、ユーザー体験を損なわない最適点** |

---

## 結果（Consequences）

### ポジティブな帰結

- Tier 1 致命的問題 3 件が構造的に解消される
  - API キー: Worker のみが保持、ブラウザに降格しない
  - OAuth トークン: Firestore per-user、ログアウトで確実に消える
  - 医療 PII: Firestore 暗号化 at-rest + ACL（クライアント側 localStorage には残さない）
- マルチデバイス対応が完全になり、ユーザー認知と実装が整合する
- 共用端末・端末譲渡時のセキュリティ問題が解消される
- 同一端末で別アカウント切替時のデータ混在問題が解消される（user 切替 = Firestore 取得し直し）

### ネガティブな帰結 / 受容するリスク

- **Firebase 課金が増える**: 起動毎の read 数 / write 数増加。試算と監視が必要
- **オフライン書込キュー（IndexedDB `pendingWrites`）の堅牢化が必要**: 失敗時の retry / dead-letter ハンドリング
- **初回ログイン時の体感速度が遅くなる可能性**: Firestore SDK persistence で 2 回目以降を改善
- **既存ユーザーの localStorage データ移行**: 別 ADR で詳細設計（自動マイグレーション / 手動エクスポート / 期間限定の両モード並走）
- **AI ルーティングの簡素化（直接呼出経路の廃止）**: 客側キー直接呼出を廃止するため、admin が「自分のキーをブラウザに置きたい」運用は不可能になる
- **コードベース変更の規模が大きい**: `js/store.js` / `js/firebase-backend.js` / `js/integrations.js` / `js/ai-engine.js` / `js/app.js` の大規模改修が必要。スコープを抑えるには段階的移行計画が必須（次の `migration_plan.md` で詳細化）

### 不変条件（このリニューアルでも維持する）

- SPA on GitHub Pages、vanilla JS、ビルド工程なし
- Firebase / Cloudflare Workers の現行スタック
- 65 歳女性ペルソナ・12 言語対応
- ライトテーマ固定 / `confirm()` `alert()` 禁止 / mobile redirect 必須
- 管理者 `agewaller@gmail.com` ハードコード
- Claude モデル id は MODEL_MAP 経由
- ユーザー向け文言に「AI」リテラル混入禁止

---

## 次のアクション

このリニューアルは本 ADR 単独では完結しない。以下を別 ADR で個別に決定する:

| 候補 ADR | 主題 |
|---------|------|
| #0002 | LLM API キーを Worker 内に閉じる方式（Firebase ID Token 認証の Worker への導入） |
| #0003 | OAuth トークンの Firestore 保管とログアウト時削除戦略 |
| #0004 | 写真の保存先（Cloud Storage vs Firestore base64 vs 端末のみ） |
| #0005 | ゲストモードの扱い（廃止 vs Firestore 揮発レーン） |
| #0006 | オフライン書込キューの堅牢化と失敗時 UX |
| #0007 | localStorage に残す最小キー集合（言語・テーマ・セッション）の確定 |
| #0008 | 既存ユーザーの localStorage データ移行戦略 |
| #0009 | Firebase 課金見積りと監視 |
| #0010 | `admin_emails` / `admin/config` の Firestore 一元化と Worker からの参照 |

各 ADR は「議題が立ち上がった時点で」作成し、本 ADR の表を更新する。

---

## 参考資料

- [`snapshot_v1.0_2026-05-12.md`](../snapshot_v1.0_2026-05-12.md) §4 データレイヤ / §10 セキュリティ・プライバシー / §12 既知の論点
- `docs/ブラウザ内ストレージ棚卸し.md`（2026-05-11） — Tier 1 致命的問題の一次資料
- `docs/データ構造.md`（2026-04-28） — Firestore / localStorage 構造の旧リファレンス
- `docs/update_logs/2026-05-11_main-merge_update_note.md` — 5/11 取り込み差分
- `docs/update_logs/2026-05-11_browser-storage-audit-diff.md` — 5/6 → 5/11 改善状況
