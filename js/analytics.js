/**
 * Analytics loader — privacy-first pageview + conversion tracking for 健康日記.
 *
 * Supports Cloudflare Web Analytics (default, cookieless, 個人情報保護法
 * と GDPR 適合) and Plausible as fallback. Designed to be a single-file
 * include that every HTML page pulls in via `<script defer src="/js/analytics.js"></script>`.
 *
 * To enable: replace the placeholder token below with the real CF
 * Web Analytics token (one.dash.cloudflare.com → Web Analytics →
 * Add a site → cares.advisers.jp). Until then, this file is a
 * no-op for external beacons, but local event tracking always works.
 *
 * Privacy guarantees:
 * - No cookies, no fingerprinting
 * - CF Web Analytics aggregates at edge and does not store per-user
 *   identifiers. This keeps Pマーク / JIS Q 15001 準拠 trivial.
 * - Respects Do-Not-Track (navigator.doNotTrack === '1') — no-op
 *   when the user has DNT enabled.
 * - Custom events written to localStorage are anonymous (no user ID).
 */
(function () {
  'use strict';

  var DNT = false;
  try {
    DNT = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  } catch (_) {}

  // --- Cloudflare Web Analytics ------------------------------------
  // Replace REPLACE_ME_CF_TOKEN with the real token string from the
  // CF dashboard (looks like 'a1b2c3d4e5f6...', 32-64 chars).
  var CF_TOKEN = 'REPLACE_ME_CF_TOKEN';
  if (!DNT && CF_TOKEN && CF_TOKEN.indexOf('REPLACE_ME') !== 0) {
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

  // --- Conversion funnel tracking ----------------------------------
  // window.trackEvent(name, props?) stores anonymous conversion events
  // to localStorage (ring buffer, max 500). The admin dashboard reads
  // 'cc_events' to render the funnel. No user identifiers are stored.
  //
  // Standard event names (kept stable — do not rename):
  //   guest_sample_submit   — "サンプルを試す" clicked
  //   guest_sample_report   — "医師提出レポートを見る" clicked
  //   guest_register_click  — "無料で登録する" clicked
  //   lp_cta_click          — LP sticky CTA / hero CTA clicked
  //   lp_share              — social share button clicked on LP
  //   signup_complete       — new account created
  //   first_real_entry      — first real (non-sample) entry saved

  var MAX_EVENTS = 500;

  window.trackEvent = function (name, props) {
    if (DNT) return;
    try {
      var events = [];
      try { events = JSON.parse(localStorage.getItem('cc_events') || '[]'); } catch (_) {}
      events.push({
        n: String(name),
        t: Date.now(),
        p: location.pathname,
        d: props || {}
      });
      // Keep only the most recent MAX_EVENTS
      if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
      localStorage.setItem('cc_events', JSON.stringify(events));
    } catch (_) {}

    // Forward to Cloudflare Zaraz custom event if available
    try {
      if (window.zaraz && typeof window.zaraz.track === 'function') {
        window.zaraz.track(name, props || {});
      }
    } catch (_) {}
  };

  // Auto-track pageview with page title + path
  window.trackEvent('pageview', { title: document.title });

})();
