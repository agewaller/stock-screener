---
component: api
type: pipeline
tech: Rust, J-Quants API V2, PostgreSQL
path: apps/api
updated: 2026-04-23
---

# J-Quants データ取り込みパイプライン

J-Quants API V2 から取得した銘柄・株価・財務データを DB に保存し、派生指標・DCF を計算するまでの一連の処理をまとめる。

## 1. 全体フロー

```
J-Quants API V2
   │
   ├─ /equities/master            ──→ sync-jquants master  ──→ companies, listings, industries
   ├─ /equities/bars/daily        ──→ sync-jquants prices  ──→ stock_prices
   ├─ /fins/summary               ┐
   └─ /fins/details               ┴──→ sync-jquants financials / details
                                         │
                                         ├─ Phase 1: summary を年度集約 (year_map)
                                         ├─ Phase 2: details の FS HashMap → カラムマッピング
                                         ├─ Phase 3: 集約データを financial_statements に UPSERT
                                         └─ Phase 4: 派生カラムを SQL で再計算
                                                 │
                                                 └──→ calc-metrics  ──→ financial_metrics
                                                         │               （ROIC, PER, PBR, DCF 等）
                                                         └──→ valuations（DCF 事業価値）
```

各ジョブは `apps/api/src/bin/jobs/` のエントリから起動。実装は `infrastructure/gateways/jquants/` と `domain/entities/` に分離。

---

## 2. API エンドポイントとレスポンス

| エンドポイント | 戻り型 | 用途 |
|---|---|---|
| `GET /equities/master` | `Vec<ListedInfo>` | 銘柄マスタ（5桁コード、会社名、業種、市場） |
| `GET /equities/bars/daily` | `Vec<DailyQuote>` | 株価四本値（OHLCV、調整済み値、`adj_factor`） |
| `GET /fins/summary` | `Vec<FinancialStatement>` | 財務サマリ（`sales`, `op`, `np`, `ta`, `eq`, CF, 配当、予想値） |
| `GET /fins/details` | `Vec<FinancialDetail>` | BS/PL/CF 詳細（EDINET タクソノミの冗長ラベル HashMap） |

認証: `x-api-key` ヘッダ (`Settings.jquants_api_key`、環境変数 `JQUANTS_API_KEY`)。

内部動作:
- ページネーション自動追跡（`pagination_key`）
- 429 (Rate Limited) 最大3回、10秒間隔リトライ
- 210 (データなし) はエラー化
- タイムアウト 30 秒/リクエスト

---

## 3. コード体系

J-Quants は銘柄コードを**5桁**で扱う（4桁の会社コード + 1桁の株式種別）。

| 変換 | 例 |
|---|---|
| 4桁 → 5桁（API 呼び出し用） | `1301` → `13010` |
| 5桁 → 4桁（`companies.code` 用） | `13010` → `1301` |
| 株式種別（5桁目） | `0`=普通株, `5`=優先株, その他=other |

`jquants_parser::base_company_code()` / `to_5digit_code()` / `infer_listing_type()` を使用。

---

## 4. sync-jquants master

銘柄マスタ・業種・市場区分を DB に同期。

1. `/equities/master` 全件取得
2. 17業種 (`s17`) / 33業種 (`s33`) を `industry_sectors` / `industries` に UPSERT
3. 5桁コードを4桁に変換して会社を集約 → `companies` に UPSERT
4. 5桁コードごとに `listings` に UPSERT

**ID安定化**: `UPDATE` を先に試行し、`rows_affected = 0` のときのみ `INSERT`。sequence を不要に消費しない。

---

## 5. sync-jquants prices

株価四本値を `stock_prices` に保存。

- 引数: `--date YYYYMMDD` / `--from YYYYMMDD --to YYYYMMDD`
- OHLCV 全 NULL（取引なし）銘柄はスキップ
- `price` カラム = `adj_close`（調整済み終値）

---

## 6. sync-jquants financials / details

財務データの取り込み。`save_financial_statements()` がコア。

### 取り込み単位
- **年度テーブル** (`financial_statements`): 1 社 1 年度 1 行（`quarter = 4`, `statement_type = 'annual'`）
- **四半期テーブル** (`financial_statements_quarterly`): 1 社 1 年度 1 Q ごと（1Q/2Q/3Q/4Q/FY）

### Phase 1: summary → 年度集約

各 `FinancialStatement` を `(company_id, year)` キーで `year_map` に集約。

- **year** は `cur_fy_st`（当期開始日）の先頭4桁（**2020 年以降のみ**。2019 以前はレガシー MySQL から移行済み）
- **quarter** は `cur_per_type` で分類：
  - `1Q`/`2Q`/`3Q` → 四半期テーブルのみ
  - `4Q`/`FY` → 年度テーブル + 四半期テーブル両方
- **予想値** (`f_sales`, `f_op`): Q1〜Q3 のうち**最新Q**の値を採用（Q3 > Q2 > Q1）
- **発行済株式数**: `sh_out_fy - tr_sh_fy`（自己株控除、0以下なら NULL）

### Phase 2: details → FS カラム展開

`map_fs_to_columns()` が FS HashMap を DB カラムにマッピング。**§ 9 参照**。

### Phase 3: UPSERT

`UPDATE` を先に試行 → 効かなければ `INSERT`。

**summary 由来カラムは `COALESCE` で既存値保護**：
```sql
UPDATE ... SET
  sales = COALESCE(<new>, sales),
  business_profit = COALESCE(<new>, business_profit),
  ...
```

**details 由来カラムは `DETAIL_ONLY_SET_COLS`（allowlist）のみ直接上書き**。summary には含まれない内訳項目のみを対象とすることで、summary 優先カラム（`sales / business_profit / net_profit / ta / eq / cash / CF / dividend / forecast`）を details から誤って上書きしないようにしている。

#### P&L 明細

| カラム | 日本語 | 定義 |
|---|---|---|
| `sales_cost` | 売上原価 | 商品・製品の仕入・製造コスト |
| `gross_operating_profit` | 売上総利益 | `sales − sales_cost`（未入力なら派生計算） |
| `sga` | 販売費及び一般管理費 | 販管費 |
| `ebitda` | EBITDA | `business_profit + depreciation_and_amortization`（未入力なら派生計算） |
| `ordinary_profit` | 経常利益 | JGAAP のみ。営業利益 + 営業外損益（IFRS では NULL） |
| `pretax_profit` | 税引前当期純利益 | 経常利益 + 特別損益 |
| `extraordinary_income` | 特別利益 | JGAAP のみ |
| `extraordinary_loss` | 特別損失 | JGAAP のみ |
| `non_operating_income` | 営業外収益 | JGAAP のみ（受取利息・配当等） |
| `non_operating_expense` | 営業外費用 | JGAAP のみ（支払利息等） |
| `rd` | 研究開発費 | |
| `labor_cost` | 人件費 | 販管費内訳 |
| `marketing` | 販売促進費 | 販管費内訳 |

#### BS: 資産

| カラム | 日本語 | 定義 |
|---|---|---|
| `account_receivable` | 売上債権 | 売掛金＋受取手形＋電子記録債権＋契約資産の合算（ACCUMULATE 対象） |
| `inventory` | 棚卸資産 | 商品・製品・仕掛品・原材料等（`Inventories` 合計優先、サブ項目は pri 1 合算） |
| `current_assets` | 流動資産合計 | |
| `other_current_assets` | その他流動資産 | 前払費用・未収入金等（派生カラムとして `current_assets − cash − AR − inventory` で再計算） |
| `tangible_fixed_asset` | 有形固定資産 | 土地・建物・機械・使用権資産等（ACCUMULATE 対象。aggregate `Property, plant and equipment` / `(IFRS)` を **priority 2** にして個別内訳との二重計上を防止） |
| `intangible_fixed_asset` | 無形固定資産 | のれん・ソフトウェア・各種権利（ACCUMULATE 対象。aggregate `Intangible assets` / `(IFRS)` を **priority 2** にして個別内訳との二重計上を防止） |
| `net_intangible_fixed_asset` | 純額無形固定資産 | MySQL レガシー互換。`Goodwill` / `Goodwill (IFRS)`（pri 2）>`Intangible assets` / `(IFRS)`（pri 1） |
| `sales_right` | 販売権 | 使用している企業は稀 |
| `investments` | 投資その他の資産 | 投資有価証券・関係会社株式・敷金等（ACCUMULATE 対象、`Other financial assets - NCA (IFRS)` を追加加算） |
| `noncurrent_assets` | 固定資産合計 | |
| `other_noncurrent_assets` | その他固定資産 | 長期前払費用・繰延税金資産等（派生カラム: JGAAP は直接マッピング、IFRS は `noncurrent_assets − tangible − intangible − investments` で残差計算） |
| `investments_and_other_noncurrent_assets` | 投資その他の資産合計 | JGAAP 中間合計 |
| `only_other_noncurrent_assets` | その他固定資産（単独） | 投資を除いた純粋なその他固定資産 |
| `other_assets` | その他資産 | 総資産区分の残差 |

#### BS: 負債・純資産

| カラム | 日本語 | 定義 |
|---|---|---|
| `account_payable` | 買掛金 | 仕入先への未払い（ACCUMULATE 対象） |
| `notes_and_account_payable` | 支払手形及び買掛金 | 支払手形・買掛金・電子記録債務の合算（ACCUMULATE 対象） |
| `short_term_debt` | 短期有利子負債 | 短期借入金・CP・1年内返済長期借入金・短期社債・リース負債(流動)等（ACCUMULATE 対象） |
| `current_liabilities` | 流動負債合計 | |
| `other_current_liabilities` | その他流動負債 | 未払費用・賞与引当金・契約負債等（派生カラム: `current_liabilities − account_payable − notes_and_account_payable − short_term_debt` で残差計算） |
| `long_term_debt` | 長期有利子負債 | 長期借入金・社債・リース負債(非流動)等（ACCUMULATE 対象） |
| `noncurrent_liabilities` | 固定負債合計 | |
| `other_noncurrent_liabilities` | その他固定負債 | 退職給付引当金・繰延税金負債・資産除去債務等（派生カラム: JGAAP は直接マッピング、IFRS は `noncurrent_liabilities − long_term_debt` で残差計算） |
| `only_other_noncurrent_liabilities` | その他固定負債（単独） | 有利子負債を除いた純粋なその他固定負債 |
| `other_liabilities` | その他負債 | 総負債区分の残差 |
| `total_liabilities` | 負債合計 | |
| `capital_lease` | リース債務 | 古い基準のリース負債計上 |
| `minor_shareholders` | 非支配株主持分 | 少数株主持分。DCF では有利子負債に加算 |
| `capital` | 資本金 | |
| `other_than_debt_equity` | 負債・純資産以外 | 区分不明の残差 |

#### CF・設備投資

| カラム | 日本語 | 定義 |
|---|---|---|
| `investment` | 設備投資（CAPEX） | 有形固定資産の取得による支出。`Purchase of property, plant and equipment` 等 |
| `depreciation_and_amortization` | 減価償却費 | CF計算書の非現金費用。EBITDA 計算に使用 |

#### Other

| カラム | 日本語 | 定義 |
|---|---|---|
| `employee` | 従業員数 | 有報の提出会社従業員数 |

### Phase 4: スケール不整合検出

Details の `gross_asset`（Assets）と summary の `ta` を比較して、桁ずれや乖離を検出した場合は `detail_columns` を破棄して `DETAIL_ONLY_SET_COLS` を NULL 化する。

- **スケール比が 10 倍以上**（`DETAIL_SCALE_MISMATCH_RATIO_THRESHOLD`）
- **絶対差 > 100M かつ相対差 > 1%**（`DETAIL_GROSS_ASSET_ABS/REL_DIFF_THRESHOLD`）

詳しくは `detect_detail_gross_asset_mismatch()` 参照。

### Phase 5: 派生カラム再計算 (SQL)

```sql
-- gross_operating_profit が NULL の場合
UPDATE ... SET gross_operating_profit = sales - sales_cost
 WHERE gross_operating_profit IS NULL AND sales IS NOT NULL AND sales_cost IS NOT NULL;

-- ebitda
UPDATE ... SET ebitda = business_profit + depreciation_and_amortization
 WHERE ebitda IS NULL AND business_profit IS NOT NULL AND depreciation_and_amortization IS NOT NULL;

-- BS "その他" 項目の残差計算
UPDATE ... SET other_current_assets = current_assets - COALESCE(cash,0) - COALESCE(account_receivable,0) - COALESCE(inventory,0) ...;
UPDATE ... SET other_noncurrent_assets = noncurrent_assets - COALESCE(tangible_fixed_asset,0) - COALESCE(intangible_fixed_asset,0) - COALESCE(investments,0) ...;
UPDATE ... SET other_current_liabilities = current_liabilities - COALESCE(account_payable,0) - COALESCE(notes_and_account_payable,0) - COALESCE(short_term_debt,0) ...;
UPDATE ... SET other_noncurrent_liabilities = noncurrent_liabilities - COALESCE(long_term_debt,0) ...;
```

### 引数
```bash
sync-jquants financials --code 1301    # 1社のみ
sync-jquants financials --date 20250510 # 特定日の開示
sync-jquants financials --all           # 全銘柄（逐次5並列）
sync-jquants details --code 1301        # 詳細のみ再取得
```

---

## 7. FS → DB マッピング (`fs_mapping.rs`)

`/fins/details` の `FS` は EDINET タクソノミの冗長ラベルをキーとする可変 HashMap（約 480 エントリ）。これを 35 程度の DB カラムに畳む。

### 7.1 ラベル正規化

`lookup_columns()` が FS キーを以下の順で正規化してから `FS_COLUMN_MAP` を検索：

1. **完全一致**（そのまま検索）
2. **IFRS サフィックス除去** — `" (IFRS)"` を除去（例: `Assets (IFRS)` → `Assets`）
3. **`, net` サフィックス除去** — 純額表記除去（例: `Buildings and structures, net` → `Buildings and structures`）
4. **セクションマーカー除去** — 末尾 `" - XXX"` を除去（例: `Trade and other receivables - CA` → `Trade and other receivables`）
5. **CF サフィックス除去** — `-OpeCF` / `-InvCF` / `-FinCF` 等（スペースなしハイフン形式）

最も具体的な候補から順にマッチし、マッチした時点で確定。

### 7.2 優先度 (priority)

同一カラムに複数の FS ラベルが存在する場合、priority で勝敗を決める：

| pri | 意味 | 例 |
|---|---|---|
| 0 | 包括値・フォールバック | `Profit (loss)`（少数株主含む）、`Bonds and borrowings - Liabilities (IFRS)` |
| 1 | 標準値 | `Net sales`, `Short-term borrowings`, `Accounts payable-trade` |
| 2 | 優先値（集約項目） | `Profit attributable to owners of parent`, `Interest-bearing liabilities - CL/NCL`, `Goodwill` |
| 3 | 合計値（最優先） | `Inventories`（棚卸資産合計） |

**異なる priority の場合、高い方が勝つ（置換）。**

### 7.3 同一 priority の挙動 (`ACCUMULATE_COLUMNS`)

BS 構成項目は **同一 priority の複数ラベルを合算**する：

```rust
const ACCUMULATE_COLUMNS: &[&str] = &[
    "account_receivable", "account_payable", "notes_and_account_payable",
    "short_term_debt", "long_term_debt",
    "inventory",
    "tangible_fixed_asset", "intangible_fixed_asset", "investments",
    "other_current_assets", "other_noncurrent_assets",
    "other_current_liabilities", "other_noncurrent_liabilities",
];
```

**P&L 項目（`sales`, `net_profit`, `sga` など）は合算しない**（synonym の誤計上防止で「先勝ち」のまま）。

#### 挙動例

- **7637 白銅 2024年 `account_receivable`**：
  - `Notes and accounts receivable-trade`: 11.77B + `Electronically recorded monetary claims-operating-CA`: 5.05B → **16.83B**（合算）
- **7637 白銅 2024年 `short_term_debt`**：
  - 該当ラベルなし → **NULL**（白銅は無借金）
- **小売業の棚卸資産**：
  - `Inventories`: 200（pri 3）+ `Merchandise`: 100（pri 1）→ **200**（高 priority が勝ち）

### 7.4 DEI メタデータ (期間判定)

`extract_period_from_fs()` が以下のキーから `(year, quarter, statement_type)` を抽出：

- `Current fiscal year start date, DEI` → 先頭4桁が year
- `Type of current period, DEI`:
  - `1Q`/`Q1` → quarter=1, statement_type=`1Q`
  - `2Q`/`Q2` → quarter=2, statement_type=`2Q`
  - `3Q`/`Q3` → quarter=3, statement_type=`3Q`
  - `4Q`/`FY` → quarter=4, statement_type=`annual`

**year < 2020 はスキップ**（レガシー MySQL からの移行済み）。

### 7.5 IFRS 残差計算（post-processing）

IFRS は JGAAP のように内訳を個別報告しないため、以下を残差で算出：

```
other_noncurrent_assets      = noncurrent_assets - tangible_fixed_asset - intangible_fixed_asset - investments
other_noncurrent_liabilities = noncurrent_liabilities - long_term_debt
```

該当カラムがまだ設定されていない場合のみ適用。

### 7.6 特殊加算（`investments` のみ残置）

```rust
// IFRS Other financial assets - NCA を investments に加算
// MySQL 互換: investments = equity_method + other_fin_NCA
```

`Right-of-use assets` / `Inventories` sub-item 等の旧 fallback は `ACCUMULATE_COLUMNS` 導入で不要になったため削除済み。

### 7.7 マッピングテーブル

詳細は `apps/api/src/infrastructure/gateways/jquants/README.md` と `fs_mapping.rs::FS_COLUMN_MAP` 参照（480+ エントリ）。

代表カラム：

| DB カラム | 主要ラベル | 備考 |
|---|---|---|
| `sales` | `Net sales` / `Revenue` | |
| `business_profit` | `Operating income`/`Operating profit` (loss含む) | |
| `net_profit` | `Profit (loss) attributable to owners of parent`(pri=2) | 親会社帰属優先 |
| `gross_asset` | `Assets` / `Total assets` | |
| `cash` | `Cash and deposits` / `Cash and cash equivalents` | |
| `account_receivable` | `Accounts receivable-trade`, `Notes and accounts receivable-trade`, `Electronically recorded monetary claims-operating-CA`, `Contract assets` 他多数 | **合算対象** |
| `inventory` | `Inventories`(pri=3) > `Merchandise and finished goods`(pri=2) > 各サブ項目(pri=1 合算) | |
| `short_term_debt` | `Short-term borrowings`, `Current portion of long-term borrowings`, `Commercial papers-liabilities`, `Lease liabilities - CL` 他 | **合算対象** |
| `account_payable` | `Accounts payable-trade` | |
| `notes_and_account_payable` | `Notes and accounts payable-trade`, `Electronically recorded obligations-operating-CL` 他 | **合算対象** |
| `equity` | `Equity attributable to owners of parent`(pri=2) > `Shareholders' equity`(pri=1) > `Net assets`(pri=0) | |

---

## 8. calc-metrics

`financial_statements` から指標を計算し `financial_metrics` に UPSERT。

### 入力
- `financial_statements` 年度データ
- `stock_prices` の最新値（`market_value = price × outstanding_shares`）

### 指標定義（`FinancialStatement` メソッド）

| 指標 | 式 | 備考 |
|---|---|---|
| `equity_ratio` | `equity / gross_asset` | |
| `business_profit_ratio` | `business_profit / sales` | |
| `rd_ratio` | `rd / sales` | |
| `investment_ratio` | `investment / sales` | 設備投資／売上 |
| `receivable_turnover` | `account_receivable / sales × 365` | 日数 |
| `inventory_turnover` | `inventory / sales_cost × 365` | 日数 |
| `payable_turnover` | `notes_and_account_payable / sales_cost × 365` | **data 層は NAP のみ。graph 層で AP+NAP 合算** |
| `ccc` | `receivable + inventory - payable` | |
| `sales_g` / `ebitda_g` / `net_profit_g` | `(curr - prev) / prev` | YoY |
| `cf_matrix` | O/I/F の符号で 1-8 分類 | |
| `per` / `pbr` / `pcfr` | `market_cap / net_profit` 等 | **is_latest のみ** |
| `evebit` | `(market_cap + STD + LTD - cash) / business_profit` | **is_latest のみ。data 層は `?` 短絡**|

### ROIC

```
ROIC = NOPAT / invested_capital
NOPAT = business_profit × (1 − effective_tax_rate)
invested_capital = equity + short_term_debt + long_term_debt − cash
```

**有利子負債 NULL → 0 扱い**（`unwrap_or(0)`、無借金企業対応）。

`effective_tax_rate = 1 - net_profit / business_profit`（0.1-0.5 でクランプ）、両者が正のときのみ。それ以外は 0.3 固定。

### DCF (Ruby vm3.0 互換)

```
有利子負債 = short_term_debt + long_term_debt + minor_shareholders
             （3つとも NULL のみ None、少なくとも1つあれば unwrap_or(0) で合算）

NOPAT = business_profit × 0.6  （税率 40% 固定）

WACC = 市場価値ベース:  MV × 0.08/(MV+D) + D × 0.018/(MV+D)
       簿価ベース:      Eq × 0.08/(Eq+D) + D × 0.018/(Eq+D)  （MV<=0 のとき）

事業価値 = NOPAT / WACC
財産価値(流動) = cash + AR×0.85 + inventory×0.5 + other_CA×0.5
                 − 仕入債務(AP+NAP 合算) − other_CL − sales×0.02
財産価値 = 財産価値(流動) + investments
株主価値 = 事業価値 + 財産価値 − 有利子負債
VP spread = 株主価値 / 市場価値
```

`valuations` テーブルにも同じ値を `from_statement` 経由で保存。

### VP spread ランク

`vp_spread_rank_id`:

| ランク | 範囲 |
|---|---|
| 1 | < 0.7（割安） |
| 2 | 0.7-1.2 |
| 3 | 1.2-1.5 |
| 4 | 1.5-2.0 |
| 5 | ≥ 2.0（割高） |

### 引数
```bash
cargo run --bin jobs -- calc-metrics                 # 全社
cargo run --bin jobs -- calc-metrics --code 1301     # 1社
cargo run --bin jobs -- calc-metrics --year 2024     # 特定年度
```

---

## 9. 設計ルール

### 9.1 NULL vs 0

**データ層（`financial_statement.rs` ドメイン、書き込み）**:
- `Option<i64>` の財務フィールドは `unwrap_or(0)` **しない**
- `None = データなし` と `Some(0) = ゼロ円` は明確に区別
- 短絡（`?`）で None を伝播させ、財務指標も None を返す
- 例外: **複数カラムの合算**で「少なくとも片方 Some なら合算」パターンはOK（§ 7.3、`dcf_property_value_current`、`total_interest_bearing_debt`）

**グラフ表示層（`graph_svg_service.rs`、描画）**:
- `unwrap_or(0)` で「無借金/開示なし = 0」として扱ってよい
- 例: `roic_metric` の `ic_turnover`、`payable_turnover`、Multiples の `evebit`、EV ブロック
- 理由: データ欠落でグラフが消えると UX が悪く、かつ「開示なし = 0」が実務的に正しいケースが多い

### 9.2 UPSERT パターン

```rust
// UPDATE 先行 → rows_affected == 0 なら INSERT
let r = db.execute_unprepared(&update_sql).await?;
if r.rows_affected() == 0 {
    db.execute_unprepared(&insert_sql).await?;
}
```

- sequence を無駄に消費しない
- ID が安定（既存行は ID 保持）

### 9.3 summary vs details のカラム領域

- **summary 優先カラム**: `sales`, `business_profit`, `net_profit`, `gross_asset`, `equity`, `cash`, `operating_cash_flow`, `invest_cash_flow`, `finance_cash_flow`, `dividend`, `outstanding_shares`, `forecast_*`
  - 書き込みは `COALESCE(<new>, <col>)` で既存値を保護（details からは触らない）
- **details 専用カラム** (`DETAIL_ONLY_SET_COLS`): BS/PL/CF 詳細項目
  - 直接上書き（summary では提供されない）

### 9.4 会計基準（JGAAP/IFRS）の変遷

| 時期 | 変更前 | 変更後 | 対象 |
|---|---|---|---|
| 2021〜 収益認識基準 | `Notes and accounts receivable-trade` | `Notes and accounts receivable - trade, and contract assets` | 売上債権 |
| 2021〜 収益認識基準 | `Merchandise and finished goods` | `Merchandise` 単体 | 棚卸資産 |
| 随時 | `Short-term loans payable` | `Short-term borrowings` | 借入金 |
| IFRS 移行 | `Short-term loans payable` | `Interest-bearing liabilities - CL` / `Borrowings - CL (IFRS)` | 短期有利子負債 |

`FS_COLUMN_MAP` では各バリエーションを同一カラムに割り当てて吸収。新しい表記が出たら `RUST_LOG=info` ログの `Unmatched FS keys` を監視して追加。

### 9.5 既知のケース

| 企業 | 特徴 | 挙動 |
|---|---|---|
| 7637 白銅 | 無借金（`short_term_debt` / `long_term_debt` / `capital_lease` NULL）、AR を売掛金と電子記録債権で別報告 | ROIC/投下資本回転率は `unwrap_or(0)` で計算可、AR は `ACCUMULATE_COLUMNS` で合算 |
| 1301 極洋 | `account_payable` を NAP（`Notes and accounts payable-trade`）で一括報告、単独の `Accounts payable-trade` は不在 | wc_turnover / DCF の「仕入債務」は AP+NAP 合算で計算 |

---

## 10. 主要ファイル一覧

| ファイル | 役割 |
|---|---|
| `apps/api/src/infrastructure/gateways/jquants/client.rs` | HTTP クライアント、ページネーション、リトライ |
| `apps/api/src/infrastructure/gateways/jquants/types.rs` | API レスポンス型 |
| `apps/api/src/infrastructure/gateways/jquants/fs_mapping.rs` | FS HashMap → DB カラムマッピング（`FS_COLUMN_MAP`, `ACCUMULATE_COLUMNS`, `map_fs_to_columns`, `extract_period_from_fs`） |
| `apps/api/src/bin/jobs/sync_jquants.rs` | master/prices/financials/details サブコマンド |
| `apps/api/src/bin/jobs/jquants_parser.rs` | コード変換ヘルパー（`base_company_code`, `to_5digit_code`, `infer_listing_type`） |
| `apps/api/src/bin/jobs/calc_metrics.rs` | financial_metrics 計算ジョブ |
| `apps/api/src/domain/entities/financial_statement.rs` | 財務指標・DCF ロジック |
| `apps/api/src/domain/entities/financial_metric.rs` | `FinancialMetric::from_statement` |
| `apps/api/src/domain/entities/valuation.rs` | `Valuation::from_statement`（DCF→valuations 保存） |
| `apps/api/src/application/usecases/valuation_usecase.rs` | バリュエーション保存ユースケース |

---

## 11. 実行例

```bash
# 初回フル同期
cargo run --bin jobs -- sync-jquants master
cargo run --bin jobs -- sync-jquants prices --from 20200101 --to 20261231
cargo run --bin jobs -- sync-jquants financials --all
cargo run --bin jobs -- calc-metrics

# 日次更新
cargo run --bin jobs -- sync-jquants prices --date 20260423
cargo run --bin jobs -- sync-jquants financials --date 20260423
cargo run --bin jobs -- calc-metrics --year 2025

# 特定銘柄の再取り込み
cargo run --bin jobs -- sync-jquants financials --code 1301
cargo run --bin jobs -- sync-jquants details --code 1301
cargo run --bin jobs -- calc-metrics --code 1301

# 未マップ FS キーを確認
RUST_LOG=info cargo run --bin jobs -- sync-jquants details --code 7637 2>&1 | grep "Unmatched"
```
