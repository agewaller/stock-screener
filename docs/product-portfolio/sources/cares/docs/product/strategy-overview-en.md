# cares — Product Strategy Overview (English)

> 2026-06 ｜ English summary of [strategy-overview.md](strategy-overview.md). Market figures are as of research date; verify with sources.

## 0. Executive summary
**cares = a dignity‑centered health diary × AI companion for people living with chronic illness** (ME/CFS, Long COVID, fibromyalgia, POTS, etc.). It connects the full loop: **record → AI translates it for "this person, this day" → turn it into doctor reports / benefit‑application drafts → keep going** — all on a **data‑sovereignty** foundation (no ads, field encryption, no PII in the browser, server‑only AI keys).

The market is **hot**: consumer virtual medical assistants are projected **$1.86B (2025) → $8.85B (2030), 36.6% CAGR**; healthcare AI overall reaches **~$505B by 2033 (~39% CAGR)**. In Jan 2026 **OpenAI launched "ChatGPT Health"** (230M people ask health questions weekly), and Big Tech is racing to be the "front door" to consumer health.

**Where cares wins:** (1) data sovereignty / privacy, (2) depth for chronic illness + a "don't treat me as a patient" dignity design, (3) reducing paperwork burden (doctor PDFs, benefit drafts), (4) Japanese language / care‑system localization, (5) **B2B2C via clinicians**. As general AI takes the broad, shallow entry point, cares differentiates as a **narrow, deep, life‑embedded specialized OS**.

## 1. Concept
Remove the financial and psychological barriers to "writing," and help people with chronic illness **maximize their Physical Capital** with a privacy‑preserving health AI companion. Existing trackers make logging feel like an obligation; proud patients resist being treated "as a sick person." cares keeps clinical data as a base while inviting natural **life‑logging**.

## 2. Value
- **Patients:** log without obligation; an in‑the‑moment empathetic note; **a doctor‑ready PDF**; **a draft for benefit/subsidy applications**; export & restore their own data (sovereignty).
- **Clinicians/clinics:** organized history before the visit → **shorter, higher‑value consultations** (the reason to recommend it).
- **Society:** less paperwork burden → better access to support/benefits people are entitled to.

The essence: while others "measure/check," cares **translates records into meaning and into action across life and the welfare system** — and **does not sell privacy**.

## 3. Features
- **Implemented:** 8 record categories + photos + free notes; edit/delete/30‑day soft‑delete + restore; audit log. AI: daily note / deep reflection / doctor‑family‑SNS reports / PubMed research / **login‑free trial analysis**; monthly cost cap; **DB‑driven prompts** (per‑disease). Auth (Google + email/password). 2‑pass photo AI. Export JSON/CSV/FHIR/**doctor PDF**. Recent: one‑page quick entry, login persistence, readable AI output, **removed yen display**, photo gallery attach, AI‑comment history, emergency/resource pages, in‑app‑browser guidance, backdating, streaks, profile (encrypted meds/allergies), bulk import / JSON restore, life‑log tone, **benefit‑application draft (PDF)**.
- **Roadmap (unbuilt):** external integrations (Calendar/ICS, Plaud, Fitbit, Apple Health, SendGrid), auth extensions (anonymous/Magic Link/2FA/SSO), i18n (10 languages), voice dialogue + persona, and the **"Health‑Science OS" epic (#46‑61)**: safety‑constraint layer (#51), Physical Capital estimation + gap analysis (#47/#48), Health‑intervention Value engine (HAV, #49), Conventional‑wisdom Trust Score (TCS, #50), state‑adaptive prompts + outcome learning (#52/#53), correlation engine (#55), outcome‑hierarchy dashboard (#54), 7‑layer consciousness (#61), sensing expansion (CGM #57, EEG #58, food‑photo PFC #60, meds/supplements #59).

## 4. Target users
- **Primary:** people with ME/CFS, Long COVID, fibromyalgia, POTS, etc. — high price sensitivity, heavy paperwork/visit‑prep burden, Japanese speakers.
- **Secondary:** their clinicians/specialist clinics (the B2B2C contracting/recommending party), patient groups.
- **Future:** mental‑health conditions, lifestyle‑disease self‑management, prevention‑minded wellness (Health‑Science OS expansion).

## 5. Competitive landscape & positioning
- **Specialized apps:** **Visible** (ME/CFS & Long COVID pacing, HRV via camera, PEM) — cares goes beyond pacing to AI translation + doctor PDF + benefits, with Japanese/care‑system support. **Bearable** (multi‑metric symptom/mood tracking & correlations) — cares adds AI companionship + paperwork + sovereignty. **Ada Health** (symptom checker) — cares is continuous companionship, not a one‑off check.
- **Big Tech / general LLMs:** **ChatGPT Health (2026/1)**, Google (b.well), Apple Health + AI take the broad entry point. cares differentiates as a **narrow, deep OS optimized for the patient's life, Japan's welfare system, and safety/dignity** — hard for general AI to replicate (disease‑specific prompts, doctor/benefit form formats, PEM safety constraints, thorough data sovereignty). It can later **interoperate** (export/FHIR) rather than compete head‑on.
- **Japan:** **Welby** (PHR, device‑linked, doctor sharing, ePRO; lifestyle disease/cancer). cares is **chronic illness × AI companion × paperwork relief × dignity**, and is explicitly **not a medical device** (no diagnosis/treatment).

**Positioning:** *"Not as broad as general AI, not as cold as a tracker — a data‑sovereign health‑AI companion OS that walks alongside people with chronic illness and turns records into doctor, welfare, and daily action."*

## 6. Marketing / GTM ([ADR-0017])
- **B2B2C primary + freemium**: clinics/support orgs pay and provide to patients; individuals free–low cost.
- **Clinician‑led GTM as official strategy** (highest patient trust); polish the **doctor report** as the clinician's reason to recommend (visit efficiency).
- **Data secondary‑use excluded for now** (consistency with sovereignty).
- **Cost floor is legible**: AI variable cost capped at ¥1,000/user/month; free tier uses only light AI. **No yen shown to users**. Community spread gated on legal review of terms/privacy.
- Comply with medical advertising / fair‑trade rules; keep the non‑medical‑device framing.

## 7. Risks
- Big Tech generalization may look "good enough" → counter with specialized depth, welfare‑system fit, safety constraints, sovereignty.
- Thin revenue (price‑sensitive + no ads) → establish **B2B2C unit pricing** (per facility / per patient).
- Regulatory/legal (medical advertising, personal data) → terms/privacy readiness.
- Safety (dangerous AI advice: PEM worsening, self‑adjusting meds) → **implement the safety‑constraint layer early (#51)**.

## 8. Sources
See [strategy-overview.md](strategy-overview.md) §8 for market/competitor source links (Grand View Research, MarketsandMarkets, Bessemer, OpenAI, CNBC, Visible, Bearable, Ada, Welby).
