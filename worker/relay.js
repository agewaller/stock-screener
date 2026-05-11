/**
 * Cloudflare Worker — Anthropic proxy RELAY
 *
 * 役割: cares-relay.agewaller.workers.dev で受けたリクエストを
 * service binding 経由で stock-screener Worker に丸投げする。
 *
 * なぜこれが必要か:
 *   stock-screener.agewaller.workers.dev は Cloudflare Access
 *   (Zero Trust) で保護されており、ブラウザからの fetch がすべて
 *   認証画面にリダイレクトされて CORS で fail していた。
 *   service binding は public URL を経由しない内部呼び出しなので、
 *   Access / WAF / Rate Limiting といった public 層の制限を全て
 *   バイパスする (Cloudflare 公式ドキュメントの仕様)。
 *
 * 設定: wrangler.relay.jsonc で env.PROXY を stock-screener に
 * binding。stock-screener の env.ANTHROPIC_API_KEY をそのまま
 * 流用するので、新規シークレット設定は不要。
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
