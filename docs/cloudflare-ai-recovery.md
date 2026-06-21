# Cloudflare AI recovery runbook

対象: `agewaller/stock-screener` の健康日記 AI 分析経路。

## Current production shape

- Frontend: `https://cares.advisers.jp` on GitHub Pages.
- AI API: `https://ai.cares.advisers.jp` as a Worker Custom Domain.
- Worker: `stock-screener` (`worker/anthropic-proxy.js`).
- KV namespace: `stock-screener-research`, bound as `RESEARCH_KV`.
- Legacy relay: `cares-relay.agewaller.workers.dev`, rollback/diagnostics only.

The browser must not call `stock-screener.agewaller.workers.dev` directly because it may be protected by Cloudflare Access. The browser must not call `cares-relay.agewaller.workers.dev` in production because a broken relay/service-binding deployment can return Worker error `1042`.

## Required Cloudflare settings

In `stock-screener` Worker:

- Custom Domain: `ai.cares.advisers.jp`
- Vars:
  - `ALLOWED_ORIGINS=https://cares.advisers.jp`
  - `FIREBASE_PROJECT_ID=care-14c31`
- Secrets:
  - `ANTHROPIC_API_KEY`
  - `ADMIN_WRITE_TOKEN`
- KV binding:
  - binding name: `RESEARCH_KV`
  - namespace title: `stock-screener-research`

`deploy-worker.yml` creates or resolves `stock-screener-research` and injects its namespace ID into `wrangler.jsonc` before `wrangler deploy`.

## GitHub Actions deployment

Run **Deploy Cloudflare Workers** manually after changing Worker config or code.

`CLOUDFLARE_API_TOKEN` needs:

- Account -> Workers Scripts -> Edit
- Account -> Workers KV Storage -> Edit
- Zone -> Zone -> Read for `advisers.jp`
- Zone -> DNS -> Edit for `advisers.jp`
- Zone -> Workers Routes -> Edit for `advisers.jp`

If deployment fails while creating the Custom Domain, fix token zone permissions first.

## Smoke tests

Expected:

```bash
curl -i -X OPTIONS https://ai.cares.advisers.jp/v1/messages \
  -H "Origin: https://cares.advisers.jp" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,anthropic-version"
```

Should return `200` or `204` with `Access-Control-Allow-Origin: https://cares.advisers.jp`.

```bash
curl -i https://stock-screener.agewaller.workers.dev/
```

May redirect to Cloudflare Access. That is acceptable because production traffic does not use this URL.

## Admin key recovery

If `agewaller@gmail.com` can open the admin screen but API key save fails:

1. Confirm `https://ai.cares.advisers.jp/admin/key-status` is reachable from the browser.
2. Confirm `FIREBASE_PROJECT_ID=care-14c31` is set on the Worker.
3. Use the break-glass input in the admin API key tab with the `ADMIN_WRITE_TOKEN` value.
4. Save at least `ANTHROPIC_API_KEY`; it will be stored as `admin:key:anthropic` in `RESEARCH_KV`.

The Worker never returns stored key values to the browser. `/admin/key-status` only returns boolean status.
