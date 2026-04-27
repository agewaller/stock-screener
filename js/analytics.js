/**
 * Analytics loader — privacy-first pageview tracking for 健康日記.
 *
 * Supports Cloudflare Web Analytics (default, cookieless, 個人情報保護法
 * と GDPR 適合) and Plausible as fallback. Designed to be a single-file
 * include that every HTML page pulls in via `<script defer src="/js/analytics.js"></script>`.
 *
 * Token setup (admin only):
 *   1. 管理パネル → API キー → Cloudflare Analytics Token を入力して保存
 *   2. 保存後、次回ページ読み込みから計測が開始されます
 *   Or: replace CF_TOKEN_FALLBACK with the token from
 *   one.dash.cloudflare.com → Web Analytics → Add a site → cares.advisers.jp
 *
 * Privacy guarantees:
 * - No cookies, no localStorage reads for tracking, no fingerprinting
 * - CF Web Analytics aggregates at edge and does not store per-user identifiers
 * - Respects Do-Not-Track (navigator.doNotTrack === '1') — no-op when DNT enabled
 * - Analytics only fire after explicit consent when cookie consent is active
 */
(function () {
  'use strict';

  var LS_KEY = 'cf_analytics_token';
  var CF_TOKEN_FALLBACK = '';
  var _loaded = false;

  function loadBeacon() {
    if (_loaded) return;

    // Respect DNT — health app users are privacy-sensitive.
    try {
      if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    } catch (_) { /* ignore */ }

    // Respect analytics consent when cookie-consent module is active.
    try {
      var consent = localStorage.getItem('health_diary_consent');
      if (consent) {
        var c = JSON.parse(consent);
        if (c.analytics === false) return;
      }
    } catch (_) { /* no consent state yet — allow */ }

    // --- Cloudflare Web Analytics ------------------------------------
    var cfToken = '';
    try { cfToken = localStorage.getItem(LS_KEY) || ''; } catch (_) {}
    cfToken = cfToken || CF_TOKEN_FALLBACK;

    if (cfToken && cfToken.length >= 10) {
      _loaded = true;
      var s = document.createElement('script');
      s.defer = true;
      s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      s.setAttribute('data-cf-beacon', JSON.stringify({ token: cfToken }));
      (document.head || document.body || document.documentElement).appendChild(s);
    }

    // --- Plausible (optional alternative) ----------------------------
    // Uncomment + fill in if you self-host or subscribe to Plausible.
    // var PLAUSIBLE_DOMAIN = '';
    // try { PLAUSIBLE_DOMAIN = PLAUSIBLE_DOMAIN || localStorage.getItem('plausible_domain') || ''; } catch(_) {}
    // if (PLAUSIBLE_DOMAIN) {
    //   _loaded = true;
    //   var p = document.createElement('script');
    //   p.defer = true;
    //   p.src = 'https://plausible.io/js/script.js';
    //   p.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
    //   (document.head || document.body).appendChild(p);
    // }
  }

  loadBeacon();

  // Called by cookie-consent.js after user accepts analytics
  window._hdReloadAnalytics = loadBeacon;
})();
