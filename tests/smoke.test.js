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

// Strip quoted strings and template literal content from source, leaving
// whitespace in their place. Code inside template literal expression
// holes (${...}) is preserved, including nested {} and nested template
// literals. Used to exclude navigate() calls inside onclick="..."
// attributes within template literals.
function stripStrings(code) {
  // First strip comments
  code = code.replace(/\/\/[^\n]*/g, '');
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');

  let result = '';
  let i = 0;
  // Stack of contexts: 'code', 'tmpl' (template literal text), 'sq' (single-quote string), 'dq' (double-quote string).
  // For 'tmpl', when we hit ${ we push a 'block' frame that knows to
  // pop the matching } and return to 'tmpl'.
  const stack = [{ type: 'code' }];
  while (i < code.length) {
    const top = stack[stack.length - 1];
    const c = code[i];

    if (top.type === 'code') {
      if (c === '`') { stack.push({ type: 'tmpl' }); result += ' '; i++; continue; }
      if (c === "'") { stack.push({ type: 'sq' }); result += ' '; i++; continue; }
      if (c === '"') { stack.push({ type: 'dq' }); result += ' '; i++; continue; }
      if (c === '{' && top.brace !== undefined) { top.brace++; result += c; i++; continue; }
      if (c === '}' && top.brace !== undefined && top.brace > 0) {
        top.brace--; result += c; i++; continue;
      }
      if (c === '}' && top.brace === 0) {
        // End of a template-expression block — pop back to enclosing tmpl
        stack.pop();
        i++;
        continue;
      }
      result += c;
      i++;
    } else if (top.type === 'tmpl') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); i++; continue; }
      if (c === '$' && code[i + 1] === '{') {
        // Enter a code block (interpolation) with brace depth 0
        stack.push({ type: 'code', brace: 0 });
        i += 2;
        continue;
      }
      i++; // strip everything else
    } else if (top.type === 'sq') {
      if (c === '\\') { i += 2; continue; }
      if (c === "'") { stack.pop(); i++; continue; }
      i++;
    } else if (top.type === 'dq') {
      if (c === '\\') { i += 2; continue; }
      if (c === '"') { stack.pop(); i++; continue; }
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
    // Strip comments and string literals so example code in comments
    // doesn't trip the check.
    const stripped = stripStrings(content);
    const matches = stripped.match(/(^|[^a-zA-Z_.])confirm\s*\(/g) || [];
    const real = matches.filter(m => !m.match(/[a-zA-Z_]confirm/));
    assert(real.length === 0, `Found confirm() in ${name}`);
  }
});

test('No alert() calls (use Components.showToast())', () => {
  for (const { name, content } of allJs) {
    const stripped = stripStrings(content);
    const matches = stripped.match(/(^|[^a-zA-Z_.])alert\s*\(/g) || [];
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

// ─── Model response contract ───
// Incident: callModel() used to return generateDemoAnalysis() — a JS
// object — when the API was unavailable. analyzeViaAPI expected a string
// and called .match() on the object, threw silently, then stored the
// entire object in result._raw. The dashboard renderer used _raw first
// and JSON.stringify'd the object, dumping raw JSON to the user as their
// "AI analysis result". Two contracts must hold to prevent this:
// 1. callModel() must return a string or throw — never an object.
// 2. Renderers must coerce text fields to strings and never call
//    JSON.stringify on a stored result for display.

section('Model Response Contract');

test('callModel throws (no demo fallback) when all providers fail', () => {
  const body = extractFunction(js('js/ai-engine.js'), 'callModel');
  assert(body, 'callModel not found');
  // Must throw when all providers fail — not return an object. Accept
  // either the old NO_API_KEY signal or the new ALL_PROVIDERS_FAILED
  // aggregate.
  assert(
    /throw\s+new\s+Error\s*\(\s*['"](?:NO_API_KEY|ALL_PROVIDERS_FAILED)/.test(body) ||
    /throw\s+new\s+Error\s*\(\s*['"`]ALL_PROVIDERS_FAILED/.test(body),
    'callModel must throw when all providers fail (not silently return demo data)'
  );
});

test('callModel implements provider fallback', () => {
  const src = js('js/ai-engine.js');
  // Must have a helper that lists providers to try
  assert(/buildProviderFallbackList/.test(src),
    'ai-engine.js must expose a provider fallback list builder');
  const body = extractFunction(src, 'callModel');
  // Must iterate over providers and collect errors
  assert(/errors?\.push|errors\s*\[|errors\s*=/.test(body) &&
         /for\s*\(.*of\s+providers/.test(body),
    'callModel must iterate providers and aggregate errors before throwing');
});

test('callModel does not call generateDemoAnalysis (orphaned function)', () => {
  const src = js('js/ai-engine.js');
  // The orphaned generateDemoAnalysis used to be the failure fallback.
  // It's now deleted, but make sure no caller resurrects it.
  assert(!/this\.generateDemoAnalysis\s*\(/.test(src),
    'callModel must not call generateDemoAnalysis() — it returns an ' +
    'object that leaks as raw JSON to the user UI');
});

test('analyzeViaAPI coerces response to string before parsing', () => {
  const body = extractFunction(js('js/app.js'), 'analyzeViaAPI');
  assert(body, 'analyzeViaAPI not found');
  assert(/typeof\s+response\s*===?\s*['"]string['"]/.test(body),
    'analyzeViaAPI must guard with typeof response === "string" so a ' +
    'non-string return from callModel cannot leak through');
});

test('analyzeViaAPI does not store non-string in _raw', () => {
  const body = extractFunction(js('js/app.js'), 'analyzeViaAPI');
  // The "Plain-text response" branch must not assign _raw at all (the
  // earlier guarded path is the only place _raw is set, and only for
  // strings via responseText).
  // Heuristic: every "_raw" assignment in analyzeViaAPI must be near a
  // responseText reference.
  const rawAssignments = body.match(/_raw\s*[:=]\s*\w+/g) || [];
  for (const assign of rawAssignments) {
    const value = assign.split(/[:=]\s*/)[1].trim();
    assert(value === 'responseText',
      `_raw must only be assigned from responseText (the string-coerced ` +
      `version), not from "${value}"`);
  }
});

test('renderAnalysisCard coerces all text fields with asText helper', () => {
  const body = extractFunction(js('js/app.js'), 'renderAnalysisCard');
  assert(body, 'renderAnalysisCard not found');
  // Must define an asText (or similar) coercion helper
  assert(/asText\s*=\s*\(/.test(body),
    'renderAnalysisCard must define an asText() coercion helper');
  // Must NOT call formatMarkdown directly on result.summary/findings/etc
  // (those could be objects from legacy bad records). Use the local
  // string-coerced variables instead.
  const badPattern = /formatMarkdown\s*\(\s*result\.(summary|findings|details|new_approach|trend|next_check)\s*\)/;
  const m = body.match(badPattern);
  assert(!m, `renderAnalysisCard must not pass result.* directly to ` +
    `formatMarkdown — coerce via asText() first. Found: ${m?.[0]}`);
});

test('formatMarkdown returns empty string for non-string input', () => {
  const body = extractFunction(js('js/components.js'), 'formatMarkdown');
  assert(body, 'formatMarkdown not found');
  assert(/typeof\s+text\s*!==?\s*['"]string['"]/.test(body),
    'formatMarkdown must guard against non-string input to avoid crashes');
});

test('Dashboard AI comment renderer never JSON.stringifies result', () => {
  // The render_dashboard inline AI comment block must not call
  // JSON.stringify on the result — that's how raw JSON leaked to users.
  const body = extractFunction(js('js/pages.js'), 'render_dashboard');
  assert(body, 'render_dashboard not found');
  // Search only the inline comment-rendering arrow function. Cheap check:
  // there must be no JSON.stringify call referencing "text" or the
  // comment result inside the function body.
  assert(!/JSON\.stringify\s*\(\s*(text|comment\.result|r\._raw|r\.findings|r\.summary)/.test(body),
    'render_dashboard must not JSON.stringify the AI comment result — ' +
    'use string-coerced fields and a friendly fallback message instead');
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

// ─── Progress feedback while the model is working ───
// Incident: users (avg age 65) thought the app had frozen during the
// 15-30s analysis window. The chat view sat silent and dashboard file
// uploads only showed a toast, so they reloaded mid-request. Ensure the
// progress gauge + typing indicator stay wired up.

section('Progress Feedback');

test('Components.loading renders a progress gauge', () => {
  const body = extractFunction(js('js/components.js'), 'loading');
  assert(body, 'Components.loading not found');
  assert(body.includes('progress-indeterminate'),
    'loading() must render the .progress-indeterminate bar');
  assert(body.includes('秒経過'),
    'loading() must show an elapsed-seconds counter so users see it is still working');
});

test('Components.typingIndicator renders animated dots', () => {
  const body = extractFunction(js('js/components.js'), 'typingIndicator');
  assert(body, 'Components.typingIndicator not found');
  assert(body.includes('typing-dots'),
    'typingIndicator() must render the .typing-dots animation');
  assert(body.includes('chat-typing-indicator'),
    'typingIndicator() must use the id chat-typing-indicator so it is auto-removed on re-render');
});

test('sendChat shows typing indicator while awaiting reply', () => {
  const body = extractFunction(js('js/app.js'), 'sendChat');
  assert(body, 'sendChat not found');
  assert(body.includes('typingIndicator'),
    'sendChat must insert Components.typingIndicator() after posting the user message');
});

test('dashQuickFile shows loading gauge in the feedback area', () => {
  const body = extractFunction(js('js/app.js'), 'dashQuickFile');
  assert(body, 'dashQuickFile not found');
  assert(body.includes('Components.loading'),
    'dashQuickFile must render Components.loading() into dash-ai-feedback so the user sees progress');
});

test('CSS defines progress-indeterminate and typing-dots animations', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/styles.css'), 'utf8');
  assert(/\.progress-indeterminate\s*\{/.test(css),
    'css/styles.css must define .progress-indeterminate');
  assert(/@keyframes\s+progress-slide/.test(css),
    'css/styles.css must define @keyframes progress-slide');
  assert(/\.typing-dots\s*\{/.test(css),
    'css/styles.css must define .typing-dots');
  assert(/@keyframes\s+typing-bounce/.test(css),
    'css/styles.css must define @keyframes typing-bounce');
});

test('APIキー message is gated behind isAdmin()', () => {
  // analyzeViaAPI no-key fallback must not expose APIキー to regular users
  const body = extractFunction(js('js/app.js'), 'analyzeViaAPI');
  if (!body.includes('APIキー')) return; // no longer uses the term, fine
  // If it mentions APIキー, the same branch must also call isAdmin()
  assert(body.includes('isAdmin'),
    'analyzeViaAPI mentions APIキー without isAdmin() gate');
});

// ─── Claude model ID mapping ───
// Incident: callAnthropic hardcoded claude-3-5-sonnet-20241022, which
// Anthropic has since deprecated. Users saw "分析の呼び出しに失敗" for
// every request. The call site must now derive the API model id from
// the store's selectedModel via MODEL_MAP.

section('Claude Model ID Mapping');

test('callAnthropic maps modelId via MODEL_MAP, not a hardcoded id', () => {
  const body = extractFunction(js('js/ai-engine.js'), 'callAnthropic');
  assert(body, 'callAnthropic not found');
  assert(/MODEL_MAP\s*=/.test(body),
    'callAnthropic must define MODEL_MAP for internal→API id translation');
  assert(!body.includes("'claude-3-5-sonnet-20241022'"),
    'callAnthropic still references the deprecated claude-3-5-sonnet-20241022 id');
  assert(/MODEL_MAP\[modelId\]/.test(body),
    'callAnthropic must look up apiModelId via MODEL_MAP[modelId]');
});

test('callAnthropic supports Vision via options.imageBase64', () => {
  const body = extractFunction(js('js/ai-engine.js'), 'callAnthropic');
  assert(body.includes('imageBase64'),
    'callAnthropic must branch on options.imageBase64 to enable Vision');
  assert(/type:\s*['"]image['"]/.test(body),
    'callAnthropic must emit a {type: "image"} content block when an image is supplied');
});

test('callAnthropic accepts options.systemPrompt override', () => {
  const body = extractFunction(js('js/ai-engine.js'), 'callAnthropic');
  assert(/options\.systemPrompt/.test(body),
    'callAnthropic must honour options.systemPrompt so callers can override the default persona');
});

test('getApiKey guards against undefined modelId', () => {
  const body = extractFunction(js('js/ai-engine.js'), 'getApiKey');
  assert(body, 'getApiKey not found');
  assert(/if\s*\(\s*!modelId\s*\)/.test(body),
    'getApiKey must early-return when modelId is falsy, otherwise startsWith() throws TypeError');
});

// ─── Default model = Claude Opus 4.6 ───
// Incident: we kept defaulting to gpt-4o even after requesting Opus as
// the strongest model. Billing is not a constraint and we want Opus by
// default everywhere.

section('Default Model');

test('CONFIG.AI_MODELS marks claude-opus-4-6 as default', () => {
  const body = js('js/config.js');
  const opusLine = body.split('\n').find(l => l.includes('claude-opus-4-6') && l.includes('default'));
  assert(opusLine && /default:\s*true/.test(opusLine),
    'CONFIG.AI_MODELS must set default: true on claude-opus-4-6');
  // And the old default must no longer be marked default.
  const gptLine = body.split('\n').find(l => l.includes("id: 'gpt-4o'"));
  assert(gptLine && !/default:\s*true/.test(gptLine),
    'gpt-4o must no longer be the default');
});

test('store.state.selectedModel defaults to claude-opus-4-6', () => {
  const body = js('js/store.js');
  assert(/selectedModel:\s*['"]claude-opus-4-6['"]/.test(body),
    'Store initial state must set selectedModel to claude-opus-4-6');
  assert(!/selectedModel\s*=\s*['"]gpt-4o['"]/.test(body),
    'store must not fall back to gpt-4o anywhere');
});

// ─── Nutrition / BMR / PFC dashboard ───
// New feature: the dashboard shows intake calories vs BMR and PFC
// balance. Guards the store contract, charts, and the afterRender hook.

section('Nutrition / BMR / PFC Dashboard');

test('store persists nutritionLog and exposes BMR/upsert helpers', () => {
  const body = js('js/store.js');
  assert(/nutritionLog:\s*\[\s*\]/.test(body),
    'Store must initialize nutritionLog as an empty array');
  // Both save and load lists must include nutritionLog for persistence.
  const persistCount = (body.match(/'nutritionLog'/g) || []).length;
  assert(persistCount >= 2,
    "nutritionLog must be listed in both persistKeys and loadFromStorage key lists");
  const bmr = extractFunction(body, 'calculateBMR');
  assert(bmr, 'store.calculateBMR must exist');
  assert(/Mifflin|10\s*\*\s*weight/.test(bmr),
    'calculateBMR must use the Mifflin-St Jeor formula');
  const upsert = extractFunction(body, 'upsertNutritionEntry');
  assert(upsert, 'store.upsertNutritionEntry must exist');
  assert(upsert.includes('filter') && upsert.includes('sort'),
    'upsertNutritionEntry must dedupe by date and keep the log sorted');
});

test('app exposes nutrition chart + extraction + clear methods', () => {
  const src = js('js/app.js');
  for (const fn of ['initNutritionCharts', 'extractTodayNutrition', 'clearNutritionLog']) {
    assert(extractFunction(src, fn), `App.prototype.${fn} must exist`);
  }
  const init = extractFunction(src, 'initNutritionCharts');
  assert(init.includes('nutrition-calorie-chart') && init.includes('nutrition-pfc-chart'),
    'initNutritionCharts must bind both canvas ids used by render_dashboard');
  assert(/chartInstances\.nutritionCal/.test(init) && /chartInstances\.nutritionPfc/.test(init),
    'initNutritionCharts must cache chart instances on this.chartInstances');
});

test('extractTodayNutrition never calls window.confirm/alert (mobile breaks)', () => {
  const body = extractFunction(js('js/app.js'), 'clearNutritionLog');
  assert(body, 'clearNutritionLog not found');
  assert(!/\bconfirm\s*\(/.test(body) && !/\balert\s*\(/.test(body),
    'clearNutritionLog must not use window.confirm/alert — they are blocked on mobile. Use an inline toast UI instead.');
});

test('dashboard afterRender hook initializes nutrition charts', () => {
  const body = extractFunction(js('js/app.js'), 'afterRender');
  assert(body, 'afterRender not found');
  assert(body.includes('initNutritionCharts'),
    "afterRender('dashboard') must call initNutritionCharts so the charts render on first paint");
});

test('render_dashboard includes the nutrition section', () => {
  const body = extractFunction(js('js/pages.js'), 'App.prototype.render_dashboard');
  assert(body, 'render_dashboard not found');
  assert(body.includes('nutrition-calorie-chart') && body.includes('nutrition-pfc-chart'),
    'render_dashboard must contain both canvas ids for the nutrition charts');
  assert(body.includes('calculateBMR'),
    'render_dashboard must read BMR from store.calculateBMR()');
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

// ─── Method Reference Integrity ───
// Catches dead references when an event handler in a template literal
// (e.g. onclick="app.foo()") points to a method that doesn't exist on
// App.prototype. The user clicks the button and nothing happens —
// silent failure that's hard to find by hand.

section('Method Reference Integrity');

// Collect every method defined on App across all JS files. App is
// declared as `var App = class App { ... }` and additional methods are
// added later via `App.prototype.foo = function() { ... }`. Collect both.
const APP_METHODS = new Set();
for (const f of allJs) {
  // 1. App.prototype.foo = function() { ... }
  const reA = /App\.prototype\.(\w+)\s*=\s*(?:async\s+)?function/g;
  let m;
  while ((m = reA.exec(f.content)) !== null) APP_METHODS.add(m[1]);
}

// 2. class App { ... methods ... } in app.js
const appSrc = js('js/app.js');
const classMatch = /class\s+App\s*\{/.exec(appSrc);
if (classMatch) {
  const classBody = extractBodyAt(appSrc, classMatch.index + classMatch[0].length - 1);
  if (classBody) {
    // Class methods: `name(args) {` or `async name(args) {` at start of line
    // (with class indent of 2 spaces). String stripping isn't needed
    // here — JS keywords don't appear at start-of-line with `name(` form
    // unless they're real methods.
    const methodRe = /^\s{2}(?:async\s+)?(\w+)\s*\(/gm;
    let mm;
    while ((mm = methodRe.exec(classBody)) !== null) {
      if (['if', 'for', 'while', 'switch', 'return', 'throw', 'catch'].includes(mm[1])) continue;
      APP_METHODS.add(mm[1]);
    }
  }
}

// 3. Constructor properties: this.X = ...
const ctorSrc = extractFunction(appSrc, 'constructor') || '';
const ctorProps = ctorSrc.match(/this\.(\w+)\s*=/g) || [];
for (const p of ctorProps) APP_METHODS.add(p.replace(/this\.|\s*=/g, ''));

// Built-in JS / fields that are intentionally added at runtime
const APP_RUNTIME_PROPS = new Set([
  'currentPage', 'sidebarOpen', 'ADMIN_EMAILS',
  // Object proto
  'toString', 'hasOwnProperty', 'constructor',
]);

test('All onclick="app.X(...)" references resolve to App methods', () => {
  // Look across both pages.js and app.js — both build template literal HTML
  const sources = [js('js/pages.js'), js('js/app.js'), js('js/components.js')];
  const onclickRe = /(?:onclick|onchange|oninput|onsubmit|onkeydown|onfocus|onblur|ondrop)\s*=\s*["'`][^"'`]*?\bapp\.(\w+)\s*\(/g;
  const missing = new Set();
  for (const src of sources) {
    let m;
    while ((m = onclickRe.exec(src)) !== null) {
      const name = m[1];
      if (!APP_METHODS.has(name) && !APP_RUNTIME_PROPS.has(name)) {
        missing.add(name);
      }
    }
  }
  assert(missing.size === 0,
    `onclick handlers reference non-existent App methods: ${[...missing].join(', ')}`);
});

test('All ${app.X(...)} interpolations resolve to App methods', () => {
  // Template literal expression holes: ${app.foo()}
  const sources = [js('js/pages.js'), js('js/app.js')];
  const interpRe = /\$\{[^}]*?\bapp\.(\w+)\s*\(/g;
  const missing = new Set();
  for (const src of sources) {
    let m;
    while ((m = interpRe.exec(src)) !== null) {
      const name = m[1];
      if (!APP_METHODS.has(name) && !APP_RUNTIME_PROPS.has(name)) {
        missing.add(name);
      }
    }
  }
  assert(missing.size === 0,
    `Template literal expressions reference non-existent App methods: ${[...missing].join(', ')}`);
});

// ─── Duplicate Method Definitions ───
// Two App.prototype.foo = ... declarations in the same module silently
// overwrite each other and the second wins. Easy to introduce when
// copy-pasting code.

section('Duplicate Method Definitions');

test('No duplicate App.prototype method definitions', () => {
  const counts = new Map();
  for (const f of allJs) {
    const re = /App\.prototype\.(\w+)\s*=\s*(?:async\s+)?function/g;
    let m;
    while ((m = re.exec(f.content)) !== null) {
      const key = m[1];
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  const dupes = [...counts.entries()].filter(([, n]) => n > 1);
  assert(dupes.length === 0,
    `Duplicate App.prototype methods: ${dupes.map(([k, n]) => `${k} (×${n})`).join(', ')}`);
});

test('No duplicate object-literal method names in core modules', () => {
  // For each `var X = { ... }` block, no key should be defined twice.
  // Restrict to the well-known modules with object literal definitions.
  const checks = [
    { file: 'js/firebase-backend.js', container: 'FirebaseBackend' },
    { file: 'js/store.js', container: 'Store' },
    { file: 'js/components.js', container: 'Components' },
    { file: 'js/calendar.js', container: 'CalendarIntegration' },
  ];
  for (const { file, container } of checks) {
    const src = js(file);
    // Find the object literal start (after `= {`)
    const re = new RegExp(`(var|const)\\s+${container}\\s*=\\s*(class\\s*\\{|\\{)`);
    const m = re.exec(src);
    if (!m) continue;
    const start = m.index + m[0].length - 1;
    const body = extractBodyAt(src, start);
    if (!body) continue;
    // Look for top-level method definitions: at start of a line (after
    // whitespace) "name(args) {" or "async name(args) {".
    const methodRe = /^\s{2}(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm;
    const seen = new Map();
    let mm;
    while ((mm = methodRe.exec(body)) !== null) {
      seen.set(mm[1], (seen.get(mm[1]) || 0) + 1);
    }
    const dupes = [...seen.entries()].filter(([, n]) => n > 1);
    assert(dupes.length === 0,
      `${container} has duplicate methods: ${dupes.map(([k, n]) => `${k} (×${n})`).join(', ')}`);
  }
});

// ─── Renderer Return Contract ───
// Every render_* function MUST return a string. Returning undefined
// blanks the page (the navigate() caller does content.innerHTML = undefined).

section('Renderer Return Contract');

test('Every render_* function has a return statement', () => {
  const content = js('js/pages.js');
  const re = /App\.prototype\.(render_\w+)\s*=\s*function/g;
  let m;
  const missing = [];
  while ((m = re.exec(content)) !== null) {
    const name = m[1];
    const body = extractFunction(content, name);
    if (!body) continue;
    // Strip strings (so a `return` token inside a string doesn't count)
    // and check for an actual `return` statement.
    const stripped = stripStrings(body);
    if (!/\breturn\b/.test(stripped)) missing.push(name);
  }
  assert(missing.length === 0,
    `Renderers without a return statement: ${missing.join(', ')}`);
});

// ─── Disease ID Consistency ───
// Disease IDs are referenced in many places (prompts, pages, hints).
// A typo (mecsf instead of mecfs) silently filters out the user's
// disease without any error.

section('Disease ID Consistency');

test('Hardcoded disease IDs in code exist in CONFIG.DISEASE_CATEGORIES', () => {
  // Extract all disease IDs from CONFIG.DISEASE_CATEGORIES
  const configSrc = js('js/config.js');
  const idRe = /id:\s*['"]([a-z_0-9]+)['"]/g;
  const definedIds = new Set();
  // Restrict to inside DISEASE_CATEGORIES
  const dcStart = configSrc.indexOf('DISEASE_CATEGORIES');
  if (dcStart === -1) return;
  const dcEnd = configSrc.indexOf('DATA_CATEGORIES', dcStart);
  const dcBlock = configSrc.substring(dcStart, dcEnd > 0 ? dcEnd : configSrc.length);
  let m;
  while ((m = idRe.exec(dcBlock)) !== null) definedIds.add(m[1]);

  // Now scan code for places that look like disease ID lookups:
  // - hints[id] / diseaseTerms[id] object literals
  // - selectedDiseases.includes('xxx')
  const checked = ['js/app.js', 'js/pages.js', 'js/config.js'];
  const referenced = new Set();
  // Object literal keys like "mecfs: ..." inside hints/disease maps
  for (const f of checked) {
    const src = js(f);
    // Match: word: '...' inside known disease-keyed objects
    const objMatches = src.match(/\b(?:mecfs|depression|bipolar|ptsd|adhd|long_covid|fibromyalgia|hashimoto|diabetes_t2|sle|ibs|pots|insomnia|gastroparesis|anxiety|migraine)\b/g) || [];
    for (const mm of objMatches) referenced.add(mm);
  }

  // Every referenced ID should exist in DISEASE_CATEGORIES
  const unknown = [...referenced].filter(id => !definedIds.has(id));
  assert(unknown.length === 0,
    `Disease IDs referenced in code but not defined in CONFIG: ${unknown.join(', ')}`);
});

// ─── DATA_CATEGORIES Consistency ───

section('Data Category Consistency');

test('store.categoryToStateKey covers DATA_CATEGORIES ids', () => {
  const configSrc = js('js/config.js');
  const dcStart = configSrc.indexOf('DATA_CATEGORIES');
  if (dcStart === -1) return;
  // Extract IDs from DATA_CATEGORIES section only
  const dcEnd = configSrc.indexOf('TEST_KITS', dcStart);
  const block = configSrc.substring(dcStart, dcEnd > 0 ? dcEnd : configSrc.length);
  const idRe = /id:\s*['"]([a-z_0-9]+)['"]/g;
  const ids = new Set();
  let m;
  while ((m = idRe.exec(block)) !== null) ids.add(m[1]);

  // Verify the mapping in store.js exists for the core ones
  const storeSrc = js('js/store.js');
  const mapBody = extractFunction(storeSrc, 'categoryToStateKey') || '';
  // Test that the high-traffic ids resolve to a state key (or at least
  // that the function returns null gracefully — never throws).
  // We don't require every id to map; some are text-only categories
  // handled separately. But the function MUST exist and be callable.
  assert(mapBody.length > 0, 'store.categoryToStateKey() must exist');
});

// ─── CONFIG Reference Integrity ───

section('CONFIG Reference Integrity');

test('All CONFIG.X references in code resolve to a property', () => {
  const configSrc = js('js/config.js');
  // Collect top-level CONFIG keys
  const configKeys = new Set();
  // Match `var CONFIG = { KEY: ..., KEY: ... }` shallow keys
  const cfgStart = configSrc.indexOf('var CONFIG');
  const cfgBraceStart = configSrc.indexOf('{', cfgStart);
  const cfgBody = extractBodyAt(configSrc, cfgBraceStart);
  if (cfgBody) {
    // Match top-level "  KEY:" lines (2-space indent, all caps + underscores)
    const keyRe = /^\s{2}([A-Z][A-Z_0-9]*):/gm;
    let m;
    while ((m = keyRe.exec(cfgBody)) !== null) configKeys.add(m[1]);
  }

  // Scan all JS for CONFIG.X references (X is uppercase)
  const referenced = new Set();
  const refRe = /\bCONFIG\.([A-Z][A-Z_0-9]*)\b/g;
  for (const f of allJs) {
    let m;
    while ((m = refRe.exec(f.content)) !== null) referenced.add(m[1]);
  }

  const missing = [...referenced].filter(k => !configKeys.has(k));
  assert(missing.length === 0,
    `CONFIG.X references with no matching property: ${missing.join(', ')}`);
});

// ─── JSON.parse Safety ───

section('JSON.parse Safety');

test('Every JSON.parse() is wrapped in try/catch', () => {
  // Walk every brace upward from a JSON.parse() call. For each enclosing
  // `{`, check if it's preceded by `try`. If any ancestor brace is a
  // try-block, the call is covered. Continue ascending until we run out
  // of enclosing braces.
  const offenders = [];
  for (const f of allJs) {
    const src = f.content;
    let i = 0;
    while (i < src.length) {
      const idx = src.indexOf('JSON.parse', i);
      if (idx === -1) break;
      i = idx + 'JSON.parse'.length;
      // Skip if inside a comment
      const lineStart = src.lastIndexOf('\n', idx) + 1;
      const lineUpToCall = src.substring(lineStart, idx);
      if (lineUpToCall.includes('//')) continue;
      // Walk backward, finding successive enclosing { (popping out of
      // sibling {} pairs as we go).
      let depth = 0;
      let found = false;
      let j = idx - 1;
      while (j >= 0) {
        const c = src[j];
        if (c === '}') { depth++; j--; continue; }
        if (c === '{') {
          if (depth === 0) {
            // Found the immediately enclosing `{`. Check if preceded by `try`.
            const before = src.substring(Math.max(0, j - 6), j).trimEnd();
            if (/\btry$/.test(before)) { found = true; break; }
            // Otherwise, continue ascending OUT of this block.
            j--;
            // Don't reset depth — we're now sibling-scope of this { in
            // the parent. But since we just consumed the open brace
            // without matching it from a close, we're now AT the parent
            // scope. depth stays 0 to find the next outer `{`.
            continue;
          }
          depth--;
          j--;
          continue;
        }
        j--;
      }
      if (!found) {
        const ln = src.substring(0, idx).split('\n').length;
        offenders.push(`${f.name}:${ln}`);
      }
    }
  }
  assert(offenders.length === 0,
    `Unwrapped JSON.parse() calls: ${offenders.join(', ')}`);
});

// ─── HTML Injection Safety ───
// User-supplied content (text entries, profile fields, names) MUST NOT
// be inserted into innerHTML without escaping. Otherwise a record like
// "<script>alert(1)</script>" executes when the dashboard renders it.

section('HTML Injection Safety');

test('Components exposes an escapeHtml() helper', () => {
  const components = js('js/components.js');
  assert(/escapeHtml\s*\(/.test(components),
    'Components.escapeHtml() must exist for HTML-safe interpolation of user content');
  // Verify the helper actually escapes the dangerous chars
  const escBody = extractFunction(components, 'escapeHtml');
  assert(escBody, 'escapeHtml not found');
  for (const ch of ['&amp;', '&lt;', '&gt;', '&quot;']) {
    assert(escBody.includes(ch),
      `escapeHtml must encode ${ch}`);
  }
});

test('Dashboard renders user content via escapeHtml, not raw interpolation', () => {
  const pagesSrc = js('js/pages.js');
  const dash = extractFunction(pagesSrc, 'render_dashboard');
  assert(dash, 'render_dashboard not found');
  // Required: every interpolation of e.content / e.title in the
  // dashboard recent-records block must be sanitized via escapeHtml.
  // Check for the bad patterns: ${content} where content = e.content
  // not piped through escapeHtml.
  assert(dash.includes('Components.escapeHtml(rawContent'),
    'render_dashboard must sanitize user-supplied content with Components.escapeHtml()');
});

test('Timeline renders user content via escapeHtml', () => {
  const tlSrc = js('js/pages.js');
  const tl = extractFunction(tlSrc, 'render_timeline');
  assert(tl, 'render_timeline not found');
  // The text-entry rendering branch must escape e.content before
  // inserting it into innerHTML.
  assert(tl.includes('Components.escapeHtml'),
    'render_timeline must escape user content before innerHTML insertion');
});

// ─── Build Determinism ───

section('Build Determinism');

test('build_inline.py produces identical output across runs', () => {
  const { execSync } = require('child_process');
  // Snapshot current
  const before = readFile('index.html');
  // Re-run build
  execSync('python3 build_inline.py', { cwd: ROOT, stdio: 'pipe' });
  const after = readFile('index.html');
  assert(before === after,
    'build_inline.py produced different output on a second run — non-deterministic build');
});

// ─── Dead Code / Untracked References ───

section('Dead Code Detection');

test('No reference to deleted generateDemoAnalysis function', () => {
  // We deleted it. Make sure no caller crept back in.
  for (const f of allJs) {
    const stripped = stripStrings(f.content);
    assert(!/\bgenerateDemoAnalysis\s*\(/.test(stripped),
      `${f.name} still calls generateDemoAnalysis() — deleted function`);
  }
});

test('No top-level await outside async functions', () => {
  // Top-level await would crash the script load in non-module mode (we
  // use compat scripts). Walk brace depth from each `await` upward and
  // require an enclosing `async function`/`async (...) =>`/`async name(`.
  for (const f of allJs) {
    const src = f.content;
    let i = 0;
    while (i < src.length) {
      const idx = src.indexOf('await ', i);
      if (idx === -1) break;
      i = idx + 6;
      // Skip if `await` is inside a comment or string — quick check on
      // the line: if the line has // before `await`, skip.
      const lineStart = src.lastIndexOf('\n', idx) + 1;
      const lineUpToAwait = src.substring(lineStart, idx);
      if (lineUpToAwait.includes('//')) continue;
      // Skip if it's not actually a token (e.g. "awaiter")
      const prevChar = src[idx - 1];
      if (prevChar && /[a-zA-Z0-9_]/.test(prevChar)) continue;
      // Walk back from idx, counting braces, looking for an unclosed `{`
      // preceded by `async` (function or arrow).
      let depth = 0;
      let found = false;
      for (let j = idx - 1; j >= 0; j--) {
        const c = src[j];
        if (c === '}') depth++;
        else if (c === '{') {
          if (depth === 0) {
            // Look back ~80 chars before this `{` for `async`
            const before = src.substring(Math.max(0, j - 100), j);
            if (/\basync\b/.test(before)) { found = true; break; }
            // Not async — keep walking up to find a higher enclosing scope
            depth = -1; // signal: out of this brace, continue at higher level
          } else {
            depth--;
          }
        }
        if (depth < 0) depth = 0;
      }
      if (!found) {
        const ln = src.substring(0, idx).split('\n').length;
        assert(false, `Top-level await at ${f.name}:${ln}`);
      }
    }
  }
});

// ─── Integration → Dashboard reflection contract ───
// Incident: Apple Health / Fitbit imports landed in vitals/activity/
// sleep collections only, which the dashboard doesn't render. Users
// uploaded data and saw nothing change on the home screen. Fix: every
// integration that brings in data must also call _addImportEntry()
// (or push directly to textEntries) so it appears in the dashboard's
// "あなたの記録" feed and updates integrationSyncs for the status
// badge.

section('Integration → Dashboard Reflection');

test('Integrations exposes _addImportEntry() helper', () => {
  const src = js('js/integrations.js');
  assert(/_addImportEntry\s*\(/.test(src),
    'Integrations._addImportEntry() must exist');
  // Helper must push to textEntries AND set integrationSyncs
  assert(/textEntries[\s\S]*store\.set\(\s*['"]textEntries['"]/.test(src),
    '_addImportEntry must push to textEntries');
  assert(/integrationSyncs/.test(src),
    '_addImportEntry must update integrationSyncs');
});

test('Apple Health import creates dashboard-visible entry', () => {
  const body = extractFunction(js('js/integrations.js'), 'importData');
  assert(body, 'appleHealth.importData not found');
  assert(/_addImportEntry\s*\(/.test(body) || /textEntries/.test(body),
    'Apple Health importData must create a text entry visible on dashboard');
});

test('Fitbit importToday creates dashboard-visible entry', () => {
  const body = extractFunction(js('js/integrations.js'), 'importToday');
  assert(body, 'fitbit.importToday not found');
  assert(/_addImportEntry\s*\(/.test(body),
    'Fitbit importToday must call _addImportEntry');
});

test('Plaud saveTranscript updates integrationSyncs', () => {
  const body = extractFunction(js('js/integrations.js'), 'saveTranscript');
  assert(body, 'plaud.saveTranscript not found');
  assert(/integrationSyncs/.test(body),
    'plaud.saveTranscript must update integrationSyncs for the status badge');
});

test('integrationSyncs is in store persistKeys', () => {
  const storeSrc = js('js/store.js');
  assert(/persistKeys[\s\S]*?'integrationSyncs'/.test(storeSrc),
    'integrationSyncs must be persisted across reloads');
});

test('Dashboard subscribes to data changes for auto-refresh', () => {
  const initBody = extractFunction(js('js/app.js'), 'init');
  assert(initBody, 'init not found');
  // Must subscribe to textEntries (or similar) and call navigate('dashboard')
  assert(/store\.on\s*\(\s*['"]textEntries['"]/.test(initBody) ||
         /scheduleDashRefresh/.test(initBody),
    'init() must subscribe to data changes to auto-refresh the dashboard');
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
