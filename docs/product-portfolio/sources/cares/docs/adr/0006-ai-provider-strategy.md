# ADR-0006: AI プロバイダ戦略（3 社継続、サーバ専有鍵）

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

## Context

旧仕様の AI 機能は Anthropic Claude を中心に OpenAI / Gemini も選択可能。鍵はサーバ側のみで保持し、ブラウザに出さない原則を堅持してきた（cares CLAUDE.md 既述）。新仕様でも同じ原則が必要であり、加えてマルチプロバイダ・コスト制御を強化したい。

## Decision

### サポート Provider

**Anthropic / OpenAI / Gemini の 3 社継続**。デフォルトモデルは Claude Opus 系（最新の最強モデル）。

### 鍵管理

- すべて **Secret Manager** に保管（ADR-0005）
- ブラウザ・Cloud SQL には鍵を入れない
- 起動時に Workload Identity または環境変数で BE に注入

### 呼び出し経路

```
Browser → Next.js (BFF) → Hono BE → AI Providers
                              ↑
                         Secret Manager から鍵注入
```

- 単一経路。フォールバックチェーン（複雑化）は作らない
- Anthropic は**直接 API** を叩く（Vertex AI 経由の Claude はモデルリリース追従が遅れがちなので不採用）

### モデル選択 UX

- **ユーザー選択可**（旧仕様継続）。管理者が利用可能モデル一覧を制御
- **`ai_models` テーブル**で動的管理（schema.md §5.5）。管理画面で追加・廃止・有効/無効・デフォルト変更・コスト更新が可能
- BE は `ai_models.id` で参照し、API 呼び出し時に `ai_models.api_model_id` を解決。datestamped model id のハードコード禁止

### ストリーミング

- BE 内で Anthropic SDK の AsyncIterator を消費
- 結果を SSE（Server-Sent Events）で FE へ転送

### コスト制御

- **ユーザー × 月次のコストキャップ** を設置
- デフォルト **月次 1000 円**
- 全 AI 呼び出しの token 使用量を `ai_usage_logs` に記録、モデル別単価で換算（単価は `ai_models` テーブルから取得）
- **上限到達時は 422 拒否のみ**（縮退モデルへのフォールバックは行わない）。CLAUDE.md「フォールバックチェーン禁止」原則と整合
- 管理者は任意にユーザー個別キャップを上書き可
- GCP Budgets でシステム全体予算アラートも併用

### Origin 許可リスト

BE は cares の正規 Origin のみ受付（Origin 詐称攻撃の防止）

## Consequences

### 良い面

- データ主権・鍵漏洩リスクを最小化
- 3 プロバイダ並立により、特定 LLM 障害時に管理者判断で切替可能（自動フォールバックではない）
- コストキャップで「AI 暴走による課金事故」を防止
- 旧仕様の MODEL_MAP 設計を引き継ぐことで、Anthropic 等のモデル ID rotate に強い

### 悪い面

- 3 プロバイダの API 差異吸収（Adapter 層）の実装が必要
- コスト集計・キャップ管理の実装コスト（フェーズ 3 で詳細設計）
- プロンプトキャッシング（Anthropic の 5 分 TTL 機能）の活用設計が必要
- AI 呼び出しの監査ログを PII マスキング後に保存する仕組みが必要

### 派生タスク

- AI Provider Adapter 層の設計（プロバイダ間差異の吸収）
- `ai_usage_logs` テーブル設計（user_id, provider, model, input_tokens, output_tokens, cost_jpy, timestamp）
- コストキャップ enforcement の middleware 実装
- プロンプトキャッシング戦略（共通システムプロンプトに適用）
- AI 呼び出しの PII マスキング後ログ仕様

## Alternatives Considered

- **Anthropic 一本化**: モデルは最強だが Anthropic 障害時にサービス全停止リスク。多 LLM 対応の選択肢を残す。
- **Gemini を主に、Vertex AI 経由**: GCP 完結だが、Claude / GPT を捨てると最強モデルの選択肢が狭まる。
- **自動フォールバックチェーン**（A 失敗 → B 試行 → C 試行）: CLAUDE.md の「複雑化禁止」原則と矛盾。設定の取り違え・性能差で予期せぬ挙動を生む。管理者の手動切替に留める。
- **OpenAI / Gemini を削除して Anthropic のみ**: シンプルだが、用途別最適化（要約は Haiku、画像は Sonnet 等）の選択肢を失う。
