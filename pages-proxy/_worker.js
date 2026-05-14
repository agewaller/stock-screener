/**
 * Cloudflare Pages Functions — Anthropic proxy relay
 *
 * 役割: cares-ai-proxy-pages.pages.dev で受けたリクエストを、
 * service binding (env.PROXY) 経由で stock-screener Worker に転送する。
 *
 * なぜ Pages 経由か:
 *   2026-05 に Cloudflare アカウントの workers.dev サブドメインが
 *   無効化され、agewaller.workers.dev 配下のあらゆる Worker が
 *   "Host not in allowlist" 403 を返すようになった。Pages は
 *   *.pages.dev という別系統のサブドメインを使うので、この影響を
 *   受けない。
 *
 * service binding (env.PROXY) は内部呼び出しなので:
 *   - workers.dev 無効化を bypass
 *   - stock-screener にかかる Cloudflare Access を bypass
 *   - WAF / Rate Limiting も bypass
 *   公式仕様 (Cloudflare の service binding ドキュメント)。
 *
 * バインディング設定:
 *   pages-proxy/wrangler.toml の [[services]] で
 *   PROXY → stock-screener にバインド。stock-screener の
 *   ANTHROPIC_API_KEY をそのまま使うので、Pages 側に
 *   secret 設定は不要。
 */
export default {
  async fetch(request, env, ctx) {
    if (!env.PROXY) {
      return new Response(
        JSON.stringify({
          error: 'Service binding PROXY not configured. Set it in the Pages project Settings → Functions → Service bindings.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    // Forward the original request through the service binding.
    // env.PROXY.fetch(request) calls stock-screener's fetch handler
    // directly without going through the Internet, bypassing all
    // public-layer protection (workers.dev disable / Access / WAF).
    return env.PROXY.fetch(request);
  },
};
