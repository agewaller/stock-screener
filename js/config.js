/* ============================================================
   Configuration & Constants
   ============================================================ */
var CONFIG = {
  APP_NAME: 'ChronicCare AI',
  APP_VERSION: '1.0.0',

  // Firebase config
  FIREBASE: {
    apiKey: 'AIzaSyDx9ByplxdzaWkLJrHnPhbf13MmUBEmLT8',
    authDomain: 'care-14c31.firebaseapp.com',
    projectId: 'care-14c31',
    storageBucket: 'care-14c31.firebasestorage.app',
    messagingSenderId: '429015904719',
    appId: '1:429015904719:web:0b57bb424006e86ab7a2ba',
    measurementId: 'G-YEHQ7MNRFX'
  },

  // AI Model Options
  AI_MODELS: [
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', description: '高速・高精度の汎用モデル', default: true },
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', description: '最高精度の推論モデル' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: '高速・低コストモデル' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'OpenAI最新マルチモーダルモデル' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Google最新モデル' }
  ],

  // WHO ICD-11 based disease categories
  DISEASE_CATEGORIES: [
    {
      id: 'neuro',
      name: '神経系疾患',
      icon: '🧠',
      icd: 'ICD-11: 08',
      diseases: [
        { id: 'mecfs', name: 'ME/CFS（筋痛性脳脊髄炎/慢性疲労症候群）', icd: '8E49' },
        { id: 'fibromyalgia', name: '線維筋痛症', icd: 'MG30.01' },
        { id: 'migraine', name: '片頭痛', icd: '8A80' },
        { id: 'epilepsy', name: 'てんかん', icd: '8A60' },
        { id: 'ms', name: '多発性硬化症（MS）', icd: '8A40' },
        { id: 'parkinsons', name: 'パーキンソン病', icd: '8A00' },
        { id: 'als', name: '筋萎縮性側索硬化症（ALS）', icd: '8B60' },
        { id: 'neuropathy', name: '末梢神経障害', icd: '8C0' },
        { id: 'dysautonomia', name: '自律神経障害', icd: '8D40' },
        { id: 'pots', name: 'POTS（体位性頻脈症候群）', icd: '8D40' },
        { id: 'tbi', name: '外傷性脳損傷後遺症', icd: '8B20' },
        { id: 'chronic_pain', name: '慢性疼痛症候群', icd: 'MG30' }
      ]
    },
    {
      id: 'mental',
      name: '精神・行動の障害',
      icon: '💭',
      icd: 'ICD-11: 06',
      diseases: [
        { id: 'depression', name: 'うつ病（大うつ病性障害）', icd: '6A70' },
        { id: 'bipolar', name: '双極性障害', icd: '6A60' },
        { id: 'gad', name: '全般性不安障害（GAD）', icd: '6B00' },
        { id: 'ptsd', name: 'PTSD（心的外傷後ストレス障害）', icd: '6B40' },
        { id: 'cptsd', name: '複雑性PTSD', icd: '6B41' },
        { id: 'ocd', name: '強迫性障害（OCD）', icd: '6B20' },
        { id: 'adhd', name: 'ADHD（注意欠如多動性障害）', icd: '6A05' },
        { id: 'asd', name: '自閉スペクトラム症（ASD）', icd: '6A02' },
        { id: 'eating', name: '摂食障害', icd: '6B8' },
        { id: 'insomnia', name: '不眠障害', icd: '7A00' },
        { id: 'substance', name: '物質依存症', icd: '6C4' },
        { id: 'burnout', name: 'バーンアウト症候群', icd: 'QD85' },
        { id: 'dissociative', name: '解離性障害', icd: '6B6' }
      ]
    },
    {
      id: 'immune',
      name: '免疫系疾患',
      icon: '🛡️',
      icd: 'ICD-11: 04',
      diseases: [
        { id: 'long_covid', name: 'Long COVID（コロナ後遺症）', icd: 'RA02' },
        { id: 'mcas', name: 'MCAS（マスト細胞活性化症候群）', icd: '4A44' },
        { id: 'sle', name: '全身性エリテマトーデス（SLE）', icd: '4A40' },
        { id: 'ra', name: '関節リウマチ', icd: 'FA20' },
        { id: 'sjogrens', name: 'シェーグレン症候群', icd: '4A42' },
        { id: 'hashimoto', name: '橋本病（慢性甲状腺炎）', icd: '5A00.1' },
        { id: 'crohns', name: 'クローン病', icd: 'DD70' },
        { id: 'uc', name: '潰瘍性大腸炎', icd: 'DD71' },
        { id: 'celiac', name: 'セリアック病', icd: 'DA95' },
        { id: 'psoriasis', name: '乾癬', icd: 'EA90' },
        { id: 'immunodeficiency', name: '免疫不全症', icd: '4A0' },
        { id: 'allergy', name: 'アレルギー疾患', icd: '4A8' }
      ]
    },
    {
      id: 'endocrine',
      name: '内分泌・代謝疾患',
      icon: '⚗️',
      icd: 'ICD-11: 05',
      diseases: [
        { id: 'diabetes_t1', name: '1型糖尿病', icd: '5A10' },
        { id: 'diabetes_t2', name: '2型糖尿病', icd: '5A11' },
        { id: 'thyroid_hypo', name: '甲状腺機能低下症', icd: '5A00' },
        { id: 'thyroid_hyper', name: '甲状腺機能亢進症（バセドウ病）', icd: '5A02' },
        { id: 'adrenal', name: '副腎機能不全', icd: '5A70' },
        { id: 'pcos', name: '多嚢胞性卵巣症候群（PCOS）', icd: 'GA30' },
        { id: 'metabolic_syndrome', name: 'メタボリックシンドローム', icd: '5B81' },
        { id: 'obesity', name: '肥満症', icd: '5B81' },
        { id: 'gout', name: '痛風・高尿酸血症', icd: 'FA25' },
        { id: 'osteoporosis', name: '骨粗鬆症', icd: 'FB83' }
      ]
    },
    {
      id: 'cardiovascular',
      name: '循環器疾患',
      icon: '❤️',
      icd: 'ICD-11: 11',
      diseases: [
        { id: 'hypertension', name: '高血圧症', icd: 'BA00' },
        { id: 'heart_failure', name: '心不全', icd: 'BD10' },
        { id: 'arrhythmia', name: '不整脈', icd: 'BC6' },
        { id: 'ihd', name: '虚血性心疾患', icd: 'BA80' },
        { id: 'dvt', name: '深部静脈血栓症', icd: 'BD40' },
        { id: 'raynauds', name: 'レイノー症候群', icd: 'BD30' }
      ]
    },
    {
      id: 'respiratory',
      name: '呼吸器疾患',
      icon: '🫁',
      icd: 'ICD-11: 12',
      diseases: [
        { id: 'asthma', name: '喘息', icd: 'CA23' },
        { id: 'copd', name: 'COPD（慢性閉塞性肺疾患）', icd: 'CA22' },
        { id: 'sleep_apnea', name: '睡眠時無呼吸症候群', icd: '7A40' },
        { id: 'pulmonary_fibrosis', name: '肺線維症', icd: 'CB03' }
      ]
    },
    {
      id: 'digestive',
      name: '消化器疾患',
      icon: '🫃',
      icd: 'ICD-11: 13',
      diseases: [
        { id: 'ibs', name: '過敏性腸症候群（IBS）', icd: 'DD91' },
        { id: 'gerd', name: '逆流性食道炎（GERD）', icd: 'DA22' },
        { id: 'nafld', name: '非アルコール性脂肪肝（NAFLD）', icd: 'DB92' },
        { id: 'sibo', name: 'SIBO（小腸内細菌増殖）', icd: 'DD90' },
        { id: 'gastroparesis', name: '胃不全麻痺', icd: 'DA44' }
      ]
    },
    {
      id: 'connective',
      name: '筋骨格・結合組織疾患',
      icon: '🦴',
      icd: 'ICD-11: 15',
      diseases: [
        { id: 'eds', name: 'EDS（エーラス・ダンロス症候群）', icd: 'LD28' },
        { id: 'ankylosing', name: '強直性脊椎炎', icd: 'FA92' },
        { id: 'myasthenia', name: '重症筋無力症', icd: '8C60' },
        { id: 'polymyalgia', name: 'リウマチ性多発筋痛症', icd: 'FA21' }
      ]
    },
    {
      id: 'cancer',
      name: 'がん・腫瘍（経過観察・後遺症）',
      icon: '🎗️',
      icd: 'ICD-11: 02',
      diseases: [
        { id: 'cancer_survivor', name: 'がんサバイバー（治療後管理）', icd: '02' },
        { id: 'cancer_fatigue', name: 'がん関連疲労', icd: 'MG22' },
        { id: 'chemo_side', name: '化学療法後遺症', icd: 'NE61' }
      ]
    },
    {
      id: 'other',
      name: 'その他・複合的症候群',
      icon: '🔬',
      icd: '',
      diseases: [
        { id: 'mcs', name: '化学物質過敏症（MCS）', icd: 'NE61' },
        { id: 'emf', name: '電磁波過敏症', icd: '' },
        { id: 'lyme', name: 'ライム病（慢性）', icd: '1C1G' },
        { id: 'mold', name: 'カビ毒（マイコトキシン）症', icd: '' },
        { id: 'hsd', name: '関節過可動性症候群', icd: 'FB32' },
        { id: 'custom', name: 'その他（自由記入）', icd: '' }
      ]
    }
  ],

  // Test kits and lab recommendations
  TEST_KITS: [
    { id: 'blood_basic', name: '基本血液検査キット', description: '血算・肝機能・腎機能・CRP・甲状腺', price: '¥5,000〜¥10,000', where: 'クリニック', url: '' },
    { id: 'nk_cell', name: 'NK細胞活性検査', description: '免疫機能の評価（ME/CFS重要指標）', price: '¥8,000〜¥15,000', where: 'クリニック', url: '' },
    { id: 'cytokine', name: 'サイトカインパネル', description: 'IL-6, TNF-α, IFN-γ等の炎症マーカー', price: '¥20,000〜¥40,000', where: '専門病院', url: '' },
    { id: 'thyroid', name: '甲状腺パネル', description: 'TSH, T3, T4, 抗TPO, 抗TG抗体', price: '¥5,000〜¥10,000', where: 'クリニック', url: '' },
    { id: 'vitamin_d', name: 'ビタミンD検査（血清25-OH）', description: '免疫・骨代謝の重要指標', price: '¥3,000〜¥5,000', where: 'クリニック', url: 'https://www.amazon.co.jp/s?k=ビタミンD+検査キット' },
    { id: 'cortisol', name: 'コルチゾール検査', description: 'HPA軸の評価（副腎疲労）', price: '¥3,000〜¥8,000', where: 'クリニック', url: '' },
    { id: 'food_allergy', name: '遅延型食物アレルギー検査（IgG）', description: '96項目食物アレルギーパネル', price: '¥30,000〜¥40,000', where: '郵送検査', url: 'https://www.amazon.co.jp/s?k=IgG+食物アレルギー+検査' },
    { id: 'gut_flora', name: '腸内フローラ検査', description: '腸内細菌叢の構成分析', price: '¥15,000〜¥25,000', where: '郵送検査', url: 'https://www.amazon.co.jp/s?k=腸内フローラ+検査キット' },
    { id: 'genetic', name: '遺伝子検査', description: 'SNP解析、薬剤代謝、疾患リスク', price: '¥10,000〜¥30,000', where: '郵送検査', url: 'https://www.amazon.co.jp/s?k=遺伝子検査キット' },
    { id: 'heavy_metal', name: '重金属・有害ミネラル検査（毛髪）', description: '水銀・鉛・カドミウム・ヒ素等', price: '¥10,000〜¥15,000', where: '郵送検査', url: 'https://www.amazon.co.jp/s?k=毛髪ミネラル検査' },
    { id: 'hormone', name: 'ホルモンパネル（DUTCH）', description: 'コルチゾール・性ホルモン・メラトニン', price: '¥40,000〜¥60,000', where: '郵送検査', url: '' },
    { id: 'organic_acid', name: '有機酸検査（OAT）', description: 'ミトコンドリア機能・栄養代謝の包括評価', price: '¥40,000〜¥60,000', where: '郵送（海外ラボ）', url: '' },
    { id: 'sleep_study', name: '睡眠ポリグラフ検査', description: '無呼吸・睡眠の質の客観評価', price: '¥10,000〜¥30,000', where: '病院・在宅キット', url: 'https://www.amazon.co.jp/s?k=睡眠検査キット' },
    { id: 'hrv_monitor', name: 'HRVモニター（Oura/Garmin）', description: '自律神経バランスの継続モニタリング', price: '¥30,000〜¥50,000', where: 'Amazon', url: 'https://www.amazon.co.jp/s?k=oura+ring' },
    { id: 'autoantibody', name: '自己抗体パネル', description: 'ANA, 抗dsDNA, GPCR自己抗体等', price: '¥15,000〜¥30,000', where: '専門病院', url: '' }
  ],

  // Legacy single-disease selection (kept for backward compat)
  DISEASES: [
    { id: 'mecfs', name: 'ME/CFS', fullName: '筋痛性脳脊髄炎 / 慢性疲労症候群', icon: '🧠', color: '#6C63FF' },
    { id: 'fibromyalgia', name: '線維筋痛症', fullName: '線維筋痛症', icon: '💪', color: '#f59e0b' },
    { id: 'long_covid', name: 'Long COVID', fullName: '新型コロナウイルス後遺症', icon: '🦠', color: '#ef4444' },
    { id: 'depression', name: 'うつ病', fullName: 'うつ病（大うつ病性障害）', icon: '💭', color: '#8b5cf6' },
    { id: 'custom', name: 'その他', fullName: 'カスタム疾患設定', icon: '➕', color: '#8896b0' }
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
var MECFS_DEFAULT_PROMPT = `あなたは慢性疲労症候群/筋痛性脳脊髄炎（ME/CFS）の世界的権威であり、
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
// ============================================================
// Disease-specific and universal prompt library
// ============================================================

// Common header injected into all prompts
var PROMPT_HEADER = `【ユーザープロフィール】
{{USER_PROFILE}}

【選択疾患】{{SELECTED_DISEASES}}

【ユーザーの健康データ】
{{USER_DATA}}

【本日の日付】{{DATE}}
`;

// ---- UNIVERSAL PROMPTS (all diseases / healthy people) ----
var UNIVERSAL_PROMPTS = {
  universal_daily: {
    name: '日次健康分析（共通）',
    disease: '_universal',
    description: '全疾患・健常者共通の毎日の健康分析',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたは統合医療・予防医学の世界的専門家です。
上記ユーザーデータを基に以下を分析・提案してください：

1. 本日の体調評価と傾向分析
2. 睡眠・栄養・活動量のバランス評価
3. ストレスレベルの推定と対策
4. 免疫力・炎症レベルの推定
5. 具体的な改善アクション（優先度付き）
6. 推奨サプリメント・食事
7. 受診が必要な兆候があればアラート

出力はユーザーの居住地（{{LOCATION}}）の医療機関・薬局を優先して提案すること。`
  },
  universal_weekly: {
    name: '週次レポート（共通）',
    disease: '_universal',
    description: '1週間の総合分析',
    schedule: 'weekly',
    active: true,
    prompt: PROMPT_HEADER + `過去7日間の健康データを総合分析してください。
{{WEEKLY_DATA}}

1. 症状・体調の傾向（改善/悪化/安定をグラフ的に表現）
2. 睡眠品質の推移と改善策
3. 栄養・サプリメント効果の評価
4. 活動量と回復のバランス
5. メンタルヘルスの状態
6. 来週の生活改善戦略
7. 医療機関受診の要否判断`
  },
  supplement_optimizer: {
    name: 'サプリメント最適化（共通）',
    disease: '_universal',
    description: '血液検査と症状からサプリプロトコルを最適化',
    schedule: 'on_data_update',
    active: true,
    prompt: PROMPT_HEADER + `以下のデータに基づき、サプリメントプロトコルを最適化してください：
【血液検査】{{BLOOD_TEST_DATA}}
【現在のサプリ】{{CURRENT_SUPPLEMENTS}}
【症状】{{SYMPTOM_DATA}}

分析：
1. 不足栄養素の特定
2. エビデンスベースの推奨サプリメント（用量・タイミング）
3. 飲み合わせの安全性チェック
4. コスト最適化
5. 具体的な購入リンク（Amazon.co.jp, iHerb優先）`
  },
  sleep_analysis: {
    name: '睡眠分析（共通）',
    disease: '_universal',
    description: '睡眠の質を分析し改善策を提案',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `睡眠データと日中の症状から睡眠の質を分析してください。

1. 睡眠の量と質の評価
2. 睡眠障害の兆候（無呼吸、中途覚醒、入眠困難等）
3. 概日リズムの評価
4. 睡眠環境の改善提案（温度・光・音・電磁波）
5. 睡眠補助の推奨（メラトニン、マグネシウム、GABA等）
6. 睡眠薬を使用中の場合、減薬に向けたアドバイス`
  },
  nutrition_analysis: {
    name: '栄養分析（共通）',
    disease: '_universal',
    description: '食事内容を分析し栄養改善を提案',
    schedule: 'on_data_update',
    active: true,
    prompt: PROMPT_HEADER + `ユーザーの食事記録・食事写真・栄養データを分析してください。

1. 主要栄養素（タンパク質・脂質・炭水化物）のバランス
2. 微量栄養素の過不足
3. 抗炎症食の観点からの評価
4. 腸内環境への影響
5. 疾患特有の食事制限への適合性
6. 具体的な食事改善提案（レシピ含む）
7. 推奨食品の購入リンク`
  },
  mental_health: {
    name: 'メンタルヘルス分析（共通）',
    disease: '_universal',
    description: '精神状態を分析しケアを提案',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `ユーザーの精神状態・会話記録・日記データを分析してください。

1. 現在の気分・感情状態の評価
2. ストレス要因の特定
3. うつ・不安の兆候チェック
4. 孤独感・社会的孤立のリスク評価
5. 即実行可能なセルフケア手順
6. 専門家（心療内科・カウンセラー）受診の要否
7. 瞑想・呼吸法・マインドフルネスの具体的プロトコル`
  }
};

// ---- DISEASE-SPECIFIC PROMPTS ----
var DISEASE_PROMPTS = {
  // ME/CFS
  mecfs_daily: {
    name: 'ME/CFS 日次分析',
    disease: 'mecfs',
    description: 'ME/CFS専門の毎日の症状分析',
    schedule: 'daily',
    active: true,
    prompt: MECFS_DEFAULT_PROMPT
  },
  mecfs_research: {
    name: 'ME/CFS 最新研究',
    disease: 'mecfs',
    description: 'PubMed等からME/CFS最新論文を収集',
    schedule: 'weekly',
    active: true,
    prompt: PROMPT_HEADER + `ME/CFS（筋痛性脳脊髄炎/慢性疲労症候群）の最新研究を報告してください。
検索対象：PubMed, bioRxiv, medRxiv　期間：過去7日間
重点領域：免疫異常、ミトコンドリア、TRPM3、自己抗体、LDN、BC007、迷走神経刺激
各論文：タイトル（日本語訳）・著者・要旨・臨床的意義・DOI・重要度★1-5`
  },
  mecfs_pacing: {
    name: 'ME/CFS ペーシング',
    disease: 'mecfs',
    description: 'PEM予防のためのペーシング戦略',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `ME/CFS患者のペーシング戦略を提案してください。
【HRV】{{HRV_DATA}}　【活動量】{{ACTIVITY_DATA}}　【PEM履歴】{{PEM_HISTORY}}

1. 本日のエネルギーエンベロープ推定
2. 推奨活動時間と休憩間隔
3. PEM発症リスク評価
4. 心拍数ベースの活動限界値
5. 安全な活動の具体例と時間配分`
  },

  // うつ病
  depression_daily: {
    name: 'うつ病 日次分析',
    disease: 'depression',
    description: 'うつ病の症状追跡と気分管理',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたはうつ病（大うつ病性障害）の専門医・認知行動療法の専門家です。
ユーザーの日記・気分データ・活動量を分析してください。

1. 今日の気分スコアとPHQ-9推定値
2. 認知の歪み（全か無思考、過度の一般化等）の検出
3. 行動活性化の提案（小さな達成可能な目標）
4. 反芻思考パターンの分析と対策
5. 社会的つながりの評価
6. 服薬アドヒアランスの確認
7. 自殺念慮のスクリーニング（該当時は即時受診推奨）
8. 今日の具体的なセルフケアステップ`
  },
  depression_research: {
    name: 'うつ病 最新研究',
    disease: 'depression',
    description: 'うつ病の最新治療研究',
    schedule: 'weekly',
    active: true,
    prompt: PROMPT_HEADER + `うつ病の最新研究を報告してください。
重点：ケタミン/エスケタミン、TMS、サイケデリクス療法（シロシビン）、腸脳相関、炎症性うつ病、デジタル治療（CBT-i等）、運動療法のRCT、栄養精神医学`
  },

  // 双極性障害
  bipolar_daily: {
    name: '双極性障害 日次分析',
    disease: 'bipolar',
    description: '気分の波の追跡と安定化',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたは双極性障害の専門医です。
ユーザーデータから気分エピソードの状態を評価してください。

1. 現在の気分状態（うつ/正常/軽躁/躁）の推定
2. 睡眠パターンからの躁転兆候チェック
3. 活動量と気分の相関分析
4. 服薬（リチウム・バルプロ酸等）の効果評価
5. トリガー要因の特定（睡眠不足・ストレス・季節）
6. 安定化のための具体的アクション`
  },

  // PTSD/C-PTSD
  ptsd_daily: {
    name: 'PTSD 日次分析',
    disease: 'ptsd',
    description: 'トラウマ症状の追跡とケア',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたはPTSD/複雑性PTSDの専門家（EMDR・CPT認定）です。

1. フラッシュバック・悪夢の頻度と強度の追跡
2. 回避行動パターンの分析
3. 過覚醒・感情麻痺の評価
4. ウィンドウ・オブ・トレランス（耐性の窓）の評価
5. グラウンディングテクニックの提案
6. EMDR・PE・CPTなど専門治療へのアクセス情報
7. 安全な日常ルーティンの提案`
  },

  // ADHD
  adhd_daily: {
    name: 'ADHD 日次分析',
    disease: 'adhd',
    description: '注意力・実行機能の管理支援',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたはADHD（注意欠如多動性障害）の専門家です。

1. 今日の集中力・実行機能の評価
2. タスク管理・時間管理の改善提案
3. 過集中と注意散漫のパターン分析
4. 服薬効果の評価（メチルフェニデート・アトモキセチン等）
5. 環境調整の提案（ノイズ・刺激管理）
6. 運動・マインドフルネスによる自己制御戦略
7. 睡眠と覚醒リズムの最適化`
  },

  // Long COVID
  long_covid_daily: {
    name: 'Long COVID 日次分析',
    disease: 'long_covid',
    description: 'コロナ後遺症の症状管理',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたはLong COVID（Post-COVID Condition）の専門医です。
ME/CFSとの重複症状にも注意して分析してください。

1. 主要症状クラスターの評価（疲労・認知・自律神経・呼吸・疼痛）
2. PEM有無の評価とペーシング戦略
3. ブレインフォグの程度と認知リハビリ提案
4. 微小血栓・血管内皮障害の兆候チェック
5. 免疫調整・抗炎症アプローチ
6. ワクチン接種歴との関連評価
7. 最新治療オプション（抗凝固、LDN、HBOT等）`
  },

  // 線維筋痛症
  fibromyalgia_daily: {
    name: '線維筋痛症 日次分析',
    disease: 'fibromyalgia',
    description: '疼痛管理と生活の質向上',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたは線維筋痛症の専門医です。

1. 疼痛マップ（部位・強度・種類）の評価
2. 中枢性感作の程度評価
3. 疼痛管理戦略（薬物・非薬物の組み合わせ）
4. 睡眠の質と疼痛の相関分析
5. 運動療法プロトコル（水中運動・ヨガ・太極拳）
6. プレガバリン・デュロキセチン等の効果評価
7. トリガーポイントのセルフケア手順`
  },

  // 甲状腺疾患
  thyroid_daily: {
    name: '甲状腺疾患 日次分析',
    disease: 'hashimoto',
    description: '甲状腺機能と症状の管理',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたは甲状腺疾患（橋本病・バセドウ病・甲状腺機能低下/亢進症）の専門医です。

1. 甲状腺関連症状の評価（疲労・体重変動・冷え・動悸等）
2. TSH/T3/T4の推移分析（検査データがある場合）
3. 薬用量（レボチロキシン等）の適正評価
4. 自己免疫管理（抗TPO/TG抗体）
5. セレン・亜鉛・ヨウ素の栄養管理
6. グルテンフリー食の検討
7. ストレスとHPA軸への影響`
  },

  // 糖尿病
  diabetes_daily: {
    name: '糖尿病 日次分析',
    disease: 'diabetes_t2',
    description: '血糖管理と合併症予防',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたは糖尿病専門医・糖尿病療養指導士です。

1. 血糖値パターンの分析（食前/食後/空腹時）
2. HbA1c推定と目標管理
3. 食事の血糖インパクト評価
4. インスリン抵抗性の評価
5. 運動と血糖の関係分析
6. 合併症リスク評価（腎症・網膜症・神経障害）
7. GLP-1受容体作動薬・SGLT2阻害薬の効果評価`
  },

  // 自己免疫疾患（共通）
  autoimmune_daily: {
    name: '自己免疫疾患 日次分析',
    disease: 'sle',
    description: 'SLE・RA等の自己免疫疾患管理',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたは自己免疫疾患（SLE・関節リウマチ・シェーグレン等）の専門医です。

1. フレア（増悪）の兆候チェック
2. 炎症マーカー（CRP・ESR・補体）の推移
3. 免疫抑制薬の効果と副作用モニタリング
4. 紫外線・ストレス等のトリガー管理
5. 疲労管理とペーシング
6. 骨密度・感染リスクの評価
7. 妊娠計画がある場合の薬剤調整`
  },

  // IBS（過敏性腸症候群）
  ibs_daily: {
    name: 'IBS 日次分析',
    disease: 'ibs',
    description: '腸症状と食事管理',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたは消化器内科・IBS専門医です。

1. 腸症状（腹痛・膨満・下痢・便秘）の評価
2. 食事トリガーの特定（FODMAP分析）
3. 腸内細菌叢の状態推定
4. ストレスと腸症状の相関
5. Low-FODMAPプロトコルの提案
6. プロバイオティクス・プレバイオティクスの推奨
7. 腸脳相関に基づく心理的アプローチ`
  },

  // POTS
  pots_daily: {
    name: 'POTS 日次分析',
    disease: 'pots',
    description: '起立不耐と自律神経管理',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたはPOTS（体位性頻脈症候群）・自律神経障害の専門医です。

1. 起立時心拍数変動の評価
2. 血圧・心拍のパターン分析
3. 水分・塩分摂取量の適正評価
4. 圧迫衣類・傾斜訓練の効果
5. ミドドリン・フロリネフ等の薬効評価
6. 運動プロトコル（臥位→座位→立位の段階的）
7. ME/CFS・MCAS・EDS合併時の注意点`
  },

  // 不眠症
  insomnia_daily: {
    name: '不眠症 日次分析',
    disease: 'insomnia',
    description: '睡眠障害の分析と改善',
    schedule: 'daily',
    active: true,
    prompt: PROMPT_HEADER + `あなたは睡眠医学の専門医・CBT-I（不眠症の認知行動療法）の専門家です。

1. 睡眠効率の計算と評価
2. 入眠潜時・中途覚醒・早朝覚醒のパターン
3. 睡眠日誌分析
4. CBT-Iの具体的介入（刺激制御・睡眠制限・認知再構成）
5. 睡眠薬の減薬プロトコル（使用中の場合）
6. 概日リズム調整（光療法・メラトニン）
7. 睡眠衛生チェックリスト`
  }
};

// Build DEFAULT_PROMPTS by merging universal + disease-specific
var DEFAULT_PROMPTS = { ...UNIVERSAL_PROMPTS, ...DISEASE_PROMPTS };
