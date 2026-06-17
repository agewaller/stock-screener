# deployment

> **実装状況 (2026-06-01)**: 本図は**目標構成（フェーズ 7 以降）**。現在のフェーズ 6 最小構成は
> 単一プロジェクト `arctic-anvil-497002-q2` + Cloud Run 直公開（LB / VPC / staging / dev プロジェクトなし）。
> 現状の実構成図は [`../../architecture/system-overview.md`](../../architecture/system-overview.md) を参照。

```mermaid
%% デプロイ構成図: GCP プロジェクト構造、VPC、ネットワーキング (目標構成)
%% ADR-0005, ADR-0014 と整合 (Keycloak 用 identity-* プロジェクトは ADR-0014 で廃止)

flowchart TB
    subgraph User["インターネット"]
        Client["ユーザー Web Browser"]
        DNS["Cloud DNS<br/>cares.advisers.jp 他"]
    end

    subgraph SharedP["GCP Project: shared"]
        AR["Artifact Registry<br/>コンテナイメージ"]
        BillingMon["請求・集約監視"]
    end

    subgraph CaresProd["GCP Project: cares-prod (asia-northeast1)"]
        direction TB
        subgraph CaresVPC["VPC: cares-prod-vpc"]
            FELB["HTTPS LB<br/>(Cloud Run FE)"]
            BELB["HTTPS LB<br/>(Cloud Run BE)"]
            VPCConn["Serverless<br/>VPC Access"]
            CaresSQL[("Cloud SQL<br/>PostgreSQL<br/>Private IP")]
        end
        CaresFE["Cloud Run<br/>Next.js FE"]
        CaresBE["Cloud Run<br/>Hono BE"]
        CaresGCS["Cloud Storage<br/>cares-prod-media"]
        CaresSec["Secret Manager<br/>(AI keys 等)"]
    end

    subgraph CaresStg["GCP Project: cares-staging"]
        StgPlaceholder["同型を縮小構成で複製<br/>(Terraform で生成)"]
    end

    subgraph CaresDev["GCP Project: cares-dev"]
        DevPlaceholder["同型を最小構成で複製"]
    end

    subgraph IdentityManaged["GCP マネージド認証 (ADR-0014)"]
        IDP["Identity Platform<br/>(Firebase Auth)<br/>セルフホスト不要・LB/SQL 不要"]
    end

    %% クライアント → DNS → LB
    Client -->|cares.advisers.jp| DNS
    DNS --> FELB

    FELB --> CaresFE
    BELB --> CaresBE

    %% クライアント → Identity Platform (Firebase JS SDK)
    Client -.->|Firebase signIn<br/>HTTPS| IDP

    %% Cloud Run → Private DB (via VPC Connector)
    CaresFE -.->|内部 HTTPS| CaresBE
    CaresBE -->|via VPC| VPCConn
    VPCConn --> CaresSQL
    CaresBE --> CaresGCS
    CaresBE -.->|鍵取得| CaresSec

    %% Cloud Run → Identity Platform (token 検証)
    CaresFE -.->|verifyIdToken| IDP
    CaresBE -.->|verifyIdToken| IDP

    %% Artifact Registry
    AR -.->|pull image| CaresFE
    AR -.->|pull image| CaresBE

    %% スタイル
    classDef prod fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef stg fill:#fff9c4,stroke:#f57c00
    classDef dev fill:#f3e5f5,stroke:#7b1fa2
    classDef shared fill:#e8f5e9,stroke:#2e7d32
    class CaresProd,IdentityManaged prod
    class CaresStg stg
    class CaresDev dev
    class SharedP shared
```
