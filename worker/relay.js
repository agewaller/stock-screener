/**
 * Cloudflare Worker — legacy Anthropic proxy relay
 *
 * 役割: 旧経路 cares-relay.agewaller.workers.dev で受けたリクエストを
 * service binding 経由で stock-screener Worker に丸投げする。
 *
 * 現在の本番経路:
 *   ブラウザは https://ai.cares.advisers.jp を直接呼ぶ。
 *   この relay は rollback / diagnostics 用に残すだけで、
 *   ai.cares.advisers.jp の Custom Domain は持たない。
 *
 * 設定: wrangler.relay.jsonc で env.PROXY を stock-screener に
 * binding。stock-screener の env.ANTHROPIC_API_KEY /
 * ADMIN_WRITE_TOKEN / RESEARCH_KV をそのまま使う。
 */
export default {
  async fetch(request, env) {
    if (!env.PROXY) {
      return new Response(JSON.stringify({
        error: 'service binding PROXY not configured',
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    // Forward the original request through the service binding.
    // env.PROXY.fetch(request) calls stock-screener's fetch handler
    // directly without going through the Internet, bypassing Access.
    return env.PROXY.fetch(request);
  },
};
