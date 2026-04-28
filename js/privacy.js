// === js/privacy.js ===
/* ============================================================
   Privacy / PII anonymization
   ------------------------------------------------------------
   Strips obvious personal identifiers (emails, phone numbers,
   postal codes, addresses, honorific-suffixed names, long
   number sequences) from any text about to be sent to an AI
   provider. Opt-in via the "AI 送信前の匿名化" toggle in
   設定 → プライバシー設定. Off by default because masking can
   degrade analysis quality; users concerned about leaks can
   turn it on for a measurable reduction in surface area.

   This is NOT a guarantee — Japanese names in particular are
   hard to detect reliably without a morphological analyzer.
   The goal is "much better than raw text" without pretending
   to be DLP-grade.
   ============================================================ */
var Privacy = {
  STORAGE_KEY: 'privacy_anonymize_ai',

  isEnabled() {
    try { return localStorage.getItem(this.STORAGE_KEY) === '1'; }
    catch (_) { return false; }
  },
  setEnabled(v) {
    try { localStorage.setItem(this.STORAGE_KEY, v ? '1' : '0'); }
    catch (_) {}
  },

  anonymizeText(text) {
    if (!text || typeof text !== 'string') return text;
    let t = text;
    // Emails — the most common identifier in free-form text.
    t = t.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[メール]');
    // International phone numbers (+81-90-1234-5678 etc.)
    t = t.replace(/\+\d{1,3}[-\s]?\d{2,4}[-\s]?\d{2,4}[-\s]?\d{2,4}/g, '[電話]');
    // Japanese phone numbers (0X-XXXX-XXXX or 0XX-XXXX-XXXX)
    t = t.replace(/\b0\d{1,4}[-\s]\d{1,4}[-\s]\d{3,4}\b/g, '[電話]');
    // Credit-card-like 16-digit groups
    t = t.replace(/\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g, '[カード番号]');
    // Generic long digit sequences 10+ (マイナンバー、保険証等)
    t = t.replace(/\b\d{10,16}\b/g, '[番号]');
    // Postal codes (郵便番号)
    t = t.replace(/〒?\s*\d{3}-\d{4}/g, '[郵便番号]');
    // Rough Japanese address pattern: 県/府/都/道 + 市/区/町/村 + local portion
    t = t.replace(/([一-龥ぁ-んァ-ヶー]+[都道府県])([一-龥ぁ-んァ-ヶー]+[市区郡町村])([一-龥ぁ-んァ-ヶー0-9〇一二三四五六七八九十丁目番地号\-]{0,30})/g, '[住所]');
    // Honorific-suffixed names: "山田さん", "佐藤先生", "鈴木様".
    // The prefix must be 1-5 kanji/kana chars AND not a common
    // pronoun / label, to avoid masking things like 「皆さん」 or
    // 「患者さん」 which are generic.
    const pronounBlacklist = new Set(['皆', 'この', 'あの', 'その', 'どの', '本人', '自分', 'あなた', '私', '誰', 'お客', '患者']);
    t = t.replace(/([一-龥ァ-ヶー]{1,5})(さん|様|君|ちゃん|先生)/g, (match, name, title) => {
      if (pronounBlacklist.has(name)) return match;
      return '[人名]' + title;
    });
    return t;
  }
};


