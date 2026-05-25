# コンポーネント図

本ディレクトリは健康日記システムの構成要素と依存関係を示すコンポーネント図を保持する。

- [component.mmd](component.mmd) — システム全体のコンポーネント図（Mermaid）

## 凡例

- 実線矢印: 同期 HTTP / API 呼び出し
- 破線矢印: Firestore listener など非同期サブスクリプション
- 「service binding」: Cloudflare Workers 内部の高速バインド経路（Cloudflare Access を貫通）

## 参照

- [基本設計書 §1.1 全体構成](../基本設計書.md#11-全体構成)
- [基本設計書 §7.1 ネットワーク構成](../基本設計書.md#71-ネットワーク構成)
