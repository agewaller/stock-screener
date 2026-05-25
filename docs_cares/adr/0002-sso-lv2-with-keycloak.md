# ADR-0002: SSO Lv2: Keycloak セルフホスト中央 IdP

- Status: Accepted
- Date: 2026-05-26
- Deciders: オーナー、Claude（提案）

## Context

cares は単独サービスではなく、ValuationMatrix（既存・GCP Identity Platform + Google ログインで稼働中）および zen-track（未着手）等の自社サービス群と **共通アカウントで利用できる設計** が要件（論点 1 派生）。

SSO の意味として 2 段階の解釈がある:

- Lv1: 同一 Google アカウントで各サービスにログイン体験統一（実装軽量、各サービス独立）
- Lv2: 中央 IdP + フェデレーション、ユーザー ID が全サービスで共通（実装重い、拡張性高い）

Lv2 を採用すれば、共通プロファイル・共通サブスクリプション・サービス間遷移時のシームレス体験が可能になる。

## Decision

**SSO Lv2** を採用し、**Keycloak をセルフホストして中央 IdP** とする。

### アーキテクチャ

```
[GCP Project: identity]          ← 中央 IdP
   └─ Keycloak on Cloud Run + Cloud SQL（独立プロジェクト）

   各サービスは OIDC RP として接続

       ↓                       ↓                       ↓
[Project: cares]    [Project: vm]      [Project: zen-track]
  各サービス内に     既存。OIDC RP        将来。OIDC RP
  user_link テーブル  へ移行             として実装
  （global_uid 参照）
```

### サポートするログイン手段

- Google ログイン（必須、既存 VM ユーザーとの互換性）
- Email + Password
- Magic Link（メールリンク）
- 匿名認証（**SSO 圏外**、後から正規アカウントへ昇格可能なフローを設計）

### 2FA

ユーザー任意で TOTP を有効化可能。管理者アカウントは強制を検討（ADR-0011）。

### 匿名ユーザーのデータ保持

匿名ユーザーのデータも **正規アカウントと同じ無期限保持**（追加レビューで確定）。ユーザーが明示的に削除しない限り消さない。匿名 → 正規昇格時はデータをそのまま引き継ぐ。

### ログアウトの挙動

`POST /api/auth/logout` は **全サービス同時ログアウト**（Backchannel logout）。cares でログアウトすると VM / zen-track からもセッションが切れる。SSO Lv2 の一貫性を最優先。「このサービスだけログアウト」は実装しない。

### ユーザー ID 設計

- 中央 IdP が `global_uid`（OIDC `sub` クレーム）を発行
- 各サービス DB は `user_link (global_uid, local_user_id)` で内部 ID と分離
- 共通プロファイル（氏名・メール）は IdP 側で一元管理

## Consequences

### 良い面

- ValuationMatrix / cares / zen-track / 将来サービス群で **ユーザー ID 共通化**
- 共通プロファイル・共通サブスクリプションが将来実装可能
- データ主権原則と整合（ユーザー情報を SaaS IdP に預けない）
- OSS の Keycloak は OIDC / SAML / SCIM 等を完備し、企業要件にも対応可能

### 悪い面

- Keycloak の運用負荷（DB バックアップ、TLS、可用性、バージョンアップ）が増える
- 初期実装コストが大きい
- **ValuationMatrix の移行が必須**（現状の Identity Platform 直接利用 → 中央 IdP 経由の OIDC RP 化）。これは cares リポジトリのスコープ外だが、SSO 実現のため避けられない
- 匿名認証は SSO 圏外として割り切る必要がある

### 派生タスク

- ValuationMatrix の中央 IdP 移行プロジェクト（cares ローンチ後追い、本リポジトリ外）
- 匿名 → 正規アカウントの昇格 UX 設計（データは無期限保持なので、昇格時にそのまま引き継ぐ）
- Keycloak Realm 設定・テーマカスタマイズ（日本語化、ブランディング）
- Backchannel logout の実装（全サービス同時ログアウト確定）

### ローンチ順序

1. cares ローンチ時点: cares 単独で Keycloak 動作。VM は既存の Identity Platform のまま
   - この期間、ユーザーは「同じ Google アカウントで両方ログイン可」だがセッション共有なし
2. VM 移行: cares ローンチ後の別プロジェクトとして実施
3. zen-track 開発開始時に初めから中央 IdP に接続

## Alternatives Considered

- **A: GCP Identity Platform を IdP として運用**: GCP 完結だが、Identity Platform を OIDC IdP として運用する事例が薄く、Authorization Server としての設計が標準化されていない。
- **C: Auth0 / WorkOS / Stytch（SaaS）**: 運用ほぼゼロだが、ユーザーアカウント情報を外部 SaaS に預けることになり、データ主権原則（ADR-0001）と矛盾。
- **D: 自前 OIDC サーバ実装**: 認証は自作禁忌領域。セキュリティリスク高すぎる。
- **Firebase Auth 継続**: Lv1 すらも自前で組み立てる必要がある。既存サービス（VM）が GCP Identity Platform を使っており、Firebase Auth に戻る理由がない。
