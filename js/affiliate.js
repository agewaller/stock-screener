// === js/affiliate.js ===
/* ============================================================
   Affiliate & Monetization Engine
   Manages affiliate links, tracking, and revenue
   ============================================================ */
var AffiliateEngine = class AffiliateEngine {
  constructor() {
    this.config = store.get('affiliateConfig') || {};
    this.trackingData = [];
  }

  // Generate affiliate link
  generateLink(product, storeId) {
    const networks = CONFIG.AFFILIATE_NETWORKS;
    const network = networks.find(n => n.id === storeId);
    if (!network) return product.url || '#';

    const customConfig = this.config[storeId] || {};
    const tag = customConfig.tag || network.tag;

    switch (storeId) {
      case 'amazon_jp':
        return this.amazonLink(product.url || product.asin, tag);
      case 'rakuten':
        return this.rakutenLink(product.url, tag);
      case 'iherb':
        return this.iherbLink(product.url, customConfig.code || network.code);
      default:
        return this.appendTag(product.url, tag);
    }
  }

  amazonLink(urlOrAsin, tag) {
    if (urlOrAsin.startsWith('http')) {
      const url = new URL(urlOrAsin);
      url.searchParams.set('tag', tag);
      return url.toString();
    }
    return `https://www.amazon.co.jp/dp/${urlOrAsin}?tag=${tag}`;
  }

  rakutenLink(url, affiliateId) {
    return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(url)}`;
  }

  iherbLink(url, code) {
    if (url && url.includes('iherb.com')) {
      const u = new URL(url);
      u.searchParams.set('rcode', code);
      return u.toString();
    }
    return `https://www.iherb.com/search?kw=${encodeURIComponent(url || '')}&rcode=${code}`;
  }

  appendTag(url, tag) {
    if (!url) return '#';
    try {
      const u = new URL(url);
      u.searchParams.set('ref', tag);
      return u.toString();
    } catch {
      return url;
    }
  }

  // Track click
  trackClick(productId, storeId, actionType) {
    const event = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      productId,
      storeId,
      actionType,
      userId: store.get('user')?.uid || 'anonymous'
    };
    this.trackingData.push(event);
    this.saveTracking();

    // Send to analytics backend if available
    this.sendAnalyticsEvent('affiliate_click', event);
  }

  // Track conversion (called via postback URL from affiliate networks)
  trackConversion(orderId, storeId, amount, currency = 'JPY') {
    const event = {
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      type: 'conversion',
      orderId,
      storeId,
      amount,
      currency,
      userId: store.get('user')?.uid || 'anonymous'
    };
    this.trackingData.push(event);
    this.saveTracking();
    this.sendAnalyticsEvent('affiliate_conversion', event);
  }

  // Generate product card HTML with affiliate link
  renderProductCard(product) {
    const links = (product.links || []).map(link => {
      const affiliateUrl = this.generateLink(
        { url: link.url, asin: link.asin },
        link.storeId || this.detectStore(link.url)
      );
      return `
        <a href="${affiliateUrl}" target="_blank" rel="noopener"
           class="btn btn-sm btn-outline"
           onclick="affiliateEngine.trackClick('${product.id}', '${link.storeId || ''}', 'purchase')"
           style="margin-right: 6px; margin-bottom: 6px;">
          ${link.store || link.storeId} ${link.price || ''}
        </a>
      `;
    }).join('');

    return `
      <div class="action-card" data-product-id="${product.id}">
        <div class="action-card-icon" style="background: ${product.color || 'var(--accent-bg)'}">
          ${product.icon || '💊'}
        </div>
        <div class="action-card-title">${product.title}</div>
        <div class="action-card-desc">${product.description || ''}</div>
        ${product.evidence ? `<div class="tag tag-accent" style="margin-bottom:8px">エビデンス: ${product.evidence}</div>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${links}
        </div>
        ${product.cost ? `<div class="action-card-price" style="margin-top:10px">${product.cost}</div>` : ''}
      </div>
    `;
  }

  detectStore(url) {
    if (!url) return 'custom';
    if (url.includes('amazon.co.jp') || url.includes('amzn')) return 'amazon_jp';
    if (url.includes('rakuten.co.jp')) return 'rakuten';
    if (url.includes('iherb.com')) return 'iherb';
    return 'custom';
  }

  // Admin: Update affiliate config
  updateConfig(storeId, config) {
    this.config[storeId] = { ...this.config[storeId], ...config };
    store.set('affiliateConfig', this.config);
  }

  // Admin: Get revenue report
  getRevenueReport(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const conversions = this.trackingData.filter(
      e => e.type === 'conversion' && new Date(e.timestamp) >= cutoff
    );

    const clicks = this.trackingData.filter(
      e => e.type !== 'conversion' && new Date(e.timestamp) >= cutoff
    );

    const byStore = {};
    conversions.forEach(c => {
      if (!byStore[c.storeId]) byStore[c.storeId] = { clicks: 0, conversions: 0, revenue: 0 };
      byStore[c.storeId].conversions++;
      byStore[c.storeId].revenue += c.amount || 0;
    });
    clicks.forEach(c => {
      if (!byStore[c.storeId]) byStore[c.storeId] = { clicks: 0, conversions: 0, revenue: 0 };
      byStore[c.storeId].clicks++;
    });

    return {
      totalClicks: clicks.length,
      totalConversions: conversions.length,
      totalRevenue: conversions.reduce((sum, c) => sum + (c.amount || 0), 0),
      byStore,
      period: `${days}日間`
    };
  }

  saveTracking() {
    try {
      localStorage.setItem('cc_affiliate_tracking', JSON.stringify(this.trackingData.slice(-1000)));
    } catch (e) { /* ignore */ }
  }

  loadTracking() {
    try {
      const data = localStorage.getItem('cc_affiliate_tracking');
      if (data) this.trackingData = JSON.parse(data);
    } catch (e) { /* ignore */ }
  }

  sendAnalyticsEvent(eventName, data) {
    // Send to backend analytics
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventName, data })
    }).catch(() => { /* silent fail for analytics */ });
  }
};

var affiliateEngine = new AffiliateEngine();
affiliateEngine.loadTracking();


