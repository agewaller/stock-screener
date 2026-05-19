# メールアラート機能

## 目的

リスク指数が一定値を超えた、または短期に急上昇したときに、登録者へ自動で
冷静な事実通知を送ります。本機能は**戦争発生を予言・断定しません**。

## 登録方法

1. `/subscribe` にアクセス
2. メールアドレスと通知レベルを設定
3. 確認メールを受信
4. メール内の確認リンクをクリック → `active` 状態になり通知開始

## ダブルオプトイン

確認メールのリンクをクリックするまでアラートは送信されません。第三者が
他人のメールアドレスで勝手に登録してしまうことを防ぐ標準的な手順です。

## 通知条件（4 種類）

| 種別 | 発火条件（既定値） |
|------|-------------------|
| `level_threshold` | `level >= alert_min_level` かつ昨日より level 上昇 |
| `daily_spike` | `trend_1d >= 0.35` かつ `level >= 1` |
| `weekly_spike` | `trend_7d >= 0.60` かつ `level >= 1` |
| `manual_critical` | 管理者が `tags: ["critical"]` を付けた reviewed イベント |

カテゴリフィルター：上昇要因に登録者の購読カテゴリが含まれる場合に優先送信。
ただし全体 level が 4 以上ならカテゴリ設定に関係なく通知。

## クールダウン

- 既定 12 時間（`ALERT_COOLDOWN_HOURS`）
- 同じ `risk_date` × `alert_type` での二重送信は不可
- ただし level がさらに上がった場合はクールダウン中でも送信
- 同日最大 2 通まで

## 解除方法

すべてのアラートメール末尾の解除リンクをクリック。1 クリックで解除完了
します。アラートメールごとに**新しい解除トークンが発行**され、古いリンク
は自動的に無効になります。

## 個人情報の取扱い

- メールアドレスは Supabase の `subscribers` テーブルにのみ保存
- 公開 JSON には保存されません
- 確認・解除トークンは平文ではなく **SHA-256 ハッシュ**として保存
- IP アドレスは購読アクションのトレースのため**ハッシュ化**して保存（`subscription_events.ip_hash`）

## 免責

本通知は公開情報に基づく自動アラートです。重要な判断には政府発表・一次情報・
専門家判断を確認してください。

## RESEND_API_KEY の設定

1. <https://resend.com> でアカウント作成 → API key を発行
2. ローカル：`.env.local` に `RESEND_API_KEY=...` を追記
3. 本番：Vercel Environment Variables / GitHub Secrets に同じキーを設定
4. 送信元ドメインを Resend で verify（DKIM レコードを DNS に追加）

未設定時はメール送信を**スキップ**し、`console.log` に件名と本文を出力するだけ
になります（ローカル開発で確認しやすくするため）。

## Supabase スキーマの適用

```bash
# 方法 A: psql
psql "$SUPABASE_DB_URL" -f supabase/schema.sql

# 方法 B: Supabase ダッシュボード
#   SQL Editor → "New query" → supabase/schema.sql の内容を貼り付け → Run
```

スキーマは `subscribers` / `alert_deliveries` / `subscription_events` の
3 テーブルを作成します。MVP では Service Role Key からのみ書き込みを行うため
RLS は有効化していません（`schema.sql` 末尾に将来の RLS ポリシー例をコメント
で記載）。
