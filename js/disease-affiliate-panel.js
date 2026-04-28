/**
 * Disease-LP affiliate resource panel — surfaces 3-5 curated
 * references (books, supplements, devices) per condition with
 * proper disclosure. Standalone — does not depend on the main app's
 * AffiliateEngine, so it works on the static LPs.
 *
 * Why not AdSense:
 *   Health content falls under YMYL ("Your Money or Your Life") in
 *   Google's quality guidelines and faces strict ad policy review.
 *   AdSense approval is risky and demonetization for medical claims
 *   is common. Affiliate links to relevant books / proven supplements
 *   are higher-trust and align with the guide content already on the
 *   page (no clickbait pressure).
 *
 * Disclosure:
 *   Each panel includes a clear "アフィリエイトリンクを含みます" note,
 *   complying with 景品表示法（ステマ規制 2023.10.1）which requires
 *   explicit disclosure of paid promotional links in Japan.
 */
(function () {
  'use strict';

  // Lookup keyed by data-app-param. Each entry is a small list of
  // search-term-based product cards. Using Amazon search (not ASIN)
  // means we don't have to maintain individual product pages — the
  // content survives even when individual products go out of stock.
  var CATALOGS = {
    mecfs: {
      title: '📚 ME/CFS の理解を深めるための関連リソース',
      items: [
        { kind: 'book', label: '『慢性疲労症候群 (ME/CFS) のすべて』医歯薬出版', q: '慢性疲労症候群 ME/CFS' },
        { kind: 'book', label: '『線維筋痛症と慢性疲労症候群を治す本』', q: '線維筋痛症 慢性疲労 治す' },
        { kind: 'supplement', label: 'CoQ10（ユビキノール 200mg）', q: 'コエンザイムQ10 ユビキノール 200mg' },
        { kind: 'supplement', label: 'メチル B12 1000μg（活性型）', q: 'メチルB12 1000 活性型' },
        { kind: 'device', label: 'Polar H10 心拍センサー（ペーシング用）', q: 'Polar H10 心拍センサー' }
      ]
    },
    long_covid: {
      title: '📚 Long COVID の対処に役立つリソース',
      items: [
        { kind: 'book', label: '『コロナ後遺症はなぜ続くのか』', q: 'コロナ後遺症 続く 治療' },
        { kind: 'supplement', label: 'ナットウキナーゼ（マイクロクロット仮説）', q: 'ナットウキナーゼ 2000FU' },
        { kind: 'supplement', label: 'ビタミン D 4000IU', q: 'ビタミンD 4000 IU' },
        { kind: 'device', label: 'パルスオキシメーター（SpO2 計測）', q: 'パルスオキシメーター 医療用' }
      ]
    },
    fibromyalgia: {
      title: '📚 線維筋痛症と向き合うためのリソース',
      items: [
        { kind: 'book', label: '『線維筋痛症 痛みからの解放』', q: '線維筋痛症 痛み 治療' },
        { kind: 'supplement', label: 'マグネシウム（グリシン酸）', q: 'マグネシウム グリシン酸' },
        { kind: 'supplement', label: 'CBD オイル（疼痛緩和）', q: 'CBDオイル 国内 ブロードスペクトラム' },
        { kind: 'device', label: '温熱パッド（広範囲）', q: '温熱パッド 広範囲 医療' }
      ]
    },
    pots: {
      title: '📚 POTS / 起立性不耐症のためのリソース',
      items: [
        { kind: 'supplement', label: '塩分タブレット（経口補水）', q: '経口補水 塩分タブレット' },
        { kind: 'device', label: 'コンプレッションストッキング 30-40 mmHg', q: 'コンプレッションストッキング 医療用 30 40' },
        { kind: 'book', label: '『起立性調節障害がよくわかる本』', q: '起立性調節障害 治す' }
      ]
    },
    mcas: {
      title: '📚 MCAS（肥満細胞活性化症候群）のリソース',
      items: [
        { kind: 'supplement', label: 'クエルセチン 500mg', q: 'クエルセチン 500mg' },
        { kind: 'supplement', label: 'ビタミン C（リポソーム）', q: 'リポソーム ビタミンC' },
        { kind: 'book', label: '『マスト細胞活性化症候群の基本』(英語書籍)', q: 'mast cell activation syndrome' }
      ]
    },
    eds: {
      title: '📚 EDS / 関節過可動性症候群のリソース',
      items: [
        { kind: 'device', label: '関節サポーター（手指）', q: '関節サポーター 手指 医療用' },
        { kind: 'book', label: '『エーラス・ダンロス症候群と暮らす』', q: 'エーラスダンロス 暮らす' },
        { kind: 'supplement', label: 'コラーゲンペプチド（タイプ I・III）', q: 'コラーゲンペプチド タイプ1 タイプ3' }
      ]
    },
    ibs: {
      title: '📚 IBS / 過敏性腸症候群のリソース',
      items: [
        { kind: 'book', label: '『低 FODMAP 食レシピ集』', q: '低FODMAP レシピ' },
        { kind: 'book', label: '『過敏性腸症候群がよくわかる本』', q: '過敏性腸症候群 よくわかる' },
        { kind: 'supplement', label: 'プロバイオティクス（B. infantis 35624）', q: 'プロバイオティクス Bifidobacterium infantis' },
        { kind: 'supplement', label: 'サイリウム（可溶性食物繊維）', q: 'サイリウム 食物繊維' }
      ]
    },
    hashimoto: {
      title: '📚 橋本病 / 甲状腺機能低下症のリソース',
      items: [
        { kind: 'supplement', label: 'セレン（200μg/日）', q: 'セレン 200 μg' },
        { kind: 'supplement', label: 'ブラジルナッツ（無塩・無漂白）', q: 'ブラジルナッツ 無塩' },
        { kind: 'supplement', label: 'ビタミン D 4000IU', q: 'ビタミンD 4000 IU' },
        { kind: 'book', label: '『橋本病・甲状腺の本』', q: '橋本病 甲状腺 本' }
      ]
    },
    depression: {
      title: '📚 うつ病・気分障害のリソース',
      items: [
        { kind: 'supplement', label: 'オメガ 3（EPA+DHA 2g/日）', q: 'オメガ3 EPA DHA 2000mg' },
        { kind: 'supplement', label: 'メチル葉酸（MTHFR 多型対応）', q: 'メチル葉酸 メチルフォレート' },
        { kind: 'book', label: '『うつヌケ』(田中圭一)', q: 'うつヌケ 田中圭一' },
        { kind: 'book', label: '『マンガでわかる認知行動療法』', q: 'マンガ 認知行動療法' }
      ]
    },
    insomnia: {
      title: '📚 不眠症の改善に役立つリソース',
      items: [
        { kind: 'supplement', label: 'マグネシウム（グリシン酸 400mg）', q: 'マグネシウム グリシン酸 400' },
        { kind: 'supplement', label: 'メラトニン（1-3mg）', q: 'メラトニン 1mg 3mg' },
        { kind: 'book', label: '『眠れなくなるほど面白い 図解 睡眠の話』', q: '眠れなくなるほど 図解 睡眠' },
        { kind: 'device', label: 'ホワイトノイズマシン', q: 'ホワイトノイズマシン 寝室' }
      ]
    }
  };

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Amazon JP search URL with affiliate tag. Tag is configurable via
  // <body data-amazon-tag="..."> or falls back to 'chroniccare-22'.
  function amazonSearchUrl(query) {
    var tag = (document.body && document.body.getAttribute('data-amazon-tag')) || 'chroniccare-22';
    return 'https://www.amazon.co.jp/s?k=' + encodeURIComponent(query) +
      '&tag=' + encodeURIComponent(tag);
  }

  function iconFor(kind) {
    return kind === 'book' ? '📖' : kind === 'supplement' ? '💊' : kind === 'device' ? '🔬' : '🔗';
  }

  onReady(function () {
    var key = (document.body && document.body.getAttribute('data-app-param')) || '';
    var catalog = CATALOGS[key];
    if (!catalog) return;

    var box = document.createElement('div');
    box.id = 'affiliate-resource-panel';
    box.style.cssText =
      'margin:24px 0;padding:16px 18px;background:#fafaff;' +
      'border:1px solid #e2e8f0;border-radius:12px;' +
      'font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif';

    var html = '<div style="font-size:14px;font-weight:700;color:#3730a3;margin-bottom:6px">' +
      catalog.title + '</div>' +
      '<div style="font-size:11px;color:#64748b;line-height:1.6;margin-bottom:10px;padding:6px 8px;background:#fef3c7;border-radius:6px">' +
      'ℹ️ <strong>本セクションには Amazon アソシエイト等のアフィリエイトリンクが含まれます</strong>。リンクから購入された場合、運営者に一定の手数料が支払われ、サービス運営費に充てられます（読者の支払額は変わりません）。記載商品の効果は個人差があります。購入前に主治医にご相談ください。' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">';

    catalog.items.forEach(function (item) {
      var url = amazonSearchUrl(item.q);
      html +=
        '<a href="' + url + '" target="_blank" rel="sponsored noopener noreferrer" ' +
        'style="display:block;padding:10px 12px;background:#fff;border:1px solid #e2e8f0;' +
        'border-radius:8px;text-decoration:none;color:#1e293b;font-size:12px;line-height:1.5;' +
        'transition:transform 0.1s">' +
        '<div style="font-size:14px;margin-bottom:2px">' + iconFor(item.kind) + '</div>' +
        '<div style="font-weight:600;color:#3730a3">' + item.label.replace(/</g, '&lt;') + '</div>' +
        '<div style="font-size:10px;color:#64748b;margin-top:4px">→ Amazon で探す</div>' +
        '</a>';
    });
    html += '</div>';
    html += '<div style="font-size:10px;color:#94a3b8;margin-top:8px">※ 健康日記は医療機関ではなく、本セクションも医療アドバイスではありません。</div>';

    box.innerHTML = html;

    // Place before the <footer>; same anchor convention as the
    // newsletter form so they stack naturally.
    var footer = document.querySelector('footer');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(box, footer);
    } else {
      document.body.appendChild(box);
    }
  });
})();
