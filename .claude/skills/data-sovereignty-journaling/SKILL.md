---
name: data-sovereignty-journaling
description: >-
  Design policy for journaling + AI + management systems (health, money,
  time, work). Use when building or reviewing any feature that stores user
  data, generates AI output from accumulated data, manages provider API
  keys, or gates admin access. Enforces data sovereignty (store-all,
  per-item edit/delete, audience-tuned summaries), zero key leakage
  (server-side keys only), never locking out the owner admin, and the
  "no fallback-chain complexity" rule.
---

# Data Sovereignty — Journaling / AI / Management Systems

The product essence: **users converse, accumulate data, and that
accumulated data is used to return more optimal / latest / *something new*
results that shift the user's cognition and prompt a concrete next
action.** Applies to health, money, time, work — any journaling/AI/mgmt
system in this org.

## 1. Data sovereignty (user-data lifecycle)

- **Store everything**: calendar, metrics/health, photos, conversation
  logs — persist to the user-scoped backend (Firestore by uid). Local
  storage is a cache, never the source of truth.
- **Per-item edit & delete**: every data type must have UI to view,
  edit, and delete a single record. "Wipe-all only" is not acceptable.
- **Audience-tuned summaries** from the accumulated data:
  - **Doctor**: chart-style, fact-based, course + questions structured.
  - **SNS**: identifying info removed, shareable positive tone.
  - **Close family**: plain language, status + support needed.
- **Cognition-shifting output**: not record repetition — ground answers
  in the accumulated data, surface the latest/optimal/novel angle, and
  give exactly one concrete next action.
- **Export / portability**: the user can export all their data anytime.
  No vendor lock-in.

## 2. Zero key leakage (secrets)

- Provider API keys (Anthropic/OpenAI/Google/…) live **only** server-side
  (Cloudflare Worker KV / env secret). Never sync keys to the browser,
  localStorage, or the user database.
- AI calls always go browser → relay → proxy Worker, which injects the
  server-side key. The browser never sends or receives a key.
- Single AI endpoint fixed in code (no localStorage override). A
  returning user with stale local state must behave exactly like a fresh
  visitor.
- No per-user key assumption. One shared server-side key; protect it
  with an Origin allowlist.

## 3. Never lock out the owner admin

- Admin check uses the **live auth identity, normalized (lowercase/
  trim)**. Never depend on stale store/localStorage. The owner email is
  always admin.
- Admin write endpoints accept **either** a verified identity token
  (email == owner) **or** a break-glass shared token. Either path alone
  must work, so a failure in one never locks the owner out.
- Status endpoints return only configured true/false — **never the key
  value**.

## 4. No complexity / regression (hard-won lesson)

Multi-endpoint fallback chains, auto proxy-switching, and key sync added
while trying to "fix the first broken users" repeatedly broke existing
users and the admin. Keep a **single correct path**; do not add fallback
chains. Endpoint availability is an infra/deploy concern, not something
to paper over client-side.

## Review checklist

- [ ] New user data type → persisted by uid + has per-item edit/delete?
- [ ] Summarization covers doctor / SNS / family audiences?
- [ ] No API key in browser/localStorage/user DB; AI via proxy only?
- [ ] AI endpoint fixed in code, no localStorage override path?
- [ ] Admin check normalized & owner always admin; dual admin auth?
- [ ] Key-status never returns key values?
- [ ] No new fallback chain / client-side endpoint juggling?
- [ ] Export path exists for the new data?
