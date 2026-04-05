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
var DEFAULT_PROMPTS = {
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
