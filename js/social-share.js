/**
 * Social share row — injected into all disease LPs at the bottom of
 * the hero section (or anywhere a `.social-share-target` exists).
 *
 * Includes X (Twitter), Facebook, LINE, Pinterest, Hatena, and a
 * Web Share API fallback (mobile native share sheet) for everything
 * else. Each link opens in a new tab and uses the page's actual URL
 * + title from <meta property="og:title">.
 *
 * Self-contained — no CSS class dependencies. Builds inline SVG
 * icons so it works on the static LPs that don't load app CSS.
 */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function metaContent(prop) {
    var m = document.querySelector('meta[property="' + prop + '"], meta[name="' + prop + '"]');
    return m ? m.getAttribute('content') || '' : '';
  }

  onReady(function () {
    var url = (metaContent('og:url') || window.location.href).split('#')[0];
    var title = metaContent('og:title') || document.title || '';
    var encU = encodeURIComponent(url);
    var encT = encodeURIComponent(title);
    var hashtag = encodeURIComponent('健康日記');

    var shares = [
      { id: 'x', label: 'X', color: '#000', href: 'https://x.com/intent/tweet?text=' + encT + '&url=' + encU + '&hashtags=' + hashtag },
      { id: 'fb', label: 'Facebook', color: '#1877f2', href: 'https://www.facebook.com/sharer/sharer.php?u=' + encU },
      { id: 'line', label: 'LINE', color: '#06c755', href: 'https://social-plugins.line.me/lineit/share?url=' + encU },
      { id: 'hatena', label: 'はてブ', color: '#00a4de', href: 'https://b.hatena.ne.jp/entry/s/' + url.replace(/^https?:\/\//, '') },
      { id: 'pinterest', label: 'Pinterest', color: '#e60023', href: 'https://pinterest.com/pin/create/button/?url=' + encU + '&description=' + encT }
    ];

    var box = document.createElement('div');
    box.id = 'social-share-row';
    box.style.cssText = 'margin:18px 0;padding:14px;background:#fafaff;border:1px solid #e2e8f0;border-radius:12px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:center';

    var label = document.createElement('div');
    label.textContent = '🤝 同じ症状で悩む方へシェア';
    label.style.cssText = 'flex:1 1 100%;text-align:center;font-size:12px;color:#475569;font-weight:600;margin-bottom:6px';
    box.appendChild(label);

    shares.forEach(function (s) {
      var a = document.createElement('a');
      a.href = s.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', s.label + 'でシェア');
      a.style.cssText =
        'display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;' +
        'background:#fff;border:1.5px solid ' + s.color + ';color:' + s.color + ';' +
        'font-size:12px;font-weight:700;text-decoration:none;transition:transform 0.1s';
      a.textContent = s.label;
      a.onmouseover = function () { a.style.transform = 'translateY(-1px)'; };
      a.onmouseout  = function () { a.style.transform = ''; };
      box.appendChild(a);
    });

    if (typeof navigator.share === 'function') {
      var btn = document.createElement('button');
      btn.textContent = '📤 その他';
      btn.style.cssText =
        'padding:8px 14px;border-radius:8px;background:#6366f1;color:#fff;border:none;' +
        'font-size:12px;font-weight:700;cursor:pointer';
      btn.onclick = function () {
        navigator.share({ title: title, url: url }).catch(function () { /* user cancelled */ });
      };
      box.appendChild(btn);
    }

    var target = document.querySelector('.social-share-target');
    if (target) {
      target.appendChild(box);
      return;
    }
    // Default: insert after the .hero block (top CTA card on disease LPs)
    var hero = document.querySelector('.hero');
    if (hero && hero.parentNode) {
      hero.parentNode.insertBefore(box, hero.nextSibling);
    } else {
      // Last resort: append to body
      document.body.appendChild(box);
    }
  });
})();
