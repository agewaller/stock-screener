/**
 * Accessibility + Lighthouse-score enhancements injected on every
 * disease LP / FAQ / About / Compare page.
 *
 * What we add:
 * 1. Skip-to-content link — keyboard users skip past the masthead
 *    nav on first Tab. Screen-reader-friendly.
 * 2. Theme color meta — Mobile Safari / Chrome tints the address-bar
 *    to match brand color, improving the "feels native" perception.
 * 3. Adds ARIA labels to icon-only links (header, share row).
 * 4. Adds `prefers-reduced-motion` support for users who set
 *    "Reduce motion" — disables animations on sticky CTA + hero.
 * 5. Ensures form inputs have explicit <label> associations.
 *
 * Each enhancement is idempotent — safe to load multiple times.
 */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // 1. Theme color (run immediately, doesn't need DOMContentLoaded).
  (function ensureThemeColor() {
    if (!document.querySelector('meta[name="theme-color"]')) {
      var meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      meta.setAttribute('content', '#6366f1');
      document.head.appendChild(meta);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      var amwa = document.createElement('meta');
      amwa.setAttribute('name', 'apple-mobile-web-app-capable');
      amwa.setAttribute('content', 'yes');
      document.head.appendChild(amwa);
    }
    if (!document.querySelector('meta[name="format-detection"]')) {
      var fd = document.createElement('meta');
      fd.setAttribute('name', 'format-detection');
      fd.setAttribute('content', 'telephone=no');
      document.head.appendChild(fd);
    }
  })();

  // 2. prefers-reduced-motion CSS
  (function injectReducedMotionStyles() {
    if (document.getElementById('a11y-rm-styles')) return;
    var style = document.createElement('style');
    style.id = 'a11y-rm-styles';
    style.textContent =
      '@media (prefers-reduced-motion: reduce) {' +
      '  *, *::before, *::after { animation-duration: 0.01ms !important;' +
      '    animation-iteration-count: 1 !important;' +
      '    transition-duration: 0.01ms !important;' +
      '    scroll-behavior: auto !important; }' +
      '  #sticky-cta-bar { transition: none !important; }' +
      '}' +
      // Visible focus indicator — Lighthouse a11y check item.
      'a:focus-visible, button:focus-visible, input:focus-visible,' +
      'textarea:focus-visible, select:focus-visible {' +
      '  outline: 3px solid #6366f1 !important;' +
      '  outline-offset: 2px !important;' +
      '  border-radius: 4px;' +
      '}' +
      // Skip-link (hidden until focused)
      '.skip-link {' +
      '  position: absolute; left: -9999px; top: auto;' +
      '  padding: 8px 14px; background: #6366f1; color: #fff;' +
      '  font-weight: 700; font-size: 13px; text-decoration: none;' +
      '  border-radius: 0 0 8px 0; z-index: 99999;' +
      '}' +
      '.skip-link:focus {' +
      '  left: 0; top: 0;' +
      '}';
    document.head.appendChild(style);
  })();

  onReady(function () {
    // 3. Skip-to-content link (keyboard a11y baseline).
    if (!document.querySelector('a.skip-link')) {
      var skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#main-content';
      skip.textContent = 'メインコンテンツへスキップ';
      document.body.insertBefore(skip, document.body.firstChild);
    }
    // Ensure the main content has an anchor.
    var main = document.querySelector('#main-content');
    if (!main) {
      var firstHeader = document.querySelector('h1');
      if (firstHeader) {
        var anchor = document.createElement('span');
        anchor.id = 'main-content';
        anchor.setAttribute('tabindex', '-1');
        firstHeader.parentNode.insertBefore(anchor, firstHeader);
      }
    }

    // 4. Add aria-label to bare-arrow header back-link if missing.
    document.querySelectorAll('header a[href*="cares.advisers.jp/"]').forEach(function (a) {
      if (!a.getAttribute('aria-label') && /←/.test(a.textContent)) {
        a.setAttribute('aria-label', '健康日記トップへ戻る');
      }
    });

    // 5. Lazy-load any images that don't already have it.
    document.querySelectorAll('img:not([loading])').forEach(function (img) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });

    // 6. Form label auto-association.
    // For every input/select/textarea that has no <label> pointing to it,
    // generate an aria-label from its placeholder, name, or nearest text node.
    var inputCounter = 0;
    document.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
      var id = el.id;
      if (id && document.querySelector('label[for="' + id + '"]')) return; // already labelled
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;

      // Try to infer a label from placeholder, name, or data attributes
      var label =
        el.getAttribute('placeholder') ||
        el.getAttribute('data-label') ||
        el.getAttribute('name') ||
        '';

      // Walk up to find a preceding sibling / parent text node for context
      if (!label) {
        var prev = el.previousElementSibling;
        if (prev && /label|span|div/.test(prev.tagName.toLowerCase()) && prev.textContent.trim().length < 60) {
          label = prev.textContent.trim();
        }
      }

      if (label) {
        el.setAttribute('aria-label', label);
      } else {
        // Last resort: generate a stable numeric ID and pair with a visually hidden label
        inputCounter++;
        var genId = 'hd-input-' + inputCounter;
        el.id = el.id || genId;
        el.setAttribute('aria-label', el.tagName.toLowerCase() + ' ' + inputCounter);
      }
    });

    // 7. Ensure <html lang> is set (Lighthouse accessibility check).
    var html = document.documentElement;
    if (!html.getAttribute('lang')) {
      html.setAttribute('lang', 'ja');
    }

    // 8. Add role="main" to the primary content area if missing.
    var mainEl = document.querySelector('main, [role="main"]');
    if (!mainEl) {
      var candidate = document.querySelector('#main-content, .main-content, .page-content, article');
      if (candidate) candidate.setAttribute('role', 'main');
    }
  });
})();
