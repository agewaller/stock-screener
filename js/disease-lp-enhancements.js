/**
 * Disease-LP client enhancements — single-file include used by all
 * 10 condition-specific landing pages (/me-cfs.html, /long-covid.html,
 * /fibromyalgia.html, /pots.html, /mcas.html, /eds.html, /ibs.html,
 * /hashimoto.html, /depression.html, /insomnia.html).
 *
 * Responsibilities:
 * 1. Inject a mobile-first sticky CTA bar that appears once the user
 *    has scrolled past the first viewport. Drives signup on pages
 *    where the hero CTA has scrolled off-screen.
 * 2. Inject Breadcrumb structured data so Google shows the page
 *    hierarchy (ホーム → 疾患ガイド → 〇〇) in SERP.
 *
 * Each LP sets two data-attributes on <body>:
 *   data-disease-label="ME/CFS（筋痛性脳脊髄炎）"  // breadcrumb leaf
 *   data-app-param="mecfs"                         // ?d= query param
 *
 * Missing attributes fall back to sensible defaults so the script
 * never throws on a page that hasn't been migrated yet.
 */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var body = document.body;
    if (!body) return;
    var label = body.getAttribute('data-disease-label') || '疾患ガイド';
    var appParam = body.getAttribute('data-app-param') || '';
    var pageUrl = window.location.href.split('#')[0].split('?')[0];

    // --- Breadcrumb schema (JSON-LD) -------------------------------
    try {
      var bc = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://cares.advisers.jp/' },
          { '@type': 'ListItem', position: 2, name: '疾患ガイド', item: 'https://cares.advisers.jp/#seo-landing' },
          { '@type': 'ListItem', position: 3, name: label, item: pageUrl }
        ]
      };
      var bcScript = document.createElement('script');
      bcScript.type = 'application/ld+json';
      bcScript.textContent = JSON.stringify(bc);
      document.head.appendChild(bcScript);
    } catch (_) { /* ignore */ }

    // --- Sticky CTA bar --------------------------------------------
    // Hidden by default; fades in once the user scrolls > 50% of
    // the first screen so we don't double up with the hero CTA.
    var ctaHref = 'https://cares.advisers.jp/' + (appParam ? ('?d=' + encodeURIComponent(appParam)) : '');

    var bar = document.createElement('div');
    bar.id = 'sticky-cta-bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML =
      '<a href="' + ctaHref + '" style="display:flex;align-items:center;justify-content:center;gap:8px;'
        + 'padding:14px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;'
        + 'border-radius:28px;text-decoration:none;font-weight:700;font-size:14px;'
        + 'box-shadow:0 6px 24px rgba(99,102,241,0.4);white-space:nowrap">'
        + '<span>📝 無料で記録を始める</span>'
        + '<span style="font-size:12px;opacity:0.85">→</span>'
      + '</a>';
    var style = document.createElement('style');
    style.textContent =
      '#sticky-cta-bar{position:fixed;left:50%;transform:translateX(-50%) translateY(120%);'
        + 'bottom:14px;z-index:9999;opacity:0;transition:opacity 0.3s,transform 0.3s;'
        + 'padding:0 12px;pointer-events:none}'
      + '#sticky-cta-bar.visible{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}'
      + '@media print{#sticky-cta-bar{display:none !important}}';
    document.head.appendChild(style);
    document.body.appendChild(bar);

    var lastShown = false;
    var onScroll = function () {
      var scrolled = window.scrollY || document.documentElement.scrollTop || 0;
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      // Show once user is >50% into first screen.
      // Hide in the last 200px so it doesn't overlap the footer CTA.
      var docHeight = document.documentElement.scrollHeight;
      var nearBottom = (scrolled + vh) > (docHeight - 260);
      var show = scrolled > vh * 0.5 && !nearBottom;
      if (show !== lastShown) {
        bar.classList.toggle('visible', show);
        bar.setAttribute('aria-hidden', show ? 'false' : 'true');
        lastShown = show;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  });
})();
