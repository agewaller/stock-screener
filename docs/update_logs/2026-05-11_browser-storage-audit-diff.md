# ブラウザ内ストレージ棚卸し 差分ノート: 2026-05-06 → 2026-05-11

前回（2026-05-06）の棚卸し以降、ブラウザ内ストレージのセキュリティ・構造に
どこが変わったかを記録する。

姉妹文書: [../ブラウザ内ストレージ棚卸し.md](../ブラウザ内ストレージ棚卸し.md)（最新の現状リファレンス）

---

## 結論サマリ

> **Tier 1 致命的 3 件はすべて未対応のまま。** 主要 Store 層（`store.js` / `privacy.js`）の diff はゼロ。
> main 取り込みで `switchUser` / `DEFAULT_STATE` / `_evictOldData` などの構造改善が試みられたが、
> 最終的に **撤回・無効化された** ため、5/11 のコード状態は 5/6 と本質的に同じ。

| 改善期待度 | 項目 | 結果 |
|---|---|---|
| 🔴 高 | API キー降格ロジックの撤廃 | **未対応**（`firebase-backend.js:446-448` 同一） |
| 🔴 高 | `PRESERVE_KEYS` の見直し | **未対応**（`store.js:373-394` 完全同一） |
| 🔴 高 | 医療 PII の暗号化導入 | **未対応**（`encrypt` / `WebCrypto` 系コード無し） |
| 🟠 中 | `privacy_anonymize_ai` 既定 ON 化 | **未対応**（`privacy.js:21-23` 同一） |
| 🟠 中 | ユーザー別 localStorage 名前空間 | **撤回**（`switchUser` 一度入って削除） |
| 🟡 低 | QuotaExceeded 時のキー evict | **撤回**（`_evictOldData` 痕跡なし） |
| 🟢 軽微 | Google Fit 新規 OAuth トークン | **新規追加**（ただし PRESERVE 外＝消去対象、設計は正しい） |
| 🟢 軽微 | logout 時 `store.clearAll()` 確実呼び | **既に実装済**（5/6 時点で同様の挙動） |
| 🟢 軽微 | Service Worker 自動 unregister | **新規追加**（Cache Storage 強制クリア） |

---

## 1. 実コード差分（前回 e8375fe → 今回 HEAD）

### 1-A. diff ゼロのファイル（変更なし）

- `js/store.js` — `PERSIST_KEYS` / `PRESERVE_KEYS` / `clearAll()` / `loadFromStorage()` 全て同一
- `js/privacy.js` — `STORAGE_KEY` / `isEnabled` / `anonymizeText` 全て同一
- `js/idb.js` — `images` / `largeData` / `pendingWrites` 構成同一
- `js/calendar.js` — OAuth 関連の `localStorage.setItem` 行も同一

### 1-B. 変更のあったファイル

| ファイル | 行数 | localStorage への影響 |
|---|---|---|
| `js/app.js` | +1043 | 編集/削除 UI 追加 / Firestore ルール自動デプロイ。localStorage 直接操作の新規追加は **なし**（既存 keys のみ参照） |
| `js/firebase-backend.js` | +164 | `onSnapshot` 同期追加。**API キー降格箇所（446-448）は完全に同一** |
| `js/integrations.js` | +185 | **Google Fit 連携追加**（後述 §2-A） |

---

## 2. 新規追加された localStorage キー

### 2-A. `google_fit_token` / `google_fit_token_expiry`（Google Fit 連携）

| キー | 書込箇所 | 削除箇所 | 残置 |
|---|---|---|---|
| `google_fit_token` | `integrations.js:855` | `integrations.js:871` (disconnect) | **PRESERVE 外＝消去** |
| `google_fit_token_expiry` | `integrations.js:856` | `integrations.js:872` | **PRESERVE 外＝消去** |

```js
// integrations.js:854-857（要点抜粋）
localStorage.setItem('google_fit_token', token);
localStorage.setItem('google_fit_token_expiry', String(Date.now() + 3500000));  // ~58 分
```

- 有効期限は ~58 分（3,500,000 ms）。Fitbit と異なりリフレッシュトークンの localStorage 保存は行わない。
- `clearAll()` で消える設計（PRESERVE_KEYS に追加されていない）。**Fitbit と対照的に正しい設計** で、ログアウト後に次の利用者へ漏れない。
- ただし Fitbit / Google Calendar 側は依然として PRESERVE_KEYS 内なので、Tier 1-2 の問題は解消されていない。

### 2-B. 新規でないが暗に変化したもの

- `cc_*`（Store 経由 44 キー）: PERSIST_KEYS の構成は変化なし
- `subscribeToCollections` で受信する Firestore 8 コレクションの内容が **より頻繁に Store → `cc_*` localStorage** に同期されるようになった（旧: ログイン時 1 回 → 新: realtime）
  - 端末 A での書き込みが端末 B の localStorage にも即座に転写される設計に変更
  - 機微度が増したわけではないが、「最新の症状記録が複数端末の localStorage に同時に存在する」状態が常態化する

---

## 3. main 取り込みで「試みられたが撤回された」改善

5/6 → 5/11 のあいだに、ストレージ層への構造改善が main 側で何度か試みられたが、
最終マージ後の HEAD には残らなかった。重要な経緯として記録する。

### 3-A. `static DEFAULT_STATE` の型安全な `clearAll()`

- コミット `76e1608` / `42ccd7e` で「`DEFAULT_STATE` を一元定義し、`clearAll()` は型をコピー」と謳われた
- 現状の `store.js` には `static DEFAULT_STATE` も `_evictOldData` も **存在しない**
- `clearAll()` は旧式の「`Object.keys(this.state).forEach` + `isArray/object` 判定」のまま（`store.js:406-409`）
- **撤回経緯**: 5/8 〜 5/9 の連続コミット中に `js/app.js` の MCP push 事故が起き、`c9ade11`（PR #19）で大規模 restore がかかった結果、これらの改善が巻き込まれて元に戻ったと推定される

### 3-B. `switchUser(uid)`（ユーザー別 localStorage 名前空間）

- 同一端末で別アカウント利用時のデータ混在を防ぐ目的で `42ccd7e` で追加
- しかし PR #25 (`40c7ec1` / `cca607c`) で **「URGENT: switchUser() 撤去 — Googleログイン復旧」** として削除
- `firebase-backend.js` 側の呼び出し残骸も `2dc2bda`（#28）で削除
- **5/11 時点: コード全体に `switchUser` という symbol は存在しない**
- 結果として「同一端末で別アカウント」シナリオは依然として未防御

### 3-C. `localStorage.clear()` → `cc_*` プレフィックスのみ削除

- `76e1608` のコミットメッセージでは「他アプリのデータを巻き込まない」改善とされた
- 現状の `clearAll()` は **依然 `localStorage.clear()` を呼ぶ**（`store.js:401`）
- ただし PRESERVE 対象キーを事前退避 → `clear()` → 復元、という流れなので「PRESERVE 外は確実に消える」点は担保されている
- `cc_*` 限定削除は最終マージで撤回された

### 3-D. 全ユーザー Worker 強制（API キー降格を回避できた可能性）

- `1a93de8`（PR #31）で「全ユーザーを Worker 経由に強制」 → ブラウザ側の `apikey_*` 参照を撤廃する方向に動いた
- 翌日 `b869a36` (HOTFIX) で撤回。撤回理由: 既存登録ユーザーが Worker 経由で 401 を受け接続不可になった
- **5/11 時点のルーティング**: 「クライアントにキーあり → 直接 Anthropic / なし → Worker」（pre-#31 と同一）
- = `apikey_*` の localStorage 降格は **依然必須の経路** として残っている

---

## 4. 部分改善: ログアウト時挙動の信頼性向上

PRESERVE_KEYS 自体は変わっていないが、**「PRESERVE 外を確実に消す」確度** は上がった。

### 4-A. `FirebaseBackend.signOut()` が `store.clearAll()` を必ず呼ぶ

```js
// firebase-backend.js:272-281
async signOut() {
  try {
    this.cleanupListeners();
    await this.auth.signOut();
    store.clearAll();          // ← これが確実に呼ばれる
    Components.showToast('ログアウトしました', 'info');
  } catch (err) {
    Components.showToast('ログアウトエラー: ' + err.message, 'error');
  }
},
```

### 4-B. `app.logout()` の二重防御

```js
// app.js:785-796
async logout() {
  try {
    if (FirebaseBackend.initialized) {
      await FirebaseBackend.signOut();  // ← ここで store.clearAll() が走る
    }
  } catch(e) {
    console.warn('Logout error:', e);
  }
  // Firebase 未初期化時のフォールバック
  store.update({ user: null, isAuthenticated: false });
  this.navigate('login');
}
```

### 4-C. Service Worker / Cache Storage の自動クリア

- `index.html:1649` / `:1654` 付近で **全訪問時に** Service Worker と Cache Storage をクリーンアップ
- 旧 PWA `sw.js` 残骸による「永久にエラー」問題の根治療法
- これは localStorage / IndexedDB には影響しないが、Cache Storage 層が常に新しいビルドで再構築される

### 改善の限界

これらは **PRESERVE_KEYS 内のキーには一切影響しない**。
つまり「ログアウトで API キーや Fitbit トークンが消える」ようにはならない。
本質的な Tier 1 問題は別途対処が必要。

---

## 5. ドキュメント自体の精度向上

前回ドキュメント記述で、5/11 の実コード検証で **誤りが判明** した箇所:

### 5-A. `google_calendar_access_token` の PRESERVE 扱い

- 前回ドキュメント: 「`google_calendar_access_token` が PRESERVE_KEYS によりログアウト後も残置」
- 実コード: **PRESERVE_KEYS には含まれていない**（`google_calendar_oauth_connected` のみ含まれる）
- 棚卸し md の 2-C を修正済み

### 5-B. JS モジュール数

- 前回: 「13モジュール」
- 実: **21 モジュール**（`a11y-enhancements.js` / `analytics.js` / `disease-affiliate-panel.js` / `disease-lp-enhancements.js` / `inapp-browser-banner.js` / `newsletter-signup.js` / `social-share.js` などのオプショナルモジュールを含む）
- CLAUDE.md でも「13モジュール」と書かれているが、これは中核モジュールのことで、補助モジュールを含めると 21
- 棚卸し md の冒頭を修正済み

### 5-C. 最終更新日

- 2026-05-06 → 2026-05-11 に更新

---

## 6. 推奨フォローアップ（優先度順）

1. **🔴 Tier 1-1**: `apikey_*` を localStorage に置かない構成への移行
   - 案: 全 AI 呼び出しを Worker 経由に統一（PR #31 のリベンジ）、ただし HOTFIX b869a36 の課題（既存ユーザー 401）を先に解決する
   - 案: Worker の `env.ANTHROPIC_API_KEY` で完結し、`admin/secrets` も廃止

2. **🔴 Tier 1-2**: PRESERVE_KEYS から `fitbit_token` / `fitbit_refresh_token` / `ics_calendar_url` / `plaud_email` を除外
   - 「再ログインで再 OAuth が走る」のはセキュリティ的に妥当なコスト
   - device-shared と per-user OAuth を保存層レベルで分離（前者は `system_*` プレフィックス等で別管理）

3. **🔴 Tier 1-3**: 医療 PII の at-rest 暗号化
   - WebCrypto API + ユーザー固有派生鍵（PBKDF2 / Argon2）
   - Firestore 側で保管されているなら localStorage 側はキャッシュとして暗号化保持
   - 最低限 `cc_textEntries` / `cc_medications` / `cc_bloodTests` を対象に

4. **🟠 Tier 2**: `privacy_anonymize_ai` の既定 ON 化
   - 「opt-in だと事実上 OFF」問題への対処
   - 既定 ON にして「ピンポイントで OFF にする」UI に変更

5. **🟠 Tier 2**: `cc_apiUsage` の容量制御を Store 側から外す
   - Firestore 集計に寄せる、または IndexedDB に退避
   - 現状 5000 件で `QuotaExceededError` → Store 全体の保存が止まる構造リスク

---

## 付録: 確認に使った機械的な走査

```bash
# 直接 localStorage 呼び出し箇所の総数
grep -rn "localStorage\." js/ index.html | wc -l            # 110 件

# 一意キー
grep -rnoE "localStorage\.[a-zA-Z]+\(['\"]([^'\"]+)['\"]" js/ index.html \
  | grep -oE "['\"]([^'\"]+)['\"]" | sort -u

# Store 層の重要セクション
grep -n "PERSIST_KEYS\|PRESERVE_KEYS\|DEFAULT_STATE\|clearAll\|_evictOldData" js/store.js
# → DEFAULT_STATE と _evictOldData は HIT なし（存在しない）

# 暗号化機構の有無
grep -n "encrypt\|cipher\|WebCrypto\|subtle\.encrypt" js/ -r
# → HIT なし

# 前回棚卸し時点からの diff
git diff e8375fe..HEAD --stat -- js/store.js js/privacy.js js/firebase-backend.js js/integrations.js js/calendar.js js/idb.js
# → store.js / privacy.js / calendar.js / idb.js は diff ゼロ
```
