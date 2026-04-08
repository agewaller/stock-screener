#!/usr/bin/env node
/**
 * Smoke tests for 未病ダイアリー
 * Run: node tests/smoke.test.js
 *
 * Validates:
 * 1. All JS files parse without syntax errors
 * 2. Build output (index.html) exists and contains expected markers
 * 3. Required globals are defined (CONFIG, store, etc.)
 * 4. No accidental localStorage.clear() calls
 * 5. No confirm()/alert() calls (blocked on mobile)
 * 6. Critical config entries exist
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (e) {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ─── JS Syntax Checks ───

const jsFiles = [
  'js/config.js', 'js/store.js', 'js/ai-engine.js', 'js/affiliate.js',
  'js/components.js', 'js/i18n.js', 'js/calendar.js', 'js/integrations.js',
  'js/firebase-backend.js', 'js/app.js', 'js/pages.js'
];

console.log('\n--- JS Syntax ---');
for (const f of jsFiles) {
  test(`${f} parses without error`, () => {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    // vm.compileFunction will throw on syntax errors
    new vm.Script(code, { filename: f });
  });
}

// ─── Build Output Checks ───

console.log('\n--- Build Output ---');

test('index.html exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'index.html')));
});

test('dashboard.html exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'dashboard.html')));
});

test('index.html contains all JS modules', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const f of jsFiles) {
    assert(html.includes(`// === ${f} ===`), `Missing ${f} in build output`);
  }
});

test('index.html contains Firebase SDK', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(html.includes('firebase-app-compat.js'), 'Missing Firebase SDK');
});

test('index.html and dashboard.html are identical', () => {
  const a = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const b = fs.readFileSync(path.join(ROOT, 'dashboard.html'), 'utf8');
  assert(a === b, 'index.html and dashboard.html differ — run build_inline.py');
});

// ─── Forbidden Patterns ───

console.log('\n--- Forbidden Patterns ---');

const allJs = jsFiles.map(f => ({
  name: f,
  content: fs.readFileSync(path.join(ROOT, f), 'utf8')
}));

test('No localStorage.clear() calls (use store.clearAll())', () => {
  for (const { name, content } of allJs) {
    // Allow if it's inside store.js clearAll definition
    if (name === 'js/store.js') continue;
    assert(!content.includes('localStorage.clear()'),
      `Found localStorage.clear() in ${name}`);
  }
});

test('No confirm() calls (use inline UI)', () => {
  for (const { name, content } of allJs) {
    // Match standalone confirm( but not confirmLogout( etc.
    const matches = content.match(/[^a-zA-Z_]confirm\s*\(/g);
    if (matches) {
      // Filter out function definitions like confirmLogout(
      const real = matches.filter(m => !m.match(/[a-zA-Z_]confirm/));
      assert(real.length === 0, `Found confirm() in ${name}`);
    }
  }
});

test('No alert() calls (use Components.showToast())', () => {
  for (const { name, content } of allJs) {
    const matches = content.match(/[^a-zA-Z_.]alert\s*\(/g);
    assert(!matches, `Found alert() in ${name}`);
  }
});

// ─── Config Integrity ───

console.log('\n--- Config Integrity ---');

const configContent = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');

test('CONFIG object is defined', () => {
  assert(configContent.includes('var CONFIG'), 'CONFIG not found');
});

test('DISEASE_CATEGORIES exist', () => {
  assert(configContent.includes('DISEASE_CATEGORIES'), 'DISEASE_CATEGORIES not found');
});

test('PROMPT_HEADER exists', () => {
  assert(configContent.includes('PROMPT_HEADER'), 'PROMPT_HEADER not found');
});

test('INLINE_PROMPTS exist', () => {
  assert(configContent.includes('INLINE_PROMPTS'), 'INLINE_PROMPTS not found');
});

test('INLINE_PROMPTS has text_analysis', () => {
  assert(configContent.includes('text_analysis'), 'text_analysis prompt missing');
});

test('INLINE_PROMPTS has image_analysis', () => {
  assert(configContent.includes('image_analysis'), 'image_analysis prompt missing');
});

// ─── Build Script ───

console.log('\n--- Build Script ---');

test('build_inline.py exists in repo', () => {
  assert(fs.existsSync(path.join(ROOT, 'build_inline.py')),
    'build_inline.py missing — build will fail in new sessions');
});

test('build_inline.py references all JS files', () => {
  const build = fs.readFileSync(path.join(ROOT, 'build_inline.py'), 'utf8');
  for (const f of jsFiles) {
    assert(build.includes(f), `${f} missing from build_inline.py`);
  }
});

// ─── CLAUDE.md ───

console.log('\n--- Documentation ---');

test('CLAUDE.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'CLAUDE.md')),
    'CLAUDE.md missing — new sessions will lack project context');
});

// ─── Summary ───

console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${'─'.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
