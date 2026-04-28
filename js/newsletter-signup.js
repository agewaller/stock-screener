/**
 * Newsletter signup — minimal email capture for the disease LPs and
 * footer area. Stores into Firestore `newsletter_subscribers/{hash}`.
 *
 * Why Firestore (not Mailchimp/ConvertKit directly):
 * - Keeps within the existing Firebase stack — no extra paid service
 *   required to start collecting emails.
 * - Admin can later sync to Mailchimp / ConvertKit / Buttondown via
 *   a Cloudflare Worker once an API key is configured (see
 *   docs/ニュースレター運用.md). Firestore is the canonical source.
 * - Anonymous create works via firestore.rules — no Firebase Auth
 *   step is required, so the form fires from a static disease LP.
 *
 * The form is auto-injected near the bottom of any page that loads
 * this script. Pages can also place an explicit anchor with
 * id="newsletter-target" to force a particular insertion point.
 */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Firebase compat-style globals exist on index.html; on the static
  // disease LPs we lazy-load the lite SDK on demand to keep the
  // initial bundle minimal. Bail gracefully on offline / blocked.
  var firebaseConfig = null;
  async function loadFirebase() {
    if (window.firebase && window.firebase.firestore) return window.firebase;
    // No Firebase loaded — load minimal SDK from CDN.
    await new Promise(function (resolve, reject) {
      var s1 = document.createElement('script');
      s1.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
      s1.onload = resolve;
      s1.onerror = reject;
      document.head.appendChild(s1);
    });
    await new Promise(function (resolve, reject) {
      var s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';
      s2.onload = resolve;
      s2.onerror = reject;
      document.head.appendChild(s2);
    });
    return window.firebase;
  }

  // Firebase config is loaded from /firebase-config.json (admin-managed).
  // If unavailable, the form shows a helpful "later" message.
  async function getFirebaseConfig() {
    if (firebaseConfig) return firebaseConfig;
    try {
      var resp = await fetch('/firebase-config.json', { cache: 'force-cache' });
      if (!resp.ok) throw new Error('config http ' + resp.status);
      firebaseConfig = await resp.json();
      return firebaseConfig;
    } catch (e) {
      console.warn('[newsletter] firebase config unavailable:', e.message);
      return null;
    }
  }

  // 8-char base36 hash of email — used as the Firestore doc id so
  // duplicate subscriptions naturally upsert instead of erroring.
  function emailHash(email) {
    var s = email.toLowerCase().trim();
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    // Fold to unsigned 32-bit and base36.
    return ((h >>> 0).toString(36) + Math.abs(s.length).toString(36)).substring(0, 12);
  }

  function isValidEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
  }

  async function submit(email, ctx) {
    var cfg = await getFirebaseConfig();
    if (!cfg) throw new Error('登録基盤が一時的に利用できません。少し時間を置いて再度お試しください。');
    var firebase = await loadFirebase();
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
    var db = firebase.firestore();
    var docId = emailHash(email);
    var data = {
      email: email.toLowerCase().trim(),
      subscribedAt: new Date().toISOString(),
      consent: true,
      source: (window.location && window.location.pathname) || '/',
      disease: ctx.disease || ''
    };
    await db.collection('newsletter_subscribers').doc(docId).set(data, { merge: true });
  }

  function buildForm() {
    var label = document.body.getAttribute('data-disease-label') || '';
    var diseaseId = document.body.getAttribute('data-app-param') || '';

    var box = document.createElement('div');
    box.id = 'newsletter-signup-card';
    box.style.cssText =
      'margin:24px 0;padding:18px 22px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);' +
      'border:1.5px solid #86efac;border-radius:14px;' +
      'font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif';
    box.innerHTML =
      '<div style="font-size:14px;font-weight:700;color:#166534;margin-bottom:4px">' +
      '✉️ ' + (label ? (label + ' の最新研究と治療情報') : '健康日記からのお知らせ') +
      'をメールで受け取る</div>' +
      '<div style="font-size:11px;color:#15803d;line-height:1.7;margin-bottom:10px">' +
      '月 1-2 通・最新研究／note 連載／新機能。<strong>いつでも 1 タップで解除</strong>できます。広告転送・第三者提供は一切ありません。' +
      '</div>' +
      '<form id="newsletter-form" novalidate style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<input id="newsletter-email" type="email" required autocomplete="email" ' +
      'placeholder="you@example.com" ' +
      'style="flex:1;min-width:200px;padding:10px 14px;border:1.5px solid #86efac;border-radius:10px;' +
      'font-size:13px;background:#fff;outline:none">' +
      '<button type="submit" id="newsletter-submit" ' +
      'style="padding:10px 18px;background:#16a34a;color:#fff;border:none;border-radius:10px;' +
      'font-size:13px;font-weight:700;cursor:pointer">登録する</button>' +
      '</form>' +
      '<div id="newsletter-msg" style="margin-top:8px;font-size:12px;color:#166534;min-height:18px" aria-live="polite"></div>';

    var form = box.querySelector('#newsletter-form');
    var emailEl = box.querySelector('#newsletter-email');
    var btn = box.querySelector('#newsletter-submit');
    var msg = box.querySelector('#newsletter-msg');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = (emailEl.value || '').trim();
      if (!isValidEmail(email)) {
        msg.style.color = '#b91c1c';
        msg.textContent = '正しいメールアドレスを入力してください。';
        return;
      }
      btn.disabled = true;
      btn.textContent = '登録中...';
      msg.style.color = '#166534';
      msg.textContent = '';
      try {
        await submit(email, { disease: diseaseId });
        form.style.display = 'none';
        msg.style.color = '#166534';
        msg.innerHTML = '✅ 登録ありがとうございます。次回の更新時にお送りします。<br><span style="font-size:11px;color:#15803d">解除リンクはメールに記載されます。</span>';
      } catch (err) {
        msg.style.color = '#b91c1c';
        msg.textContent = '登録に失敗しました: ' + (err && err.message ? err.message : 'エラー') + ' — 再度お試しください。';
        btn.disabled = false;
        btn.textContent = '登録する';
      }
    });

    return box;
  }

  onReady(function () {
    var anchor = document.getElementById('newsletter-target');
    var box = buildForm();
    if (anchor) {
      anchor.appendChild(box);
      return;
    }
    // Default: place before the <footer>, after the .related grid.
    var footer = document.querySelector('footer');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(box, footer);
    } else {
      document.body.appendChild(box);
    }
  });
})();
