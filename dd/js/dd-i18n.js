/* ============================================
   DD i18n - Internationalization
   ============================================ */

const DDi18n = {
  _currentLang: 'ja',
  _translations: {
    ja: {
      // Navbar
      'nav.home': 'ホーム',
      'nav.dashboard': 'ダッシュボード',
      'nav.reports': 'レポート',
      'nav.admin': '管理',
      'nav.settings': '設定',
      'nav.login': 'ログイン',
      'nav.logout': 'ログアウト',
      'nav.subscribe': 'プランに加入',

      // Landing
      'landing.title': 'AI Due Diligence',
      'landing.subtitle': '企業名を入力するだけで、世界中のあらゆる企業のデューディリジェンスレポートをAIが自動生成。上場・未上場を問わず、財務・法務・税務・ビジネスの全領域を網羅。',
      'landing.cta': 'Googleでログインして始める',
      'landing.sample': 'サンプルレポートを見る',
      'landing.feat1.title': 'マルチ領域分析',
      'landing.feat1.desc': '財務・法務・税務・ビジネス・システム等10領域のデューディリジェンスを一括実行。各領域のプロンプトはカスタマイズ可能。',
      'landing.feat2.title': 'グローバル対応',
      'landing.feat2.desc': '世界中の上場・未上場企業に対応。EDINET、SEC、各国の公式データソースから一次資料を収集・分析。',
      'landing.feat3.title': 'AIモデル選択',
      'landing.feat3.desc': 'Claude、GPT-4o、Gemini、DeepSeekなど最新AIモデルを自由に選択。用途に合わせて最適なモデルを使用。',
      'landing.feat4.title': 'プロ品質レポート',
      'landing.feat4.desc': 'DCF分析、ROIC/WACC、CFMマップ、スコアカード等を含む包括的レポートとグラフ8枚を自動生成。',
      'landing.pricing.title': '料金プラン',
      'landing.pricing.price': '$50',
      'landing.pricing.period': '/月',
      'landing.pricing.f1': '全10領域のDDレポート生成',
      'landing.pricing.f2': '最新AIモデル自由選択',
      'landing.pricing.f3': '無制限のレポート生成',
      'landing.pricing.f4': '追加分析・カスタム質問',
      'landing.pricing.f5': 'レポート履歴保存',
      'landing.pricing.f6': 'プロンプトカスタマイズ',
      'landing.pricing.cta': 'PayPalで購読開始',
      'landing.samples.title': 'サンプルレポート',

      // Dashboard
      'dash.title': '企業分析',
      'dash.search.title': '企業のデューディリジェンスを開始',
      'dash.search.desc': '企業名、ティッカー、または会社情報を入力してください',
      'dash.search.placeholder': '例: トヨタ自動車 / AAPL / Samsung Electronics',
      'dash.search.btn': '分析開始',
      'dash.model': 'AIモデル',
      'dash.lang': '出力言語',
      'dash.history': 'レポート履歴',
      'dash.analyzing': '分析中...',
      'dash.step1': 'データ収集中（一次資料優先）...',
      'dash.step2': 'フルレポート生成中...',
      'dash.complete': '分析完了',

      // Report
      'report.additional': '追加分析',
      'report.additional.placeholder': '追加の分析指示や質問を入力してください...',
      'report.additional.info': '補足情報を入力（財務データ、社内情報など）',
      'report.additional.btn': '追加分析を実行',
      'report.export': 'エクスポート',
      'report.share': '共有',
      'report.makeSample': 'サンプルとして公開',
      'report.removeSample': 'サンプルから削除',

      // Admin
      'admin.title': 'プロンプト管理',
      'admin.prompt.name': 'プロンプト名',
      'admin.prompt.category': 'カテゴリ',
      'admin.prompt.content': 'プロンプト内容',
      'admin.prompt.save': '保存',
      'admin.prompt.reset': 'デフォルトに戻す',
      'admin.prompt.delete': '削除',
      'admin.settings': 'システム設定',
      'admin.apikeys': 'APIキー設定',

      // Settings
      'settings.title': '設定',
      'settings.api.title': 'APIキー',
      'settings.api.anthropic': 'Anthropic API Key',
      'settings.api.openai': 'OpenAI API Key',
      'settings.api.google': 'Google AI API Key',
      'settings.api.deepseek': 'DeepSeek API Key',
      'settings.api.xai': 'xAI API Key',
      'settings.subscription': 'サブスクリプション',
      'settings.sub.active': '有効（$50/月）',
      'settings.sub.inactive': '未購読',
      'settings.sub.manage': 'PayPalで管理',

      // Common
      'common.loading': '読み込み中...',
      'common.error': 'エラー',
      'common.save': '保存',
      'common.cancel': 'キャンセル',
      'common.delete': '削除',
      'common.close': '閉じる',
      'common.confirm': '確認',
      'common.back': '戻る',
      'common.nodata': 'データがありません',
      'common.required': '必須項目です',
    },

    en: {
      'nav.home': 'Home',
      'nav.dashboard': 'Dashboard',
      'nav.reports': 'Reports',
      'nav.admin': 'Admin',
      'nav.settings': 'Settings',
      'nav.login': 'Login',
      'nav.logout': 'Logout',
      'nav.subscribe': 'Subscribe',

      'landing.title': 'AI Due Diligence',
      'landing.subtitle': 'Simply enter a company name to auto-generate comprehensive due diligence reports for any company worldwide — public or private. Covering financial, legal, tax, business, and all domains.',
      'landing.cta': 'Sign in with Google',
      'landing.sample': 'View Sample Reports',
      'landing.feat1.title': 'Multi-Domain Analysis',
      'landing.feat1.desc': 'Execute due diligence across 10 domains including financial, legal, tax, business, and IT. All prompts are fully customizable.',
      'landing.feat2.title': 'Global Coverage',
      'landing.feat2.desc': 'Covers public and private companies worldwide. Collects and analyzes primary sources from EDINET, SEC, and official data sources.',
      'landing.feat3.title': 'AI Model Selection',
      'landing.feat3.desc': 'Choose from the latest AI models: Claude, GPT-4o, Gemini, DeepSeek, and more. Pick the best model for your needs.',
      'landing.feat4.title': 'Professional Reports',
      'landing.feat4.desc': 'Auto-generates comprehensive reports with DCF analysis, ROIC/WACC, CFM maps, scorecards, and 8 visualization charts.',
      'landing.pricing.title': 'Pricing',
      'landing.pricing.price': '$50',
      'landing.pricing.period': '/mo',
      'landing.pricing.f1': 'All 10 DD domain reports',
      'landing.pricing.f2': 'Latest AI model selection',
      'landing.pricing.f3': 'Unlimited report generation',
      'landing.pricing.f4': 'Follow-up analysis & custom queries',
      'landing.pricing.f5': 'Report history storage',
      'landing.pricing.f6': 'Prompt customization',
      'landing.pricing.cta': 'Subscribe via PayPal',
      'landing.samples.title': 'Sample Reports',

      'dash.title': 'Company Analysis',
      'dash.search.title': 'Start Due Diligence',
      'dash.search.desc': 'Enter a company name, ticker, or company information',
      'dash.search.placeholder': 'e.g. Toyota Motor / AAPL / Samsung Electronics',
      'dash.search.btn': 'Analyze',
      'dash.model': 'AI Model',
      'dash.lang': 'Output Language',
      'dash.history': 'Report History',
      'dash.analyzing': 'Analyzing...',
      'dash.step1': 'Collecting data (primary sources priority)...',
      'dash.step2': 'Generating full report...',
      'dash.complete': 'Analysis complete',

      'report.additional': 'Additional Analysis',
      'report.additional.placeholder': 'Enter additional analysis instructions or questions...',
      'report.additional.info': 'Enter supplementary information (financial data, internal info, etc.)',
      'report.additional.btn': 'Run Additional Analysis',
      'report.export': 'Export',
      'report.share': 'Share',
      'report.makeSample': 'Publish as Sample',
      'report.removeSample': 'Remove from Samples',

      'admin.title': 'Prompt Management',
      'admin.prompt.name': 'Prompt Name',
      'admin.prompt.category': 'Category',
      'admin.prompt.content': 'Prompt Content',
      'admin.prompt.save': 'Save',
      'admin.prompt.reset': 'Reset to Default',
      'admin.prompt.delete': 'Delete',
      'admin.settings': 'System Settings',
      'admin.apikeys': 'API Key Settings',

      'settings.title': 'Settings',
      'settings.api.title': 'API Keys',
      'settings.api.anthropic': 'Anthropic API Key',
      'settings.api.openai': 'OpenAI API Key',
      'settings.api.google': 'Google AI API Key',
      'settings.api.deepseek': 'DeepSeek API Key',
      'settings.api.xai': 'xAI API Key',
      'settings.subscription': 'Subscription',
      'settings.sub.active': 'Active ($50/month)',
      'settings.sub.inactive': 'Not subscribed',
      'settings.sub.manage': 'Manage on PayPal',

      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.close': 'Close',
      'common.confirm': 'Confirm',
      'common.back': 'Back',
      'common.nodata': 'No data',
      'common.required': 'Required',
    },

    zh: {
      'nav.home': '首页',
      'nav.dashboard': '仪表盘',
      'nav.reports': '报告',
      'nav.admin': '管理',
      'nav.settings': '设置',
      'nav.login': '登录',
      'nav.logout': '退出',
      'nav.subscribe': '订阅',
      'landing.title': 'AI 尽职调查',
      'landing.subtitle': '只需输入公司名称，AI即可自动生成全球任何企业的尽职调查报告。涵盖上市与非上市公司，覆盖财务、法律、税务、业务等全领域。',
      'landing.cta': '使用Google登录',
      'landing.sample': '查看示例报告',
      'dash.search.btn': '开始分析',
      'common.loading': '加载中...',
    },

    ko: {
      'nav.home': '홈',
      'nav.dashboard': '대시보드',
      'nav.reports': '보고서',
      'nav.admin': '관리',
      'nav.settings': '설정',
      'nav.login': '로그인',
      'nav.logout': '로그아웃',
      'landing.title': 'AI 실사 분석',
      'landing.subtitle': '회사명을 입력하면 전 세계 모든 기업의 실사 보고서를 AI가 자동 생성합니다.',
      'landing.cta': 'Google로 로그인',
      'dash.search.btn': '분석 시작',
    }
  },

  init() {
    const saved = localStorage.getItem('dd_lang');
    if (saved && this._translations[saved]) {
      this._currentLang = saved;
    }
  },

  setLang(lang) {
    if (this._translations[lang]) {
      this._currentLang = lang;
      localStorage.setItem('dd_lang', lang);
    }
  },

  getLang() {
    return this._currentLang;
  },

  t(key) {
    const lang = this._currentLang;
    return this._translations[lang]?.[key]
      || this._translations['en']?.[key]
      || this._translations['ja']?.[key]
      || key;
  },

  getAvailableLanguages() {
    return [
      { code: 'ja', name: '日本語' },
      { code: 'en', name: 'English' },
      { code: 'zh', name: '中文' },
      { code: 'ko', name: '한국어' }
    ];
  },

  // Output language for AI (can differ from UI language)
  getOutputLanguages() {
    return [
      { code: 'ja', name: '日本語' },
      { code: 'en', name: 'English' },
      { code: 'zh', name: '中文' },
      { code: 'ko', name: '한국어' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'pt', name: 'Português' },
      { code: 'th', name: 'ไทย' },
      { code: 'vi', name: 'Tiếng Việt' },
      { code: 'id', name: 'Bahasa Indonesia' },
      { code: 'ar', name: 'العربية' }
    ];
  }
};

DDi18n.init();
