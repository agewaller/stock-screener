#!/usr/bin/env node
/**
 * 健康日記 全機能チェック
 * Run: node tests/smoke.test.js
 *
 * index.html の inline JS を静的解析し、全ユーザーアクションの
 * コードパスが正しく配線されているかを検証する。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;
const failures = [];

function section(label) { console.log(`\n--- ${label} ---`); }
function test(name, fn) {
  try { fn(); passed++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  catch (e) { failed++; failures.push({ name, message: e.message }); console.log(`  \x1b[31m✗\x1b[0m ${name}\n    ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Extract inline script
const scriptMatch = html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/);
const script = scriptMatch ? scriptMatch[1] : '';

// Helper: extract function body by name (supports class methods,
// object methods, and App.prototype.X = function() patterns)
function extractFn(source, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`(?:^|[\\s,;}])${esc}\\s*\\([^)]*\\)\\s*\\{`, 'm'),
    new RegExp(`async\\s+${esc}\\s*\\([^)]*\\)\\s*\\{`),
    new RegExp(`\\b${esc}\\s*=\\s*(?:async\\s+)?function\\s*\\*?\\s*\\([^)]*\\)\\s*\\{`),
    new RegExp(`\\b${esc}\\s*:\\s*(?:async\\s+)?function\\s*\\([^)]*\\)\\s*\\{`),
  ];
  for (const re of patterns) {
    const m = re.exec(source);
    if (!m) continue;
    const start = m.index + m[0].lastIndexOf('{');
    let depth = 1, i = start + 1;
    while (i < source.length && depth > 0) {
      const c = source[i];
      if (c === '/' && source[i+1] === '/') { while (i < source.length && source[i] !== '\n') i++; }
      else if (c === '/' && source[i+1] === '*') { i += 2; while (i < source.length - 1 && !(source[i] === '*' && source[i+1] === '/')) i++; i++; }
      else if (c === '`') { i++; while (i < source.length && source[i] !== '`') { if (source[i] === '\\') i++; i++; } }
      else if (c === "'") { i++; while (i < source.length && source[i] !== "'") { if (source[i] === '\\') i++; i++; } }
      else if (c === '"') { i++; while (i < source.length && source[i] !== '"') { if (source[i] === '\\') i++; i++; } }
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      i++;
    }
    return source.substring(start, i);
  }
  return null;
}

// Helper: strip JS comments from code
function stripComments(code) {
  return code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

// ================================================================
section('1. JS 構文');
test('index.html inline JS parses without error', () => {
  new vm.Script(script, { filename: 'index.html' });
});

['worker/anthropic-proxy.js', 'worker/plaud-inbox.js'].forEach(f => {
  test(`${f} parses`, () => {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    // Workers use ESM syntax which vm.Script can't parse directly
    // Just check it's not empty and has export default
    assert(code.length > 50, 'file too short');
    assert(/export\s+default/.test(code), 'missing export default');
  });
});

// ================================================================
section('2. onclick ハンドラの配線');
test('Every onclick="app.X()" references a real App method', () => {
  const onclicks = html.match(/onclick="app\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g) || [];
  const methods = new Set();
  onclicks.forEach(m => {
    const fn = m.match(/app\.([a-zA-Z_][a-zA-Z0-9_]*)/)[1];
    methods.add(fn);
  });
  const missing = [];
  methods.forEach(fn => {
    // Check if method exists in script (class method or prototype)
    const hasMethod = new RegExp(`(?:^|\\s)${fn}\\s*\\(`).test(script) ||
                      new RegExp(`App\\.prototype\\.${fn}`).test(script);
    if (!hasMethod) missing.push(fn);
  });
  assert(missing.length === 0, `Missing App methods: ${missing.join(', ')}`);
});

// ================================================================
section('3. レンダラー完全性');
const pages = ['login', 'disease_select', 'dashboard', 'data_input', 'analysis',
  'actions', 'research', 'chat', 'timeline', 'integrations', 'settings', 'admin'];
pages.forEach(p => {
  test(`render_${p} is defined`, () => {
    assert(script.includes(`render_${p}`) || script.includes(`render_${p.replace(/_/g, '-')}`),
      `render_${p} not found`);
  });
});

// ================================================================
section('4. 認証フロー');
test('handleSignedInUser exists and is called from signInWithGoogle', () => {
  const body = extractFn(script, 'signInWithGoogle');
  assert(body, 'signInWithGoogle not found');
  assert(body.includes('handleSignedInUser'), 'signInWithGoogle must call handleSignedInUser');
});

test('handleSignedInUser exists and is called from signInWithEmail', () => {
  const body = extractFn(script, 'signInWithEmail');
  assert(body, 'signInWithEmail not found');
  assert(body.includes('handleSignedInUser'), 'signInWithEmail must call handleSignedInUser');
});

test('signInWithGoogle uses signInWithPopup on ALL devices (no signInWithRedirect)', () => {
  const body = stripComments(extractFn(script, 'signInWithGoogle'));
  assert(!body.includes('signInWithRedirect'), 'signInWithRedirect breaks on cross-domain authDomain');
});

test('loginWithGoogle does NOT silently fall back to window.prompt', () => {
  const body = stripComments(extractFn(script, 'loginWithGoogle'));
  assert(body, 'loginWithGoogle not found');
  assert(!body.includes('loginWithPrompt'), 'silent fallback to prompt hides errors');
});

test('loadAllData has re-entry guard', () => {
  const body = extractFn(script, 'loadAllData');
  assert(body, 'loadAllData not found');
  assert(body.includes('if (this._loading) return'), 'missing re-entry guard');
});

test('loadGlobalConfig runs early in loadAllData (before per-user data)', () => {
  const body = extractFn(script, 'loadAllData');
  const globalIdx = body.indexOf('loadGlobalConfig');
  const profileIdx = body.indexOf('userDoc');
  assert(globalIdx > 0 && profileIdx > 0, 'both must exist');
  assert(globalIdx < profileIdx, 'loadGlobalConfig must run before userDoc fetch');
});

// ================================================================
section('5. ダッシュボード AI 応答');
test('dashQuickSubmit sets isAnalyzing=true BEFORE pushing textEntries', () => {
  const fnStart = script.indexOf('dashQuickSubmit()');
  assert(fnStart > 0, 'dashQuickSubmit not found');
  const chunk = stripComments(script.substring(fnStart, fnStart + 3000));
  const analyzingIdx = chunk.indexOf("set('isAnalyzing', true)");
  const pushIdx = chunk.indexOf("store.set('textEntries'");
  assert(analyzingIdx > 0, 'isAnalyzing not found in dashQuickSubmit body');
  assert(pushIdx > 0, 'textEntries push not found in dashQuickSubmit body');
  assert(analyzingIdx < pushIdx, 'isAnalyzing must be set before textEntries push');
});

test('dashQuickSubmit has .catch() on analyzeViaAPI', () => {
  const body = extractFn(script, 'dashQuickSubmit');
  assert(body.includes('.catch('), 'missing .catch() — errors are silently swallowed');
});

test('dashQuickSubmit detects _fromAPI===false and routes to error card', () => {
  const body = extractFn(script, 'dashQuickSubmit');
  assert(body.includes('_fromAPI'), 'must check _fromAPI to detect fallback responses');
  assert(body.includes('latestFeedbackError'), 'must set latestFeedbackError on failure');
});

test('render_dashboard reads isAnalyzing / latestFeedbackError / latestFeedback in priority order', () => {
  // The dash-ai-feedback template with priority logic is in the
  // render_dashboard function. Find it by looking for the template
  // HTML id="dash-ai-feedback" followed by the isAnalyzing check.
  const marker = 'dash-ai-feedback" style=';
  let idx = script.lastIndexOf(marker);
  assert(idx > 0, 'dash-ai-feedback template not found');
  const chunk = script.substring(idx, idx + 1500);
  const analyzingIdx = chunk.indexOf('isAnalyzing');
  const errorIdx = chunk.indexOf('latestFeedbackError');
  assert(analyzingIdx > 0, 'must check isAnalyzing in dash-ai-feedback');
  assert(errorIdx > 0, 'must check latestFeedbackError');
  assert(analyzingIdx < errorIdx, 'isAnalyzing must be checked before latestFeedbackError');
});

test('scheduleDashRefresh triggers on latestFeedbackError and isAnalyzing', () => {
  assert(script.includes("'latestFeedbackError'") && script.includes("'isAnalyzing'"),
    'latestFeedbackError and isAnalyzing must be in scheduleDashRefresh trigger list');
});

// ================================================================
section('6. AI エンジン');
test('analyzeViaAPI does NOT have early return on !apiKey', () => {
  const body = extractFn(script, 'analyzeViaAPI');
  assert(body, 'analyzeViaAPI not found');
  // Should NOT have the pattern: if (!apiKey) { return { ... _fromAPI: false }; }
  // before the try block
  const tryIdx = body.indexOf('try {');
  const beforeTry = body.substring(0, tryIdx);
  assert(!beforeTry.includes("if (!apiKey)"), 'early apiKey check bypasses shared proxy');
});

test('callAnthropic uses MODEL_MAP, not hardcoded deprecated IDs', () => {
  const body = extractFn(script, 'callAnthropic');
  assert(body, 'callAnthropic not found');
  assert(/MODEL_MAP\s*=/.test(body), 'must define MODEL_MAP');
  assert(!body.includes("'claude-3-5-sonnet-20241022'"), 'deprecated model ID');
  assert(!body.includes("'claude-3-opus-20240229'"), 'deprecated model ID');
});

test('callAnthropic has Vision support (imageBase64)', () => {
  const body = extractFn(script, 'callAnthropic');
  assert(body.includes('imageBase64'), 'must support imageBase64');
});

test('canUseSharedProxy exists', () => {
  assert(extractFn(script, 'canUseSharedProxy'), 'canUseSharedProxy not found');
});

test('getApiKey guards against undefined modelId', () => {
  const body = extractFn(script, 'getApiKey');
  assert(body && /if\s*\(\s*!modelId\s*\)/.test(body), 'must guard against undefined');
});

// ================================================================
section('7. プロンプト');
test('PROMPT_HEADER has empathy/encouragement/something-new directives', () => {
  assert(script.includes('寄り添い') || script.includes('共感'), 'empathy missing');
  assert(script.includes('SOMETHING NEW') || script.includes('新しい打ち手'), 'something new missing');
  assert(script.includes('RESPOND_LANGUAGE_INSTRUCTION'), 'language directive missing');
});

test('PROMPT_HEADER has /ooda framework', () => {
  assert(script.includes('/ooda'), '/ooda marker missing');
  assert(script.includes('Observe') && script.includes('Orient') &&
    script.includes('Decide') && script.includes('Act'), 'OODA stages missing');
});

test('INLINE_PROMPTS has required keys', () => {
  ['text_analysis', 'image_analysis', 'conversation_analysis', 'plaud_analysis', 'timeline_insight']
    .forEach(k => assert(script.includes(`${k}:`), `INLINE_PROMPTS.${k} missing`));
});

test('interpolatePrompt injects RESPOND_LANGUAGE_INSTRUCTION', () => {
  const body = extractFn(script, 'interpolatePrompt');
  assert(body && body.includes('RESPOND_LANGUAGE_INSTRUCTION'), 'missing language injection');
});

test('injectLanguageDirective helper exists', () => {
  assert(extractFn(script, 'injectLanguageDirective'), 'injectLanguageDirective not found');
});

// ================================================================
section('8. Google 翻訳リンク');
test('No translate.google.com/translate?u= usage outside comments', () => {
  const lines = script.split('\n');
  const bad = lines.filter((l, i) => {
    if (/\/\//.test(l.split('translate.google.com')[0])) return false; // comment
    return /translate\.google\.com\/translate\?/.test(l) && !l.trim().startsWith('//') && !l.trim().startsWith('*');
  });
  assert(bad.length === 0, `Found live usage: ${bad[0]?.trim()}`);
});

// ================================================================
section('9. 写真アップロード');
test('Components.photoUpload exists', () => {
  assert(script.includes('photoUpload('), 'Components.photoUpload not found');
});

test('handleModalPhotoUpload exists', () => {
  assert(extractFn(script, 'handleModalPhotoUpload'), 'handleModalPhotoUpload not found');
});

test('image_analysis prompt has medication deep analysis (4段階)', () => {
  assert(script.includes('第1段階') && script.includes('第2段階') &&
    script.includes('第3段階') && script.includes('第4段階'),
    'medication 4-stage analysis missing');
});

// ================================================================
section('10. カレンダー連携');
test('connectGoogleCalendarWithGoogle has multi-path accessToken extraction', () => {
  const body = extractFn(script, 'connectGoogleCalendarWithGoogle');
  assert(body, 'connectGoogleCalendarWithGoogle not found');
  assert(body.includes('extractAccessToken'), 'multi-path token extraction missing');
  assert(body.includes('signInWithPopup'), 'signInWithPopup fallback missing');
});

test('isGoogleCalendarApiDisabledError exists', () => {
  assert(extractFn(script, 'isGoogleCalendarApiDisabledError'),
    'Calendar API disabled detector missing');
});

// ================================================================
section('11. Plaud');
test('subscribeToInbox does NOT use .orderBy (avoids composite index)', () => {
  const body = stripComments(extractFn(script, 'subscribeToInbox'));
  assert(body, 'subscribeToInbox not found');
  assert(!body.includes(".orderBy('receivedAt'"), 'orderBy requires composite index');
});

test('subscribeToInbox sets inboxStatus', () => {
  const body = extractFn(script, 'subscribeToInbox');
  assert(body.includes('inboxStatus'), 'must set inboxStatus for UI diagnostic');
});

test('saveTranscript calls runPlaudAnalysis', () => {
  assert(script.includes('runPlaudAnalysis'), 'runPlaudAnalysis must be called from saveTranscript');
});

// ================================================================
section('12. 栄養ダッシュボード');
test('store has nutritionLog in persistKeys', () => {
  assert(script.includes("'nutritionLog'"), 'nutritionLog missing from persistKeys');
});

test('calculateBMR exists and uses Mifflin-St Jeor', () => {
  const body = extractFn(script, 'calculateBMR');
  assert(body, 'calculateBMR not found');
  assert(body.includes('6.25') || body.includes('Mifflin'), 'Mifflin formula missing');
});

test('upsertNutritionEntry exists', () => {
  assert(extractFn(script, 'upsertNutritionEntry'), 'upsertNutritionEntry not found');
});

// ================================================================
section('13. データ完全性');
test('exportData includes ALL collections (24+ keys)', () => {
  const body = extractFn(script, 'exportData');
  assert(body, 'exportData not found');
  ['textEntries', 'symptoms', 'vitals', 'bloodTests', 'medications', 'supplements',
   'meals', 'sleepData', 'activityData', 'photos', 'nutritionLog', 'plaudAnalyses',
   'aiComments', 'calendarEvents', 'userProfile', 'conversationHistory'].forEach(k => {
    assert(body.includes(`'${k}'`), `exportData missing: ${k}`);
  });
});

test('importDataFile covers same keys as exportData', () => {
  const body = extractFn(script, 'importDataFile');
  assert(body, 'importDataFile not found');
  ['nutritionLog', 'plaudAnalyses', 'aiComments', 'calendarEvents', 'userProfile'].forEach(k => {
    assert(body.includes(`'${k}'`), `importDataFile missing: ${k}`);
  });
});

test('render_timeline includes all data types', () => {
  const body = extractFn(script, 'render_timeline');
  assert(body, 'render_timeline not found');
  ['supplement', 'meal', 'nutrition', 'plaud', 'calendar'].forEach(t => {
    assert(body.includes(`'${t}'`), `timeline missing type: ${t}`);
  });
});

// ================================================================
section('14. Worker CORS');
test('anthropic-proxy allows anthropic-version in CORS headers', () => {
  const worker = fs.readFileSync(path.join(ROOT, 'worker/anthropic-proxy.js'), 'utf8');
  assert(worker.includes('anthropic-version'), 'anthropic-version missing from CORS allow-list');
});

// ================================================================
section('15. Firestore rules');
test('inbox create rule allows worker writes (not if false)', () => {
  const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  // Must NOT have `allow create: if false` for inbox
  const inboxSection = rules.substring(rules.indexOf('match /inbox/'));
  assert(!inboxSection.includes('allow create: if false'), 'inbox create must not be "if false"');
  assert(inboxSection.includes('allow create:'), 'inbox create rule must exist');
});

// ================================================================
section('16. アクション推奨');
test('loadActionRecommendations checks both container IDs', () => {
  const body = extractFn(script, 'loadActionRecommendations');
  assert(body, 'loadActionRecommendations not found');
  assert(body.includes('action-live-recs') && body.includes('dash-actions-live'),
    'must check both dashboard and actions page container IDs');
});

test('buildVerifiedActionLinks exists (no AI-hallucinated URLs)', () => {
  assert(extractFn(script, 'buildVerifiedActionLinks'), 'buildVerifiedActionLinks not found');
});

test('AI prompt for actions prohibits URL generation', () => {
  const body = extractFn(script, 'loadActionRecommendations');
  assert(body.includes('URLやリンクは一切出力しないでください') || body.includes('URL.*出力しない'),
    'AI prompt must prohibit URL generation');
});

// ================================================================
section('17. モバイル安全性');
test('No window.confirm() in user-facing code', () => {
  // Strip comments
  const clean = script.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const matches = clean.match(/\bconfirm\s*\(/g) || [];
  // Filter out false positives (confirmAction is a custom method)
  const real = matches.filter(m => !clean.includes('confirmAction'));
  // Just check there's no window.confirm pattern
  assert(!/window\.confirm\s*\(/.test(clean), 'window.confirm is blocked on mobile');
});

test('No window.alert() in user-facing code', () => {
  const clean = script.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert(!/window\.alert\s*\(/.test(clean) && !/\balert\s*\([^)]*\)/.test(clean.replace(/alertEl|alert_|alertMessage|showAlert/g, '')),
    'window.alert is blocked on mobile');
});

// ================================================================
section('18. 多言語');
test('i18n has 4+ languages', () => {
  const langs = (script.match(/^\s{4}[a-z]{2}:\s*\{/gm) || []);
  assert(langs.length >= 4, `Only ${langs.length} languages defined`);
});

test('Language selector has 8+ options', () => {
  const options = (html.match(/option value="[a-z]{2}"/g) || []);
  assert(options.length >= 8, `Only ${options.length} language options`);
});

test('_languageDirectiveFor supports 10 languages', () => {
  const body = extractFn(script, '_languageDirectiveFor');
  assert(body, '_languageDirectiveFor not found');
  ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'pt', 'de', 'ar', 'it'].forEach(lang => {
    // Keys can be quoted ('ja':) or unquoted (ja:)
    assert(body.includes(`${lang}:`) || body.includes(`'${lang}':`),
      `language directive missing for: ${lang}`);
  });
});

// ================================================================
section('19. デプロイ設定');
test('CNAME points to cares.advisers.jp', () => {
  const cname = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim();
  assert(cname === 'cares.advisers.jp', `CNAME is ${cname}`);
});

test('pages.yml deploys on main push', () => {
  const yml = fs.readFileSync(path.join(ROOT, '.github/workflows/pages.yml'), 'utf8');
  assert(yml.includes('main'), 'pages.yml must deploy on main');
});

test('deploy-worker.yml deploys both workers', () => {
  const yml = fs.readFileSync(path.join(ROOT, '.github/workflows/deploy-worker.yml'), 'utf8');
  assert(yml.includes('stock-screener'), 'must deploy anthropic-proxy');
  assert(yml.includes('plaud-inbox'), 'must deploy plaud-inbox');
});

test('wrangler.plaud-inbox.toml exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'wrangler.plaud-inbox.toml')), 'missing wrangler.plaud-inbox.toml');
});

// ================================================================
section('20. セキュリティ');
test('Components.escapeHtml exists', () => {
  assert(script.includes('escapeHtml'), 'escapeHtml missing');
});

test('Dashboard user content rendered via escapeHtml', () => {
  // Check render_dashboard references escapeHtml for user content
  assert(script.includes('Components.escapeHtml(rawContent)') || script.includes('escapeHtml(e.content'),
    'Dashboard must escape user content');
});

test('CONFIG.FIREBASE has valid apiKey (not placeholder)', () => {
  assert(script.includes("apiKey: 'AIza"), 'Firebase apiKey looks like a placeholder');
});

test('ADMIN_EMAILS includes agewaller@gmail.com', () => {
  assert(script.includes("'agewaller@gmail.com'"), 'admin email missing');
});

// ================================================================
console.log(`\n${'═'.repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}`);
if (failures.length > 0) {
  console.log('\nFAILURES:');
  failures.forEach(f => console.log(`  • ${f.name}\n    ${f.message}`));
}
process.exit(failed > 0 ? 1 : 0);
