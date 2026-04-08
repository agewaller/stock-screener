#!/usr/bin/env node
/**
 * Regression test suite for 未病ダイアリー
 * Run: node tests/smoke.test.js
 *
 * Each section guards against a class of bug we've previously hit in
 * production. When a test fires, read the comment at the top of the
 * section to understand the original incident.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;
const failures = [];

function section(label) {
  console.log(`\n--- ${label} ---`);
}

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, message: e.message });
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ─── Fixtures ───

const jsFiles = [
  'js/config.js', 'js/store.js', 'js/ai-engine.js', 'js/affiliate.js',
  'js/components.js', 'js/i18n.js', 'js/calendar.js', 'js/integrations.js',
  'js/firebase-backend.js', 'js/app.js', 'js/pages.js'
];

const readFile = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const allJs = jsFiles.map(f => ({ name: f, content: readFile(f) }));
const joinedJs = allJs.map(f => f.content).join('\n');

// Extract a specific JS file's content by name (short or full path).
function js(name) {
  const f = allJs.find(f => f.name === name || f.name.endsWith('/' + name));
  if (!f) throw new Error(`File not found: ${name}`);
  return f.content;
}

// Extract the body of a function / method by its name. Handles several
// common definition patterns and ignores call sites. Returns the string
// from the opening { to the matching }.
function extractFunction(source, name) {
  const escName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Try several common definition patterns (in priority order).
  const patterns = [
    // Class/object method: "name(args) {"  (but NOT "foo.name(" call site)
    new RegExp(`(?:^|[\\s,;}])${escName}\\s*\\([^)]*\\)\\s*\\{`, 'm'),
    // Async class method: "async name(args) {"
    new RegExp(`async\\s+${escName}\\s*\\([^)]*\\)\\s*\\{`),
    // Assignment: "name = function(args) {" or "name = async function(args) {"
    new RegExp(`\\b${escName}\\s*=\\s*(?:async\\s+)?function\\s*\\*?\\s*\\([^)]*\\)\\s*\\{`),
    // Object literal: "name: function(args) {" or "name: async function(...) {"
    new RegExp(`\\b${escName}\\s*:\\s*(?:async\\s+)?function\\s*\\([^)]*\\)\\s*\\{`),
    // Arrow assignment: "name = (args) => {" or "name = async (args) => {"
    new RegExp(`\\b${escName}\\s*=\\s*(?:async\\s+)?\\([^)]*\\)\\s*=>\\s*\\{`),
  ];
  for (const re of patterns) {
    const m = re.exec(source);
    if (!m) continue;
    const start = m.index + m[0].lastIndexOf('{');
    return extractBodyAt(source, start);
  }
  return null;
}

function extractBodyAt(source, openBrace) {
  let depth = 1;
  let i = openBrace + 1;
  while (i < source.length && depth > 0) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
    } else if (c === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length - 1 && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i++;
    } else if (c === '`') {
      i++;
      while (i < source.length && source[i] !== '`') { if (source[i] === '\\') i++; i++; }
    } else if (c === "'") {
      i++;
      while (i < source.length && source[i] !== "'") { if (source[i] === '\\') i++; i++; }
    } else if (c === '"') {
      i++;
      while (i < source.length && source[i] !== '"') { if (source[i] === '\\') i++; i++; }
    } else if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
    }
    i++;
  }
  return source.substring(openBrace, i);
}

// Strip all quoted strings and template literals from a block of source,
// leaving whitespace in their place. Used to exclude navigate() calls
// inside onclick="..." attributes within template literals.
function stripStrings(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    const c = code[i];
    if (c === '`') {
      result += ' ';
      i++;
      let depth = 0;
      while (i < code.length) {
        if (code[i] === '\\') { i += 2; continue; }
        if (code[i] === '$' && code[i + 1] === '{') { depth++; i += 2; continue; }
        if (code[i] === '}' && depth > 0) { depth--; i++; continue; }
        if (code[i] === '`' && depth === 0) { i++; break; }
        i++;
      }
    } else if (c === "'" || c === '"') {
      const quote = c;
      result += ' ';
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') i += 2;
        else i++;
      }
      i++;
    } else if (c === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
    } else if (c === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
    } else {
      result += c;
      i++;
    }
  }
  return result;
}

// ─── JS Syntax ───
// Catches broken template literals, trailing commas, etc. A single broken
// file takes down the whole app.

section('JS Syntax');
for (const f of jsFiles) {
  test(`${f} parses without error`, () => {
    new vm.Script(readFile(f), { filename: f });
  });
}

// ─── Build Output ───
// index.html is the artifact GitHub Pages serves. If the build is stale
// or missing a module, users see an error.

section('Build Output');

test('index.html exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'index.html')));
});

test('dashboard.html exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'dashboard.html')));
});

test('index.html contains all JS modules', () => {
  const html = readFile('index.html');
  for (const f of jsFiles) {
    assert(html.includes(`// === ${f} ===`), `Missing ${f} in build`);
  }
});

test('index.html contains Firebase SDK', () => {
  assert(readFile('index.html').includes('firebase-app-compat.js'));
});

test('index.html and dashboard.html are identical', () => {
  assert(readFile('index.html') === readFile('dashboard.html'),
    'index.html and dashboard.html differ — run build_inline.py');
});

// ─── Security: Secrets & PII leakage ───
// Incident: calendar events with real names, meetings, and addresses
// were hardcoded in js/app.js init() and inlined into the public
// index.html. Anyone viewing source saw personal schedule data.

section('Security: Secrets & PII Leakage');

test('No hardcoded Anthropic API keys', () => {
  const m = joinedJs.match(/sk-ant-api03-[A-Za-z0-9_-]{20,}/);
  assert(!m, `Leaked Anthropic key: ${m?.[0]}`);
});

test('No hardcoded OpenAI API keys', () => {
  const m = joinedJs.match(/sk-proj-[A-Za-z0-9_-]{20,}/);
  assert(!m, `Leaked OpenAI key: ${m?.[0]}`);
});

test('No hardcoded OpenAI legacy API keys', () => {
  // sk-... with 40+ chars is the old OpenAI format. Be tolerant of false
  // positives (selectors, etc) by requiring the high-entropy pattern.
  const m = joinedJs.match(/["']sk-[A-Za-z0-9]{40,}["']/);
  assert(!m, `Possible leaked OpenAI legacy key: ${m?.[0]}`);
});

test('No hardcoded personal calendar arrays in app.js', () => {
  const content = js('js/app.js');
  // Pattern: store.set('calendarEvents', [  {  ... id ... title ... start ...
  // i.e. a literal non-empty array of event objects. Empty array [] is allowed.
  const bad = content.match(/store\.set\(\s*['"]calendarEvents['"]\s*,\s*\[\s*\{[^\]]*title[^\]]*start/);
  assert(!bad, 'Hardcoded calendar events found in app.js — must load from Firestore per-user');
});

test('No hardcoded Japanese personal name patterns in JS', () => {
  // Looks for a Japanese name (3+ kana/kanji chars) followed by 「さん」 or 「予約」
  // combined with a date/time — strongly suggests real personal data.
  const bad = joinedJs.match(/[一-龥ぁ-んァ-ヶ]{2,4}(さん|予約)[^\n]{0,40}\d{4}-\d{2}-\d{2}/);
  assert(!bad, `Possible personal name + date leak: ${bad?.[0]?.substring(0, 80)}`);
});

test('No hardcoded phone numbers', () => {
  // Japanese mobile: 080/090/070-XXXX-XXXX
  const bad = joinedJs.match(/0[789]0-\d{4}-\d{4}/);
  assert(!bad, `Possible phone number leak: ${bad?.[0]}`);
});

test('No hardcoded email addresses except admin owner', () => {
  const emails = joinedJs.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const allowed = new Set([
    'agewaller@gmail.com',        // admin owner, intentional
    'support@advisers.jp',        // contact email in footer
    'y09082257449@gmail.com',     // in git history only? shouldn't be
  ]);
  // Filter out placeholder-ish patterns and allowed
  const leaked = emails.filter(e => {
    if (allowed.has(e)) return false;
    // Allow Firebase / build-tool domains (e.g. firebase.google.com@)
    if (e.includes('example.') || e.includes('your-')) return false;
    return true;
  });
  assert(leaked.length === 0, `Hardcoded emails found: ${leaked.join(', ')}`);
});

test('Built index.html has no leaked personal names', () => {
  const html = readFile('index.html');
  const names = ['Wakamoto', 'Sheng Wei', 'Matsushita', 'APONTE', '鶴岡信介', '御代川', '加藤隆哉', '石渡翔', '安田雅樹', '藤井宏一郎', '山田崇裕', 'Kazz Watabe'];
  const found = names.filter(n => html.includes(n));
  assert(found.length === 0, `Personal data in built HTML: ${found.join(', ')}`);
});

// ─── Forbidden mobile patterns ───
// Incidents: alert()/confirm() are blocked on some mobile browsers;
// localStorage.clear() wipes Firebase config on logout; signInWithRedirect
// is broken on iOS Safari due to ITP when authDomain ≠ site domain.

section('Mobile Compatibility');

test('No localStorage.clear() calls (use store.clearAll())', () => {
  for (const { name, content } of allJs) {
    if (name === 'js/store.js') continue; // clearAll() may use it internally
    assert(!content.includes('localStorage.clear()'),
      `Found localStorage.clear() in ${name}`);
  }
});

test('No confirm() calls (use app.confirmAction() inline UI)', () => {
  for (const { name, content } of allJs) {
    // Match naked `confirm(` but not `confirmAction(`, `confirmLogout(`, etc.
    const matches = content.match(/(^|[^a-zA-Z_.])confirm\s*\(/g) || [];
    const real = matches.filter(m => !m.match(/[a-zA-Z_]confirm/));
    assert(real.length === 0, `Found confirm() in ${name}`);
  }
});

test('No alert() calls (use Components.showToast())', () => {
  for (const { name, content } of allJs) {
    const matches = content.match(/(^|[^a-zA-Z_.])alert\s*\(/g) || [];
    assert(matches.length === 0, `Found alert() in ${name}`);
  }
});

test('No signInWithRedirect (broken on iOS Safari ITP)', () => {
  for (const { name, content } of allJs) {
    // Allow comments that mention it as documentation
    const codeLines = content.split('\n').filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*');
    }).join('\n');
    assert(!codeLines.includes('signInWithRedirect('),
      `Found signInWithRedirect call in ${name} — use signInWithPopup`);
  }
});

test('signInWithPopup is used for Google auth', () => {
  assert(js('js/firebase-backend.js').includes('signInWithPopup('),
    'Google auth must use signInWithPopup');
});

// ─── Renderer contract ───
// Incident: render_disease_select called app.navigate('login') recursively
// from within a renderer, which raced with the caller's innerHTML
// assignment and blanked the page. Rule: renderers must return HTML
// strings and must NEVER call navigate().

section('Renderer Contract');

test('No render_* function calls navigate() as real code', () => {
  const content = js('js/pages.js');
  const renderMatches = content.match(/App\.prototype\.render_\w+\s*=\s*function/g) || [];
  for (const match of renderMatches) {
    const name = match.match(/render_\w+/)[0];
    const body = extractFunction(content, name);
    if (!body) continue;
    // Strip strings and template literals so onclick="app.navigate(...)"
    // inside HTML string content doesn't trigger a false positive — those
    // run on click, not during render.
    const code = stripStrings(body);
    assert(
      !code.match(/\b(app|this)\.navigate\s*\(/),
      `${name} calls navigate() as real code — renderers must return HTML, not redirect`
    );
  }
});

test('No render_* function sets innerHTML directly', () => {
  const content = js('js/pages.js');
  const renderMatches = content.match(/App\.prototype\.render_\w+\s*=\s*function/g) || [];
  for (const match of renderMatches) {
    const name = match.match(/render_\w+/)[0];
    const body = extractFunction(content, name);
    if (!body) continue;
    const code = stripStrings(body);
    assert(!code.match(/\.innerHTML\s*=/),
      `${name} mutates innerHTML as real code — renderers must return HTML, not write it`);
  }
});

// ─── Cache invalidation contract ───
// Incident: users changed selectedDiseases but the dashboard showed old
// research/actions/feedback because cachedResearch (24h), cachedActions
// (12h) and latestFeedback (persistent) were never cleared. Rule: any
// mutation of selectedDiseases must also clear those three caches.

section('Cache Invalidation Contract');

const CACHES_TO_CLEAR_ON_DISEASE_CHANGE = ['cachedResearch', 'cachedActions', 'latestFeedback'];
const DISEASE_MUTATORS = ['saveDiseaseSettings', 'toggleDiseaseSelection'];

for (const fn of DISEASE_MUTATORS) {
  for (const cache of CACHES_TO_CLEAR_ON_DISEASE_CHANGE) {
    test(`${fn}() invalidates ${cache}`, () => {
      const body = extractFunction(js('js/app.js'), fn);
      assert(body, `${fn} not found in app.js`);
      const pattern = new RegExp(`store\\.set\\(\\s*['"]${cache}['"]\\s*,\\s*null\\s*\\)`);
      assert(pattern.test(body),
        `${fn} must clear ${cache} (e.g. store.set('${cache}', null))`);
    });
  }
}

// ─── Prompt placeholder integrity ───
// Incident: a placeholder used in a prompt template but missing from
// interpolatePrompt() would render as literal "{{X}}" text in the AI
// call, silently degrading results. Ensure the two stay in sync.

section('Prompt Placeholder Integrity');

test('All {{PLACEHOLDER}} in prompts are handled', () => {
  const configSrc = js('js/config.js');
  const interp = extractFunction(js('js/ai-engine.js'), 'interpolatePrompt') || '';
  const analyzeBody = extractFunction(js('js/app.js'), 'analyzeViaAPI') || '';
  const handlers = interp + '\n' + analyzeBody;

  assert(interp.length > 0, 'Could not extract interpolatePrompt() body');
  assert(analyzeBody.length > 0, 'Could not extract analyzeViaAPI() body');

  // Collect placeholders used in config.js (where the prompts live)
  const used = new Set();
  const re = /\{\{([A-Z_]+)\}\}/g;
  let m;
  while ((m = re.exec(configSrc)) !== null) used.add(m[1]);

  // The handlers use patterns like /\{\{SELECTED_DISEASES\}\}/g — we
  // look for the placeholder name literally appearing within a replace()
  // regex that references \{\{NAME\}\}.
  const missing = [];
  for (const name of used) {
    // Match either `\{\{NAME\}\}` (inside a regex literal) or `{{NAME}}` literal.
    const pattern = new RegExp(`\\\\\\{\\\\\\{${name}\\\\\\}\\\\\\}|\\{\\{${name}\\}\\}`);
    if (!pattern.test(handlers)) missing.push(name);
  }

  assert(missing.length === 0,
    `Placeholders used in prompts but not handled: ${missing.join(', ')}`);
});

test('interpolatePrompt handles SELECTED_DISEASES from store', () => {
  const interp = extractFunction(js('js/ai-engine.js'), 'interpolatePrompt');
  assert(interp.includes("store.get('selectedDiseases')"),
    'interpolatePrompt must read selectedDiseases live from store');
});

// ─── Autosync duplication contract ───
// Incident: loadAllData() called store.set() to populate entries from
// Firestore, which fired enableAutoSync() listeners that re-wrote the
// latest loaded entry as a fresh Firestore doc via .add(). Every page
// reload duplicated the newest textEntries/symptoms/vitals record. The
// fix: a _loading flag on FirebaseBackend that autosync listeners check
// before writing, plus marking loaded entries with _synced=true.

section('Autosync Duplication Contract');

test('FirebaseBackend declares a _loading flag', () => {
  const src = js('js/firebase-backend.js');
  assert(/_loading\s*:\s*false/.test(src),
    'FirebaseBackend must declare _loading: false (autosync guard)');
});

test('loadAllData sets _loading true before store.set', () => {
  const rawBody = extractFunction(js('js/firebase-backend.js'), 'loadAllData');
  assert(rawBody, 'loadAllData not found');
  // Strip comments/strings so comments mentioning "store.set" don't
  // match the indexOf search below.
  const body = stripStrings(rawBody);
  const loadingIdx = body.indexOf('this._loading = true');
  const firstSetIdx = body.search(/store\.set\s*\(/);
  assert(loadingIdx >= 0, 'loadAllData must set this._loading = true');
  assert(firstSetIdx < 0 || loadingIdx < firstSetIdx,
    'this._loading = true must come before the first store.set() call');
});

test('loadAllData resets _loading in finally', () => {
  const body = extractFunction(js('js/firebase-backend.js'), 'loadAllData');
  assert(/finally\s*\{[^}]*this\._loading\s*=\s*false/.test(body),
    'loadAllData must reset this._loading = false in a finally block');
});

test('Loaded entries are marked _synced=true', () => {
  const body = extractFunction(js('js/firebase-backend.js'), 'loadAllData');
  assert(/_synced\s*:\s*true/.test(body),
    'Entries loaded from Firestore must carry _synced:true so subsequent ' +
    'store.set() calls don\'t try to re-upload them');
});

test('enableAutoSync listeners check _loading flag', () => {
  const body = extractFunction(js('js/firebase-backend.js'), 'enableAutoSync');
  assert(body, 'enableAutoSync not found');
  assert(body.includes('_loading'),
    'enableAutoSync body has no _loading references at all');

  // Collect names of local helpers that are themselves _loading-guarded.
  // Any store.on() call that delegates to one of these is safe. For each
  // `const NAME = ...` declaration, extract its body via brace matching
  // and check whether _loading appears inside.
  const guardedHelpers = new Set();
  const declRe = /const\s+(\w+)\s*=/g;
  let dm;
  while ((dm = declRe.exec(body)) !== null) {
    const name = dm[1];
    // Find the first `{` after the `=` and extract its body.
    const braceIdx = body.indexOf('{', dm.index + dm[0].length);
    if (braceIdx === -1) continue;
    // Make sure the brace belongs to THIS declaration and not a later one:
    // there must be no `;` between `=` and `{` (allow whitespace, arrows, parens).
    const between = body.substring(dm.index + dm[0].length, braceIdx);
    if (between.includes(';')) continue;
    const helperBody = extractBodyAt(body, braceIdx);
    if (helperBody && helperBody.includes('_loading')) {
      guardedHelpers.add(name);
    }
  }

  // Walk all store.on(...) calls and verify each handler is guarded.
  const onCalls = [];
  let searchFrom = 0;
  while (searchFrom < body.length) {
    const idx = body.indexOf('store.on(', searchFrom);
    if (idx === -1) break;
    // Find the matching closing paren.
    let depth = 1;
    let i = idx + 'store.on('.length;
    while (i < body.length && depth > 0) {
      const c = body[i];
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) break; }
      i++;
    }
    onCalls.push(body.substring(idx, i + 1));
    searchFrom = i + 1;
  }

  assert(onCalls.length > 0, 'no store.on() calls found in enableAutoSync');

  for (const call of onCalls) {
    if (call.includes('_loading')) continue; // inline guard
    let delegated = false;
    for (const helper of guardedHelpers) {
      if (new RegExp(`\\b${helper}\\s*\\(`).test(call)) { delegated = true; break; }
    }
    assert(delegated,
      `store.on listener missing _loading guard and not using a guarded helper: ${call.substring(0, 80).replace(/\n/g, ' ')}`);
  }
});

test('saveHealthEntry uses .add() (so loaded docs must be guarded)', () => {
  // Sanity check: if saveHealthEntry ever switched to .set(id) the
  // duplication bug would not recur, but the _loading contract is still
  // required for other reasons (correctness of analyses writes etc).
  const body = extractFunction(js('js/firebase-backend.js'), 'saveHealthEntry');
  assert(body && body.includes('.add('),
    'saveHealthEntry currently uses .add(); update tests if that changes');
});

test('Firebase offers deduplicateAll() cleanup utility', () => {
  assert(/deduplicateAll\s*\(/.test(js('js/firebase-backend.js')),
    'FirebaseBackend.deduplicateAll() must exist for manual cleanup');
});

// ─── AI terminology hiding ───
// Incident: we explicitly hid "AI" from the user-facing UI, but
// hardcoded strings kept creeping back in. Ensure renderers never use
// the letters "AI" in literal text (aria-label / comments OK).

section('AI Terminology Hidden From Users');

// Allow-list pages that are admin-only (analysis, admin) — these may use AI terminology.
const USER_VISIBLE_RENDERERS = [
  'render_dashboard', 'render_data_input', 'render_actions',
  'render_research', 'render_chat', 'render_integrations',
  'render_settings', 'render_login', 'render_disease_select', 'render_timeline'
];

for (const r of USER_VISIBLE_RENDERERS) {
  test(`${r} contains no user-facing "AI" literal`, () => {
    const body = extractFunction(js('js/pages.js'), `App.prototype.${r}`);
    if (!body) return; // optional renderers
    // Strip HTML comments and JS comments so documentation doesn't trigger.
    const clean = body
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    // Match "AI" as a standalone token (word boundary) that isn't part of
    // identifiers like "chai", "detail", "mail", etc. or Japanese 無い/会い.
    // We look for ">AI", " AI ", "'AI'", '"AI"', "AI分析", "AIで", "AIが".
    const bad = clean.match(/>AI[\s<]|["'`\s]AI[\s"'`.、。]|AI分析|AIで|AIが|AIキー/);
    assert(!bad, `${r} exposes "AI" text: ${bad?.[0]}`);
  });
}

test('Chat avatar does not display literal "AI"', () => {
  const body = extractFunction(js('js/components.js'), 'chatMessage');
  assert(body && !body.match(/>AI</),
    'Chat avatar must not render the literal text "AI"');
});

test('APIキー message is gated behind isAdmin()', () => {
  // analyzeViaAPI no-key fallback must not expose APIキー to regular users
  const body = extractFunction(js('js/app.js'), 'analyzeViaAPI');
  if (!body.includes('APIキー')) return; // no longer uses the term, fine
  // If it mentions APIキー, the same branch must also call isAdmin()
  assert(body.includes('isAdmin'),
    'analyzeViaAPI mentions APIキー without isAdmin() gate');
});

// ─── Admin access control ───
// Incident: saveApiKeys/setModel used to be callable by any user. They
// must check isAdmin() first and write to global config via
// saveGlobalConfig() so all other users inherit the settings.

section('Admin Access Control');

const ADMIN_ONLY_FUNCS = ['saveApiKeys', 'clearApiKeys'];

for (const fn of ADMIN_ONLY_FUNCS) {
  test(`${fn}() checks isAdmin()`, () => {
    const body = extractFunction(js('js/app.js'), fn);
    assert(body, `${fn} not found`);
    assert(body.includes('isAdmin'),
      `${fn} must guard with isAdmin()`);
  });
}

test('saveApiKeys writes to global admin config', () => {
  const body = extractFunction(js('js/app.js'), 'saveApiKeys');
  assert(body.includes('saveGlobalConfig'),
    'saveApiKeys must call FirebaseBackend.saveGlobalConfig so keys propagate to all users');
});

test('loadAllData loads global config', () => {
  const body = extractFunction(js('js/firebase-backend.js'), 'loadAllData');
  assert(body.includes('loadGlobalConfig'),
    'loadAllData must call loadGlobalConfig to inherit admin-managed keys');
});

test('Firestore rules guard admin/* writes by email', () => {
  const rules = readFile('firestore.rules');
  assert(rules.includes('match /admin/'), 'firestore.rules missing admin/ scope');
  // Non-greedy match across lines; [\s\S] rather than [^}] because {docId} has }
  assert(/\/admin\/[\s\S]*?write[\s\S]*?agewaller@gmail\.com/.test(rules),
    'firestore.rules must restrict admin/ writes to admin email');
});

// ─── Store persistence contract ───
// Incident: new store keys were introduced without being added to the
// persistKeys whitelist in store.js, so they would be lost on reload.

section('Store Persistence Contract');

test('selectedDiseases is in persistKeys', () => {
  const storeSrc = js('js/store.js');
  const persistMatch = storeSrc.match(/persistKeys\s*=\s*\[([^\]]+)\]/);
  assert(persistMatch, 'persistKeys array not found in store.js');
  assert(persistMatch[1].includes("'selectedDiseases'"),
    'selectedDiseases must be in persistKeys');
});

test('userProfile is in persistKeys', () => {
  const storeSrc = js('js/store.js');
  assert(storeSrc.match(/persistKeys[\s\S]*?'userProfile'/),
    'userProfile must be in persistKeys');
});

test('cachedResearch and cachedActions are persisted', () => {
  const storeSrc = js('js/store.js');
  assert(storeSrc.includes("'cachedResearch'"), 'cachedResearch missing from persistKeys');
});

test('clearAll() preserves Firebase config', () => {
  const body = extractFunction(js('js/store.js'), 'clearAll');
  assert(body.includes('firebase_config') && body.includes('localStorage.setItem'),
    'clearAll() must preserve and restore firebase_config');
});

// ─── Config integrity ───

section('Config Integrity');

const configSrc = js('js/config.js');

test('CONFIG object is defined', () => {
  assert(configSrc.includes('var CONFIG'), 'CONFIG not found');
});

test('DISEASE_CATEGORIES exist', () => {
  assert(configSrc.includes('DISEASE_CATEGORIES'));
});

test('PROMPT_HEADER exists', () => {
  assert(configSrc.includes('PROMPT_HEADER'));
});

test('INLINE_PROMPTS has required entries', () => {
  for (const key of ['text_analysis', 'image_analysis', 'conversation_analysis',
                     'product_recommendations', 'action_recommendations']) {
    assert(configSrc.includes(key + ':'),
      `INLINE_PROMPTS missing ${key}`);
  }
});

test('Firebase config authDomain is set', () => {
  assert(configSrc.match(/authDomain:\s*['"][^'"]+['"]/),
    'Firebase authDomain required for auth to work');
});

// ─── Build script presence ───

section('Build Script & Docs');

test('build_inline.py exists in repo', () => {
  assert(fs.existsSync(path.join(ROOT, 'build_inline.py')),
    'build_inline.py missing — build fails in fresh sessions');
});

test('build_inline.py references all JS files', () => {
  const build = readFile('build_inline.py');
  for (const f of jsFiles) {
    assert(build.includes(f), `${f} missing from build_inline.py`);
  }
});

test('CLAUDE.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'CLAUDE.md')));
});

test('CLAUDE.md under 200 lines (concise project guide)', () => {
  const content = readFile('CLAUDE.md');
  const lines = content.split('\n').length;
  assert(lines < 200, `CLAUDE.md is ${lines} lines — keep under 200`);
});

// ─── Summary ───

console.log(`\n${'─'.repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${'─'.repeat(50)}\n`);

if (failed > 0) {
  console.log('FAILURES:');
  failures.forEach(f => console.log(`  • ${f.name}\n    ${f.message}`));
  console.log('');
}

process.exit(failed > 0 ? 1 : 0);
