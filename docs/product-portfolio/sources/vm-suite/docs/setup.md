# セットアップ手順

ゼロからデータベースを構築し、データを投入するまでの手順。

## 前提

- PostgreSQL が起動済み
- `.env` に `DATABASE_URL` が設定済み
- `geni` CLI がインストール済み
- `JQUANTS_API_KEY` が `.env` に設定済み

## 1. データベース作成・マイグレーション・シード

```bash
# DB 作成（初回のみ）
./db/migrate.sh create

# マイグレーション実行
./db/migrate.sh up

# シードデータ投入（取引所・市場区分・業種マスター）
./db/migrate.sh seed
```

シードで投入されるデータ:
- **exchanges**: TSE, NYSE, NASDAQ, 札幌, 名古屋, 福岡
- **industry_sectors**: 17業種（TOPIX セクター指数用）
- **industries**: 33業種（東証 証券コード協議会制定）
- **market_segments**: 各取引所の市場区分

## 2. クイックスタート（日次運用）

マスタ同期 + 前営業日の株価取得を一括で行う最小手順:

```bash
# 銘柄マスタ同期
cargo run --bin jobs -- sync-jquants master

# mysqlのbusiness
cargo run --bin jobs -- import-legacy-mysql --company 2>&1

# 前営業日の株価取得（YYYYMMDD 形式で昨日を指定）
cargo run --bin jobs -- sync-jquants prices --date $(date -v-1d +%Y%m%d)


```

土日祝は取引なし（0件）になるが、upsert なので再実行しても問題ない。

## 3. J-Quants API からデータ同期（フルセットアップ）

依存関係に従い、以下の順序で実行する。

### Step 1: 銘柄マスター（companies + listings）

```bash
cargo run --bin jobs -- sync-jquants master
```

- J-Quants `/equities/master` から全銘柄を取得
- `industry_sectors`（17業種）と `industries`（33業種）を upsert
- `companies` を upsert（`industry_id` で33業種に紐づけ）
- `listings` を upsert（5桁コードで上場情報）

### Step 2: 財務諸表（financial_statements + earnings_forecasts）

```bash
# 特定銘柄
cargo run --bin jobs -- sync-jquants financials --code 72030

# 特定日付（開示日）
cargo run --bin jobs -- sync-jquants financials --date 20240510
```

- `/fins/summary` から連結実績（FY/4Q のみ）を取得し `financial_statements` に upsert
- 同時に `earnings_forecasts`（業績予想: FSales/FOP）も抽出・upsert

### Step 3: 財務諸表詳細（BS/PL/CF 明細）

```bash
# 特定銘柄
cargo run --bin jobs -- sync-jquants financials --code 72030

# financials サブコマンドは details も自動実行
```

- `/fins/details` から EDINET XBRL 詳細項目を取得
- `financial_statements` の BS/PL/CF 項目（sga, inventory, current_assets 等）を更新
- Summary API のカラムは COALESCE で保護（上書きしない）
- gross_operating_profit, ebitda は post-processing で算出

### Step 4: 株価（stock_prices）

```bash
# 特定日
cargo run --bin jobs -- sync-jquants prices --date 20240510

# 日付範囲
cargo run --bin jobs -- sync-jquants prices --from 20240401 --to 20240430
```

- `/equities/bars/daily` から四本値・出来高・調整係数を取得
- `stock_prices` に upsert（listing_id + date でユニーク）

### Step 5: 財務指標（financial_metrics）

```bash
# 全銘柄
cargo run --bin jobs -- calc-metrics

# 特定銘柄
cargo run --bin jobs -- calc-metrics --code 7203
```

- `financial_statements` + `stock_prices` + `earnings_forecasts` から指標を計算
- equity_ratio, business_profit_ratio, sales_g, cf_matrix, roic, per, pbr 等

## 依存関係

```
exchanges (seed)
  └→ companies (sync-jquants master)
       ├→ listings (sync-jquants master)
       │    └→ stock_prices (sync-jquants prices)
       ├→ financial_statements (sync-jquants financials)
       ├→ earnings_forecasts (sync-jquants financials)
       └→ financial_metrics (calc-metrics)
            ← financial_statements + stock_prices + earnings_forecasts

industry_sectors (seed / sync-jquants master)
  └→ industries (seed / sync-jquants master)
       └→ companies.industry_id
```

## テーブル一覧

| テーブル | 説明 | データソース |
|---------|------|-------------|
| `exchanges` | 取引所 | seed.sql |
| `market_segments` | 市場区分 | seed.sql |
| `industry_sectors` | 17業種 | seed.sql / sync-jquants master |
| `industries` | 33業種 | seed.sql / sync-jquants master |
| `companies` | 企業マスタ | sync-jquants master |
| `listings` | 上場情報（5桁コード） | sync-jquants master |
| `financial_statements` | 財務諸表（P&L, BS, CF） | sync-jquants financials |
| `earnings_forecasts` | 業績予想 | sync-jquants financials |
| `stock_prices` | 株価 | sync-jquants prices |
| `financial_metrics` | 財務指標 | calc-metrics |
| `valuations` | バリュエーション | （未実装） |
| `company_analyses` | AI 企業分析 | analyze-company |

## やり直し

```bash
# 全ロールバック → 再マイグレーション → シード
./db/migrate.sh down --all
./db/migrate.sh up
./db/migrate.sh seed

# その後 Step 1 から再実行
```

## レガシーデータ（2019以前）

2019以前のデータは旧 MySQL (shares3) から取込済み:

```bash
# MySQL → financial_statements（2019以前）
cargo run --bin jobs -- import-legacy-mysql

# Excel → companies + financial_statements + earnings_forecasts
cargo run --bin jobs -- import-jquants <excel-path>
```

これらは J-Quants API では取得できない期間のデータを補完する。
