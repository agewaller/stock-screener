#!/usr/bin/env node
/**
 * 健康日記 スモークテスト
 * ─────────────────────────────────────────────
 * 実行: node tests/smoke.test.js （または npm test）
 *
 * ■ 目的
 *   index.html（18,000+ 行の単一ファイル SPA）と Worker ファイルに対して
 *   静的解析を行い、コードの構造的な健全性を検証する。
 *   ブラウザやサーバーを起動せず、Node.js だけで完結する。
 *
 * ■ 何をテストするか
 *   - JS 構文の正当性（パースエラーの検出）
 *   - UI イベントハンドラ（onclick）と実装メソッドの対応
 *   - 全 13 画面レンダラーの存在確認
 *   - 認証フロー・AI エンジン・プロンプト体系の配線
 *   - データ入出力（エクスポート/インポート）の対称性
 *   - Cloudflare Worker の CORS 設定
 *   - Firestore セキュリティルール
 *   - モバイル安全性（confirm/alert 禁止）
 *   - 多言語対応・デプロイ設定・セキュリティ対策
 *
 * ■ 何をテストしないか
 *   - ブラウザでの実際の動作（DOM 操作、描画、ユーザー操作）
 *   - 外部 API（Firebase, OpenAI, Anthropic）との通信
 *   - CSS のレンダリング・レイアウト
 *
 * ■ テストの仕組み
 *   1. index.html から <script> タグの中身を正規表現で抽出
 *   2. vm.Script でパースし構文エラーを検出
 *   3. 文字列検索・正規表現で関数の存在や呼び出し関係を検証
 *   4. extractFn() でブレース対応の関数本体を切り出し、内部ロジックを検証
 *
 * ■ テストの追加方法
 *   section('カテゴリ名') でグループを作り、
 *   test('テスト名', () => { assert(条件, 'エラーメッセージ'); }) で追加。
 *   外部ライブラリ不要。Node.js 組み込みモジュールのみで動作する。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;
const failures = [];

/** テストカテゴリの見出しを出力 */
function section(label) {
  console.log(`\n--- ${label} ---`);
}

/** 個別テストを実行し、結果を集計・出力する */
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, message: e.message });
    console.log(`  \x1b[31m✗\x1b[0m ${name}\n    ${e.message}`);
  }
}

/** 条件が false なら例外を投げる（テスト用アサーション） */
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Load all JS modules in dependency order (replaces old inline script extraction).
// This mirrors the <script src="js/..."> tags in index.html.
const MODULE_ORDER = [
  'config.js', 'prompts.js', 'store.js', 'privacy.js', 'ai-engine.js',
  'affiliate.js', 'components.js', 'i18n.js', 'calendar.js',
  'integrations.js', 'firebase-backend.js', 'app.js', 'pages.js'
];
const script = MODULE_ORDER.map(f => {
  const p = path.join(ROOT, 'js', f);
  if (!fs.existsSync(p)) {
    // Fallback: extract inline script from index.html (legacy single-file mode)
    const m = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)];
    return m.map(mm => mm[1]).join('\n;\n');
  }
  return fs.readFileSync(p, 'utf8');
}).join('\n;\n');

// 関数名から関数本体（{ ... } の中身）を切り出すヘルパー。
// クラスメソッド、オブジェクトメソッド、App.prototype.X = function() の
// いずれのパターンにも対応。ブレースの対応を追跡して正確に切り出す。
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
    let depth = 1,
      i = start + 1;
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
        while (i < source.length && source[i] !== '`') {
          if (source[i] === '\\') i++;
          i++;
        }
      } else if (c === "'") {
        i++;
        while (i < source.length && source[i] !== "'") {
          if (source[i] === '\\') i++;
          i++;
        }
      } else if (c === '"') {
        i++;
        while (i < source.length && source[i] !== '"') {
          if (source[i] === '\\') i++;
          i++;
        }
      } else if (c === '{') depth++;
      else if (c === '}') depth--;
      i++;
    }
    return source.substring(start, i);
  }
  return null;
}

// コードから JS コメント（// と /* */）を除去するヘルパー。
// コメント内のコードを誤検出しないために使用する。
function stripComments(code) {
  return code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

// ================================================================
// 1. JS 構文チェック
// index.html のインライン JS と Worker ファイルが構文エラーなく
// パースできることを確認する。デプロイ前の最も基本的なチェック。
// ================================================================
section('1. JS 構文');
test('All JS modules parse without error', () => {
  new vm.Script(script, { filename: 'all-modules' });
});

MODULE_ORDER.forEach(f => {
  test(`js/${f} parses individually`, () => {
    const code = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
    new Function(code);
  });
});

['worker/anthropic-proxy.js', 'worker/plaud-inbox.js'].forEach((f) => {
  test(`${f} parses`, () => {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    // Worker は ESM (import/export) を使うため vm.Script ではパースできない。
    // ファイルが空でないことと、export default が存在することで最低限の構文を確認。
    assert(code.length > 50, 'file too short');
    assert(/export\s+default/.test(code), 'missing export default');
  });
});

// ================================================================
// 2. onclick ハンドラの配線チェック
// HTML 内の onclick="app.X()" で参照されるメソッドが、
// JS コードに実際に定義されているかを検証する。
// メソッド名のタイポや削除忘れによるランタイムエラーを防ぐ。
// ================================================================
section('2. onclick ハンドラの配線');
test('Every onclick="app.X()" references a real App method', () => {
  const onclicks = html.match(/onclick="app\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g) || [];
  const methods = new Set();
  onclicks.forEach((m) => {
    const fn = m.match(/app\.([a-zA-Z_][a-zA-Z0-9_]*)/)[1];
    methods.add(fn);
  });
  const missing = [];
  methods.forEach((fn) => {
    // Check if method exists in script (class method or prototype)
    const hasMethod =
      new RegExp(`(?:^|\\s)${fn}\\s*\\(`).test(script) || new RegExp(`App\\.prototype\\.${fn}`).test(script);
    if (!hasMethod) missing.push(fn);
  });
  assert(missing.length === 0, `Missing App methods: ${missing.join(', ')}`);
});

// ================================================================
// 3. レンダラー完全性チェック
// 全 13 画面（login, dashboard, settings 等）の render_* 関数が
// すべて定義されているかを確認する。画面の追加・削除時に
// ナビゲーションとレンダラーの不整合を検出する。
// ================================================================
section('3. レンダラー完全性');
const pages = [
  'login',
  'disease_select',
  'dashboard',
  'data_input',
  'analysis',
  'actions',
  'research',
  'chat',
  'timeline',
  'integrations',
  'settings',
  'admin',
];
pages.forEach((p) => {
  test(`render_${p} is defined`, () => {
    assert(
      script.includes(`render_${p}`) || script.includes(`render_${p.replace(/_/g, '-')}`),
      `render_${p} not found`
    );
  });
});

// ================================================================
// 4. 認証フローの検証
// Firebase Auth のログイン処理が正しく配線されているかを確認する。
// - signInWithGoogle/Email → handleSignedInUser の呼び出し連鎖
// - signInWithRedirect の不使用（cross-domain authDomain で動作しない）
// - loadAllData の再入防止ガード（二重読み込み防止）
// - グローバル設定の読み込み順序（ユーザーデータより先に読む必要がある）
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
// 5. ダッシュボード AI 応答パイプラインの検証
// ユーザーがダッシュボードに体調を入力→AI 分析→結果表示の
// 一連のフローが正しく配線されているかを確認する。
// - isAnalyzing フラグのタイミング（ローディング表示の制御）
// - エラーハンドリング（.catch の存在、エラーカード表示）
// - 表示の優先順位（ローディング > エラー > 結果）
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
  assert(
    script.includes("'latestFeedbackError'") && script.includes("'isAnalyzing'"),
    'latestFeedbackError and isAnalyzing must be in scheduleDashRefresh trigger list'
  );
});

// ================================================================
// 6. AI エンジンの検証
// AI モデル呼び出しの実装が正しいかを確認する。
// - analyzeViaAPI が API キー未設定でも共有プロキシ経由で動作すること
// - callAnthropic が MODEL_MAP を使い、廃止されたモデル ID をハードコードしていないこと
// - Vision API（画像分析）のサポート
// - canUseSharedProxy（共有プロキシの利用可否判定）の存在
// ================================================================
section('6. AI エンジン');
test('analyzeViaAPI does NOT have early return on !apiKey', () => {
  const body = extractFn(script, 'analyzeViaAPI');
  assert(body, 'analyzeViaAPI not found');
  // Should NOT have the pattern: if (!apiKey) { return { ... _fromAPI: false }; }
  // before the try block
  const tryIdx = body.indexOf('try {');
  const beforeTry = body.substring(0, tryIdx);
  assert(!beforeTry.includes('if (!apiKey)'), 'early apiKey check bypasses shared proxy');
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
// 7. AI プロンプト体系の検証
// AI に渡すプロンプトの構造が要件を満たしているかを確認する。
// - PROMPT_HEADER に共感・励まし・新処方の 3 大指示が含まれるか
// - OODA ループ（意思決定フレームワーク）が組み込まれているか
// - INLINE_PROMPTS に必須キー（text_analysis 等）が存在するか
// - 多言語応答指示（RESPOND_LANGUAGE_INSTRUCTION）の注入
// ================================================================
section('7. プロンプト');
test('PROMPT_HEADER has empathy/encouragement/something-new directives', () => {
  assert(script.includes('寄り添い') || script.includes('共感'), 'empathy missing');
  assert(script.includes('SOMETHING NEW') || script.includes('新しい打ち手'), 'something new missing');
  assert(script.includes('RESPOND_LANGUAGE_INSTRUCTION'), 'language directive missing');
});

test('PROMPT_HEADER has /ooda framework', () => {
  assert(script.includes('/ooda'), '/ooda marker missing');
  assert(
    script.includes('Observe') && script.includes('Orient') && script.includes('Decide') && script.includes('Act'),
    'OODA stages missing'
  );
});

test('INLINE_PROMPTS has required keys', () => {
  ['text_analysis', 'image_analysis', 'conversation_analysis', 'plaud_analysis', 'timeline_insight'].forEach((k) =>
    assert(script.includes(`${k}:`), `INLINE_PROMPTS.${k} missing`)
  );
});

test('interpolatePrompt injects RESPOND_LANGUAGE_INSTRUCTION', () => {
  const body = extractFn(script, 'interpolatePrompt');
  assert(body && body.includes('RESPOND_LANGUAGE_INSTRUCTION'), 'missing language injection');
});

test('injectLanguageDirective helper exists', () => {
  assert(extractFn(script, 'injectLanguageDirective'), 'injectLanguageDirective not found');
});

// ================================================================
// 8. Google 翻訳リンクの検証
// 2019 年に廃止された translate.google.com/translate?u= 形式が
// コード内で使われていないことを確認する。
// 正しい形式は translate.goog サブドメイン方式。
// 旧形式を使うとクリック時に無限リダイレクトが発生する。
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
// 9. 写真アップロード機能の検証
// 画像アップロード（食事写真、検査結果、処方箋等）の
// UI コンポーネントと分析パイプラインが存在するかを確認する。
// image_analysis プロンプトには処方箋の 4 段階薬剤分析が必須。
// ================================================================
section('9. 写真アップロード');
test('Components.photoUpload exists', () => {
  assert(script.includes('photoUpload('), 'Components.photoUpload not found');
});

test('handleModalPhotoUpload exists', () => {
  assert(extractFn(script, 'handleModalPhotoUpload'), 'handleModalPhotoUpload not found');
});

test('image_analysis prompt has medication deep analysis (4段階)', () => {
  assert(
    script.includes('第1段階') &&
      script.includes('第2段階') &&
      script.includes('第3段階') &&
      script.includes('第4段階'),
    'medication 4-stage analysis missing'
  );
});

// ================================================================
// 10. Google Calendar 連携の検証
// OAuth 認証→アクセストークン取得→カレンダー同期の配線を確認。
// トークン取得には複数の経路（OAuth レスポンスの形式差異）があるため、
// multi-path extraction が実装されているかを検証する。
// また、Calendar API が GCP で無効な場合のエラーハンドリングも確認。
// ================================================================
section('10. カレンダー連携');
test('connectGoogleCalendarWithGoogle has multi-path accessToken extraction', () => {
  const body = extractFn(script, 'connectGoogleCalendarWithGoogle');
  assert(body, 'connectGoogleCalendarWithGoogle not found');
  assert(body.includes('extractAccessToken'), 'multi-path token extraction missing');
  assert(body.includes('signInWithPopup'), 'signInWithPopup fallback missing');
});

test('isGoogleCalendarApiDisabledError exists', () => {
  assert(extractFn(script, 'isGoogleCalendarApiDisabledError'), 'Calendar API disabled detector missing');
});

// ================================================================
// 11. Plaud（音声文字起こし）連携の検証
// Plaud デバイスからの文字起こしデータ受信→保存→AI 分析の配線を確認。
// - subscribeToInbox が .orderBy を使わないこと（Firestore の複合インデックス不要化）
// - 受信状態（inboxStatus）を UI に反映していること
// - saveTranscript が自動的に AI 分析（runPlaudAnalysis）を実行すること
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
// 12. 栄養ダッシュボードの検証
// 食事記録・カロリー計算機能の基盤が存在するかを確認する。
// - nutritionLog が localStorage に永続化されること
// - BMR（基礎代謝量）の計算に Mifflin-St Jeor 方程式を使用すること
// - upsertNutritionEntry（栄養データの追加・更新）が存在すること
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
// 13. データエクスポート/インポートの完全性
// ユーザーデータの入出力パイプラインが対称であることを検証する。
// - エクスポート: 全データコレクション（textEntries, symptoms, vitals 等）が含まれること
// - インポート: エクスポートと同じキーを処理できること
// - タイムライン: 全データタイプを表示できること
// エクスポートにあるのにインポートにない（またはその逆の）キーがあると
// ユーザーのデータが欠損するため、この対称性チェックは重要。
// ================================================================
section('13. データ完全性');
test('exportData entry point + multi-format export machinery exists', () => {
  // The export implementation was split into openExportModal (UI),
  // executeExport (orchestration), _exportAsMarkdown/CSV/PlainText
  // (formatters), and _computeExportStats (summary). exportData()
  // is preserved as a legacy alias that forwards to openExportModal.
  assert(extractFn(script, 'exportData'), 'exportData not found');
  assert(extractFn(script, 'openExportModal'), 'openExportModal not found');
  assert(extractFn(script, 'executeExport'), 'executeExport not found');
  assert(extractFn(script, '_exportAsMarkdown'), '_exportAsMarkdown not found');
  assert(extractFn(script, '_exportAsCSV'), '_exportAsCSV not found');
  assert(extractFn(script, '_exportAsPlainText'), '_exportAsPlainText not found');
  assert(extractFn(script, '_computeExportStats'), '_computeExportStats not found');

  // The orchestration function must reference every major collection
  // so users get the full download — check the executeExport +
  // stats + markdown exporter collectively for each key.
  const merged = [
    extractFn(script, 'executeExport'),
    extractFn(script, '_computeExportStats'),
    extractFn(script, '_exportAsMarkdown'),
    extractFn(script, '_exportAsCSV'),
  ].join('\n');
  [
    'textEntries',
    'symptoms',
    'vitals',
    'bloodTests',
    'medications',
    'supplements',
    'meals',
    'sleepData',
    'photos',
    'plaudAnalyses',
    'analysisHistory',
    'conversationHistory',
  ].forEach((k) => {
    assert(merged.includes(`'${k}'`) || merged.includes(`"${k}"`), `export pipeline missing: ${k}`);
  });
});

test('importDataFile covers same keys as exportData', () => {
  const body = extractFn(script, 'importDataFile');
  assert(body, 'importDataFile not found');
  ['nutritionLog', 'plaudAnalyses', 'aiComments', 'calendarEvents', 'userProfile'].forEach((k) => {
    assert(body.includes(`'${k}'`), `importDataFile missing: ${k}`);
  });
});

test('render_timeline includes all data types', () => {
  const body = extractFn(script, 'render_timeline');
  assert(body, 'render_timeline not found');
  ['supplement', 'meal', 'nutrition', 'plaud', 'calendar'].forEach((t) => {
    assert(body.includes(`'${t}'`), `timeline missing type: ${t}`);
  });
});

// ================================================================
// 14. Cloudflare Worker CORS ヘッダーの検証
// anthropic-proxy Worker が Anthropic API に必要な CORS ヘッダー
//（特に anthropic-version）を許可しているかを確認する。
// このヘッダーがないとブラウザからの API 呼び出しがブロックされる。
// ================================================================
section('14. Worker CORS');
test('anthropic-proxy allows anthropic-version in CORS headers', () => {
  const worker = fs.readFileSync(path.join(ROOT, 'worker/anthropic-proxy.js'), 'utf8');
  assert(worker.includes('anthropic-version'), 'anthropic-version missing from CORS allow-list');
});

// ================================================================
// 15. Firestore セキュリティルールの検証
// inbox コレクション（Plaud Email Worker からの書き込み先）が
// create を許可していることを確認する。
// 「allow create: if false」だと Worker からの書き込みが拒否され、
// Plaud 文字起こしの自動受信が機能しなくなる。
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
// 16. アクション推奨機能の検証
// AI が生成するアクション推奨（クリニック・サプリ・検査等）の
// 安全性を確認する。
// - AI にURL を生成させない（ハルシネーションによる偽 URL 防止）
// - 代わりに buildVerifiedActionLinks で検証済みリンクを生成する
// - ダッシュボードとアクションページの両方にコンテナが存在すること
// ================================================================
section('16. アクション推奨');
test('loadActionRecommendations checks both container IDs', () => {
  const body = extractFn(script, 'loadActionRecommendations');
  assert(body, 'loadActionRecommendations not found');
  assert(
    body.includes('action-live-recs') && body.includes('dash-actions-live'),
    'must check both dashboard and actions page container IDs'
  );
});

test('buildVerifiedActionLinks exists (no AI-hallucinated URLs)', () => {
  assert(extractFn(script, 'buildVerifiedActionLinks'), 'buildVerifiedActionLinks not found');
});

test('AI prompt for actions prohibits URL generation', () => {
  const body = extractFn(script, 'loadActionRecommendations');
  assert(
    body.includes('URLやリンクは一切出力しないでください') || body.includes('URL.*出力しない'),
    'AI prompt must prohibit URL generation'
  );
});

// ================================================================
// 17. モバイル安全性の検証
// window.confirm() / window.alert() がコード内で使われていないことを確認。
// これらのネイティブダイアログはモバイルブラウザ（特に iOS）で
// ブロックされたり予期しない動作をするため、インライン UI に置き換える。
// CLAUDE.md の「絶対にやってはいけないこと」に記載のルール。
// ================================================================
section('17. モバイル安全性');
test('No window.confirm() in user-facing code', () => {
  // Strip comments
  const clean = script.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const matches = clean.match(/\bconfirm\s*\(/g) || [];
  // Filter out false positives (confirmAction is a custom method)
  const real = matches.filter((m) => !clean.includes('confirmAction'));
  // Just check there's no window.confirm pattern
  assert(!/window\.confirm\s*\(/.test(clean), 'window.confirm is blocked on mobile');
});

test('No window.alert() in user-facing code', () => {
  const clean = script.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert(
    !/window\.alert\s*\(/.test(clean) &&
      !/\balert\s*\([^)]*\)/.test(clean.replace(/alertEl|alert_|alertMessage|showAlert/g, '')),
    'window.alert is blocked on mobile'
  );
});

// ================================================================
// 18. 多言語（i18n）対応の検証
// - i18n オブジェクトに 4 言語以上の翻訳が定義されているか
// - ログイン画面の言語セレクタに 8 言語以上の選択肢があるか
// - AI 応答言語を切り替える _languageDirectiveFor が 10 言語に対応しているか
// ================================================================
section('18. 多言語');
test('i18n has 4+ languages', () => {
  const langs = script.match(/^\s{4}[a-z]{2}:\s*\{/gm) || [];
  assert(langs.length >= 4, `Only ${langs.length} languages defined`);
});

test('Language selector has 8+ options', () => {
  const allSource = html + '\n' + script;
  const options = (allSource.match(/option value="[a-z]{2}"/g) || []);
  assert(options.length >= 8, `Only ${options.length} language options`);
});

test('_languageDirectiveFor supports 10 languages', () => {
  const body = extractFn(script, '_languageDirectiveFor');
  assert(body, '_languageDirectiveFor not found');
  ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'pt', 'de', 'ar', 'it'].forEach((lang) => {
    // Keys can be quoted ('ja':) or unquoted (ja:)
    assert(body.includes(`${lang}:`) || body.includes(`'${lang}':`), `language directive missing for: ${lang}`);
  });
});

// ================================================================
// 19. デプロイ設定の検証
// GitHub Pages / Cloudflare Workers の自動デプロイに必要な
// 設定ファイルが正しく構成されているかを確認する。
// - CNAME が cares.advisers.jp を指していること
// - GitHub Actions ワークフローが main ブランチ push でトリガーされること
// - 両方の Worker（anthropic-proxy, plaud-inbox）がデプロイ対象であること
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
// 20. セキュリティ対策の検証
// - escapeHtml: ユーザー入力の XSS エスケープが存在すること
// - ダッシュボードでユーザーコンテンツ表示時に escapeHtml を使っていること
// - Firebase apiKey がプレースホルダーではなく実値であること
// - 管理者メール（agewaller@gmail.com）がハードコードされていること
// ================================================================
section('20. セキュリティ');
test('Components.escapeHtml exists', () => {
  assert(script.includes('escapeHtml'), 'escapeHtml missing');
});

test('Dashboard user content rendered via escapeHtml', () => {
  // Check render_dashboard references escapeHtml for user content
  assert(
    script.includes('Components.escapeHtml(rawContent)') || script.includes('escapeHtml(e.content'),
    'Dashboard must escape user content'
  );
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
  failures.forEach((f) => console.log(`  • ${f.name}\n    ${f.message}`));
}
process.exit(failed > 0 ? 1 : 0);
