/**
 * Analytics loader — privacy-first pageview tracking for 健康日記.
 *
 * Supports Cloudflare Web Analytics (default, cookieless, 個人情報保護法
 * と GDPR 適合) and Plausible as fallback. Designed to be a single-file
 * include that every HTML page pulls in via `<script defer src="/js/analytics.js"></script>`.
 *
 * To enable: replace the placeholder token below with the real CF
 * Web Analytics token (one.dash.cloudflare.com → Web Analytics →
 * Add a site → cares.advisers.jp). Until then, this file is a
 * no-op — it will not inject any beacon or send any request.
 *
 * Privacy guarantees:
 * - No cookies, no localStorage reads, no fingerprinting
 * - CF Web Analytics aggregates at edge and does not store per-user
 *   identifiers. This keeps Pマーク / JIS Q 15001 準拠 trivial.
 * - Respects Do-Not-Track (navigator.doNotTrack === '1') — no-op
 *   when the user has DNT enabled.
 */
(function () {
  'use strict';

  // Respect DNT — health app users in particular are privacy-sensitive.
  try {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  } catch (_) { /* ignore */ }

  // --- Cloudflare Web Analytics ------------------------------------
  // Replace REPLACE_ME_CF_TOKEN with the real token string from the
  // CF dashboard (looks like 'a1b2c3d4e5f6...', 32-64 chars).
  var CF_TOKEN = 'REPLACE_ME_CF_TOKEN';
  if (CF_TOKEN && CF_TOKEN.indexOf('REPLACE_ME') !== 0) {
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_TOKEN }));
    (document.head || document.body || document.documentElement).appendChild(s);
  }

  // --- Plausible (optional alternative) ----------------------------
  // Uncomment + fill in if you self-host or subscribe to Plausible.
  // var PLAUSIBLE_DOMAIN = '';  // e.g. 'cares.advisers.jp'
  // if (PLAUSIBLE_DOMAIN) {
  //   var p = document.createElement('script');
  //   p.defer = true;
  //   p.src = 'https://plausible.io/js/script.js';
  //   p.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
  //   (document.head || document.body).appendChild(p);
  // }
})();
