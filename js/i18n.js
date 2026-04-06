/* ============================================================
   Internationalization (i18n) System
   ============================================================ */
var i18n = {
  currentLang: 'ja',

  translations: {
    ja: {
      // App
      app_name: '健康日記',
      app_subtitle: '慢性疾患の寛解サポート',
      // Nav
      dashboard: 'ホーム',
      record: '記録する',
      actions: 'アクション',
      research: '最新研究',
      ask_ai: '相談する',
      integrations: '連携',
      settings: '設定',
      admin: '管理パネル',
      // Dashboard
      quick_input_placeholder: '今日の体調は？（例：頭痛がする、生理2日目で辛い、昨日よく眠れた...）',
      send: '送信',
      advice: 'アドバイス',
      your_recommendations: 'あなたへの推奨',
      recent_records: '最近の記録',
      trend: 'トレンド',
      fatigue: '疲労度',
      pain: '痛み',
      brain_fog: '脳霧',
      sleep: '睡眠',
      last_updated: '最終更新',
      view_all: 'すべて見る',
      // Data Input
      data_input: 'データ入力',
      diary: '日記・フリーテキスト入力',
      category: 'カテゴリ',
      date: '日付',
      title: 'タイトル',
      content: '内容',
      save_and_analyze: '保存してAI分析',
      clear: 'クリア',
      file_upload: 'ファイルアップロード',
      // Settings
      profile: 'プロフィール・基本情報',
      age: '年齢',
      gender: '性別',
      male: '男性',
      female: '女性',
      other: 'その他',
      height: '身長',
      weight: '体重',
      location: '居住地',
      language: '言語',
      save_profile: 'プロフィールを保存',
      logout: 'ログアウト',
      data_export: 'すべてのデータをエクスポート',
      data_import: 'データインポート',
      // Login
      select_diseases: '対象疾患を選択',
      search_diseases: '疾患名で検索...',
      step1: 'Step 1: 対象疾患を選択',
      step2: 'Step 2: ログイン',
      login_google: 'Googleでログイン',
      or: 'または',
      email: 'メールアドレス',
      password: 'パスワード',
      login: 'ログイン',
      selected: '件選択中',
      // Common
      items: '件',
      loading: '読み込み中...',
      analyzing: 'AI分析中...',
      saved: '保存しました',
      error: 'エラー',
    },
    en: {
      app_name: 'Health Diary',
      app_subtitle: 'Your path to chronic illness remission',
      dashboard: 'Home',
      record: 'Record',
      actions: 'Actions',
      research: 'Research',
      ask_ai: 'Consult',
      integrations: 'Connect',
      settings: 'Settings',
      admin: 'Admin',
      ai_analysis: 'AI Analysis',
      quick_input_placeholder: 'How are you feeling today? Write anything...',
      send: 'Send',
      ai_advice: 'AI Advice',
      your_recommendations: 'Recommendations for You',
      recent_records: 'Recent Records',
      trend: 'Trends',
      fatigue: 'Fatigue',
      pain: 'Pain',
      brain_fog: 'Brain Fog',
      sleep: 'Sleep',
      last_updated: 'Last updated',
      view_all: 'View all',
      data_input: 'Data Entry',
      diary: 'Diary / Free Text',
      category: 'Category',
      date: 'Date',
      title: 'Title',
      content: 'Content',
      save_and_analyze: 'Save & Analyze',
      clear: 'Clear',
      file_upload: 'File Upload',
      profile: 'Profile',
      age: 'Age',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      height: 'Height',
      weight: 'Weight',
      location: 'Location',
      language: 'Language',
      save_profile: 'Save Profile',
      logout: 'Logout',
      data_export: 'Export All Data',
      data_import: 'Import Data',
      select_diseases: 'Select Your Conditions',
      search_diseases: 'Search conditions...',
      step1: 'Step 1: Select Conditions',
      step2: 'Step 2: Sign In',
      login_google: 'Sign in with Google',
      or: 'or',
      email: 'Email',
      password: 'Password',
      login: 'Sign In',
      selected: 'selected',
      items: 'items',
      loading: 'Loading...',
      analyzing: 'Analyzing...',
      saved: 'Saved',
      error: 'Error',
    },
    zh: {
      app_name: '健康日记', app_subtitle: '慢性疾病的缓解支持',
      dashboard: '首页', record: '记录', actions: '行动', research: '研究',
      ask_ai: '咨询', integrations: '连接', settings: '设置',
      admin: '管理',
      quick_input_placeholder: '今天身体怎么样？（例：头痛、失眠、吃了什么药...）',
      send: '发送', advice: '建议', your_recommendations: '推荐',
      recent_records: '最近记录', trend: '趋势', fatigue: '疲劳', pain: '疼痛',
      brain_fog: '脑雾', sleep: '睡眠', last_updated: '最后更新', view_all: '查看全部',
      save_and_analyze: '保存并分析', clear: '清除', file_upload: '文件上传',
      profile: '个人资料', age: '年龄', gender: '性别', male: '男', female: '女',
      location: '位置', language: '语言', save_profile: '保存',
      logout: '退出', login_google: '使用Google登录', login: '登录',
      selected: '已选', items: '条', loading: '加载中...', saved: '已保存',
    },
    ko: {
      app_name: '건강일기', app_subtitle: '만성질환의 관해를 서포트',
      dashboard: '홈', record: '기록', actions: '액션', research: '연구',
      ask_ai: '상담', integrations: '연결', settings: '설정',
      quick_input_placeholder: '오늘 몸 상태는 어떠세요? (예: 두통, 피곤함, 약 복용...)',
      send: '보내기', save_and_analyze: '저장 및 분석', login_google: 'Google로 로그인',
      login: '로그인', logout: '로그아웃', saved: '저장됨',
    }
  },

  // Get translation
  t(key) {
    return this.translations[this.currentLang]?.[key]
      || this.translations['ja']?.[key]
      || key;
  },

  // Set language
  setLang(lang) {
    this.currentLang = lang;
    localStorage.setItem('cc_language', lang);
    store.set('userProfile', { ...(store.get('userProfile') || {}), language: lang });
  },

  // Init from stored preference
  init() {
    const profile = store.get('userProfile');
    const stored = localStorage.getItem('cc_language');
    this.currentLang = profile?.language || stored || 'ja';
  }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => i18n.init());
