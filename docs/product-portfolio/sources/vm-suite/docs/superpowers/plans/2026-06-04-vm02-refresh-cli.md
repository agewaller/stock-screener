# vm02-refresh CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `cli vm02-refresh` command that recomputes the vm02 (割安度) score arithmetically from the latest stock price + stored fundamentals — no LLM, no build-pack — and writes it back so screening and the detail-page radar stay fresh between full `vm-standard-all` runs.

**Architecture:** Pure DB→arithmetic→DB. For each company we read the latest stock price and the latest **annual** `financial_statements` row (precedent: `apps/api/src/bin/jobs/calc_valuations.rs` uses `quarter = 4`, year DESC — there is **no TTM helper** in the codebase, so we use latest-annual fundamentals; this is a deliberate, screening-grade simplification of the design's "TTM"). We compute multiples (PER/PBR/EV-EBITDA/FCF利回り), map them to a 1–10 score via the `references/scoring-rubric.md` thresholds, then (1) update the existing `company_analyses` vm02 row's `module_score`/`output_json` and (2) patch the vm00 row's `output_json.scorecard.vm02` + `scores.detail` totals. The pure scoring core is unit-tested; DB I/O is verified via `cargo check` + `--dry-run`.

**Tech Stack:** Rust, SeaORM (`apps/api` entities re-used from `cli`), tokio, serde_json, anyhow, chrono. PostgreSQL.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `apps/cli/src/commands/vm02_refresh.rs` | New command: arg parse, pure scoring (`compute_multiples`, `score_vm02`, `recompute_vm00`), DB read/write, single + batch orchestration | **Create** |
| `apps/cli/src/commands/mod.rs` | Module registry | **Modify** (add `pub mod vm02_refresh;`) |
| `apps/cli/src/main.rs` | Subcommand dispatch | **Modify** (add `Some("vm02-refresh") => …` arm) |

All pure logic and DB I/O live in the one new file (matches the existing pattern where each command is a self-contained module, e.g. `vm_standard_all.rs`). The pure functions sit at the top with a `#[cfg(test)] mod tests` block at the bottom, mirroring `vm_standard_all.rs:853`.

**Scope:** This plan is **A only** (the CLI command). Part **B** (changing `apps/user-console` to render the ⓪ scorecard from `output_json` instead of the markdown table) is an independent subsystem and will be a separate plan.

---

## Conventions for this plan

- **Verify compile:** `cargo check --manifest-path apps/cli/Cargo.toml`
- **Run unit tests:** `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
- **Run the command (needs DB):**
  ```bash
  set -a; source apps/api/.env; set +a
  cargo run --manifest-path apps/cli/Cargo.toml --bin cli --quiet -- vm02-refresh --ticker 7203 --dry-run
  ```
- **Commit style:** match the repo (Japanese, no type prefix, e.g. `vm02-refresh コマンドの雛形を追加`). Commit after each task.
- **Money units:** `financial_statements` values are in 円 (JPY). `stock_prices.close`/`price` are 円/株. `outstanding_shares` is shares. So `market_cap = price × shares` (円). All multiples are computed in `f64`.
- **None semantics (api/CLAUDE.md):** `None` = データなし ≠ `Some(0)`. Never `unwrap_or(0)` on a financial field. A missing input drops the dependent multiple to `None` (not 0).

---

### Task 1: Module scaffold + CLI wiring + arg parsing

**Files:**
- Create: `apps/cli/src/commands/vm02_refresh.rs`
- Modify: `apps/cli/src/commands/mod.rs` (after line 19)
- Modify: `apps/cli/src/main.rs` (after the `vm-standard-all-api` arm, ~line 118)

- [ ] **Step 1: Create the new module with `Opts` + `parse_args` + a stub `run`**

Create `apps/cli/src/commands/vm02_refresh.rs`:

```rust
//! `cli vm02-refresh --ticker <code> [--date YYYY-MM-DD]` — 算術 vm02 部分リフレッシュ。
//!
//! LLM も build-pack も使わず、最新株価 × 直近通期 financial_statements から
//! 倍率 (PER/PBR/EV-EBITDA/FCF利回り) を再計算し、scoring-rubric.md の閾値で vm02 を採点。
//!   1. company_analyses の既存 vm02 行を更新 (module_score 列 → screening 即反映)
//!   2. vm00 行を patch (scorecard.vm02 + scores.detail の total/component → 詳細ページのレーダー/⓪)
//! 既存 vm00/vm02 行が無い社はスキップ (先に vm-standard-all フル分析が必要)。

use anyhow::{Result, anyhow, bail};
use chrono::{NaiveDate, Utc};
use sea_orm::DatabaseConnection;

#[derive(Clone, Debug)]
struct Opts {
    ticker: Option<String>,
    all: bool,
    industry: Option<String>,
    limit: Option<usize>,
    /// 株価 as-of 日。未指定なら最新終値。
    date: Option<NaiveDate>,
    /// vm00 の patch を省略し vm02 行だけ更新 (screening のみ更新したいとき)。
    tier1_only: bool,
    /// 書き込まず、算出した倍率・スコアを表示するだけ。
    dry_run: bool,
}

impl Opts {
    fn is_batch(&self) -> bool {
        self.all || self.industry.is_some()
    }
}

pub async fn run(_db: &DatabaseConnection, args: &[String]) -> Result<()> {
    let _opts = parse_args(args)?;
    bail!("not implemented yet")
}

fn parse_args(args: &[String]) -> Result<Opts> {
    let mut ticker: Option<String> = None;
    let mut all = false;
    let mut industry: Option<String> = None;
    let mut limit: Option<usize> = None;
    let mut date: Option<NaiveDate> = None;
    let mut tier1_only = false;
    let mut dry_run = false;

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--ticker" => {
                ticker = Some(
                    args.get(i + 1)
                        .ok_or_else(|| anyhow!("--ticker requires a value"))?
                        .clone(),
                );
                i += 2;
            }
            "--date" => {
                let v = args
                    .get(i + 1)
                    .ok_or_else(|| anyhow!("--date requires YYYY-MM-DD"))?;
                date = Some(NaiveDate::parse_from_str(v, "%Y-%m-%d")?);
                i += 2;
            }
            "--all" => {
                all = true;
                i += 1;
            }
            "--industry" => {
                industry = Some(
                    args.get(i + 1)
                        .ok_or_else(|| anyhow!("--industry requires industry code (e.g. 3700)"))?
                        .clone(),
                );
                i += 2;
            }
            "--limit" => {
                limit = Some(
                    args.get(i + 1)
                        .ok_or_else(|| anyhow!("--limit requires N"))?
                        .parse()?,
                );
                i += 2;
            }
            "--tier1-only" => {
                tier1_only = true;
                i += 1;
            }
            "--dry-run" => {
                dry_run = true;
                i += 1;
            }
            other => bail!("Unknown argument: {other}"),
        }
    }
    if ticker.is_none() && !all && industry.is_none() {
        bail!(
            "Usage: vm02-refresh (--ticker <code> | --all | --industry <code>) [--date YYYY-MM-DD] [--limit N] [--tier1-only] [--dry-run]"
        );
    }
    Ok(Opts {
        ticker,
        all,
        industry,
        limit,
        date,
        tier1_only,
        dry_run,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn strings(args: &[&str]) -> Vec<String> {
        args.iter().map(|arg| arg.to_string()).collect()
    }

    #[test]
    fn parse_single_ticker() {
        let o = parse_args(&strings(&["--ticker", "7203"])).unwrap();
        assert_eq!(o.ticker.as_deref(), Some("7203"));
        assert!(!o.is_batch());
        assert!(!o.dry_run);
    }

    #[test]
    fn parse_batch_with_flags() {
        let o = parse_args(&strings(&["--all", "--limit", "10", "--tier1-only", "--dry-run"]))
            .unwrap();
        assert!(o.is_batch());
        assert_eq!(o.limit, Some(10));
        assert!(o.tier1_only);
        assert!(o.dry_run);
    }

    #[test]
    fn parse_requires_a_target() {
        assert!(parse_args(&strings(&["--dry-run"])).is_err());
    }

    #[test]
    fn parse_rejects_unknown_arg() {
        assert!(parse_args(&strings(&["--ticker", "7203", "--bogus"])).is_err());
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail (module not yet registered → compile error)**

Run: `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: FAIL — `error[E0583]: file not found for module` or `unresolved module`, because `mod.rs` does not declare it yet.

- [ ] **Step 3: Register the module in `commands/mod.rs`**

In `apps/cli/src/commands/mod.rs`, add after the `pub mod vm_standard_all_api;` line (line 19):

```rust
pub mod vm02_refresh;
```

- [ ] **Step 4: Add the dispatch arm in `main.rs`**

In `apps/cli/src/main.rs`, add immediately after the `vm-standard-all-api` match arm:

```rust
        Some("vm02-refresh") => {
            let db = connect_db(&Settings::from_env()).await?;
            commands::vm02_refresh::run(&db, &args[2..]).await
        }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: PASS (4 tests). The stub `run` is untested.

- [ ] **Step 6: Verify the whole cli crate compiles**

Run: `cargo check --manifest-path apps/cli/Cargo.toml`
Expected: compiles (warnings about unused `Opts` fields / `Utc` import are OK for now).

- [ ] **Step 7: Commit**

```bash
git add apps/cli/src/commands/vm02_refresh.rs apps/cli/src/commands/mod.rs apps/cli/src/main.rs
git commit -m "vm02-refresh コマンドの雛形と CLI 配線を追加"
```

---

### Task 2: Pure `compute_multiples`

**Files:**
- Modify: `apps/cli/src/commands/vm02_refresh.rs`

- [ ] **Step 1: Write the failing tests** (add the `Vm02Inputs`/`Vm02Multiples` types are referenced; tests come first)

Add these tests inside the existing `mod tests`:

```rust
    fn base_inputs() -> Vm02Inputs {
        // price 1000, 100 株 → market_cap 100,000
        Vm02Inputs {
            price: 1000.0,
            shares: 100.0,
            net_profit: Some(20000.0),  // EPS 200 → PER 5.0
            prev_net_profit: Some(18000.0),
            equity: Some(150000.0),     // BPS 1500 → PBR 0.667
            ebitda: Some(40000.0),
            cash: Some(30000.0),
            ibd: Some(10000.0),         // EV = 100000 + 10000 - 30000 = 80000 → EV/EBITDA 2.0
            cfo: Some(25000.0),
            cfi: Some(-5000.0),         // FCF 20000 → 利回り 20%
            dps: Some(50.0),            // 配当利回り 5%
        }
    }

    #[test]
    fn multiples_basic() {
        let m = compute_multiples(&base_inputs(), None);
        assert!((m.market_cap - 100_000.0).abs() < 1e-6);
        assert!((m.per.unwrap() - 5.0).abs() < 1e-6);
        assert!((m.pbr.unwrap() - (100_000.0 / 150_000.0)).abs() < 1e-6);
        assert!((m.ev.unwrap() - 80_000.0).abs() < 1e-6);
        assert!((m.ev_ebitda.unwrap() - 2.0).abs() < 1e-6);
        assert!((m.fcf_yield_pct.unwrap() - 20.0).abs() < 1e-6);
        assert!((m.dividend_yield_pct.unwrap() - 5.0).abs() < 1e-6);
        assert!((m.earnings_yield_pct.unwrap() - 20.0).abs() < 1e-6);
    }

    #[test]
    fn multiples_drop_to_none_on_missing_or_nonpositive() {
        let mut inp = base_inputs();
        inp.net_profit = Some(-1.0); // 赤字 → PER None
        inp.equity = Some(0.0);      // 債務超過扱い → PBR None
        inp.cash = None;             // EV 不能 → EV/EBITDA None
        inp.cfo = None;              // FCF 不能 → 利回り None
        let m = compute_multiples(&inp, None);
        assert!(m.per.is_none());
        assert!(m.pbr.is_none());
        assert!(m.ev.is_none());
        assert!(m.ev_ebitda.is_none());
        assert!(m.fcf_yield_pct.is_none());
    }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: FAIL — `cannot find type Vm02Inputs` / `cannot find function compute_multiples`.

- [ ] **Step 3: Implement the types + `compute_multiples`** (add near the top of the file, below the imports)

```rust
/// vm02 採点に必要な生の財務入力 (すべて f64 に変換済み)。
/// price/shares は呼び出し側で必須 (無ければ会社をスキップ)。残りは欠損可。
#[derive(Clone, Debug)]
struct Vm02Inputs {
    price: f64,                  // 円/株
    shares: f64,                 // 株
    net_profit: Option<f64>,     // 直近通期 当期純利益 (円)
    prev_net_profit: Option<f64>,// 前期 当期純利益 (YoY 判定用)
    equity: Option<f64>,         // 純資産 (円)
    ebitda: Option<f64>,         // 円
    cash: Option<f64>,           // 現金 (円)
    ibd: Option<f64>,            // 有利子負債 short+long(+lease) (円)
    cfo: Option<f64>,            // 営業 CF (円)
    cfi: Option<f64>,            // 投資 CF (円)
    dps: Option<f64>,            // 1株配当 (円)
}

#[derive(Clone, Debug)]
struct Vm02Multiples {
    market_cap: f64,
    per: Option<f64>,
    pbr: Option<f64>,
    ev: Option<f64>,
    net_cash: Option<f64>,
    ev_ebitda: Option<f64>,
    fcf_yield_pct: Option<f64>,
    earnings_yield_pct: Option<f64>,
    dividend_yield_pct: Option<f64>,
    peer_median_per: Option<f64>,
}

/// 倍率を計算する。非正の分母 / 欠損入力は該当倍率を None に落とす (0 で埋めない)。
fn compute_multiples(inp: &Vm02Inputs, peer_median_per: Option<f64>) -> Vm02Multiples {
    let market_cap = inp.price * inp.shares;

    // PER = price/EPS = market_cap / net_profit。利益が正のときだけ。
    let per = inp
        .net_profit
        .filter(|&np| np > 0.0)
        .map(|np| market_cap / np);

    // PBR = market_cap / equity。純資産が正のときだけ。
    let pbr = inp
        .equity
        .filter(|&eq| eq > 0.0)
        .map(|eq| market_cap / eq);

    // EV / net_cash は cash と ibd の両方が分かるときだけ算出。
    let (ev, net_cash) = match (inp.cash, inp.ibd) {
        (Some(cash), Some(ibd)) => (Some(market_cap + ibd - cash), Some(cash - ibd)),
        _ => (None, None),
    };

    let ev_ebitda = match (ev, inp.ebitda) {
        (Some(ev), Some(eb)) if eb > 0.0 => Some(ev / eb),
        _ => None,
    };

    let fcf_yield_pct = match (inp.cfo, inp.cfi) {
        (Some(cfo), Some(cfi)) if market_cap > 0.0 => Some((cfo + cfi) / market_cap * 100.0),
        _ => None,
    };

    let earnings_yield_pct = per.map(|p| 100.0 / p);
    let dividend_yield_pct = inp.dps.map(|d| d / inp.price * 100.0);

    Vm02Multiples {
        market_cap,
        per,
        pbr,
        ev,
        net_cash,
        ev_ebitda,
        fcf_yield_pct,
        earnings_yield_pct,
        dividend_yield_pct,
        peer_median_per,
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: PASS (6 tests total).

- [ ] **Step 5: Commit**

```bash
git add apps/cli/src/commands/vm02_refresh.rs
git commit -m "vm02-refresh: 倍率計算 compute_multiples を追加"
```

---

### Task 3: Pure `score_vm02` (rubric)

Rubric source: `.agents/skills/vm-standard-all/references/scoring-rubric.md` § vm02 and § 欠損時のスコア上限.

**Files:**
- Modify: `apps/cli/src/commands/vm02_refresh.rs`

- [ ] **Step 1: Write the failing tests**

Add inside `mod tests`:

```rust
    fn mult(per: Option<f64>, pbr: Option<f64>, ev_ebitda: Option<f64>, fcf: Option<f64>, peer: Option<f64>) -> Vm02Multiples {
        Vm02Multiples {
            market_cap: 100_000.0,
            per, pbr, ev_ebitda,
            fcf_yield_pct: fcf,
            peer_median_per: peer,
            ev: None, net_cash: None,
            earnings_yield_pct: per.map(|p| 100.0 / p),
            dividend_yield_pct: None,
        }
    }

    #[test]
    fn score_all_cheap_is_top_band() {
        // 4/4 割安条件 + peer 割安 → 9..=10, 割安
        let m = mult(Some(6.0), Some(0.8), Some(5.0), Some(12.0), Some(10.0));
        let r = score_vm02(&m, Some(true), true, true);
        assert!(r.score.unwrap() >= 9, "score={:?}", r.score);
        assert_eq!(r.verdict_label, "割安");
        assert_eq!(r.verdict, "UNDERVALUED");
    }

    #[test]
    fn score_three_of_four_is_slightly_cheap() {
        // 3/4 (PER/PBR/FCF cheap, EV/EBITDA not) → 7..=8
        let m = mult(Some(7.0), Some(0.9), Some(9.0), Some(12.0), None);
        let r = score_vm02(&m, Some(true), false /*no peers*/, true);
        assert!(matches!(r.score, Some(7) | Some(8)));
        assert_eq!(r.verdict_label, "やや割安");
    }

    #[test]
    fn score_neutral_when_no_signal() {
        // どれも割安でも割高でもない → 妥当 5..=6
        let m = mult(Some(15.0), Some(1.5), Some(9.0), Some(3.0), Some(15.0));
        let r = score_vm02(&m, Some(true), true, true);
        assert!(matches!(r.score, Some(5) | Some(6)));
        assert_eq!(r.verdict_label, "妥当");
    }

    #[test]
    fn score_rich_overrides_to_overvalued() {
        // PER>25 かつ PBR>3 → 割高 3..=4
        let m = mult(Some(30.0), Some(4.0), None, None, None);
        let r = score_vm02(&m, Some(true), false, true);
        assert!(matches!(r.score, Some(3) | Some(4)));
        assert_eq!(r.verdict_label, "割高");
        assert_eq!(r.verdict, "OVERVALUED");
    }

    #[test]
    fn score_bubble_overrides_to_two() {
        // PER>50 かつ 非増益 → 1..=2
        let m = mult(Some(60.0), Some(5.0), None, None, None);
        let r = score_vm02(&m, Some(false), false, true);
        assert_eq!(r.score, Some(2));
    }

    #[test]
    fn score_undetermined_when_unvaluable() {
        // PER/PBR/EV-EBITDA すべて None → 判定不能
        let m = mult(None, None, None, Some(3.0), None);
        let r = score_vm02(&m, None, true, true);
        assert_eq!(r.score, None);
        assert_eq!(r.verdict, "UNDETERMINED");
        assert_eq!(r.verdict_label, "判定不能");
    }

    #[test]
    fn score_caps_when_inputs_missing() {
        // 全割安だが peer 欠 (cap7) かつ cfo 欠 (cap6) → 上限 6
        let m = mult(Some(6.0), Some(0.8), Some(5.0), None, None);
        let r = score_vm02(&m, Some(true), false, false);
        assert!(r.score.unwrap() <= 6, "score={:?}", r.score);
        assert!(r.caps_applied.iter().any(|c| c.contains("cfo")));
        assert!(r.caps_applied.iter().any(|c| c.contains("peer")));
    }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: FAIL — `cannot find function score_vm02` / `cannot find type Vm02Result`.

- [ ] **Step 3: Implement `Vm02Result` + `score_vm02`** (add below `compute_multiples`)

```rust
#[derive(Clone, Debug)]
struct Vm02Result {
    /// 1〜10 整数。判定不能なら None。
    score: Option<i32>,
    confidence: i32,
    verdict: &'static str,        // 英語コード (システム識別子)
    verdict_label: &'static str,  // 日本語 (表示用)
    verdict_strength: &'static str,
    n_cheap: i32,
    caps_applied: Vec<String>,
}

/// scoring-rubric.md § vm02 の閾値で算術採点する。
/// `peers_available`: peer の median PER が取れたか。`cfo_available`: 営業 CF があるか。
fn score_vm02(
    m: &Vm02Multiples,
    profit_growing: Option<bool>,
    peers_available: bool,
    cfo_available: bool,
) -> Vm02Result {
    // confidence は欠損で減衰 (下限 3)。
    let mut confidence = 7;
    if !peers_available {
        confidence -= 1;
    }
    if !cfo_available {
        confidence -= 1;
    }
    if m.per.is_none() {
        confidence -= 1;
    }
    confidence = confidence.max(3);

    // 価値が一切測れない (PER/PBR/EV-EBITDA すべて None) → fail-closed で判定不能。
    if m.per.is_none() && m.pbr.is_none() && m.ev_ebitda.is_none() {
        return Vm02Result {
            score: None,
            confidence,
            verdict: "UNDETERMINED",
            verdict_label: "判定不能",
            verdict_strength: "LOW",
            n_cheap: 0,
            caps_applied: vec!["unvaluable".to_string()],
        };
    }

    let mut n_cheap = 0;
    if m.per.is_some_and(|x| x < 8.0) {
        n_cheap += 1;
    }
    if m.pbr.is_some_and(|x| x < 1.0) {
        n_cheap += 1;
    }
    if m.ev_ebitda.is_some_and(|x| x < 6.0) {
        n_cheap += 1;
    }
    if m.fcf_yield_pct.is_some_and(|x| x > 10.0) {
        n_cheap += 1;
    }

    // 基準スコア (割安シグナル数)。
    let mut score = match n_cheap {
        4 => 9,
        3 => 8,
        2 => 7,
        1 => 6,
        _ => 5,
    };

    // peer 補正 (median 対比 ±10%)。
    if let (Some(self_per), Some(med)) = (m.per, m.peer_median_per) {
        if med > 0.0 {
            if self_per < med * 0.9 {
                score += 1;
            } else if self_per > med * 1.1 {
                score -= 1;
            }
        }
    }

    // 割高オーバーライド。
    let rich = m.per.is_some_and(|x| x > 25.0) && m.pbr.is_some_and(|x| x > 3.0);
    let bubble = m.per.is_some_and(|x| x > 50.0) && profit_growing == Some(false);
    if bubble {
        score = 2;
    } else if rich {
        score = 3;
    }

    // 欠損上限。
    let mut caps_applied = Vec::new();
    if !peers_available {
        score = score.min(7);
        caps_applied.push("no_peers->cap7".to_string());
    }
    if !cfo_available {
        score = score.min(6);
        caps_applied.push("no_cfo->cap6".to_string());
    }
    score = score.clamp(1, 10);

    let (verdict_label, verdict) = match score {
        9..=10 => ("割安", "UNDERVALUED"),
        7..=8 => ("やや割安", "UNDERVALUED"),
        5..=6 => ("妥当", "FAIR"),
        _ => ("割高", "OVERVALUED"),
    };
    let verdict_strength = if score >= 8 && confidence >= 7 {
        "HIGH"
    } else if score >= 6 && confidence >= 5 {
        "MED"
    } else {
        "LOW"
    };

    Vm02Result {
        score: Some(score),
        confidence,
        verdict,
        verdict_label,
        verdict_strength,
        n_cheap,
        caps_applied,
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: PASS (13 tests total).

- [ ] **Step 5: Commit**

```bash
git add apps/cli/src/commands/vm02_refresh.rs
git commit -m "vm02-refresh: ルーブリック採点 score_vm02 を追加"
```

---

### Task 4: Pure `recompute_vm00` (total/component re-weight)

Formula source: `references/scoring-rubric.md` § 総合スコアの計算 (`total = value×0.50 + credit×0.35 + market×0.15`).

**Files:**
- Modify: `apps/cli/src/commands/vm02_refresh.rs`

- [ ] **Step 1: Write the failing test** (uses the worked example from `structured-keys.md`)

Add inside `mod tests`:

```rust
    #[test]
    fn recompute_vm00_matches_rubric_example() {
        // vm01=7,vm03=8,vm04=7,vm05=7,vm06=7,vm07=7,vm08=8,vm09=8, vm02_new=7
        let c = Vm00Components {
            vm01: Some(7.0),
            vm03: Some(8.0),
            vm04: Some(7.0),
            vm05: Some(7.0),
            vm06: Some(7.0),
            vm07: Some(7.0),
            vm08: Some(8.0),
            vm09: Some(8.0),
        };
        let t = recompute_vm00(7.0, &c).unwrap();
        assert!((t.value - 7.5).abs() < 1e-6);
        assert!((t.credit - 7.25).abs() < 1e-6);
        assert!((t.market - 7.0).abs() < 1e-6);
        assert!((t.total - 7.3375).abs() < 1e-4); // 3.75 + 2.5375 + 1.05
    }

    #[test]
    fn recompute_vm00_none_when_market_missing() {
        let c = Vm00Components {
            vm01: Some(7.0), vm03: Some(7.0), vm04: Some(7.0), vm05: Some(7.0),
            vm06: Some(7.0), vm07: None, vm08: Some(7.0), vm09: Some(7.0),
        };
        assert!(recompute_vm00(7.0, &c).is_none());
    }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: FAIL — `cannot find type Vm00Components` / `cannot find function recompute_vm00`.

- [ ] **Step 3: Implement `Vm00Components` + `Vm00Totals` + `recompute_vm00`**

```rust
/// vm00 patch 用に、保存済みフル分析から読んだ各モジュールスコア。
/// vm02 は新スコアを別引数で渡すのでここには含めない。
#[derive(Clone, Debug)]
struct Vm00Components {
    vm01: Option<f64>,
    vm03: Option<f64>,
    vm04: Option<f64>,
    vm05: Option<f64>,
    vm06: Option<f64>,
    vm07: Option<f64>,
    vm08: Option<f64>,
    vm09: Option<f64>,
}

#[derive(Clone, Debug)]
struct Vm00Totals {
    total: f64,
    value: f64,
    credit: f64,
    market: f64,
}

fn avg(xs: &[Option<f64>]) -> Option<f64> {
    let present: Vec<f64> = xs.iter().filter_map(|x| *x).collect();
    if present.is_empty() {
        None
    } else {
        Some(present.iter().sum::<f64>() / present.len() as f64)
    }
}

/// total = value×0.50 + credit×0.35 + market×0.15。
/// value/credit/market のいずれかが算出不能なら None (patch をスキップ)。
fn recompute_vm00(vm02_new: f64, c: &Vm00Components) -> Option<Vm00Totals> {
    let value = avg(&[Some(vm02_new), c.vm03, c.vm04, c.vm08])?;
    let credit = avg(&[c.vm01, c.vm05, c.vm06, c.vm09])?;
    let market = c.vm07?;
    let total = value * 0.50 + credit * 0.35 + market * 0.15;
    Some(Vm00Totals {
        total,
        value,
        credit,
        market,
    })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: PASS (15 tests total).

- [ ] **Step 5: Commit**

```bash
git add apps/cli/src/commands/vm02_refresh.rs
git commit -m "vm02-refresh: vm00 総合スコア再計算 recompute_vm00 を追加"
```

---

### Task 5: DB read — assemble `Vm02Inputs` + peer median + price

Patterns reused: latest annual via `quarter = 4`, `year DESC` (`calc_valuations.rs:77`); price via `listing → stock_prices` order by date desc (`stock_price_repository.rs:43`); peer CSV via `split(',')` (`build_pack.rs:503`).

**Files:**
- Modify: `apps/cli/src/commands/vm02_refresh.rs`

- [ ] **Step 1: Add entity imports and DB read helpers**

At the top of the file, extend the imports:

```rust
use api::infrastructure::db::sea_orm::entities::{
    companies, company_analyses, financial_statements, industries, listings, stock_prices,
};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter,
    QueryOrder,
};
```

Add these helpers below the pure functions:

```rust
fn i64f(v: Option<i64>) -> Option<f64> {
    v.map(|x| x as f64)
}

/// 有利子負債 = short + long (+ capital_lease)。全部 None なら None。
fn interest_bearing_debt(fs: &financial_statements::Model) -> Option<f64> {
    let parts = [fs.short_term_debt, fs.long_term_debt, fs.capital_lease];
    if parts.iter().all(|p| p.is_none()) {
        None
    } else {
        Some(parts.iter().filter_map(|p| *p).map(|x| x as f64).sum())
    }
}

/// 直近通期 (quarter=4) を新しい順に最大 2 期取得 ([0]=最新, [1]=前期)。
async fn annual_history(
    db: &DatabaseConnection,
    company_id: i32,
) -> Result<Vec<financial_statements::Model>> {
    let rows = financial_statements::Entity::find()
        .filter(financial_statements::Column::CompanyId.eq(company_id))
        .filter(financial_statements::Column::Quarter.eq(4i16))
        .order_by_desc(financial_statements::Column::Year)
        .all(db)
        .await?;
    Ok(rows.into_iter().take(2).collect())
}

/// 最新終値 (close 優先、無ければ price) と取得日。`as_of` 指定時はその日以前の最新。
async fn latest_price(
    db: &DatabaseConnection,
    company_id: i32,
    as_of: Option<NaiveDate>,
) -> Result<Option<(f64, NaiveDate)>> {
    let listing_ids: Vec<i32> = listings::Entity::find()
        .filter(listings::Column::CompanyId.eq(company_id))
        .all(db)
        .await?
        .into_iter()
        .map(|l| l.id)
        .collect();
    if listing_ids.is_empty() {
        return Ok(None);
    }
    let mut q = stock_prices::Entity::find()
        .filter(stock_prices::Column::ListingId.is_in(listing_ids))
        .order_by_desc(stock_prices::Column::Date);
    if let Some(d) = as_of {
        q = q.filter(stock_prices::Column::Date.lte(d));
    }
    let row = q.one(db).await?;
    Ok(row.and_then(|r| {
        let p = r.close.or(r.price)?;
        if p <= 0 {
            return None;
        }
        Some((p as f64, r.date))
    }))
}

/// peer 群の PER 中央値。related_tickers (カンマ区切り code) を 1 件ずつ評価。
async fn peer_median_per(
    db: &DatabaseConnection,
    related: Option<&str>,
    self_code: &str,
    as_of: Option<NaiveDate>,
) -> Result<Option<f64>> {
    let Some(csv) = related else {
        return Ok(None);
    };
    let mut pers: Vec<f64> = Vec::new();
    for code in csv.split(',').map(str::trim).filter(|s| !s.is_empty()) {
        if code == self_code {
            continue;
        }
        let Some(c) = companies::Entity::find()
            .filter(companies::Column::Code.eq(code))
            .one(db)
            .await?
        else {
            continue;
        };
        let hist = annual_history(db, c.id).await?;
        let Some(fs) = hist.first() else { continue };
        let (Some(price), Some(shares), Some(np)) =
            (latest_price(db, c.id, as_of).await?.map(|(p, _)| p), i64f(fs.outstanding_shares), i64f(fs.net_profit))
        else {
            continue;
        };
        if shares > 0.0 && np > 0.0 {
            pers.push(price * shares / np);
        }
    }
    if pers.is_empty() {
        return Ok(None);
    }
    pers.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let mid = pers.len() / 2;
    let median = if pers.len() % 2 == 0 {
        (pers[mid - 1] + pers[mid]) / 2.0
    } else {
        pers[mid]
    };
    Ok(Some(median))
}
```

- [ ] **Step 2: Add a `gather` function that produces `(Vm02Inputs, profit_growing, peers_available, cfo_available, price_date)` for a company**

```rust
struct Gathered {
    inputs: Vm02Inputs,
    profit_growing: Option<bool>,
    peers_available: bool,
    cfo_available: bool,
    price_date: NaiveDate,
}

/// 1 社分の入力を DB から集める。価格 or 株数 or 通期財務が無ければ None (リフレッシュ不能)。
async fn gather(
    db: &DatabaseConnection,
    company: &companies::Model,
    as_of: Option<NaiveDate>,
) -> Result<Option<Gathered>> {
    let code = company.code.clone().unwrap_or_default();
    let hist = annual_history(db, company.id).await?;
    let Some(fs) = hist.first() else {
        return Ok(None);
    };
    let Some((price, price_date)) = latest_price(db, company.id, as_of).await? else {
        return Ok(None);
    };
    let Some(shares) = i64f(fs.outstanding_shares).filter(|&s| s > 0.0) else {
        return Ok(None);
    };

    let prev_net_profit = hist.get(1).and_then(|p| i64f(p.net_profit));
    let net_profit = i64f(fs.net_profit);
    let profit_growing = match (net_profit, prev_net_profit) {
        (Some(cur), Some(prev)) => Some(cur > prev),
        _ => None,
    };
    let cfo = i64f(fs.operating_cash_flow);
    let peer_med = peer_median_per(db, company.related_tickers.as_deref(), &code, as_of).await?;

    let inputs = Vm02Inputs {
        price,
        shares,
        net_profit,
        prev_net_profit,
        equity: i64f(fs.equity),
        ebitda: i64f(fs.ebitda),
        cash: i64f(fs.cash),
        ibd: interest_bearing_debt(fs),
        cfo,
        cfi: i64f(fs.invest_cash_flow),
        dps: fs.dividend_per_share.map(|d| d as f64),
    };

    Ok(Some(Gathered {
        inputs,
        profit_growing,
        peers_available: peer_med.is_some(),
        cfo_available: cfo.is_some(),
        price_date,
    }))
}
```

- [ ] **Step 3: Wire a minimal single-ticker `--dry-run` path so the read code is exercised**

Replace the stub `run` body with a dry-run-capable single path (batch comes in Task 8). Add this helper and call it from `run`:

```rust
async fn dry_run_one(db: &DatabaseConnection, ticker: &str, as_of: Option<NaiveDate>) -> Result<()> {
    let company = companies::Entity::find()
        .filter(companies::Column::Code.eq(ticker.to_string()))
        .one(db)
        .await?
        .ok_or_else(|| anyhow!("company not found: code={ticker}"))?;
    let Some(g) = gather(db, &company, as_of).await? else {
        println!("{ticker}: skip (価格 or 通期財務 が不足)");
        return Ok(());
    };
    let m = compute_multiples(&g.inputs, peer_median_per_value(&g));
    let r = score_vm02(&m, g.profit_growing, g.peers_available, g.cfo_available);
    println!(
        "{ticker}: price={} ({}) PER={:?} PBR={:?} EV/EBITDA={:?} FCFy={:?} peerPER={:?} -> score={:?} ({}) conf={} caps={:?}",
        g.inputs.price, g.price_date, m.per, m.pbr, m.ev_ebitda, m.fcf_yield_pct,
        m.peer_median_per, r.score, r.verdict_label, r.confidence, r.caps_applied
    );
    Ok(())
}

/// gather は peer median を bool だけ保持しているので、表示用に再取得は避け、
/// compute_multiples には gather 内で得た median を渡す。peer median を Gathered に持たせる。
fn peer_median_per_value(_g: &Gathered) -> Option<f64> {
    // 実値は Gathered に保持する (次ステップで field 追加)。ここではプレースホルダ。
    None
}
```

> **Note for the implementer:** to avoid recomputing peers, add a `peer_median: Option<f64>` field to `Gathered`, set it in `gather` (`peer_median: peer_med`), and make `peer_median_per_value` return `_g.peer_median`. Update the `Gathered` struct + the `gather` return accordingly. (Kept explicit here so the data flow is visible.)

Then set `run`:

```rust
pub async fn run(db: &DatabaseConnection, args: &[String]) -> Result<()> {
    let opts = parse_args(args)?;
    if opts.is_batch() {
        bail!("batch mode not implemented yet"); // Task 8
    }
    let ticker = opts
        .ticker
        .clone()
        .ok_or_else(|| anyhow!("--ticker required in single mode"))?;
    if opts.dry_run {
        return dry_run_one(db, &ticker, opts.date).await;
    }
    bail!("write path not implemented yet"); // Task 6/7
}
```

- [ ] **Step 4: Apply the implementer note now** — add `peer_median: Option<f64>` to `Gathered`, set it in `gather`, and make `peer_median_per_value` return `g.peer_median`. (This removes the placeholder.)

- [ ] **Step 5: Verify compile**

Run: `cargo check --manifest-path apps/cli/Cargo.toml`
Expected: compiles.

- [ ] **Step 6: Verify against the real DB with a known large-cap**

```bash
set -a; source apps/api/.env; set +a
cargo run --manifest-path apps/cli/Cargo.toml --bin cli --quiet -- vm02-refresh --ticker 7203 --dry-run
```
Expected: one line printing a plausible price + multiples + a `score=Some(N)` in 1–10 with a Japanese verdict label. (If `skip`, try another ticker that has financials, e.g. `6758`.)

- [ ] **Step 7: Commit**

```bash
git add apps/cli/src/commands/vm02_refresh.rs
git commit -m "vm02-refresh: DB から入力収集 (株価/通期財務/peer) と --dry-run を実装"
```

---

### Task 6: DB write — update vm02 row + patch vm00 row

**Files:**
- Modify: `apps/cli/src/commands/vm02_refresh.rs`

- [ ] **Step 1: Add `serde_json` import and a `write_vm02` function (read-modify-write of the existing vm02 row)**

Add to imports: `use serde_json::{Value as JsonValue, json};`

```rust
/// 既存 vm02 行 (最新, status=completed) を算術結果で更新する。無ければ false (スキップ)。
async fn write_vm02(
    db: &DatabaseConnection,
    company_id: i32,
    m: &Vm02Multiples,
    r: &Vm02Result,
    price: f64,
    price_date: NaiveDate,
    band_crossed: &mut bool,
) -> Result<bool> {
    let Some(row) = company_analyses::Entity::find()
        .filter(company_analyses::Column::CompanyId.eq(company_id))
        .filter(company_analyses::Column::AnalysisType.eq("vm02"))
        .filter(company_analyses::Column::Status.eq("completed"))
        .order_by_desc(company_analyses::Column::ReferenceDate)
        .order_by_desc(company_analyses::Column::CreatedAt)
        .one(db)
        .await?
    else {
        return Ok(false);
    };

    // 既存 output_json (data_json block) を土台に numeric/structured だけ差し替える。
    let mut oj = row.output_json.clone().unwrap_or_else(|| json!({}));
    let prev_label = oj
        .pointer("/scores/verdict_label")
        .and_then(|v| v.as_str())
        .map(String::from);
    *band_crossed = prev_label.as_deref() != Some(r.verdict_label);

    let valuation_simple = json!({
        "per": m.per,
        "pbr": m.pbr,
        "ev_ebitda": m.ev_ebitda,
        "fcf_yield_pct": m.fcf_yield_pct,
        "earnings_yield_pct": m.earnings_yield_pct,
        "dividend_yield_pct": m.dividend_yield_pct,
        "market_cap": m.market_cap,
        "enterprise_value": m.ev,
        "net_cash": m.net_cash,
        "peer_median_per": m.peer_median_per,
        "price": price,
        "price_date": price_date.to_string(),
    });
    let calculations = json!({
        "method": "vm02_refresh_arithmetic",
        "n_cheap": r.n_cheap,
        "caps_applied": r.caps_applied,
        "band_crossed": *band_crossed,
        "price": price,
        "price_date": price_date.to_string(),
    });

    if let Some(obj) = oj.as_object_mut() {
        obj.insert("valuation_simple".to_string(), valuation_simple);
        obj.insert("calculations".to_string(), calculations);
        if let Some(scores) = obj.get_mut("scores").and_then(|v| v.as_object_mut()) {
            scores.insert("module_score".to_string(), json!(r.score));
            scores.insert("confidence_score".to_string(), json!(r.confidence));
            scores.insert("verdict".to_string(), json!(r.verdict));
            scores.insert("verdict_label".to_string(), json!(r.verdict_label));
            scores.insert("verdict_strength".to_string(), json!(r.verdict_strength));
        }
        if let Some(meta) = obj.get_mut("meta").and_then(|v| v.as_object_mut()) {
            meta.insert("provider".to_string(), json!("arithmetic"));
        }
    }

    let mut am = row.into_active_model();
    am.module_score = Set(r.score.map(|s| s as f32));
    am.confidence_score = Set(Some(r.confidence as f32));
    am.output_json = Set(Some(oj));
    am.provider = Set("arithmetic".to_string());
    am.update(db).await?;
    Ok(true)
}
```

- [ ] **Step 2: Add `patch_vm00` (recompute total/components from stored scorecard)**

```rust
fn score_at(oj: &JsonValue, vm: &str) -> Option<f64> {
    oj.pointer(&format!("/scorecard/{vm}/score"))
        .and_then(|v| v.as_f64())
}

/// vm00 行の scorecard.vm02 と scores.detail の total/component を更新する。
/// scorecard/detail が壊れている等で再計算できなければ false。
async fn patch_vm00(
    db: &DatabaseConnection,
    company_id: i32,
    vm02_new: i32,
    vm02_label: &str,
    price: f64,
    price_date: NaiveDate,
) -> Result<bool> {
    let Some(row) = company_analyses::Entity::find()
        .filter(company_analyses::Column::CompanyId.eq(company_id))
        .filter(company_analyses::Column::AnalysisType.eq("vm00"))
        .filter(company_analyses::Column::Status.eq("completed"))
        .order_by_desc(company_analyses::Column::ReferenceDate)
        .order_by_desc(company_analyses::Column::CreatedAt)
        .one(db)
        .await?
    else {
        return Ok(false);
    };
    let mut oj = row.output_json.clone().unwrap_or_else(|| json!({}));

    let comps = Vm00Components {
        vm01: score_at(&oj, "vm01"),
        vm03: score_at(&oj, "vm03"),
        vm04: score_at(&oj, "vm04"),
        vm05: score_at(&oj, "vm05"),
        vm06: score_at(&oj, "vm06"),
        vm07: score_at(&oj, "vm07"),
        vm08: score_at(&oj, "vm08"),
        vm09: score_at(&oj, "vm09"),
    };
    let Some(t) = recompute_vm00(vm02_new as f64, &comps) else {
        return Ok(false);
    };

    if let Some(obj) = oj.as_object_mut() {
        // scorecard.vm02 を更新 (無ければ作る)。
        let scorecard = obj
            .entry("scorecard")
            .or_insert_with(|| json!({}))
            .as_object_mut();
        if let Some(sc) = scorecard {
            let vm02 = sc.entry("vm02").or_insert_with(|| json!({}));
            if let Some(v) = vm02.as_object_mut() {
                v.insert("score".to_string(), json!(vm02_new));
                v.insert("label".to_string(), json!(vm02_label));
            }
        }
        // scores.detail の total/component と鮮度メタ。
        if let Some(scores) = obj.get_mut("scores").and_then(|v| v.as_object_mut()) {
            let detail = scores.entry("detail").or_insert_with(|| json!({}));
            if let Some(d) = detail.as_object_mut() {
                d.insert("total_score".to_string(), json!(t.total));
                d.insert("value_component_score".to_string(), json!(t.value));
                d.insert("credit_component_score".to_string(), json!(t.credit));
                d.insert("market_component_score".to_string(), json!(t.market));
                d.insert("vm02_price".to_string(), json!(price));
                d.insert("vm02_price_date".to_string(), json!(price_date.to_string()));
                d.insert("vm02_method".to_string(), json!("arithmetic_refresh"));
            }
        }
    }

    let mut am = row.into_active_model();
    am.module_score = Set(Some(t.total.round() as f32));
    am.output_json = Set(Some(oj));
    am.update(db).await?;
    Ok(true)
}
```

- [ ] **Step 3: Verify compile**

Run: `cargo check --manifest-path apps/cli/Cargo.toml`
Expected: compiles (the new fns are unused until Task 7 — `#[allow(dead_code)]` is unnecessary; the warning is acceptable, but you may temporarily reference them in Task 7 immediately).

- [ ] **Step 4: Commit**

```bash
git add apps/cli/src/commands/vm02_refresh.rs
git commit -m "vm02-refresh: vm02 行更新と vm00 patch の書き込みを実装"
```

---

### Task 7: Single-ticker orchestration (`process_one`)

**Files:**
- Modify: `apps/cli/src/commands/vm02_refresh.rs`

- [ ] **Step 1: Implement `process_one` and wire it into `run` for the non-dry-run single path**

```rust
struct Outcome {
    updated_vm02: bool,
    patched_vm00: bool,
    skipped: bool,
}

async fn process_one(
    db: &DatabaseConnection,
    company: &companies::Model,
    opts: &Opts,
) -> Result<Outcome> {
    let Some(g) = gather(db, company, opts.date).await? else {
        return Ok(Outcome {
            updated_vm02: false,
            patched_vm00: false,
            skipped: true,
        });
    };
    let m = compute_multiples(&g.inputs, g.peer_median);
    let r = score_vm02(&m, g.profit_growing, g.peers_available, g.cfo_available);

    if opts.dry_run {
        let code = company.code.clone().unwrap_or_default();
        println!(
            "{code}: price={} ({}) score={:?} ({}) total inputs PER={:?} PBR={:?}",
            g.inputs.price, g.price_date, r.score, r.verdict_label, m.per, m.pbr
        );
        return Ok(Outcome {
            updated_vm02: false,
            patched_vm00: false,
            skipped: false,
        });
    }

    let mut band_crossed = false;
    let updated_vm02 = write_vm02(
        db,
        company.id,
        &m,
        &r,
        g.inputs.price,
        g.price_date,
        &mut band_crossed,
    )
    .await?;

    let patched_vm00 = if updated_vm02 && !opts.tier1_only {
        if let Some(score) = r.score {
            patch_vm00(
                db,
                company.id,
                score,
                r.verdict_label,
                g.inputs.price,
                g.price_date,
            )
            .await?
        } else {
            false
        }
    } else {
        false
    };

    Ok(Outcome {
        updated_vm02,
        patched_vm00,
        skipped: false,
    })
}
```

- [ ] **Step 2: Replace `run` single path + delete the now-redundant `dry_run_one`/`peer_median_per_value`**

```rust
pub async fn run(db: &DatabaseConnection, args: &[String]) -> Result<()> {
    let opts = parse_args(args)?;
    if opts.is_batch() {
        bail!("batch mode not implemented yet"); // Task 8
    }
    let ticker = opts
        .ticker
        .clone()
        .ok_or_else(|| anyhow!("--ticker required in single mode"))?;
    let company = companies::Entity::find()
        .filter(companies::Column::Code.eq(ticker.clone()))
        .one(db)
        .await?
        .ok_or_else(|| anyhow!("company not found: code={ticker}"))?;
    let o = process_one(db, &company, &opts).await?;
    if o.skipped {
        println!("{ticker}: skip (価格 or 通期財務 が不足)");
    } else if !opts.dry_run {
        println!(
            "{ticker}: vm02_updated={} vm00_patched={}",
            o.updated_vm02, o.patched_vm00
        );
    }
    Ok(())
}
```

Remove the `dry_run_one` and `peer_median_per_value` functions added in Task 5 (now superseded by `process_one`). Ensure `Gathered` keeps the `peer_median` field.

- [ ] **Step 3: Verify compile + tests still pass**

Run: `cargo check --manifest-path apps/cli/Cargo.toml && cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: compiles; 15 unit tests pass.

- [ ] **Step 4: Verify dry-run, then a real single write against a ticker that has vm00/vm02 rows**

```bash
set -a; source apps/api/.env; set +a
# dry-run first
cargo run --manifest-path apps/cli/Cargo.toml --bin cli --quiet -- vm02-refresh --ticker 7203 --dry-run
# then a real write
cargo run --manifest-path apps/cli/Cargo.toml --bin cli --quiet -- vm02-refresh --ticker 7203
```
Expected: dry-run prints the score; real run prints `7203: vm02_updated=true vm00_patched=true`. If the ticker has no prior full analysis, it prints `vm02_updated=false` — pick a ticker that has a vm00 row (verify with: `psql "$DATABASE_URL" -c "select analysis_type from company_analyses ca join companies c on c.id=ca.company_id where c.code='7203' and ca.analysis_type in ('vm00','vm02');"`).

- [ ] **Step 5: Confirm the write landed (read-only check)**

```bash
psql "$DATABASE_URL" -c "select analysis_type, module_score, provider, output_json->'scores'->>'verdict_label' as label from company_analyses ca join companies c on c.id=ca.company_id where c.code='7203' and ca.analysis_type in ('vm00','vm02') order by analysis_type;"
```
Expected: vm02 row shows `provider=arithmetic` and a refreshed `module_score`; vm00 `module_score` reflects the recomputed total.

- [ ] **Step 6: Commit**

```bash
git add apps/cli/src/commands/vm02_refresh.rs
git commit -m "vm02-refresh: 単一銘柄のオーケストレーション process_one を実装"
```

---

### Task 8: Batch mode (`--all` / `--industry` / `--limit`)

Target selection: only companies that already have a completed vm02 row (others need a full run first). Mirrors the raw-SQL pattern in `vm_standard_all.rs:collect_target_tickers` but filtered to `analysis_type='vm02'`.

**Files:**
- Modify: `apps/cli/src/commands/vm02_refresh.rs`

- [ ] **Step 1: Add `collect_targets` (companies with an existing vm02 row)**

```rust
async fn collect_targets(db: &DatabaseConnection, opts: &Opts) -> Result<Vec<String>> {
    use sea_orm::{ConnectionTrait, DatabaseBackend, Statement};

    let industry_id: Option<i32> = if let Some(code) = &opts.industry {
        let ind = industries::Entity::find()
            .filter(industries::Column::Code.eq(code.clone()))
            .one(db)
            .await?
            .ok_or_else(|| anyhow!("industry not found: code={code}"))?;
        Some(ind.id)
    } else {
        None
    };

    let base_sql = r#"
        SELECT DISTINCT c.code
        FROM companies c
        JOIN company_analyses ca
          ON ca.company_id = c.id
         AND ca.analysis_type = 'vm02'
         AND ca.status = 'completed'
        WHERE c.state = 'active'
          AND (c.segment IS NULL OR c.segment != 'その他')
    "#;
    let stmt = if let Some(id) = industry_id {
        Statement::from_sql_and_values(
            DatabaseBackend::Postgres,
            format!("{base_sql} AND c.industry_id = $1 ORDER BY c.code"),
            [id.into()],
        )
    } else {
        Statement::from_string(DatabaseBackend::Postgres, format!("{base_sql} ORDER BY c.code"))
    };

    let rows = db.query_all(stmt).await?;
    let mut out = Vec::new();
    for row in rows {
        let code: Option<String> = row.try_get("", "code")?;
        if let Some(code) = code.filter(|s| !s.is_empty()) {
            out.push(code);
            if let Some(n) = opts.limit {
                if out.len() >= n {
                    break;
                }
            }
        }
    }
    Ok(out)
}
```

- [ ] **Step 2: Add `run_batch` (sequential — pure DB, fast) and call it from `run`**

```rust
async fn run_batch(db: &DatabaseConnection, opts: &Opts) -> Result<()> {
    let tickers = collect_targets(db, opts).await?;
    let total = tickers.len();
    eprintln!("[batch] target tickers: {total}");
    if opts.dry_run {
        for t in &tickers {
            if let Some(company) = companies::Entity::find()
                .filter(companies::Column::Code.eq(t.clone()))
                .one(db)
                .await?
            {
                let _ = process_one(db, &company, opts).await?;
            }
        }
        eprintln!("[batch] dry-run: {total} tickers");
        return Ok(());
    }

    let (mut updated, mut patched, mut skipped, mut errored) = (0usize, 0usize, 0usize, 0usize);
    for (n, t) in tickers.iter().enumerate() {
        let company = match companies::Entity::find()
            .filter(companies::Column::Code.eq(t.clone()))
            .one(db)
            .await?
        {
            Some(c) => c,
            None => {
                errored += 1;
                continue;
            }
        };
        match process_one(db, &company, opts).await {
            Ok(o) => {
                if o.skipped {
                    skipped += 1;
                } else {
                    if o.updated_vm02 {
                        updated += 1;
                    }
                    if o.patched_vm00 {
                        patched += 1;
                    }
                }
            }
            Err(e) => {
                errored += 1;
                eprintln!("[{}/{total}] {t} failed: {e}", n + 1);
            }
        }
        if (n + 1) % 200 == 0 {
            eprintln!("[batch] {}/{total} processed", n + 1);
        }
    }
    println!(
        "[batch] done: total={total} vm02_updated={updated} vm00_patched={patched} skipped={skipped} errored={errored}"
    );
    Ok(())
}
```

Update `run` batch branch:

```rust
    if opts.is_batch() {
        return run_batch(db, &opts).await;
    }
```

- [ ] **Step 3: Verify compile + tests**

Run: `cargo check --manifest-path apps/cli/Cargo.toml && cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: compiles; 15 tests pass.

- [ ] **Step 4: Verify batch dry-run on a small slice, then a real `--limit` run**

```bash
set -a; source apps/api/.env; set +a
cargo run --manifest-path apps/cli/Cargo.toml --bin cli --quiet -- vm02-refresh --all --limit 5 --dry-run
cargo run --manifest-path apps/cli/Cargo.toml --bin cli --quiet -- vm02-refresh --all --limit 5
```
Expected: dry-run prints 5 score lines; real run prints `[batch] done: total=5 vm02_updated=… vm00_patched=… skipped=… errored=0`.

- [ ] **Step 5: Commit**

```bash
git add apps/cli/src/commands/vm02_refresh.rs
git commit -m "vm02-refresh: バッチ実行 (--all/--industry/--limit) を実装"
```

---

### Task 9: Polish — fmt, clippy, full test run, screening sanity check

**Files:**
- Modify: `apps/cli/src/commands/vm02_refresh.rs` (only if clippy/fmt require)

- [ ] **Step 1: Format**

Run: `cargo fmt --manifest-path apps/cli/Cargo.toml`
Expected: no diff or trivial formatting.

- [ ] **Step 2: Clippy (fix any warnings in the new file)**

Run: `cargo clippy --manifest-path apps/cli/Cargo.toml -- -D warnings 2>&1 | grep vm02_refresh || echo "clean"`
Expected: `clean`, or fix reported issues (e.g. unused imports `Utc`, redundant clones).

- [ ] **Step 3: Full unit test run**

Run: `cargo test --manifest-path apps/cli/Cargo.toml vm02_refresh`
Expected: PASS (15 tests).

- [ ] **Step 4: Screening sanity — a refreshed vm02 changes the screening average**

After a real run on a few tickers (Task 7/8), confirm screening reads the new `module_score` (read-only):

```bash
psql "$DATABASE_URL" -c "select c.code, ca.module_score, ca.provider, ca.updated_at from company_analyses ca join companies c on c.id=ca.company_id where ca.analysis_type='vm02' and ca.provider='arithmetic' order by ca.updated_at desc limit 5;"
```
Expected: rows with `provider=arithmetic` and recent `updated_at`. `apps/user-console/src/server/screening.ts` reads `module_score` per `analysis_type`, so these are now reflected in the screening average and `vm02` threshold filter.

- [ ] **Step 5: Final commit**

```bash
git add apps/cli/src/commands/vm02_refresh.rs
git commit -m "vm02-refresh: fmt/clippy 整理"
```

- [ ] **Step 6: Hand off to codex review** (per `.claude/CLAUDE.md`: 実装後は codex にレビューを依頼)

---

## Self-Review

**1. Spec coverage** (against the agreed design):
- 算術倍率 (PER/PBR/EV-EBITDA/FCF利回り/配当利回り) → Task 2 ✓
- ルーブリック採点 + 欠損上限 (peer→7, CFO→6) + 判定不能 fail-closed → Task 3 ✓
- vm00 total 再計算 (value×0.5+credit×0.35+market×0.15) → Task 4 ✓
- DB 入力 (最新株価 / 直近通期財務 / peer median / YoY) → Task 5 ✓
- vm02 行更新 (module_score 列 → screening) + vm00 patch (scorecard/detail → radar) → Tasks 6–7 ✓
- `price_date` 鮮度マーカー保存 → Tasks 6 (valuation_simple/calculations) + patch_vm00 (detail) ✓
- `final_action` を動かさない / `band_crossed` フラグのみ → Task 6 (`write_vm02`) ✓
- CLI `--ticker/--all/--industry/--limit/--date/--tier1-only/--dry-run` → Tasks 1, 8 ✓
- LLM・build-pack 不使用 → 全タスク DB+算術のみ ✓
- **Deviation documented:** TTM → 直近通期 (no TTM helper exists; precedent = `calc_valuations.rs` quarter=4). Noted in Architecture.

**2. Placeholder scan:** The Task 5 `peer_median_per_value` placeholder is explicitly removed/replaced in Task 5 Step 4 and Task 7 Step 2. No TBD/TODO remain in shipped code.

**3. Type consistency:** `Vm02Inputs` (Task 2) ← `gather` (Task 5); `Vm02Multiples` (Task 2) ← `compute_multiples` ← `score_vm02` (Task 3); `Vm02Result` fields (`score: Option<i32>`, `confidence: i32`, `verdict`/`verdict_label`: `&'static str`, `n_cheap`, `caps_applied`) consistent across Tasks 3, 6, 7; `Vm00Components`/`Vm00Totals`/`recompute_vm00(f64, &Vm00Components) -> Option<Vm00Totals>` consistent across Tasks 4, 6. `Gathered.peer_median: Option<f64>` added in Task 5 Step 4 and consumed in Task 7. CLI module name `vm02_refresh` ↔ command `vm02-refresh` consistent (Task 1).

---

## Open follow-ups (out of scope for this plan)

- **Part B:** `apps/user-console` — render ⓪ scorecard from `output_json.scorecard`/`scores.detail` and strip the markdown ⓪ block, surfacing `price_date`. Separate plan.
- **Concurrency:** batch is sequential. If weekly全社 is too slow, add the `Semaphore`+`tokio::spawn` pattern from `vm_standard_all.rs:run_batch`. YAGNI until measured.
- **Cadence wiring:** scheduling the weekly `--all` run (cron/Cloud Run Job) is separate ops work.
