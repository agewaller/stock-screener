# ADR-0018: フィジカルキャピタル・プロフィール v2（機微カテゴリの拡張と項目別同意）

- Status: Accepted
- Date: 2026-06-11
- Deciders: オーナー（山口）、Claude（提案）

## Context（背景）

健康学OS（[Epic #46](https://github.com/agewaller/cares/issues/46)）の個人適合 PFit（T_g 類型適合 / I_i 個人固有適合）の土台として、
[#40](https://github.com/agewaller/cares/issues/40) の最小プロフィール（年齢・性別・既往薬・アレルギー）を、健康学が使う
**個人理解レイヤー**へ拡張する（[#47](https://github.com/agewaller/cares/issues/47)）。新しい機微カテゴリ（家族歴・診断・価値観・人生目的 等）を
DB に持つため、暗号化系統の追加と**項目別の AI 利用同意**の方針を ADR として記録する。

## Decision（決定）

### 1. 扱う項目（user_profiles へ追加）
- 基礎（非機微・平文可）: 身長 / 体重 / 職業 / 居住地域
- 医学（機微・暗号化）: 家族歴 / 診断 / サプリ（既存の服薬・アレルギーに追加）
- 生活: 睡眠タイプ / 食習慣 / 運動習慣 / 嗜好品
- 文脈: 孤独感 / 金銭的余裕 / 時間的余裕（各 0–10）/ 価値観 / 人生の目的 / 意識の焦点（1–7、#61 連携）
- `consent`（JSON）: 項目別「AI の判断材料に使う/使わない」。

### 2. **遺伝子・DNA 生データは v2 では扱わない**
家族歴・既往までに留める。DNA 連携は重機微・法規制が高く、別途 ADR（#58 系の重機微トラック）で採否判断する。

### 3. 暗号化（[ADR-0007] / 詳細設計書 §2 改訂）
機微テキストは**アプリ層 AES-256-GCM**（`@cares/db` の `ENCRYPTED_FIELDS`）で暗号化する。対象に追加:
`family_history` / `diagnoses` / `supplements` / `personal_values` / `life_purpose`
（既存: `current_medications` / `allergies` / `note`）。非機微（身長・性別・職業区分・スケール値 等）は平文可。

### 4. 同意モデル（プライバシーファースト）
- **機微項目**: `consent[field] === true` のときだけ AI 文脈に使う（**既定 OFF・明示オプトイン**）。
- **非機微項目**: `consent[field] !== false` なら使う（**既定 ON・明示オプトアウト**）。
- 同意 ON の項目だけを `buildUserProfileText()` が AI プロンプト文脈へ注入する（ルールベース・テスト可能、ハードコードしない）。

### 5. データ主権
- 1 項目単位で閲覧・編集・削除（null 化）。エクスポート対象に含める（ポータビリティ）。
- ブラウザに平文 PII を残さない（ADR-0007）。`/api/me/profile` は `no-store`。

## Consequences（結果）

- `UserProfile` に多数の列を追加（migration `20260611000000_user_profile_v2`）。
- 全 AI 系の `userProfileText` プレースホルダが、同意済みプロフィールに置き換わる（個人化が効く）。
- 充実度メータで「次に埋めると精度が上がる項目」を提示し、段階入力を促す。

## 未決 / follow-up
- 同意トグルの**カテゴリ単位**の一括 ON/OFF（現状は項目単位）。
- 価値観・人生目的・意識の焦点を PFit / 提案トーンへどう反映するか（#48/#49/#61）。
- DNA/遺伝子データの採否（別 ADR）。

## 関連
- [ADR-0007] ブラウザ PII 禁止 ／ 詳細設計書 §2（暗号化系統）
- issue: #46（Epic）, #47（本実装）, #40（前提）, #13（暗号化基盤）, #61（意識レイヤー）
