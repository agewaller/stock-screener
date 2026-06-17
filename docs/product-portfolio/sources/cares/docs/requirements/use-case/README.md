# ユースケース図

cares の主要アクターと FN-* 機能の関係を示す。要件定義書 §3 (アクター) / §4.1 (機能一覧) と整合。

- [`use-case.md`](use-case.md) — Mermaid (GitHub レンダリング対応)

## アクター

| アクター | 説明 |
|---|---|
| 一般利用者 (User) | GCP Identity Platform (Firebase Auth) で正規認証済み（Google または email/password、[ADR-0014](../../adr/0014-auth-switch-to-identity-platform.md)）。全機能利用可 |
| 匿名 (Anonymous) | Firebase `signInAnonymously` 想定。SSO 圏外、cares 単独で限定機能のみ。**設計のみ・MVP 未実装 (FN-AUTH-03)** |
| 管理者 (Admin) | Firebase Custom Claim `admin:true` OR (OWNER_EMAIL AND provider=="password") OR ブレークグラスの三段認可（ADR-0011 改訂） |
| 医療従事者 | 直接の利用者ではないが、FN-AI-05 (医師レポート) の読み手 |
| 自社他サービス | ValuationMatrix / zen-track 等、`global_uid` で同一ユーザー識別 |

## 関連ドキュメント

- 機能一覧の正本: [`../要件定義書.md`](../要件定義書.md) §4.1
- 業務フロー視点: [`../activity/`](../activity/)
- 画面視点: [`../../basic-design/screen-flow/`](../../basic-design/screen-flow/)
