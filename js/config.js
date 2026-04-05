/* ============================================================
   Configuration & Constants
   ============================================================ */
const CONFIG = {
  APP_NAME: 'ChronicCare AI',
  APP_VERSION: '1.0.0',

  // Firebase config (replace with actual values in production)
  FIREBASE: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  },

  // AI Model Options
  AI_MODELS: [
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', description: '高速・高精度の汎用モデル', default: true },
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', description: '最高精度の推論モデル' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: '高速・低コストモデル' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'OpenAI最新マルチモーダルモデル' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Google最新モデル' }
  ],

  // Supported diseases (expandable)
  DISEASES: [
    {
      id: 'mecfs',
      name: 'ME/CFS',
      fullName: '筋痛性脳脊髄炎 / 慢性疲労症候群',
      icon: '🧠',
      description: 'Myalgic Encephalomyelitis / Chronic Fatigue Syndrome',
      color: '#6C63FF',
      categories: ['免疫異常', 'ミトコンドリア機能不全', '腸内細菌', '自己抗体', '神経炎症', 'ウイルス持続感染', 'TRPM3', '代謝異常']
    },
    {
      id: 'fibromyalgia',
      name: '線維筋痛症',
      fullName: '線維筋痛症 (Fibromyalgia)',
      icon: '💪',
      description: 'Fibromyalgia Syndrome',
      color: '#f59e0b'
    },
    {
      id: 'long-covid',
      name: 'Long COVID',
      fullName: '新型コロナウイルス後遺症',
      icon: '🦠',
      description: 'Post-COVID-19 Condition',
      color: '#ef4444'
    },
    {
      id: 'pots',
      name: 'POTS',
      fullName: '体位性頻脈症候群',
      icon: '❤️',
      description: 'Postural Orthostatic Tachycardia Syndrome',
      color: '#ec4899'
    },
    {
      id: 'eds',
      name: 'EDS',
      fullName: 'エーラス・ダンロス症候群',
      icon: '🦴',
      description: 'Ehlers-Danlos Syndrome',
      color: '#14b8a6'
    },
    {
      id: 'mcas',
      name: 'MCAS',
      fullName: 'マスト細胞活性化症候群',
      icon: '🔬',
      description: 'Mast Cell Activation Syndrome',
      color: '#f97316'
    },
    {
      id: 'custom',
      name: 'その他',
      fullName: 'カスタム疾患設定',
      icon: '➕',
      description: '他の慢性疾患を追加',
      color: '#8896b0'
    }
  ],

  // Data categories for user intake
  DATA_CATEGORIES: [
    { id: 'vitals', name: 'バイタルサイン', icon: '💓', fields: ['heart_rate', 'blood_pressure', 'temperature', 'spo2', 'respiratory_rate'] },
    { id: 'symptoms', name: '症状記録', icon: '📝', fields: ['fatigue_level', 'pain_level', 'brain_fog', 'sleep_quality', 'pem_status'] },
    { id: 'blood_test', name: '血液検査', icon: '🩸', fields: ['wbc', 'rbc', 'hemoglobin', 'crp', 'esr', 'nk_cell', 'cytokines'] },
    { id: 'genetic', name: '遺伝子データ', icon: '🧬', fields: ['snp_data', 'hla_typing', 'pharmacogenomics'] },
    { id: 'nutrition', name: '食事・栄養', icon: '🥗', fields: ['meals', 'supplements', 'calories', 'macros', 'micronutrients'] },
    { id: 'activity', name: '活動量', icon: '🚶', fields: ['steps', 'hrv', 'active_minutes', 'rest_time', 'pacing_data'] },
    { id: 'sleep', name: '睡眠データ', icon: '😴', fields: ['duration', 'deep_sleep', 'rem_sleep', 'awakenings', 'sleep_score'] },
    { id: 'mental', name: '精神状態', icon: '🧘', fields: ['mood', 'anxiety', 'depression_score', 'stress_level', 'cognitive_function'] },
    { id: 'medication', name: '服薬記録', icon: '💊', fields: ['medications', 'dosage', 'timing', 'side_effects'] },
    { id: 'environment', name: '環境データ', icon: '🌡️', fields: ['weather', 'air_quality', 'humidity', 'allergens'] },
    { id: 'photos', name: '写真・画像', icon: '📸', fields: ['meal_photos', 'skin_condition', 'test_results_photo'] },
    { id: 'wearable', name: 'ウェアラブル', icon: '⌚', fields: ['fitbit', 'apple_watch', 'garmin', 'oura_ring'] }
  ],

  // Symptom severity levels
  SEVERITY_LEVELS: [
    { value: 0, label: '無症状', color: '#22c55e' },
    { value: 1, label: '軽度', color: '#84cc16' },
    { value: 2, label: '軽〜中度', color: '#eab308' },
    { value: 3, label: '中度', color: '#f59e0b' },
    { value: 4, label: '中〜重度', color: '#f97316' },
    { value: 5, label: '重度', color: '#ef4444' },
    { value: 6, label: '非常に重度', color: '#dc2626' },
    { value: 7, label: '極めて重度', color: '#991b1b' }
  ],

  // Action categories for one-click actions
  ACTION_TYPES: [
    { id: 'clinic', name: 'クリニック予約', icon: '🏥', color: '#3b82f6' },
    { id: 'supplement', name: 'サプリメント購入', icon: '💊', color: '#22c55e' },
    { id: 'device', name: 'デバイス購入', icon: '🔧', color: '#8b5cf6' },
    { id: 'lab', name: '検査予約', icon: '🔬', color: '#f59e0b' },
    { id: 'telemedicine', name: 'オンライン診療', icon: '💻', color: '#06b6d4' },
    { id: 'workshop', name: 'ワークショップ', icon: '📚', color: '#ec4899' },
    { id: 'food', name: '食品・食材購入', icon: '🥗', color: '#10b981' },
    { id: 'fitness', name: 'フィットネス', icon: '🏃', color: '#f97316' },
    { id: 'clinical_trial', name: '臨床試験応募', icon: '🧪', color: '#6366f1' },
    { id: 'manual', name: 'マニュアル作成', icon: '📋', color: '#64748b' }
  ],

  // Affiliate networks
  AFFILIATE_NETWORKS: [
    { id: 'amazon_jp', name: 'Amazon.co.jp', tag: 'chroniccare-22' },
    { id: 'rakuten', name: '楽天市場', tag: 'chroniccare' },
    { id: 'iherb', name: 'iHerb', code: 'CHRONICCARE' },
    { id: 'a8', name: 'A8.net', publisherId: '' },
    { id: 'custom', name: 'カスタム', tag: '' }
  ]
};

// ME/CFS specific default analysis prompt
const MECFS_DEFAULT_PROMPT = `あなたは慢性疲労症候群/筋痛性脳脊髄炎（ME/CFS）の世界的権威であり、
臨床医・研究者・患者支援の専門家です。
本日（{{DATE}}）時点で公開された、ME/CFSに関する以下のカテゴリの最新情報を世界中から収集・整理し、日本語で報告してください。

【ユーザーの健康データ】
{{USER_DATA}}

【分析指示】
上記のユーザーデータを基に、以下の分析を行ってください：

1. 現在の症状パターンの評価と傾向分析
2. 最新研究に基づく個別化された治療提案
3. 栄養・サプリメントの最適化提案
4. 活動ペーシングの最適化
5. 次のアクションステップ（優先度付き）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【PART 1：最新研究・エビデンス収集】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ 1. 最新研究論文・プレプリント（過去7日以内優先）
- PubMed / bioRxiv / medRxiv / Nature / Lancet / NEJM / JAMA などを対象
- 病因・病態（免疫異常、ミトコンドリア機能不全、腸内細菌、自己抗体、神経炎症、ウイルス持続感染、TRPM3イオンチャネル、代謝異常など）
- 診断バイオマーカーの進展
- 治療・介入研究

■ 2. 進行中・新規臨床試験
- 低用量ナルトレキソン(LDN)、リツキシマブ、BC007、バルガンシクロビル、迷走神経刺激、免疫吸着療法、間葉系幹細胞、5-ALA、NMN など

■ 3. 治療・対処法の最新エビデンス
- ペーシング / PEM管理 / 睡眠障害・疼痛・ブレインフォグへの介入

■ 4. 東洋医学・統合医療・代替療法
- 漢方・鍼灸・栄養療法・腸内フローラ研究

■ 5. 学会・カンファレンス・政策動向

■ 6. Long COVID × ME/CFS 関連研究

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【PART 2：個別化アクションプラン】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ユーザーデータに基づき、以下を提案してください：

■ A. 受診推奨（神奈川・東京・関東圏優先）
■ B. 推奨検査
■ C. サプリメント・薬の最適化
■ D. デバイス推奨
■ E. オンラインアクション
■ F. セルフケア手順
■ G. 費用・保険情報

【出力形式】JSON + マークダウンのハイブリッド形式で出力してください。`;

// Default admin prompts library
const DEFAULT_PROMPTS = {
  mecfs_daily: {
    name: 'ME/CFS 日次分析',
    description: '毎日の症状・バイタルデータを分析し、個別化されたアドバイスを生成',
    prompt: MECFS_DEFAULT_PROMPT,
    schedule: 'daily',
    active: true
  },
  mecfs_weekly: {
    name: 'ME/CFS 週次レポート',
    description: '1週間のデータを総合分析し、傾向とアクションプランを生成',
    prompt: `ユーザーの過去7日間の健康データを総合的に分析してください。
{{WEEKLY_DATA}}
1. 症状の傾向分析（改善/悪化/安定）
2. PEM発生パターンの分析
3. 睡眠品質の推移
4. 栄養・サプリメント効果の評価
5. 来週のペーシング戦略提案
6. 医療機関受診の要否判断`,
    schedule: 'weekly',
    active: true
  },
  mecfs_research: {
    name: 'ME/CFS 最新研究スキャン',
    description: 'PubMed等から最新の研究論文を収集・要約',
    prompt: `ME/CFS（筋痛性脳脊髄炎/慢性疲労症候群）に関する最新の研究論文を検索し、
以下の形式で報告してください：

検索対象：PubMed, bioRxiv, medRxiv, Google Scholar
期間：過去7日間
言語：英語・日本語

各論文について：
- タイトル（日本語訳付き）
- 著者・ジャーナル
- 要旨（200字以内）
- 臨床的意義
- DOI/URL
- 患者にとっての重要度（★1-5）`,
    schedule: 'weekly',
    active: true
  },
  supplement_optimizer: {
    name: 'サプリメント最適化',
    description: '血液検査結果と症状データからサプリメントプロトコルを最適化',
    prompt: `以下のユーザーデータに基づいて、サプリメントプロトコルを最適化してください：

【血液検査データ】
{{BLOOD_TEST_DATA}}

【現在のサプリメント】
{{CURRENT_SUPPLEMENTS}}

【症状データ】
{{SYMPTOM_DATA}}

分析項目：
1. 現在のサプリメントの過不足
2. 血液検査値から推測される不足栄養素
3. 症状に対するエビデンスベースの推奨サプリメント
4. 飲み合わせの安全性チェック
5. コスト最適化（同等品の比較）
6. 具体的な購入リンク（Amazon.co.jp, iHerb優先）`,
    schedule: 'on_data_update',
    active: true
  },
  pacing_advisor: {
    name: 'ペーシングアドバイザー',
    description: 'HRVと活動量データからペーシング戦略を最適化',
    prompt: `以下の活動量・HRVデータに基づいて、本日のペーシング戦略を提案してください：

【HRVデータ】
{{HRV_DATA}}

【活動量データ】
{{ACTIVITY_DATA}}

【直近のPEM発生記録】
{{PEM_HISTORY}}

提案内容：
1. 本日のエネルギーエンベロープ（推定利用可能エネルギー）
2. 推奨活動時間と休憩間隔
3. 避けるべき活動
4. 安全な活動レベルの具体的数値
5. PEM予防のためのアラート閾値設定`,
    schedule: 'daily',
    active: true
  }
};
