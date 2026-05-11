// === js/config.js ===
/* ============================================================
   Configuration & Constants
   ============================================================ */
var CONFIG = {
  APP_NAME: '健康日記',
  APP_VERSION: '1.0.0',

  // Contact email — single source of truth for all お問い合わせ
  // links, privacy/terms documents, and user-facing email mentions.
  // Update this one value to change the contact address everywhere.
  CONTACT_EMAIL: 'info@bluemarl.in',

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

  // AI Model Options. Opus 4.6 is the default because billing is not a
  // constraint and we want the strongest model by default.
  AI_MODELS: [
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'Anthropic', description: '最高精度（応答30-60秒）' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', description: '高速・高精度（推奨・10-20秒）', default: true },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: '最速・低コスト（3-8秒）' },
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

  // ============================================================
  // 世界患者数 (Global patient estimates)
  // ------------------------------------------------------------
  // Tier-based reliability classification per docs/世界患者数一覧.md:
  //   tier 1 = 直接の世界人数が比較的固いもの
  //   tier 2 = 数千万規模の固い数字
  //   tier 3 = 有病率からの粗推計 (表示時は "(推計)" を付ける)
  // density: 管理密度 (high/medium/low) — AI トラッキング必要性の
  //          高さ。ボリューム軸と独立した事業優先度の指標。
  // 基準: 2025 年、世界人口 82 億人。注意事項は docs/世界患者数一覧.md 参照。
  //
  // 注: POTS / MCAS / EDS / hEDS / 複雑性PTSD / GAD 単独 / MCS /
  // カビ毒症等は「単一の世界推計を置きにくい」グループ (tier 0)
  // として label のみ保持、numeric は null。
  // ============================================================
  DISEASE_EPIDEMIOLOGY: {
    // ─── Tier 1: 固い数字 (数億人〜十数億人) ───
    chronic_pain:       { world: 1_500_000_000, label: '約 15 億人',       tier: 1, density: 'high',   source: '最新レビュー',
                          japan: 23_000_000, japanLabel: '約 2,300 万人',      japanSource: 'ペインクリニック学会推計' },
    metabolic_syndrome: { world: 1_540_000_000, label: '約 15.4 億人',     tier: 1, density: 'medium', source: '2023 成人推計',
                          japan: 20_000_000, japanLabel: '約 2,000 万人',      japanSource: '厚労省' },
    hypertension:       { world: 1_400_000_000, label: '約 14 億人',       tier: 1, density: 'medium', source: 'WHO 30-79歳',
                          japan: 43_000_000, japanLabel: '約 4,300 万人',      japanSource: '日本高血圧学会' },
    migraine:           { world: 1_200_000_000, label: '約 12 億人',       tier: 1, density: 'medium', source: 'GBD 2021',
                          japan:  8_400_000, japanLabel: '約 840 万人',        japanSource: '日本頭痛学会' },
    sleep_apnea:        { world:   936_000_000, label: '約 9.36 億人',     tier: 1, density: 'medium', source: 'OSA 30-69歳成人',
                          japan: 22_000_000, japanLabel: '約 2,200 万人 (推計)', japanSource: '推計、診断率低' },
    obesity:            { world:   890_000_000, label: '約 8.9 億人',      tier: 1, density: 'medium', source: 'WHO 成人',
                          japan: 28_000_000, japanLabel: '約 2,800 万人',      japanSource: 'BMI≥25 国民健康栄養調査' },
    insomnia:           { world:   852_000_000, label: '約 8.52 億人',     tier: 1, density: 'medium', source: '成人推計',
                          japan: 30_000_000, japanLabel: '約 3,000 万人',      japanSource: '国民生活基礎調査' },
    gerd:               { world:   826_000_000, label: '約 8.26 億人',     tier: 1, density: 'low',    source: 'GBD 2021',
                          japan: 20_000_000, japanLabel: '約 2,000 万人 (推計)', japanSource: '国内有病率 ~17%' },
    diabetes_t2:        { world:   589_000_000, label: '約 5.89 億人',     tier: 1, density: 'high',   source: 'IDF 20-79歳 (T1+T2)',
                          japan: 10_000_000, japanLabel: '約 1,000 万人',      japanSource: '厚労省 (T1+T2)' },
    gad:                { world:   359_000_000, label: '約 3.59 億人',     tier: 1, density: 'medium', source: '不安障害全体',
                          japan:  5_000_000, japanLabel: '約 500 万人 (推計)', japanSource: '生涯有病率 4-5%' },
    depression:         { world:   332_000_000, label: '約 3.32 億人',     tier: 1, density: 'high',   source: 'WHO 2025',
                          japan:  1_720_000, japanLabel: '約 172 万人',        japanSource: '厚労省患者調査 2020' },
    copd:               { world:   342_000_000, label: '約 2.92〜3.92 億人', tier: 1, density: 'medium', source: '2019 LLN/GOLD',
                          japan:  5_300_000, japanLabel: '約 530 万人',        japanSource: 'NICE Study' },
    asthma:             { world:   262_000_000, label: '約 2.62 億人',     tier: 1, density: 'medium', source: 'WHO fact sheet',
                          japan:  8_000_000, japanLabel: '約 800 万人 (推計)', japanSource: '厚労省推計' },
    ihd:                { world:   254_000_000, label: '約 2.54 億人',     tier: 1, density: 'low',    source: 'GBD 2021',
                          japan:  1_000_000, japanLabel: '約 100 万人',        japanSource: '日本循環器学会' },

    // ─── Tier 2: 数千万規模 ───
    long_covid:         { world:  65_000_000, label: '少なくとも 6,500 万人', tier: 2, density: 'high',   source: 'グローバル推計',
                          japan:  7_000_000, japanLabel: '約 700 万人 (推計)', japanSource: '厚労省研究班推計 累積感染×有病率' },
    heart_failure:      { world:  64_000_000, label: '6,400 万人',           tier: 2, density: 'high',   source: 'グローバル推計',
                          japan:  1_300_000, japanLabel: '約 130 万人',        japanSource: '日本循環器学会' },
    asd:                { world:  62_000_000, label: '約 6,200 万人',        tier: 2, density: 'high',   source: 'グローバル推計',
                          japan:  1_000_000, japanLabel: '約 100 万人 (推計)', japanSource: '有病率 ~1%' },
    gout:               { world:  55_800_000, label: '5,580 万人',           tier: 2, density: 'medium', source: 'グローバル推計',
                          japan:  1_250_000, japanLabel: '約 125 万人',        japanSource: '痛風のみ。高尿酸血症で約 1,000 万人' },
    cancer_survivor:    { world:  53_500_000, label: '5,350 万人',           tier: 2, density: 'high',   source: 'GLOBOCAN 5年有病',
                          japan:  7_000_000, japanLabel: '約 700 万人',        japanSource: '国立がん研究センター 5年有病含' },
    arrhythmia:         { world:  52_550_000, label: '5,255 万人 (AF/AFL)',  tier: 2, density: 'medium', source: 'グローバル推計',
                          japan:  1_500_000, japanLabel: '約 100-170 万人 (AF)', japanSource: '日本循環器学会' },
    epilepsy:           { world:  50_000_000, label: '5,000 万人',           tier: 2, density: 'high',   source: 'WHO',
                          japan:  1_000_000, japanLabel: '約 100 万人',        japanSource: '日本てんかん学会' },
    psoriasis:          { world:  43_000_000, label: '4,300 万人',           tier: 2, density: 'medium', source: '2021 burden',
                          japan:    500_000, japanLabel: '約 43-50 万人',      japanSource: '日本皮膚科学会推計' },
    bipolar:            { world:  37_000_000, label: '3,700 万人',           tier: 2, density: 'high',   source: 'グローバル推計',
                          japan:    750_000, japanLabel: '約 50-100 万人 (推計)', japanSource: '生涯有病率 ~0.7%' },
    ra:                 { world:  17_900_000, label: '1,790 万人',           tier: 2, density: 'high',   source: 'グローバル推計',
                          japan:    900_000, japanLabel: '約 82-100 万人',     japanSource: '日本リウマチ学会' },
    eating:             { world:  16_000_000, label: '1,600 万人',           tier: 2, density: 'high',   source: 'グローバル推計',
                          japan:    250_000, japanLabel: '約 20-30 万人',      japanSource: '厚労省研究班' },
    diabetes_t1:        { world:   9_500_000, label: '950 万人',             tier: 2, density: 'high',   source: 'IDF',
                          japan:    120_000, japanLabel: '約 10-14 万人',      japanSource: 'T1D のみ' },
    parkinsons:         { world:   8_500_000, label: '850 万人超',           tier: 2, density: 'high',   source: 'グローバル推計',
                          japan:    200_000, japanLabel: '約 20 万人',         japanSource: '厚労省患者調査' },
    sle:                { world:   3_410_000, label: '341 万人',             tier: 2, density: 'high',   source: 'グローバル推計',
                          japan:     80_000, japanLabel: '約 6-10 万人',       japanSource: '指定難病、医療受給者証' },
    ms:                 { world:   2_900_000, label: '290 万人',             tier: 2, density: 'high',   source: 'Atlas of MS 2023',
                          japan:     25_000, japanLabel: '約 2-3 万人',        japanSource: '指定難病' },

    // ─── Tier 3: 有病率からの粗推計 (表示時 "(推計)" 付き) ───
    osteoporosis:       { world: 1_500_000_000, label: '約 15 億人 (粗推計)',       tier: 3, density: 'medium', source: '18.3% 外挿',       note: '年齢性差の影響大',
                          japan: 12_800_000, japanLabel: '約 1,280 万人',           japanSource: '日本骨粗鬆症学会' },
    ibs:                { world: 1_080_000_000, label: '約 10.8 億人 (推計)',      tier: 3, density: 'medium', source: '13.21% メタ解析外挿',
                          japan: 14_000_000, japanLabel: '約 1,400 万人',          japanSource: '日本消化器病学会' },
    thyroid_hypo:       { world:   410_000_000, label: '最大 4.1 億人 (推計)',     tier: 3, density: 'medium', source: '~5% レビュー',
                          japan:  7_500_000, japanLabel: '約 500-1,000 万人 (潜在含)', japanSource: '橋本病は別カウント' },
    raynauds:           { world:   400_000_000, label: '約 4.0 億人 (粗推計)',     tier: 3, density: 'low',    source: '4.85% 外挿',
                          japan:  null,      japanLabel: '国内推計策定中',        japanSource: '有病率データ未確定' },
    ptsd:               { world:   320_000_000, label: '約 3.2 億人 (生涯有病率)', tier: 3, density: 'high',   source: '3.9% 生涯有病率',
                          japan:  1_800_000, japanLabel: '約 160-200 万人 (生涯)', japanSource: '生涯有病率 1.3-1.6%' },
    fibromyalgia:       { world:   220_000_000, label: '約 2.2 億人 (推計)',       tier: 3, density: 'high',   source: '2.7% 外挿',
                          japan:  2_000_000, japanLabel: '約 200 万人',            japanSource: '日本線維筋痛症学会' },
    neuropathy:         { world:   200_000_000, label: '約 2.0 億人 (推計)',       tier: 3, density: 'medium', source: '2.4% 外挿',
                          japan:  3_000_000, japanLabel: '約 200-400 万人 (推計)', japanSource: '糖尿病性含' },
    pcos:               { world:   175_000_000, label: '約 1.75 億人 (推計)',      tier: 3, density: 'medium', source: '15-49歳女性19億×9.2%',
                          japan:  2_000_000, japanLabel: '約 100-300 万人 (推計)', japanSource: '日本産婦人科学会' },
    ocd:                { world:   164_000_000, label: '約 8,200 万〜2.46 億人 (推計)', tier: 3, density: 'high', source: '1-3% 幅',
                          japan:  1_800_000, japanLabel: '約 100-250 万人 (推計)', japanSource: '生涯有病率 1-2%' },
    celiac:             { world:    86_000_000, label: '約 5,740 万〜1.15 億人 (推計)', tier: 3, density: 'medium', source: '0.7-1.4% 外挿',
                          japan:     10_000, japanLabel: '極めて稀 (数千人レベル)', japanSource: '国内有病率 低' },
    mecfs:              { world:    67_000_000, label: '約 6,700 万人 (推計)',     tier: 3, density: 'high',   source: 'レビュー文献',
                          japan:    200_000, japanLabel: '約 10-30 万人 (推計)',   japanSource: '厚労省研究班' },
    sjogrens:           { world:     5_000_000, label: '約 500 万人 (推計)',       tier: 3, density: 'high',   source: '60.82/10万外挿',
                          japan:    200_000, japanLabel: '約 6.8 万人 (指定難病) + 潜在 10-30 万人', japanSource: '指定難病受給 + 潜在推計' },
    adrenal:            { world:     2_500_000, label: '約 250 万人 (推計)',       tier: 3, density: 'high',   source: '300/100万外挿',
                          japan:     10_000, japanLabel: '約 1 万人 (推計)',       japanSource: '指定難病含む粗推計' },
    eds:                { world:    12_500_000, label: '約 900〜1,600 万人 (推計)', tier: 3, density: 'high',   source: '1/900-1/500', note: '診断基準ゆれ大',
                          japan:    150_000, japanLabel: '約 10-15 万人 (推計)',  japanSource: '1/500-1/900 を人口比外挿' },
    myasthenia:         { world:     1_000_000, label: '約 100 万人 (推計)',       tier: 3, density: 'high',   source: '12.4/10万外挿',
                          japan:     23_000, japanLabel: '約 2.3 万人',           japanSource: '指定難病' },
    als:                { world:       370_000, label: '約 37 万人 (推計)',        tier: 3, density: 'high',   source: '4.5/10万外挿',
                          japan:     10_000, japanLabel: '約 1 万人',             japanSource: '指定難病' },

    // ─── Tier 0: 単一世界人数を置きにくい群 (numeric null) ───
    pots:               { world: null, label: '世界推計は策定中 (米国で 0.1-1.0%)', tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中', japanSource: '研究ベース' },
    mcas:               { world: null, label: '世界推計は策定中',                  tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中', japanSource: '診断基準未確定' },
    dysautonomia:       { world: null, label: '世界推計は策定中',                  tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中' },
    cptsd:              { world: null, label: '世界推計は策定中',                  tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中' },
    adhd:               { world: null, label: '世界推計は策定中 (児童青年のみ 4,689 万人)', tier: 0, density: 'medium',
                          japan: 2_000_000, japanLabel: '約 100-300 万人 (推計)', japanSource: '成人有病率 2-4%' },
    hashimoto:          { world: null, label: '世界推計は策定中 (甲状腺低下と別計)', tier: 0, density: 'medium',
                          japan: 2_000_000, japanLabel: '診断済 約 200 万人、潜在含め 1,000 万人超', japanSource: '日本甲状腺学会' },
    thyroid_hyper:      { world: null, label: '世界推計は策定中',                  tier: 0, density: 'medium',
                          japan:    400_000, japanLabel: '約 30-50 万人',         japanSource: 'バセドウ病主体' },
    crohns:             { world: null, label: '世界推計は策定中 (IBD 全体で 383〜700 万人+)', tier: 0, density: 'high',
                          japan:     70_000, japanLabel: '約 7 万人',             japanSource: '指定難病' },
    uc:                 { world: null, label: '世界推計は策定中 (IBD 全体で 383〜700 万人+)', tier: 0, density: 'high',
                          japan:    220_000, japanLabel: '約 22 万人',            japanSource: '指定難病' },
    immunodeficiency:   { world: null, label: '世界推計は策定中',                  tier: 0, density: 'high',
                          japan:     30_000, japanLabel: '数千〜数万人',          japanSource: '原発性免疫不全症' },
    allergy:            { world: null, label: '世界推計は策定中',                  tier: 0, density: 'low',
                          japan: 50_000_000, japanLabel: '花粉症のみで 約 5,000 万人', japanSource: '国民健康栄養調査' },
    sibo:               { world: null, label: '世界推計は策定中',                  tier: 0, density: 'medium',
                          japan: null, japanLabel: '国内推計策定中' },
    gastroparesis:      { world: null, label: '世界推計は策定中',                  tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中' },
    polymyalgia:        { world: null, label: '世界推計は策定中',                  tier: 0, density: 'medium',
                          japan:    150_000, japanLabel: '約 10-20 万人 (推計)',  japanSource: '日本リウマチ学会' },
    dissociative:       { world: null, label: '世界推計は策定中',                  tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中' },
    mcs:                { world: null, label: '世界推計は策定中',                  tier: 0, density: 'medium',
                          japan:    850_000, japanLabel: '約 70-100 万人 (推計)', japanSource: '国内調査' },
    emf:                { world: null, label: '世界推計は策定中',                  tier: 0, density: 'low',
                          japan: null, japanLabel: '国内推計策定中' },
    lyme:               { world: null, label: '世界推計は策定中',                  tier: 0, density: 'medium',
                          japan: null, japanLabel: '極めて稀' },
    mold:               { world: null, label: '世界推計は策定中',                  tier: 0, density: 'medium',
                          japan: null, japanLabel: '国内推計策定中' },
    hsd:                { world: null, label: '世界推計は策定中 (EDS と重なる)',   tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中' },
    tbi:                { world: null, label: '世界推計は策定中',                  tier: 0, density: 'medium',
                          japan:    300_000, japanLabel: '後遺症で 数十万人',      japanSource: '推計' },
    burnout:            { world: null, label: 'WHO 定義では疾患ではなく職業上現象', tier: 0, density: 'medium',
                          japan: null, japanLabel: '疾患として未計上' },
    chemo_side:         { world: null, label: '世界推計は策定中',                  tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中' },
    cancer_fatigue:     { world: null, label: '世界推計は策定中',                  tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中' },
    substance:          { world: null, label: '世界推計は策定中',                  tier: 0, density: 'high',
                          japan: null, japanLabel: '国内推計策定中' },
  },

  // ============================================================
  // 新処方ローテーション軸 (Prescription Rotation Axes)
  // ------------------------------------------------------------
  // 14 の独立した「処方箋の軸」。毎日、dayOfYear % 14 で 1 軸が
  // 機械的に選ばれ、AI はその日その軸から具体的な処方を出すよう
  // 強制される。これにより「同じ助言が続く」問題を根本解決。
  //
  // 軸の順序はランダムではなく、隣接する日が大きく異なる角度に
  // なるよう意図的にインターリーブしてある (食事→身体→精神 等)。
  // ============================================================
  PRESCRIPTION_AXES: [
    { id: 'nutrition',   icon: '🌿', name: '食事・栄養の新戦略',
      desc: '抗炎症食・低FODMAP・ファスティング・間欠的断食・地中海食・ケトジェニック・腸活食材 (発酵食品、プレバイオティクス)' },
    { id: 'body',        icon: '🏃', name: '身体的アプローチ',
      desc: '運動処方 (MET-基準、ペーシング)、ストレッチ、理学療法、ヨガ、呼吸法 (4-7-8、box breathing)、姿勢' },
    { id: 'mind',        icon: '🧘', name: '精神・認知・瞑想',
      desc: 'マインドフルネス、CBT、ACT、アート療法、表現療法、ジャーナリング、思考の再構成' },
    { id: 'supplement',  icon: '💊', name: 'サプリメント・栄養素',
      desc: 'NMN、CoQ10、マグネシウム L-スレオン酸、PQQ、D-リボース、グリシン、タウリン、5-ALA、L-テアニン' },
    { id: 'sleep',       icon: '😴', name: '睡眠・回復',
      desc: '睡眠衛生プロトコル、戦略的昼寝、冷暗環境、睡眠時 HRV、入眠ルーチン、日光曝露タイミング' },
    { id: 'test',        icon: '🧬', name: '検査・モニタリング',
      desc: 'CRP・フェリチン・ビタミンD・ホルモン・HRV・CGM・有機酸検査・GI-MAP・DUTCH検査・NK 細胞活性' },
    { id: 'hydration',   icon: '💧', name: '水分・電解質・入浴',
      desc: '塩分 + カリウム補給 (POTS 対策)、エプソムソルト入浴、温冷交代浴、サウナ、経口補水液' },
    { id: 'light',       icon: '🌞', name: '光・温度・環境',
      desc: '赤色光・近赤外光療法、朝の日光曝露、ブルーライト遮断、冷水シャワー、炎症抑制環境' },
    { id: 'frontline',   icon: '💉', name: '先端医療・臨床試験',
      desc: 'LDN (低用量ナルトレキソン)、BC007、免疫吸着、JAK 阻害薬、TMS、ケタミン、HBOT、CAR-T、FMT' },
    { id: 'community',   icon: '🤝', name: 'コミュニティ・つながり',
      desc: '患者会、オンラインコミュニティ、Peatix イベント、Zoom 交流会、Discord サーバー、note 購読' },
    { id: 'specialist',  icon: '🏥', name: '専門医・セカンドオピニオン',
      desc: '専門医リスト、セカンドオピニオン、遠隔診療、海外クリニック、難病指定申請、社会資源' },
    { id: 'biohack',     icon: '🛠', name: 'バイオハック・デバイス',
      desc: 'Oura, Garmin, WHOOP, Nurosym (迷走神経刺激), gammaCore, CGM, Muse (脳波), Apollo Neuro' },
    { id: 'eastern',     icon: '🌱', name: '東洋医学・伝統療法',
      desc: '漢方薬 (ツムラ・クラシエ)、鍼灸、ツボ刺激、経絡マッサージ、温泉療法、森林浴 (Shinrin-yoku)、薬膳' },
    { id: 'knowledge',   icon: '📚', name: '情報・学習・研究',
      desc: 'PubMed 論文、ClinicalTrials.gov 治験登録、患者会ウェビナー、医学書、同病者の note 記事' },
  ],

  // Disease-specific monitoring metrics (定点観測項目)
  // Used by AI prompts to track progress over time
  DISEASE_METRICS: {
    mecfs: {
      name: 'ME/CFS',
      metrics: [
        { id: 'pem_frequency', name: 'PEM発生頻度', unit: '回/週', target: '0', importance: 'critical' },
        { id: 'activity_hours', name: '1日の活動可能時間', unit: '時間', target: '増加傾向', importance: 'critical' },
        { id: 'fatigue_level', name: '疲労度', unit: '1-10', target: '3以下', importance: 'high' },
        { id: 'sleep_quality', name: '睡眠の質', unit: '1-10', target: '7以上', importance: 'high' },
        { id: 'brain_fog', name: 'ブレインフォグ', unit: '1-10', target: '3以下', importance: 'high' },
        { id: 'pain_level', name: '疼痛レベル', unit: '1-10', target: '3以下', importance: 'medium' },
        { id: 'hrv', name: 'HRV（心拍変動）', unit: 'ms', target: '上昇傾向', importance: 'medium' },
        { id: 'nk_cell', name: 'NK細胞活性', unit: '%', target: '正常範囲', importance: 'medium', frequency: '3-6ヶ月' },
        { id: 'crp', name: 'CRP（炎症マーカー）', unit: 'mg/dL', target: '0.3未満', importance: 'medium', frequency: '3-6ヶ月' },
      ]
    },
    depression: {
      name: 'うつ病',
      metrics: [
        { id: 'phq9', name: 'PHQ-9スコア', unit: '0-27', target: '5未満（寛解）', importance: 'critical' },
        { id: 'mood', name: '気分', unit: '1-10', target: '6以上', importance: 'critical' },
        { id: 'sleep_hours', name: '睡眠時間', unit: '時間', target: '7-8時間', importance: 'high' },
        { id: 'activity_count', name: '外出・活動回数', unit: '回/週', target: '増加傾向', importance: 'high' },
        { id: 'social_contact', name: '人との接触', unit: '回/週', target: '3回以上', importance: 'high' },
        { id: 'appetite', name: '食欲', unit: '1-10', target: '安定', importance: 'medium' },
        { id: 'concentration', name: '集中力', unit: '1-10', target: '改善傾向', importance: 'medium' },
      ]
    },
    fibromyalgia: {
      name: '線維筋痛症',
      metrics: [
        { id: 'pain_sites', name: '疼痛部位数', unit: '箇所', target: '減少傾向', importance: 'critical' },
        { id: 'pain_intensity', name: '疼痛強度', unit: '1-10', target: '4以下', importance: 'critical' },
        { id: 'sleep_quality', name: '睡眠の質', unit: '1-10', target: '6以上', importance: 'high' },
        { id: 'fatigue', name: '疲労度', unit: '1-10', target: '4以下', importance: 'high' },
        { id: 'stiffness', name: '朝のこわばり', unit: '分', target: '30分未満', importance: 'medium' },
      ]
    },
    long_covid: {
      name: 'Long COVID',
      metrics: [
        { id: 'pem_frequency', name: 'PEM発生頻度', unit: '回/週', target: '0', importance: 'critical' },
        { id: 'fatigue', name: '疲労度', unit: '1-10', target: '減少傾向', importance: 'critical' },
        { id: 'brain_fog', name: 'ブレインフォグ', unit: '1-10', target: '減少傾向', importance: 'high' },
        { id: 'breathing', name: '呼吸困難度', unit: '1-10', target: '2以下', importance: 'high' },
        { id: 'heart_rate', name: '安静時心拍数', unit: 'bpm', target: '60-80', importance: 'medium' },
        { id: 'spo2', name: 'SpO2', unit: '%', target: '96以上', importance: 'medium' },
        { id: 'd_dimer', name: 'D-ダイマー', unit: 'ng/mL', target: '正常範囲', importance: 'medium', frequency: '3ヶ月' },
      ]
    },
    pots: {
      name: 'POTS',
      metrics: [
        { id: 'hr_supine', name: '臥位心拍数', unit: 'bpm', target: '60-80', importance: 'critical' },
        { id: 'hr_standing', name: '立位心拍数', unit: 'bpm', target: '臥位+30未満', importance: 'critical' },
        { id: 'bp_systolic', name: '収縮期血圧', unit: 'mmHg', target: '90-120', importance: 'high' },
        { id: 'water_intake', name: '水分摂取量', unit: 'L/日', target: '2-3L', importance: 'high' },
        { id: 'salt_intake', name: '塩分摂取', unit: 'g/日', target: '8-10g', importance: 'high' },
        { id: 'syncope', name: '失神・ふらつき', unit: '回/週', target: '0', importance: 'critical' },
      ]
    },
    diabetes_t2: {
      name: '2型糖尿病',
      metrics: [
        { id: 'hba1c', name: 'HbA1c', unit: '%', target: '7.0未満', importance: 'critical', frequency: '3ヶ月' },
        { id: 'fasting_glucose', name: '空腹時血糖', unit: 'mg/dL', target: '130未満', importance: 'critical' },
        { id: 'weight', name: '体重', unit: 'kg', target: '減少傾向', importance: 'high' },
        { id: 'exercise_min', name: '運動時間', unit: '分/週', target: '150分以上', importance: 'high' },
        { id: 'bp', name: '血圧', unit: 'mmHg', target: '130/80未満', importance: 'medium' },
      ]
    },
    hashimoto: {
      name: '甲状腺疾患',
      metrics: [
        { id: 'tsh', name: 'TSH', unit: 'μIU/mL', target: '0.5-2.5', importance: 'critical', frequency: '3-6ヶ月' },
        { id: 'ft4', name: 'FT4', unit: 'ng/dL', target: '正常範囲', importance: 'high', frequency: '3-6ヶ月' },
        { id: 'ft3', name: 'FT3', unit: 'pg/mL', target: '正常範囲', importance: 'high', frequency: '6ヶ月' },
        { id: 'fatigue', name: '疲労度', unit: '1-10', target: '改善傾向', importance: 'high' },
        { id: 'weight', name: '体重', unit: 'kg', target: '安定', importance: 'medium' },
        { id: 'tpo_ab', name: '抗TPO抗体', unit: 'IU/mL', target: '減少傾向', importance: 'medium', frequency: '6-12ヶ月' },
      ]
    },
    ibs: {
      name: 'IBS',
      metrics: [
        { id: 'abdominal_pain', name: '腹痛頻度', unit: '回/週', target: '減少傾向', importance: 'critical' },
        { id: 'bowel_type', name: '便の形状(Bristol)', unit: '1-7', target: '3-5', importance: 'high' },
        { id: 'bloating', name: '膨満感', unit: '1-10', target: '3以下', importance: 'high' },
        { id: 'food_triggers', name: '食事トリガー', unit: '特定済み数', target: '把握', importance: 'medium' },
        { id: 'stress', name: 'ストレスレベル', unit: '1-10', target: '4以下', importance: 'medium' },
      ]
    },
    insomnia: {
      name: '不眠症',
      metrics: [
        { id: 'sleep_latency', name: '入眠潜時', unit: '分', target: '30分未満', importance: 'critical' },
        { id: 'sleep_hours', name: '総睡眠時間', unit: '時間', target: '6-8時間', importance: 'critical' },
        { id: 'wake_count', name: '中途覚醒回数', unit: '回', target: '1回以下', importance: 'high' },
        { id: 'sleep_efficiency', name: '睡眠効率', unit: '%', target: '85%以上', importance: 'high' },
        { id: 'daytime_sleepiness', name: '日中の眠気', unit: '1-10', target: '3以下', importance: 'medium' },
      ]
    },
    _universal: {
      name: '共通',
      metrics: [
        { id: 'overall_condition', name: '体調（総合）', unit: '1-10', target: '改善傾向', importance: 'critical' },
        { id: 'energy', name: 'エネルギーレベル', unit: '1-10', target: '6以上', importance: 'high' },
        { id: 'stress', name: 'ストレスレベル', unit: '1-10', target: '4以下', importance: 'high' },
        { id: 'sleep', name: '睡眠の質', unit: '1-10', target: '6以上', importance: 'high' },
        { id: 'mood', name: '気分', unit: '1-10', target: '6以上', importance: 'medium' },
      ]
    }
  },

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

  // ============================================================
  // 遠隔診療・オンライン診療プロバイダー
  // ------------------------------------------------------------
  // 慢性疾患患者が在宅でアクセスできる日本のオンライン診療サービス
  // を curated し、疾患タグでマッチングするためのデータ。各 entry は
  // 公式サイトへのリンクを持ち、推奨ではなく「選択肢の提示」として
  // 表示される (医療行為の推奨は避ける)。
  //
  // 掲載基準:
  //   1. 公式サイトが実在し、現在も運営中
  //   2. 保険 or 自費で明示的な料金体系がある
  //   3. 初診対応が可能
  //   4. 慢性疾患患者に関連する専門領域
  //
  // フィールド:
  //   categories: 疾患タグ (DISEASE_CATEGORIES の id を参照)
  //   specialty: 診療科
  //   format: 'video' (ビデオ通話), 'chat' (テキスト), 'phone'
  //   payment: 'insurance' (保険適用), 'private' (自費), 'both'
  //   price: 目安料金
  // ============================================================
  TELEHEALTH_PROVIDERS: [
    // ─── 総合オンライン診療プラットフォーム ───
    {
      id: 'clinics',
      name: 'CLINICS オンライン診療',
      provider: '株式会社メドレー',
      specialty: '総合内科・皮膚科・精神科・小児科 等',
      format: 'video',
      payment: 'both',
      price: '保険診療 or 自費 (診察料+システム利用料 330 円)',
      description: 'メドレーが運営する日本最大級のオンライン診療プラットフォーム。全国 6,000+ の医療機関と連携。アプリ or Web から予約・ビデオ診察・決済まで完結。',
      url: 'https://clinics.medley.life/',
      categories: ['neuro', 'immune', 'mental', 'endocrine', 'cardiovascular', 'respiratory', 'digestive', 'connective', 'other']
    },
    {
      id: 'curon',
      name: 'curon (クロン)',
      provider: '株式会社 MICIN',
      specialty: '総合内科・小児科・精神科・糖尿病 等',
      format: 'video',
      payment: 'insurance',
      price: '保険診療 (システム利用料 360 円)',
      description: 'MICIN 社のオンライン診療サービス。全国の医療機関と連携、処方箋もオンライン発行可能。アプリでビデオ診察・薬の配送まで一貫。',
      url: 'https://curon.co/',
      categories: ['neuro', 'mental', 'endocrine', 'cardiovascular', 'respiratory', 'digestive', 'immune']
    },
    {
      id: 'yadoc',
      name: 'YaDoc (ヤードック)',
      provider: '株式会社インテグリティ・ヘルスケア',
      specialty: '総合・慢性疾患・生活習慣病',
      format: 'video',
      payment: 'insurance',
      price: '保険診療',
      description: '慢性疾患の通院継続に強いオンライン診療アプリ。血圧・血糖などのバイタルデータ連携が特徴。',
      url: 'https://www.yadoc.jp/',
      categories: ['endocrine', 'cardiovascular', 'respiratory', 'digestive']
    },
    {
      id: 'line_doctor',
      name: 'LINEドクター',
      provider: 'LINE ヘルスケア株式会社',
      specialty: '総合内科・皮膚科・耳鼻科 等',
      format: 'video',
      payment: 'insurance',
      price: '保険診療',
      description: 'LINE アプリから予約・診察。アプリインストール不要で最も敷居が低い。',
      url: 'https://line-doctor.line.me/',
      categories: ['neuro', 'mental', 'endocrine', 'cardiovascular', 'respiratory', 'digestive', 'immune']
    },
    // ─── 心療内科・精神科 ───
    {
      id: 'welby_psy',
      name: 'いしゃまち (精神科オンライン)',
      provider: '株式会社ウェブドクター',
      specialty: '精神科・心療内科',
      format: 'video',
      payment: 'both',
      price: '初診 5,000 円〜、再診 3,000 円〜',
      description: 'うつ・不安障害・PTSD・ADHD 等のオンライン診療。処方箋発行可能。',
      url: 'https://www.ishamachi.com/',
      categories: ['mental']
    },
    {
      id: 'mentalclinic_online',
      name: '心療内科・精神科オンライン診療 (poco-a-poco クリニック等)',
      provider: '各クリニック',
      specialty: '精神科・心療内科',
      format: 'video',
      payment: 'insurance',
      price: '保険診療',
      description: '全国の心療内科・精神科クリニックがオンライン診療を提供。SSRI・SNRI 等の処方継続が可能。',
      url: 'https://clinics.medley.life/searches?q=%E5%BF%83%E7%99%82%E5%86%85%E7%A7%91',
      categories: ['mental']
    },
    // ─── 慢性疲労・自律神経・統合医療 ───
    {
      id: 'hedsuma',
      name: '青山・原宿 統合医療クリニック',
      provider: '各医療機関',
      specialty: '慢性疲労・LDN 処方・自律神経失調',
      format: 'video',
      payment: 'private',
      price: '自費診療 (初診 15,000-30,000 円)',
      description: 'LDN (低用量ナルトレキソン) 等の自費処方に対応する統合医療クリニックが増加中。ME/CFS・Long COVID の相談に応じる医師も。事前に各クリニックに連絡して対応可否を確認してください。',
      url: 'https://www.google.com/search?q=LDN+低用量ナルトレキソン+オンライン+クリニック+日本',
      categories: ['neuro']
    },
    {
      id: 'long_covid_clinic',
      name: 'Long COVID 専門外来 (地域別)',
      provider: '各医療機関',
      specialty: 'コロナ後遺症・Long COVID',
      format: 'video',
      payment: 'insurance',
      price: '保険診療',
      description: '厚労省が公開している Long COVID 対応医療機関リストから、お住まいの地域で探すことができます。',
      url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000121431_00413.html',
      categories: ['immune']
    },
    // ─── 女性専門 ───
    {
      id: 'pill_online',
      name: 'ピルオンライン・女性ヘルスケア (mederi / スマルナ 等)',
      provider: '複数サービス',
      specialty: '婦人科・PMS・PCOS',
      format: 'video',
      payment: 'private',
      price: '自費 (月額 2,500 円〜)',
      description: 'PMS/PCOS/月経困難症/ホルモン関連の不調に対応するオンライン婦人科サービス。',
      url: 'https://smaluna.com/',
      categories: ['endocrine']
    },
    // ─── セカンドオピニオン ───
    {
      id: 'second_opinion',
      name: 'メディカルノート セカンドオピニオン',
      provider: 'メディカルノート株式会社',
      specialty: '全診療科セカンドオピニオン',
      format: 'video',
      payment: 'private',
      price: '自費 30,000 円〜',
      description: '専門医によるセカンドオピニオン相談。難治性疾患・診断に悩む方向け。',
      url: 'https://medicalnote.jp/consultation',
      categories: ['neuro', 'immune', 'mental', 'endocrine', 'cardiovascular', 'connective', 'other', 'cancer']
    },
    // ─── AI 症状チェック (診察前の整理) ───
    {
      id: 'ubie',
      name: 'ユビー AI 症状検索',
      provider: 'Ubie 株式会社',
      specialty: '症状入力から関連疾患・受診先の案内',
      format: 'chat',
      payment: 'private',
      price: '無料',
      description: '20 問程度の質問に答えるだけで、関連する病気と受診科の目安が分かる無料 AI サービス。診察の前段階整理に。',
      url: 'https://ubie.app/',
      categories: ['neuro', 'immune', 'mental', 'endocrine', 'cardiovascular', 'respiratory', 'digestive', 'connective', 'other']
    }
  ],

  // ============================================================
  // オンラインカウンセリング・心理サポート
  // ------------------------------------------------------------
  // 医療行為ではない心理カウンセリング・メンタルヘルスサポート。
  // 慢性疾患に伴う心理的負担・孤独感・鬱状態への対応。
  // ============================================================
  COUNSELING_PROVIDERS: [
    {
      id: 'cotree',
      name: 'cotree (コトリー)',
      provider: '株式会社 cotree',
      format: 'video',
      price: '1 回 5,000 円〜',
      description: '国内最大級のオンラインカウンセリング。200 名以上の公認心理師・臨床心理士が在籍。初回マッチングあり。',
      url: 'https://cotree.jp/'
    },
    {
      id: 'uraraka',
      name: 'うららか相談室',
      provider: '株式会社 うらら',
      format: 'video',
      price: '1 回 4,400 円〜',
      description: '220 名以上のカウンセラーと面談可能。メッセージ or ビデオ or 対面を選択可。慢性疾患の相談経験あるカウンセラー多数。',
      url: 'https://www.uraraka-soudan.com/'
    },
    {
      id: 'kimochi',
      name: 'Kimochi',
      provider: '株式会社 Kimochi',
      format: 'video',
      price: 'サブスク 8,800 円/月 (カウンセリング 4 回 + チャット無制限)',
      description: '定額制オンラインカウンセリング。毎週 1 回の定期カウンセリングを続けやすい料金体系。',
      url: 'https://kimochi-online.com/'
    },
    {
      id: 'mezzanine',
      name: 'メザニン (メンタル心理カウンセリング)',
      provider: '株式会社 メザニン',
      format: 'video',
      price: '1 回 5,500 円〜',
      description: '慢性疾患・難病に関する心理サポートの実績あり。ビデオ/電話/対面を選択可。',
      url: 'https://mezzanine.co.jp/'
    },
    {
      id: 'betterhelp',
      name: 'BetterHelp (英語)',
      provider: 'BetterHelp Inc. (米国)',
      format: 'video',
      price: '$65-100/週 (8,000-13,000 円)',
      description: '世界最大のオンラインカウンセリング。英語のセラピストのみ。ME/CFS・Long COVID の経験豊富なセラピストを指名可能。海外在住 or 英語希望者向け。',
      url: 'https://www.betterhelp.com/'
    }
  ],

  // ============================================================
  // 緊急時・無料相談窓口
  // ------------------------------------------------------------
  // 24 時間対応の公的ホットライン。希死念慮・緊急時に必ず表示する。
  // ============================================================
  EMERGENCY_LINES: [
    {
      id: 'yorisoi',
      name: 'よりそいホットライン',
      phone: '0120-279-338',
      hours: '24 時間 365 日',
      price: '無料',
      description: '厚生労働省支援の電話相談。暮らし・こころ・外国語・性・DV 等すべての悩みに対応。',
      url: 'https://www.since2011.net/yorisoi/'
    },
    {
      id: 'inochi_denwa',
      name: 'いのちの電話',
      phone: '0570-783-556 (ナビダイヤル) / 0120-783-556 (フリーダイヤル、毎月 10 日 8:00-翌朝 8:00)',
      hours: '毎日 10:00-22:00 ほか',
      price: '無料 (ナビダイヤルは通話料)',
      description: '日本いのちの電話連盟。こころの悩み・自殺予防相談。',
      url: 'https://www.inochinodenwa.org/'
    },
    {
      id: 'kokoro',
      name: 'こころの健康相談統一ダイヤル',
      phone: '0570-064-556',
      hours: '都道府県により異なる',
      price: '通話料のみ',
      description: '各都道府県の精神保健福祉センターに繋がる。精神科受診前の相談にも。',
      url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/shougaishahukushi/kokoro/'
    },
    {
      id: 'tell_lifeline',
      name: 'TELL Lifeline (英語)',
      phone: '03-5774-0992',
      hours: '毎日 9:00-23:00',
      price: '通話料のみ',
      description: '在日外国人向けの英語電話カウンセリング。',
      url: 'https://telljp.com/lifeline/'
    }
  ],

  // Legacy single-disease selection (kept for backward compat)
  DISEASES: [
    { id: 'mecfs', name: 'ME/CFS', fullName: '筋痛性脳脊髄炎 / 慢性疲労症候群', icon: '🧠', color: '#6C63FF' },
    { id: 'fibromyalgia', name: '線維筋痛症', fullName: '線維筋痛症', icon: '💪', color: '#f59e0b' },
    { id: 'long_covid', name: 'Long COVID', fullName: '新型コロナウイルス後遺症', icon: '🦠', color: '#ef4444' },
    { id: 'depression', name: 'うつ病', fullName: 'うつ病（大うつ病性障害）', icon: '💭', color: '#8b5cf6' },
    { id: 'custom', name: 'その他', fullName: 'カスタム疾患設定', icon: '➕', color: '#8896b0' }
  ],

  // Data categories for user intake (simplified)
  DATA_CATEGORIES: [
    { id: 'symptoms', name: '今日の体調', icon: '🌡️', fields: ['condition_level', 'sleep_quality'] },
    { id: 'vitals', name: 'バイタル', icon: '💓', fields: ['heart_rate', 'blood_pressure', 'temperature', 'spo2'] },
    { id: 'medication', name: '服薬', icon: '💊', fields: ['medications', 'dosage'] },
    { id: 'sleep', name: '睡眠', icon: '😴', fields: ['duration'] },
    { id: 'activity', name: '活動', icon: '🚶', fields: ['steps'] },
    { id: 'nutrition', name: '食事', icon: '🥗', fields: ['meals'] },
    { id: 'blood_test', name: '検査結果', icon: '🩸', fields: ['wbc', 'rbc', 'hemoglobin', 'crp'] },
    { id: 'mental', name: '気分', icon: '🧘', fields: ['mood'] },
    { id: 'photos', name: '写真', icon: '📸', fields: ['meal_photos', 'test_results_photo'] }
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

  // ════════════════════════════════════════════════════════════════
  // FINANCIAL_SUPPORT
  // 慢性疾患・障害に関する公的な金銭的サポート・医療費助成・税制優遇
  // の一覧。`applicable` は疾患 id 配列 ('*' で全疾患)。`form_fields`
  // は申請エントリで聞く質問のセット。`professional` は相談すべき
  // 専門家タイプ (admin が登録したリストから該当者を選択)。
  // ════════════════════════════════════════════════════════════════
  FINANCIAL_SUPPORT: [
    {
      id: 'jiritsu_shien',
      name: '自立支援医療（精神通院）',
      icon: '💊',
      category: 'medical',
      amount: '通院医療費の自己負担が1割に（上限あり）',
      eligibility: '精神疾患の通院治療を継続的に受けている方',
      applicable: ['depression', 'bipolar', 'ptsd', 'adhd', 'gad', 'ocd', 'schizophrenia', 'autism', 'panic'],
      professional: 'sharoushi',
      urls: [{ label: '制度概要（厚労省）', url: 'https://www.mhlw.go.jp/bunya/shougaihoken/jiritsu/seishin.html' }],
      form_fields: ['current_hospital', 'current_doctor', 'monthly_cost', 'income', 'household_size'],
      description: '精神科・心療内科の通院医療費（診察・薬・デイケア等）が1割負担になる制度。所得により月額上限が設定されます。'
    },
    {
      id: 'nanbyou_jyosei',
      name: '指定難病 医療費助成制度',
      icon: '🏥',
      category: 'medical',
      amount: '医療費自己負担2割（所得により月額上限 2,500〜30,000円）',
      eligibility: '国の指定難病（341疾患）の患者で、重症度基準を満たす方',
      applicable: ['mecfs', 'fibromyalgia', 'sle', 'ra', 'crohns', 'uc', 'parkinson', 'pss', 'ms', 'als', 'pots'],
      professional: 'sharoushi',
      urls: [
        { label: '難病情報センター', url: 'https://www.nanbyou.or.jp/' },
        { label: '指定難病一覧', url: 'https://www.nanbyou.or.jp/entry/5461' }
      ],
      form_fields: ['diagnosis_date', 'specialist_hospital', 'severity', 'monthly_cost', 'income'],
      description: '指定難病と診断された方の医療費負担を軽減する制度。都道府県に申請します。ME/CFSは未指定ですが類縁疾患は対象。'
    },
    {
      id: 'shougai_nenkin',
      name: '障害年金（厚生年金・国民年金）',
      icon: '🧓',
      category: 'income',
      amount: '月額 約6.5万円〜20万円（等級・加入年金による）',
      eligibility: '初診日から1年6か月経過後、かつ日常生活に著しい支障がある方',
      applicable: ['*'],
      professional: 'sharoushi',
      urls: [{ label: '日本年金機構', url: 'https://www.nenkin.go.jp/service/jukyu/shougainenkin/' }],
      form_fields: ['first_visit_date', 'diagnosis', 'symptoms_daily', 'work_status', 'adl_level', 'insurance_type'],
      description: '病気やケガで日常生活・仕事に支障が出ている方に支給される年金。初診から1年6か月経過が必要。書類作成が複雑なので社労士推奨。'
    },
    {
      id: 'shoubyou_teate',
      name: '傷病手当金（健康保険）',
      icon: '💰',
      category: 'income',
      amount: '月収の約3分の2（最長1年6か月）',
      eligibility: '健康保険加入者で、病気・けがで連続3日以上仕事を休んだ方',
      applicable: ['*'],
      professional: 'sharoushi',
      urls: [{ label: '協会けんぽ', url: 'https://www.kyoukaikenpo.or.jp/g3/cat320/sb3150/sb3160/r151' }],
      form_fields: ['employer', 'last_work_date', 'doctor_name', 'expected_recovery', 'monthly_salary'],
      description: '病気で働けない期間の所得補償。会社の健康保険・協会けんぽに加入していれば対象。退職後も条件を満たせば継続可。'
    },
    {
      id: 'kougaku_ryouyou',
      name: '高額療養費制度',
      icon: '🧾',
      category: 'medical',
      amount: '月の医療費自己負担が限度額超過分を還付',
      eligibility: '健康保険加入者で、月の医療費自己負担が所得別の限度額を超えた方',
      applicable: ['*'],
      professional: 'sharoushi',
      urls: [{ label: '厚労省 高額療養費', url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryouhoken/juuyou/kougakuiryou/index.html' }],
      form_fields: ['insurance_type', 'monthly_cost', 'income_bracket'],
      description: '医療費の月額負担上限を設ける制度。自動還付か申請制か保険により異なる。限度額適用認定証を事前取得で窓口負担軽減。'
    },
    {
      id: 'seishin_techou',
      name: '精神障害者保健福祉手帳',
      icon: '🎗️',
      category: 'identity',
      amount: '税制優遇・公共料金割引・就労支援',
      eligibility: '精神疾患で初診から6か月経過、日常生活に制約がある方',
      applicable: ['depression', 'bipolar', 'ptsd', 'adhd', 'schizophrenia', 'autism', 'panic'],
      professional: 'sharoushi',
      urls: [{ label: '制度概要（厚労省）', url: 'https://www.mhlw.go.jp/kokoro/support/level.html' }],
      form_fields: ['diagnosis_date', 'doctor_name', 'daily_impact'],
      description: '精神障害のある方が各種支援を受けるための手帳（1〜3級）。2年更新。'
    },
    {
      id: 'shintai_techou',
      name: '身体障害者手帳',
      icon: '♿',
      category: 'identity',
      amount: '税制優遇・医療費助成・交通機関割引・福祉用具支給',
      eligibility: '身体の永続的な障害（肢体・内部障害等）',
      applicable: ['pots', 'als', 'parkinson', 'ms', 'rheumatoid'],
      professional: 'sharoushi',
      urls: [{ label: '制度概要', url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/shougaishahukushi/shougaishatechou/index.html' }],
      form_fields: ['disability_type', 'doctor_name', 'daily_impact'],
      description: '身体障害を認定する手帳（1〜6級）。等級により医療費・税制・交通の優遇。'
    },
    {
      id: 'tokubetsu_shougai_teate',
      name: '特別障害者手当',
      icon: '💴',
      category: 'income',
      amount: '月額 約28,840円',
      eligibility: '20歳以上で、著しく重度の障害があり常時特別な介護が必要な方',
      applicable: ['mecfs', 'als', 'parkinson', 'ms', 'severe_mental'],
      professional: 'sharoushi',
      urls: [{ label: '厚労省 特別障害者手当', url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000123257.html' }],
      form_fields: ['severity', 'adl_level', 'caregiver', 'monthly_income'],
      description: '重度の障害を持つ方への在宅手当。在宅かつ介護状態が要件。所得制限あり。'
    },
    {
      id: 'iryouhi_koujo',
      name: '医療費控除（確定申告）',
      icon: '📄',
      category: 'tax',
      amount: '年10万円超の医療費が所得から控除（最大200万円）',
      eligibility: '1年間の医療費が10万円または所得の5%を超える方',
      applicable: ['*'],
      professional: 'tax_accountant',
      urls: [{ label: '国税庁', url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1120.htm' }],
      form_fields: ['total_medical_cost', 'annual_income', 'insurance_reimbursement'],
      description: '世帯で年10万円超（または所得5%超）の医療費を所得控除できる制度。交通費・市販薬も対象。'
    },
    {
      id: 'shougai_koujo',
      name: '障害者控除（税制）',
      icon: '🏛️',
      category: 'tax',
      amount: '所得税27万円・住民税26万円の控除（特別障害者は40万/30万）',
      eligibility: '障害者手帳保持者、または要介護認定で障害者に準ずる方',
      applicable: ['*'],
      professional: 'tax_accountant',
      urls: [{ label: '国税庁 障害者控除', url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1160.htm' }],
      form_fields: ['certificate_type', 'dependent'],
      description: '障害者手帳や要介護認定を受けている方の所得控除。家族の扶養控除でも利用可。'
    },
    {
      id: 'rousai',
      name: '労災保険給付',
      icon: '⚒️',
      category: 'work',
      amount: '療養給付（無料）＋休業給付（賃金の80%）',
      eligibility: '業務が原因で疾病を発症した方（長時間労働・ハラスメント等）',
      applicable: ['*'],
      professional: 'sharoushi',
      urls: [{ label: '労災保険制度', url: 'https://www.mhlw.go.jp/bunya/roudoukijun/rousaihoken01/index.html' }],
      form_fields: ['employer', 'work_conditions', 'onset_date', 'causal_evidence'],
      description: '仕事が原因の疾病（過労・精神障害等）に対する労災認定。医療費全額＋休業補償。社労士の支援推奨。'
    },
    {
      id: 'juukyo_kakuho',
      name: '住居確保給付金',
      icon: '🏠',
      category: 'housing',
      amount: '家賃相当額（地域別上限、最長9か月）',
      eligibility: '離職・収入減少で家賃支払が困難な方',
      applicable: ['*'],
      professional: 'sharoushi',
      urls: [{ label: '厚労省', url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000090859.html' }],
      form_fields: ['rent_amount', 'household_income', 'savings', 'employment_status'],
      description: '離職・廃業2年以内、または収入減少で家賃支払困難な方への家賃補助。自治体窓口。'
    },
    {
      id: 'seikatsu_hogo',
      name: '生活保護',
      icon: '🛟',
      category: 'welfare',
      amount: '最低生活費との差額（地域・世帯による）',
      eligibility: '資産・能力を活用しても最低生活費に満たない方',
      applicable: ['*'],
      professional: 'sharoushi',
      urls: [{ label: '厚労省', url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/seikatsuhogo/seikatuhogo/index.html' }],
      form_fields: ['household_income', 'savings', 'support_family', 'rent_amount'],
      description: '最低限度の生活を保障する制度。医療費も原則無料。自治体福祉事務所に申請。'
    },
    {
      id: 'kaigo_hoken',
      name: '介護保険サービス',
      icon: '🤝',
      category: 'care',
      amount: '介護費用の1〜3割負担（要介護度により上限）',
      eligibility: '65歳以上、または40〜64歳で特定疾病の方',
      applicable: ['parkinson', 'als', 'ra', 'ms'],
      professional: 'sharoushi',
      urls: [{ label: '厚労省', url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/kaigo_koureisha/index.html' }],
      form_fields: ['age', 'adl_level', 'living_situation'],
      description: '介護サービス利用時の費用補助。要介護認定の申請が必要。'
    },
    {
      id: 'koutsuhi_jyosei',
      name: '通院交通費助成（自治体）',
      icon: '🚆',
      category: 'local',
      amount: '月額 上限 5,000〜20,000円（自治体により異なる）',
      eligibility: '難病・指定疾患で遠方の専門医に通院する方（自治体による）',
      applicable: ['mecfs', 'fibromyalgia', 'sle', 'ra', 'als', 'ms', 'parkinson'],
      professional: 'sharoushi',
      urls: [{ label: '自治体サイトで確認', url: 'https://www.google.com/search?q=%E9%9B%A3%E7%97%85+%E9%80%9A%E9%99%A2%E4%BA%A4%E9%80%9A%E8%B2%BB%E5%8A%A9%E6%88%90' }],
      form_fields: ['residence', 'hospital', 'transport_cost', 'visit_frequency'],
      description: '自治体独自の通院費助成制度。対象疾患・金額は自治体ごとに大きく異なる。居住地の保健所に確認。'
    }
  ],

  // Professional types the admin can register contacts for. Each
  // financial support program references one of these via its
  // `professional` field so we can pick the right expert when the
  // user files an application.
  PROFESSIONAL_TYPES: [
    { id: 'sharoushi',      name: '社会保険労務士 (社労士)', icon: '📋', desc: '年金・労災・傷病手当金・障害者手続きの専門家' },
    { id: 'tax_accountant', name: '税理士',                 icon: '🧮', desc: '医療費控除・障害者控除・確定申告の専門家' },
    { id: 'lawyer',         name: '弁護士',                 icon: '⚖️', desc: '労災認定・労働問題・不服申立ての専門家' },
    { id: 'counselor',      name: '医療ソーシャルワーカー',  icon: '🤝', desc: '医療費・福祉制度全般の相談' },
    { id: 'financial_planner', name: 'ファイナンシャルプランナー', icon: '💼', desc: '家計・保険・生活設計の相談' }
  ],

  // ════════════════════════════════════════════════════════════════
  // FINANCIAL_SUPPORT_FIELDS
  // 各 form_fields の ID → 表示ラベル・プレースホルダ・type のマッピング。
  // 制度ごとに form_fields の集合が違うので、ここに未知の ID を書き足すだけで
  // 新しい質問がフォームに出るようになる。
  // ════════════════════════════════════════════════════════════════
  FINANCIAL_SUPPORT_FIELDS: {
    current_hospital:     { label: '通院中の医療機関', placeholder: '〇〇クリニック・〇〇病院', type: 'text' },
    current_doctor:       { label: '主治医の氏名（任意）', placeholder: '山田先生', type: 'text' },
    monthly_cost:         { label: '1か月の医療費（自己負担・目安）', placeholder: '15000', type: 'number', unit: '円' },
    income:               { label: '世帯の年収（目安）', placeholder: '4000000', type: 'number', unit: '円' },
    household_size:       { label: '世帯人数', placeholder: '2', type: 'number', unit: '人' },
    diagnosis_date:       { label: '診断を受けた日', placeholder: '', type: 'date' },
    specialist_hospital:  { label: '専門医療機関・指定医', placeholder: '', type: 'text' },
    severity:             { label: '症状の重症度（自己評価）', placeholder: '軽度/中等度/重度', type: 'select', options: ['軽度', '中等度', '重度', '最重度'] },
    first_visit_date:     { label: '初診日', placeholder: '', type: 'date' },
    diagnosis:            { label: '診断名', placeholder: 'うつ病、線維筋痛症 等', type: 'text' },
    symptoms_daily:       { label: '日常生活での困りごと（具体的に）', placeholder: '朝起きられない、家事が困難、外出に介助が必要…', type: 'textarea' },
    work_status:          { label: '就労状況', placeholder: '', type: 'select', options: ['就労中（フルタイム）', '就労中（短時間）', '休職中', '退職済', '就労経験なし'] },
    adl_level:            { label: '日常生活動作（ADL）自立度', placeholder: '', type: 'select', options: ['自立', '一部介助', '全介助'] },
    insurance_type:       { label: '加入している年金・保険', placeholder: '', type: 'select', options: ['国民年金', '厚生年金', '協会けんぽ', '健康保険組合', '国民健康保険', '共済組合', 'その他'] },
    employer:             { label: '勤務先（任意）', placeholder: '', type: 'text' },
    last_work_date:       { label: '最後に出勤した日', placeholder: '', type: 'date' },
    doctor_name:          { label: '主治医・診断医の氏名', placeholder: '', type: 'text' },
    expected_recovery:    { label: '復職可能時期の見込み', placeholder: '3か月/6か月/不明', type: 'text' },
    monthly_salary:       { label: '月収（手取り目安）', placeholder: '250000', type: 'number', unit: '円' },
    income_bracket:       { label: '所得区分', placeholder: '', type: 'select', options: ['住民税非課税', '年収370万未満', '年収370〜770万', '年収770万〜1160万', '年収1160万以上', '不明'] },
    daily_impact:         { label: '日常生活への影響（具体的に）', placeholder: '食事・入浴・外出がどれだけ困難か', type: 'textarea' },
    disability_type:      { label: '身体障害の種類', placeholder: '心臓機能障害、肢体不自由 等', type: 'text' },
    caregiver:            { label: '介護者の有無', placeholder: '', type: 'select', options: ['同居家族', '別居家族', 'ヘルパー', 'なし'] },
    monthly_income:       { label: '月の収入（本人）', placeholder: '0', type: 'number', unit: '円' },
    total_medical_cost:   { label: '1年間の医療費合計', placeholder: '180000', type: 'number', unit: '円' },
    annual_income:        { label: '年間所得（給与所得等）', placeholder: '3500000', type: 'number', unit: '円' },
    insurance_reimbursement: { label: '保険金・高額療養費等の受給額', placeholder: '20000', type: 'number', unit: '円' },
    certificate_type:     { label: '保有している手帳・認定', placeholder: '', type: 'select', options: ['精神障害者保健福祉手帳 1級','精神障害者保健福祉手帳 2級','精神障害者保健福祉手帳 3級','身体障害者手帳 1-2級','身体障害者手帳 3-6級','要介護認定','その他'] },
    dependent:            { label: '扶養している家族の有無', placeholder: '', type: 'select', options: ['なし', '配偶者', '子', '配偶者+子', 'その他'] },
    work_conditions:      { label: '業務内容・労働時間', placeholder: '平均残業時間、業務内容', type: 'textarea' },
    onset_date:           { label: '発症した日（目安）', placeholder: '', type: 'date' },
    causal_evidence:      { label: '業務との関連性（具体的に）', placeholder: '長時間労働、ハラスメント 等', type: 'textarea' },
    rent_amount:          { label: '家賃（月額）', placeholder: '80000', type: 'number', unit: '円' },
    household_income:     { label: '世帯月収', placeholder: '200000', type: 'number', unit: '円' },
    savings:              { label: '預貯金（世帯合計）', placeholder: '500000', type: 'number', unit: '円' },
    employment_status:    { label: '就労状況', placeholder: '', type: 'select', options: ['離職中', '休職中', '収入減少', '就労中'] },
    support_family:       { label: '援助可能な親族', placeholder: 'なし / 親 / 兄弟 等', type: 'text' },
    age:                  { label: '年齢', placeholder: '65', type: 'number', unit: '歳' },
    living_situation:     { label: '同居家族', placeholder: '独居 / 配偶者と / 子と 等', type: 'text' },
    residence:            { label: '居住地（市区町村）', placeholder: '神奈川県秦野市', type: 'text' },
    hospital:             { label: '通院先', placeholder: '', type: 'text' },
    transport_cost:       { label: '1回の通院交通費', placeholder: '3000', type: 'number', unit: '円' },
    visit_frequency:      { label: '通院頻度（月）', placeholder: '2', type: 'number', unit: '回' }
  },

  // ════════════════════════════════════════════════════════════════
  // FINANCIAL_SUPPORT_EMAIL_PROMPT
  // 利用者が入力した申請情報から、社労士・税理士宛の「丁寧で簡潔な」
  // 依頼メール本文を AI に生成させるためのシステムプロンプト。
  // 出力は JSON 形式で { subject, body } を返す。
  // ════════════════════════════════════════════════════════════════
  FINANCIAL_SUPPORT_EMAIL_PROMPT: `あなたは慢性疾患を抱える利用者の依頼を受けて、社会保険労務士・税理士などの専門家に対して、「丁寧で簡潔な依頼メール」を日本語で書く補助AIです。

### 制約
- 宛名は「{{PROFESSIONAL_NAME}} 様」（指定がなければ「{{PROFESSIONAL_TYPE}} 御中」）
- 差出人として利用者の氏名・メール・連絡先をメール末尾に記載
- 敬体（です・ます調）、ビジネス文書として違和感ない丁寧さ
- 過度に堅苦しい表現（拝啓・敬具）は避け、現代的で読みやすい文面
- 冒頭に制度名と依頼の要点を明示
- 利用者の入力情報を箇条書きで整理して載せる（プライバシー配慮として不要な情報は含めない）
- 依頼の最後に「初回相談の日程調整をお願いしたい」「見積りが可能か教えていただきたい」という具体的な次のステップを必ず入れる
- 医学的診断や法的助言は AI として提示しない。あくまで専門家への依頼の文面として書く

### 出力形式（必ず JSON のみ、前後の説明なし）
{
  "subject": "【申請相談】{{PROGRAM_NAME}}について",
  "body": "メール本文全文（改行含む）"
}`,


  // Affiliate networks
  AFFILIATE_NETWORKS: [
    { id: 'amazon_jp', name: 'Amazon.co.jp', tag: 'forestvoice-22' },
    { id: 'rakuten', name: '楽天市場', tag: 'chroniccare' },
    { id: 'iherb', name: 'iHerb', code: 'CHRONICCARE' },
    { id: 'a8', name: 'A8.net', publisherId: '' },
    { id: 'custom', name: 'カスタム', tag: '' }
  ],

  // Guest onboarding samples — pre-written records the 未登録 user can
  // dump into #guest-input with one tap. Each disease id maps to a
  // short list; if none of the user's selected tags match, we fall
  // back to `default`. Keeping entries short (~150-250 字) so the
  // guest reply returns in ~5-10s.
  GUEST_SAMPLES: {
    mecfs: [
      '朝起き上がれず、疲労感が強い。昨日は友人と1時間会っただけなのに今日はその反動でベッドから出られない。ブレインフォグもひどい。',
      '昨日軽く散歩したら今朝は頭が回らず、筋肉痛もある。典型的なPEMだと思う。ペーシングがうまくできていない。',
      '睡眠は8時間取れているはずなのに全く回復感がない。日中の疲労度は10段階で8。立ち上がると動悸がする。'
    ],
    long_covid: [
      'コロナ感染から4ヶ月経つが、階段を上ると息切れと動悸がひどい。以前は問題なくできていたことが今は難しい。',
      'ブレインフォグで仕事に集中できない。コロナ前は普通にできていた会議での発言が出てこない。疲労感も強い。'
    ],
    fibromyalgia: [
      '全身の痛みが特に朝ひどい。こわばりで起き上がるのに30分かかる。睡眠は浅く、夜中に何度も目が覚める。',
      '天気が崩れる前に痛みが強くなるパターンがある。プレガバリンを飲んでいるが完全には取れない。'
    ],
    pots: [
      '立ち上がったとたんに動悸と立ちくらみ。心拍が120近くまで上がる。塩分と水分を取っているがあまり変わらない。',
      '長時間立っていると失神しかけることがある。コンプレッションストッキングを試してみたい。'
    ],
    ibs: [
      '朝食後すぐに下痢。お腹の張りと痛みがあり、電車に乗るのが怖い。低FODMAP食を始めたばかり。',
      '生理前になると下痢と便秘を繰り返す。ストレスと関係している気がする。'
    ],
    hashimoto: [
      'チラージンを内服中だがまだ疲労感と冷えが強い。TSHは2.8で正常範囲内と言われたが症状は残っている。',
      '髪が抜けやすく、体重が2ヶ月で3kg増えた。便秘と冷えもひどい。次の採血でFT3も測ってほしい。'
    ],
    depression: [
      '朝起きるのがつらく、やる気が出ない。好きだったことに興味が持てない。夜は眠れず、食欲もない。',
      '職場での出来事を思い出してぐるぐる考えてしまう。睡眠は取れているが疲労感が抜けない。'
    ],
    insomnia: [
      '23時に布団に入っても1時間以上眠れない。夜中に2〜3回目が覚め、そのたびに30分以上眠れない。',
      '日中に強い眠気があるのに夜は眠れない。カフェインは控えているつもり。'
    ],
    default: [
      '最近体調が優れず、朝から疲れている。食欲もいつもほどなく、眠りも浅い。何から手をつけていいか分からない。'
    ]
  },

  // Pre-made 30-day sample diary for the guest 医師提出レポート
  // demo. One fictional patient per condition — realistic but
  // obviously synthetic. generateDoctorReport consumes this in place
  // of store.get('textEntries') when the guest triggers the preview.
  GUEST_REPORT_DATA: {
    mecfs: {
      diseases: ['筋痛性脳脊髄炎／慢性疲労症候群 (ME/CFS)'],
      profile: { age: 38, gender: 'female', height: 160, weight: 52 },
      textEntries: [
        { timestamp: '2026-03-25T08:00:00Z', category: 'symptoms', title: '', content: '疲労度 8/10。昨日娘の学校行事で 2 時間外出。今朝はベッドから出られず。PEM 確実。' },
        { timestamp: '2026-03-28T20:00:00Z', category: 'medication', title: 'LDN 開始', content: 'LDN 1.5mg 夜寝る前から開始。主治医指示。' },
        { timestamp: '2026-04-02T09:00:00Z', category: 'symptoms', title: '', content: 'LDN 1週目。眠気が強い。疲労度は変わらず 7/10。' },
        { timestamp: '2026-04-08T10:00:00Z', category: 'symptoms', title: '', content: '今朝は比較的調子が良い。疲労度 5/10。ブレインフォグも薄い。久しぶりに本を読めた。' },
        { timestamp: '2026-04-12T22:00:00Z', category: 'vitals', title: 'HRV', content: 'HRV 42ms (Oura)。先週比 +8ms で改善傾向。' },
        { timestamp: '2026-04-15T08:30:00Z', category: 'symptoms', title: 'PEM', content: '昨日リモート会議 45 分。今日は頭痛と強い倦怠感。PEM 頻度は減ってきている気がする。' },
        { timestamp: '2026-04-18T11:00:00Z', category: 'medication', title: 'LDN 増量', content: 'LDN 3mg に増量。眠気は慣れてきた。' },
        { timestamp: '2026-04-20T09:00:00Z', category: 'nutrition', title: '', content: '抗炎症食 2 週間継続。加工食品を避け、サバ・亜麻仁油・ブロッコリーを中心に。' },
        { timestamp: '2026-04-22T21:00:00Z', category: 'symptoms', title: '', content: '今週の PEM は 1 回のみ (先週は 3 回)。活動可能時間が 2 → 4 時間に増えた。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 8, brain_fog: 7, sleep_quality: 3, pain_level: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, brain_fog: 5, sleep_quality: 5, pain_level: 3 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, brain_fog: 4, sleep_quality: 6, pain_level: 3 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 4, brain_fog: 3, sleep_quality: 6, pain_level: 2 }
      ],
      bloodTests: [
        { timestamp: '2026-03-20T10:00:00Z', name: '定期血液検査', findings: 'CRP 0.3, フェリチン 35, TSH 2.8, ビタミンD 22 ng/mL (やや低値), B12 380' }
      ],
      medications: [
        { timestamp: '2026-03-28T20:00:00Z', name: 'LDN (低用量ナルトレキソン)', notes: '1.5mg 就寝前 → 4/18 より 3mg に増量' },
        { timestamp: '2026-04-05T08:00:00Z', name: 'CoQ10', notes: '200mg 朝食後' },
        { timestamp: '2026-04-05T08:00:00Z', name: 'メチル B12', notes: '1000μg 朝食後' }
      ],
      sleepData: [],
      activityData: [],
      meals: []
    },
    long_covid: {
      diseases: ['Long COVID (コロナ後遺症)'],
      profile: { age: 32, gender: 'male', height: 172, weight: 68 },
      textEntries: [
        { timestamp: '2026-03-20T08:00:00Z', category: 'symptoms', title: '', content: '感染から 4 ヶ月経つが階段 2 階分で息切れ。SpO2 96%。心拍 115bpm。' },
        { timestamp: '2026-03-27T10:00:00Z', category: 'symptoms', title: 'ブレインフォグ', content: '会議で普段使う単語が出てこない。コロナ前は問題なかった。' },
        { timestamp: '2026-04-03T09:00:00Z', category: 'medication', title: '', content: 'メスチノン 30mg x 3/日 開始。' },
        { timestamp: '2026-04-10T11:00:00Z', category: 'symptoms', title: '', content: 'メスチノン 1 週間。階段の息切れはやや軽減。動悸はまだある。' },
        { timestamp: '2026-04-17T09:00:00Z', category: 'vitals', title: 'HR', content: '立位心拍 108 (臥位 72)。POTS 併発の可能性。循環器紹介予定。' },
        { timestamp: '2026-04-22T21:00:00Z', category: 'symptoms', title: '', content: '今週は比較的安定。ブレインフォグは減ったが疲労は残る。' }
      ],
      symptoms: [],
      bloodTests: [
        { timestamp: '2026-03-18T10:00:00Z', name: '感染後フォローアップ', findings: 'D-dimer 0.6 (上限), CRP 0.8, フェリチン 180, B12 320' }
      ],
      medications: [
        { timestamp: '2026-04-03T09:00:00Z', name: 'メスチノン 30mg', notes: '1 日 3 回、朝昼夕' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    fibromyalgia: {
      diseases: ['線維筋痛症'],
      profile: { age: 45, gender: 'female', height: 158, weight: 54 },
      textEntries: [
        { timestamp: '2026-03-22T07:00:00Z', category: 'symptoms', title: '朝のこわばり', content: '起きるのに 40 分かかる。全身の痛み 7/10。' },
        { timestamp: '2026-03-29T09:00:00Z', category: 'medication', title: 'プレガバリン調整', content: '75mg x2 → 100mg x2 に増量。眠気はあるが痛み軽減。' },
        { timestamp: '2026-04-05T11:00:00Z', category: 'symptoms', title: '', content: '雨の前日に痛みが増悪するパターン継続。温泉で楽になる。' },
        { timestamp: '2026-04-12T09:00:00Z', category: 'symptoms', title: '', content: '痛み 5/10 まで軽減。睡眠も前より取れるように。' },
        { timestamp: '2026-04-20T08:00:00Z', category: 'vitals', title: '体温', content: '朝の基礎体温 36.1℃ (低体温傾向)。甲状腺チェック提案したい。' }
      ],
      symptoms: [],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-10T08:00:00Z', name: 'プレガバリン (リリカ)', notes: '100mg x 2/日' },
        { timestamp: '2026-04-10T08:00:00Z', name: 'デュロキセチン (サインバルタ)', notes: '20mg 朝' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    migraine: {
      diseases: ['片頭痛'],
      profile: { age: 34, gender: 'female', height: 162, weight: 53 },
      textEntries: [
        { timestamp: '2026-03-18T06:30:00Z', category: 'symptoms', title: '片頭痛発作', content: '左側の拍動性頭痛 8/10。嘔気あり。光・音が辛い。トリプタン（イミグラン50mg）服薬。2時間後に 3/10 まで改善。' },
        { timestamp: '2026-03-25T07:00:00Z', category: 'symptoms', title: '前駆症状', content: '昨日から首のこわばりと光の感受性↑。今日は発作来なかった。気圧低下（台風接近）と関係か。' },
        { timestamp: '2026-04-01T22:00:00Z', category: 'medication', title: 'アジョビ開始', content: 'フレマネズマブ（アジョビ）初回注射。自己注射器で皮下投与。注射部位の軽い発赤あり。' },
        { timestamp: '2026-04-08T08:00:00Z', category: 'symptoms', title: '頭痛', content: '頭痛 4/10。アジョビ後初の発作。前より軽い気がする。イブプロフェン400mgで対応（トリプタン使わず）。' },
        { timestamp: '2026-04-15T10:00:00Z', category: 'symptoms', title: 'トリガー記録', content: '赤ワイン飲んだ翌日に発作（4時間後）。チーズも要注意。今月の発作は3回→アジョビ前は8回/月。' },
        { timestamp: '2026-04-22T21:00:00Z', category: 'vitals', title: '月間集計', content: '4月の頭痛日数8日（うち片頭痛3日）。アジョビ前（1月）は片頭痛10日。服薬日数8日→3日に改善。' },
        { timestamp: '2026-04-30T09:00:00Z', category: 'symptoms', title: '', content: '今月の片頭痛は2回のみ。仕事への影響が大幅に減った。次回注射前に効果を医師と共有したい。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 6, pain_level: 7, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, pain_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-01T08:00:00Z', name: 'イミグラン (スマトリプタン)', notes: '50mg 頓服。発作時1錠' },
        { timestamp: '2026-04-01T22:00:00Z', name: 'アジョビ (フレマネズマブ)', notes: '225mg 月1回皮下注射 (CGRP抗体、予防薬)' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    ra: {
      diseases: ['関節リウマチ'],
      profile: { age: 52, gender: 'female', height: 156, weight: 58 },
      textEntries: [
        { timestamp: '2026-03-20T08:00:00Z', category: 'symptoms', title: '朝のこわばり', content: '朝のこわばり 90 分。両手指の腫脹あり（MCP関節・PIP関節）。疲労感強い。' },
        { timestamp: '2026-03-27T10:00:00Z', category: 'medication', title: 'ヒュミラ注射', content: 'ヒュミラ（アダリムマブ）2週おき注射。MTX 8mg/週継続。葉酸 5mg/週も継続。' },
        { timestamp: '2026-04-03T09:00:00Z', category: 'symptoms', title: '', content: 'こわばり 60 分に短縮。腫脹は右人差し指のみ継続。疲労 5/10。' },
        { timestamp: '2026-04-10T08:00:00Z', category: 'vitals', title: '検査結果', content: 'CRP 0.8（前回 2.1）。ESR 28。RF 42（陽性継続）。抗CCP抗体は未変更。改善傾向。' },
        { timestamp: '2026-04-17T10:00:00Z', category: 'symptoms', title: 'ヒュミラ後', content: 'ヒュミラ注射翌日は少し疲れる。こわばり 30 分まで改善。握力が戻ってきた。' },
        { timestamp: '2026-04-24T09:00:00Z', category: 'symptoms', title: '', content: '今週は腫れた関節ゼロ。こわばり 20 分以下。DAS28改善を医師に報告したい。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, pain_level: 6, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, pain_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-10T10:00:00Z', name: '定期血液検査', findings: 'CRP 0.8（改善）, ESR 28, RF 42（陽性）, WBC 5200, Hb 11.8（軽度貧血）, AST/ALT 正常（MTX副作用モニタ）' }
      ],
      medications: [
        { timestamp: '2026-03-01T08:00:00Z', name: 'メトトレキサート (MTX)', notes: '8mg 週1回（月曜）+ 葉酸 5mg 週1回（火曜）' },
        { timestamp: '2026-03-01T08:00:00Z', name: 'ヒュミラ (アダリムマブ)', notes: '40mg 2週おき 皮下注射（TNFα阻害薬）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    depression: {
      diseases: ['うつ病（大うつ病性障害）'],
      profile: { age: 41, gender: 'female', height: 163, weight: 56 },
      textEntries: [
        { timestamp: '2026-03-18T22:00:00Z', category: 'symptoms', title: '気分', content: '気分 2/10。布団から出られない。シャワーも無理だった。昨日の休職診断書を職場に送れた。' },
        { timestamp: '2026-03-25T11:00:00Z', category: 'medication', title: 'レクサプロ開始', content: 'エスシタロプラム（レクサプロ）10mg 開始。最初の1週間は眠気と吐き気あり。' },
        { timestamp: '2026-04-01T13:00:00Z', category: 'symptoms', title: '', content: '気分 4/10。少し外に出られた（近所のコンビニまで）。小さな前進。' },
        { timestamp: '2026-04-08T10:00:00Z', category: 'symptoms', title: '睡眠', content: '睡眠が少し改善。朝 7 時に起きられた。気分 4〜5/10。読書できた（30分）。' },
        { timestamp: '2026-04-15T12:00:00Z', category: 'symptoms', title: '', content: '気分 5/10。カウンセリング2回目。認知のゆがみについて話し合った。「べき思考」が多いと気づいた。' },
        { timestamp: '2026-04-22T14:00:00Z', category: 'symptoms', title: '', content: '気分 6/10。散歩 20分できた。気分が良くなると焦りが出るので、ペースを守ることを意識。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 8, sleep_quality: 3 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 4, sleep_quality: 6 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-25T08:00:00Z', name: 'エスシタロプラム（レクサプロ）', notes: '10mg 朝1錠。副作用: 初週は眠気・吐き気' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    adhd: {
      diseases: ['ADHD（注意欠如多動性障害）'],
      profile: { age: 29, gender: 'male', height: 175, weight: 70 },
      textEntries: [
        { timestamp: '2026-03-19T21:00:00Z', category: 'symptoms', title: '仕事', content: '締め切りを2つ忘れた。タスク管理アプリを試したがすぐ使わなくなる。上司に謝罪。集中力 2/10。' },
        { timestamp: '2026-03-26T18:00:00Z', category: 'medication', title: 'コンサータ開始', content: 'メチルフェニデート（コンサータ）18mg 開始。初日: 集中できた！午後はやや心拍増加。' },
        { timestamp: '2026-04-02T20:00:00Z', category: 'symptoms', title: '', content: 'コンサータ1週間。午前中の集中力が劇的改善。夕方以降は効果切れ（ウェアリングオフ）。' },
        { timestamp: '2026-04-09T19:00:00Z', category: 'medication', title: '増量', content: '36mg に増量。食欲がやや低下（昼食をあまり食べられない）。夜の睡眠は大丈夫。' },
        { timestamp: '2026-04-16T21:00:00Z', category: 'symptoms', title: 'コーチング', content: 'ADHDコーチング2回目。タスクを15分ブロックに分割する技法を試している。仕事への遅刻が今週ゼロ。' },
        { timestamp: '2026-04-23T20:00:00Z', category: 'symptoms', title: '', content: '集中力 7/10（コンサータ服薬日）。タスク達成率も改善。睡眠は7時間確保できてきた。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 5, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-26T08:00:00Z', name: 'メチルフェニデート（コンサータ）', notes: '18mg→36mg 朝1回。効果時間約8時間。食欲低下に注意' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    sle: {
      diseases: ['全身性エリテマトーデス（SLE）'],
      profile: { age: 28, gender: 'female', height: 160, weight: 50 },
      textEntries: [
        { timestamp: '2026-03-19T09:00:00Z', category: 'symptoms', title: 'フレア', content: '両頬に蝶形紅斑が出現。関節痛（手首・膝）7/10。疲労感強い。紫外線に当たったせいかも。' },
        { timestamp: '2026-03-26T10:00:00Z', category: 'medication', title: 'プラケニル継続', content: 'プラケニル（ヒドロキシクロロキン）400mg/日継続。フレア対応でプレドニゾロン 20mg 追加処方。' },
        { timestamp: '2026-04-02T08:00:00Z', category: 'symptoms', title: '皮膚', content: '紅斑が薄くなってきた。プレドニゾロン効いている。体重 1kg増（ステロイド副作用？）。' },
        { timestamp: '2026-04-09T11:00:00Z', category: 'vitals', title: '検査結果', content: '抗dsDNA抗体 28（高値→前回46から低下）。補体 C3 83（改善傾向）。尿タンパク 1+。腎機能は注意継続。' },
        { timestamp: '2026-04-16T09:00:00Z', category: 'symptoms', title: '日光対策', content: 'SPF50以上の日焼け止め毎日塗布。帽子とUVカット手袋で外出。関節痛 3/10 まで改善。' },
        { timestamp: '2026-04-23T14:00:00Z', category: 'medication', title: 'ステロイド漸減', content: 'プレドニゾロン 10mg まで減量。フレア再発なし。次回受診でプラケニル継続確認予定。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 8, pain_level: 7, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, pain_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-09T10:00:00Z', name: 'SLE フォロー血液検査', findings: '抗dsDNA抗体 28（改善）, 補体C3 83, 補体C4 16, 尿タンパク 1+, Cr 0.7, CBC正常' }
      ],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'プラケニル（ヒドロキシクロロキン）', notes: '400mg/日（抗マラリア薬・SLEの基本薬）' },
        { timestamp: '2026-03-26T08:00:00Z', name: 'プレドニゾロン', notes: 'フレア時 20mg →漸減→10mg/日（ステロイド）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    crohns: {
      diseases: ['クローン病'],
      profile: { age: 24, gender: 'male', height: 172, weight: 58 },
      textEntries: [
        { timestamp: '2026-03-20T07:30:00Z', category: 'symptoms', title: '腹痛', content: '右下腹部の痛み 6/10。下痢 4回/日。昨日の外食（脂肪分多め）が原因か。エレンタール追加。' },
        { timestamp: '2026-03-27T08:00:00Z', category: 'medication', title: 'エンタイビオ注射', content: '4週目のエンタイビオ（ベドリズマブ）点滴。投与後の倦怠感は軽減してきた。' },
        { timestamp: '2026-04-03T09:00:00Z', category: 'symptoms', title: '', content: '排便回数 2回/日まで改善。腹痛 3/10。体重 1.5kg増（58kg→59.5kg）。栄養状態改善。' },
        { timestamp: '2026-04-10T11:00:00Z', category: 'vitals', title: '便カルプロテクチン', content: '便カルプロテクチン 180 µg/g（前回 520）。炎症マーカー改善！エンタイビオ効果を確認。' },
        { timestamp: '2026-04-17T09:00:00Z', category: 'nutrition', title: '食事管理', content: '脂肪分を控えた食事継続。エレンタール 1本/日（朝）。野菜は煮込んで軟らかく。外食時は和食中心。' },
        { timestamp: '2026-04-24T21:00:00Z', category: 'symptoms', title: '', content: '今週は下痢ゼロ。腹痛もほぼなし。仕事にフルで復帰できた。次の内視鏡検査が楽しみ。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-10T10:00:00Z', name: '定期検査', findings: 'CRP 0.6（改善）, アルブミン 3.8（改善）, Hb 12.8, フェリチン 45, 便カルプロテクチン 180（正常化傾向）' }
      ],
      medications: [
        { timestamp: '2026-02-01T08:00:00Z', name: 'エンタイビオ（ベドリズマブ）', notes: '300mg 点滴 4週おき（生物学的製剤・腸管選択的）' },
        { timestamp: '2026-01-01T08:00:00Z', name: 'エレンタール', notes: '1包（300kcal）朝・腸管栄養療法。寛解維持に有効。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    gad: {
      diseases: ['全般性不安障害（GAD）'],
      profile: { age: 36, gender: 'female', height: 161, weight: 55 },
      textEntries: [
        { timestamp: '2026-03-18T22:00:00Z', category: 'symptoms', title: '不安・睡眠', content: '仕事のことが頭から離れず眠れない。心拍が速い（夜 90bpm）。肩が凝って頭痛。不安 8/10。' },
        { timestamp: '2026-03-25T11:00:00Z', category: 'medication', title: 'レクサプロ開始', content: 'エスシタロプラム 10mg 開始。最初の1週間は不安感が少し増す（と主治医に事前に説明された）。' },
        { timestamp: '2026-04-01T13:00:00Z', category: 'symptoms', title: 'CBT 1回目', content: 'CBT 初回。「最悪の事態」を書き出して現実的な確率を検討。思ったより不安が和らいだ。' },
        { timestamp: '2026-04-08T10:00:00Z', category: 'symptoms', title: '睡眠改善', content: '不安 6/10。レクサプロ2週目。眠りにつく時間が 1.5時間→45分に短縮。' },
        { timestamp: '2026-04-15T14:00:00Z', category: 'symptoms', title: 'CBT 3回目', content: 'CBT「心配タイム」を設定（毎日20分だけ心配する）。それ以外は「後で考える」と流せるようになった。' },
        { timestamp: '2026-04-22T21:00:00Z', category: 'symptoms', title: '', content: '不安 4/10。先週は仕事でミスが判明したが、パニックにならずに対処できた。CBT の効果を実感。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, sleep_quality: 3 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-25T08:00:00Z', name: 'エスシタロプラム（レクサプロ）', notes: '10mg 朝1錠（SSRI・GADへの第一選択）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    ms: {
      diseases: ['多発性硬化症（MS）'],
      profile: { age: 31, gender: 'female', height: 163, weight: 54 },
      textEntries: [
        { timestamp: '2026-03-20T09:00:00Z', category: 'symptoms', title: '視力低下（再発）', content: '右目の視力低下・色覚異常が昨日から。視神経炎の再発疑い。主治医に連絡→入院でステロイドパルス予定。' },
        { timestamp: '2026-03-23T10:00:00Z', category: 'medication', title: 'ステロイドパルス', content: 'メチルプレドニゾロン 1g×3日 点滴完了。視力は 70%まで回復。MSファティーグ強い。' },
        { timestamp: '2026-03-30T08:00:00Z', category: 'symptoms', title: 'MSファティーグ', content: '疲労 8/10。シャワーを浴びるだけで消耗。ウートホフ現象あり（入浴後に視力が一時的に悪化）。' },
        { timestamp: '2026-04-06T11:00:00Z', category: 'medication', title: 'オクレバス開始', content: 'オクレリズマブ（オクレバス）初回点滴（300mg）。6ヶ月おきの高効果 DMT。' },
        { timestamp: '2026-04-15T09:00:00Z', category: 'symptoms', title: '', content: '疲労 5/10 まで改善。視力ほぼ回復。冷却ベストを使い始め、ウートホフ現象が軽減。' },
        { timestamp: '2026-04-22T21:00:00Z', category: 'symptoms', title: '新規症状なし', content: '今週は新規神経症状なし。歩行も安定。MRI 予約済み（6月）。再発なく経過を見守りたい。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 8, pain_level: 3, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-04-06T10:00:00Z', name: 'オクレリズマブ（オクレバス）', notes: '300mg 点滴 初回（次回300mgを2週後）→以降600mg 6ヶ月おき' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    chronic_pain: {
      diseases: ['慢性疼痛症候群'],
      profile: { age: 49, gender: 'female', height: 158, weight: 62 },
      textEntries: [
        { timestamp: '2026-03-19T07:00:00Z', category: 'symptoms', title: '腰・下肢痛', content: 'NRS 7/10。右臀部から足先にかけての灼熱感。座って30分以上がつらい。低気圧接近前に悪化パターン。' },
        { timestamp: '2026-03-26T10:00:00Z', category: 'medication', title: 'タリージェ開始', content: 'ミロガバリン（タリージェ）5mg ×2/日 開始。眠気あり。夜の痛みが少し楽になった。' },
        { timestamp: '2026-04-02T09:00:00Z', category: 'symptoms', title: '神経ブロック', content: '硬膜外ブロック注射（2回目）。翌日から NRS 4/10 まで低下。1週間効果が持続。' },
        { timestamp: '2026-04-09T11:00:00Z', category: 'medication', title: 'タリージェ増量', content: 'ミロガバリン 10mg×2/日 に増量。眠気は慣れてきた。下肢の灼熱感がさらに軽減。' },
        { timestamp: '2026-04-16T14:00:00Z', category: 'symptoms', title: 'CBT 開始', content: '疼痛 CBT 初回。痛みへの注意の向け方を変える練習。活動を少しずつ増やす「グレード化活動」を開始。' },
        { timestamp: '2026-04-23T21:00:00Z', category: 'symptoms', title: '', content: 'NRS 3〜4/10（朝）。散歩15分×2回/日。痛みで諦めていた外出が再開できた。CBT の効果を実感。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, pain_level: 7, sleep_quality: 3 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, pain_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-26T08:00:00Z', name: 'ミロガバリン（タリージェ）', notes: '5mg→10mg ×2/日（神経障害性疼痛）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    panic: {
      diseases: ['パニック障害'],
      profile: { age: 27, gender: 'female', height: 160, weight: 52 },
      textEntries: [
        { timestamp: '2026-03-17T22:00:00Z', category: 'symptoms', title: 'パニック発作', content: '電車内で突然の動悸・息苦しさ・「死ぬかも」という恐怖。10分で自然に治まったが怖かった。次から電車が乗れなくなりそう。' },
        { timestamp: '2026-03-24T11:00:00Z', category: 'medication', title: 'レクサプロ開始', content: 'エスシタロプラム 10mg 開始。「最初の1〜2週間は不安が増すことがある」と医師に言われた。' },
        { timestamp: '2026-03-31T20:00:00Z', category: 'symptoms', title: '予期不安', content: '電車に乗れず、職場まで歩いた（40分）。発作は3日に1回程度。職場でも発作が来ないか心配。' },
        { timestamp: '2026-04-07T10:00:00Z', category: 'symptoms', title: 'CBT 開始', content: 'CBT 初回。発作日誌を付けることと、腹式呼吸の練習。「発作は20分で治まる」を覚えることが大事とのこと。' },
        { timestamp: '2026-04-14T09:00:00Z', category: 'symptoms', title: '曝露療法', content: '1駅だけ電車に乗った（曝露療法）。怖かったが発作は来なかった。達成感あり。レクサプロ効果が出始めたか。' },
        { timestamp: '2026-04-21T21:00:00Z', category: 'symptoms', title: '', content: '今週の発作は1回。乗れる電車の範囲が広がってきた。3駅までOK。来月には職場まで電車で行きたい。' },
        { timestamp: '2026-04-28T20:00:00Z', category: 'symptoms', title: '', content: '今月の発作: 4回（先月12回）。電車5駅まで乗れた。予期不安も軽くなってきた。CBT続けたい。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-24T08:00:00Z', name: 'エスシタロプラム（レクサプロ）', notes: '10mg 朝1錠（SSRI・パニック障害予防薬）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    endometriosis: {
      diseases: ['子宮内膜症'],
      profile: { age: 31, gender: 'female', height: 161, weight: 53 },
      textEntries: [
        { timestamp: '2026-03-18T07:00:00Z', category: 'symptoms', title: '月経痛', content: '月経1日目。NRS 8/10。ロキソプロフェン2錠服用。仕事を休んだ。右下腹部の強い痛みと腰痛。' },
        { timestamp: '2026-03-25T10:00:00Z', category: 'medication', title: 'ジエノゲスト開始', content: 'ジエノゲスト（ビジュアリン）2mg/日 開始。「月経周期を止めて痛みを軽減する」と婦人科で説明を受けた。' },
        { timestamp: '2026-04-01T09:00:00Z', category: 'symptoms', title: '不正出血', content: 'ジエノゲスト2週目。不正出血が続いている（ビジュアリンの副作用と説明された）。腹痛は 5/10 に軽減。' },
        { timestamp: '2026-04-08T11:00:00Z', category: 'symptoms', title: '気分変化', content: 'ジエノゲスト 3週目。骨盤痛がさらに軽減（3/10）。気分が少し沈みやすい。気分の変化を記録しておこう。' },
        { timestamp: '2026-04-15T09:00:00Z', category: 'symptoms', title: '', content: '今週は骨盤痛ほぼなし。不正出血は減ってきた。仕事にフル出勤できた。ジエノゲスト効いている実感。' },
        { timestamp: '2026-04-22T21:00:00Z', category: 'symptoms', title: 'チョコレート嚢胞', content: '婦人科MRI 結果: 右卵巣チョコレート嚢胞 4cm（前回4.2cm→縮小傾向）。ジエノゲスト継続で経過観察。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 6, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-25T08:00:00Z', name: 'ジエノゲスト（ビジュアリン）', notes: '2mg/日（子宮内膜症の第一選択ホルモン薬）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    diabetes: {
      diseases: ['2型糖尿病'],
      profile: { age: 54, gender: 'male', height: 170, weight: 82 },
      textEntries: [
        { timestamp: '2026-03-17T08:00:00Z', category: 'vitals', title: '血糖値', content: '空腹時血糖 156 mg/dL。HbA1c 先月 8.2%。医師から「SGLT2阻害薬を追加しましょう」と提案された。' },
        { timestamp: '2026-03-24T20:00:00Z', category: 'medication', title: 'フォシーガ開始', content: 'ダパグリフロジン（フォシーガ）10mg 朝食前 開始。尿量が増えた。頻尿は副作用とのこと。' },
        { timestamp: '2026-03-31T09:00:00Z', category: 'vitals', title: '血糖・体重', content: '空腹時血糖 138 mg/dL（改善）。体重 82kg→80.5kg（1.5kg減）。フォシーガの尿糖排泄効果。' },
        { timestamp: '2026-04-07T21:00:00Z', category: 'nutrition', title: '食事記録', content: '今週から白米→玄米に変更。食後2時間血糖が 168→142 mg/dL に改善。炭水化物量を意識するだけで変わる。' },
        { timestamp: '2026-04-14T08:00:00Z', category: 'symptoms', title: '運動', content: '食後30分歩行（20分）を毎日継続。食後2時間血糖が 130 mg/dL まで下がった日も。運動の効果を実感。' },
        { timestamp: '2026-04-21T10:00:00Z', category: 'vitals', title: 'HbA1c 結果', content: '受診日: HbA1c 7.4%（前回 8.2%）。食事・運動・フォシーガの相乗効果。医師から「この調子で続けて」とのこと。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-21T10:00:00Z', name: '定期血液検査', findings: 'HbA1c 7.4%（改善）, 空腹時血糖 128, eGFR 72（CKD G2）, LDL 118, TG 185, 尿タンパク (-)' }
      ],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'メトホルミン（メトグルコ）', notes: '500mg ×2/日（食直後）' },
        { timestamp: '2026-03-24T08:00:00Z', name: 'ダパグリフロジン（フォシーガ）', notes: '10mg 朝食前（SGLT2阻害薬）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    atopy: {
      diseases: ['アトピー性皮膚炎'],
      profile: { age: 26, gender: 'female', height: 158, weight: 50 },
      textEntries: [
        { timestamp: '2026-03-19T22:00:00Z', category: 'symptoms', title: 'かゆみ・不眠', content: 'かゆみ 8/10。夜中に引っ掻いて目が覚めた。顔・首・肘の内側に皮疹。ストレスで悪化している気がする。' },
        { timestamp: '2026-03-26T10:00:00Z', category: 'medication', title: 'デュピクセント開始', content: 'デュピルマブ（デュピクセント）初回注射（600mg）。2週後から 300mg を自己注射。少し期待している。' },
        { timestamp: '2026-04-02T09:00:00Z', category: 'symptoms', title: '結膜炎', content: 'デュピクセント開始1週間。目の充血・かゆみが出た（よくある副作用とのこと）。目薬を処方された。' },
        { timestamp: '2026-04-09T21:00:00Z', category: 'symptoms', title: 'かゆみ改善', content: 'かゆみ 5/10 まで低下。デュピクセント2回目の注射後。夜中に目が覚める頻度が週 5→2 回に減った。' },
        { timestamp: '2026-04-16T08:00:00Z', category: 'symptoms', title: '皮疹改善', content: '顔の皮疹がほぼ消えた。首はまだ少し残っている。保湿剤（ヒルドイド）毎日2回塗布継続。' },
        { timestamp: '2026-04-23T22:00:00Z', category: 'symptoms', title: '', content: 'かゆみ 2/10（3回目注射後）。ステロイドを塗らずに過ごせた週が初めて。睡眠が改善し、仕事のパフォーマンスも戻った。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, sleep_quality: 3 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-26T10:00:00Z', name: 'デュピルマブ（デュピクセント）', notes: '初回600mg→300mg 2週おき 皮下注射（IL-4/13阻害生物学的製剤）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    asthma: {
      diseases: ['気管支喘息'],
      profile: { age: 35, gender: 'female', height: 162, weight: 55 },
      textEntries: [
        { timestamp: '2026-03-18T07:00:00Z', category: 'symptoms', title: '夜間発作', content: '夜中 3時に喘鳴で目が覚めた。メプチン吸入1回で改善。今月3回目の夜間発作。コントロール不良かも。' },
        { timestamp: '2026-03-25T10:00:00Z', category: 'vitals', title: 'ピークフロー', content: '朝の PEF 280 L/min（最良値 380 の74%）。黄色ゾーン。吸入ステロイドの量を増やすか要検討。' },
        { timestamp: '2026-04-01T11:00:00Z', category: 'medication', title: 'シムビコート増量', content: 'シムビコート（ブデソニド/ホルモテロール）を 2吸入→4吸入/日 に増量。スマート療法で発作時追加も可。' },
        { timestamp: '2026-04-08T08:00:00Z', category: 'vitals', title: 'PEF 改善', content: '朝の PEF 330 L/min（最良値の87%）。緑ゾーンに入った。夜間発作なし。メプチン使用 0回/週。' },
        { timestamp: '2026-04-15T21:00:00Z', category: 'symptoms', title: '悪化要因特定', content: '花粉シーズンが発作増加と関係していた。マスク着用と空気清浄機で改善。花粉が主な誘因だと分かった。' },
        { timestamp: '2026-04-22T09:00:00Z', category: 'vitals', title: '', content: '朝の PEF 355 L/min（最良値の93%）。今週は喘鳴なし。発作止め吸入ゼロ。コントロール良好になった。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 6, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'シムビコート（ブデソニド/ホルモテロール）', notes: '2→4吸入/日（ICS/LABA配合剤）。スマート療法（発作時追加吸入可）。' },
        { timestamp: '2026-01-01T08:00:00Z', name: 'メプチン（プロカテロール）', notes: '頓服。発作時1〜2吸入（SABA）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    heart_failure: {
      diseases: ['心不全'],
      profile: { age: 72, gender: 'male', height: 165, weight: 70 },
      textEntries: [
        { timestamp: '2026-03-18T07:00:00Z', category: 'vitals', title: '体重増加', content: '昨日から +2.5kg（70kg→72.5kg）。足のむくみが強くなった。息苦しさ 6/10。主治医に電話。フロセミド増量を指示された。' },
        { timestamp: '2026-03-25T08:00:00Z', category: 'medication', title: 'フォシーガ追加', content: 'フォシーガ（ダパグリフロジン）10mg 追加。心不全への腎保護・利尿作用。体重 70.5kg に戻った。' },
        { timestamp: '2026-04-01T08:00:00Z', category: 'vitals', title: '安定', content: '体重 70.2kg。浮腫ほぼなし。血圧 128/80。息切れ 3/10（歩行時のみ）。安定してきた。' },
        { timestamp: '2026-04-08T09:00:00Z', category: 'nutrition', title: '減塩', content: '今週から減塩食を徹底。みそ汁を週3回→0回に。外食を避けた。体重の変動が小さくなった気がする。' },
        { timestamp: '2026-04-15T08:00:00Z', category: 'vitals', title: '心臓リハビリ', content: '心臓リハビリ 2週目。病院の体育室でエルゴメーター10分。疲労はあるが翌日も動ける。先週より歩ける距離が増えた。' },
        { timestamp: '2026-04-22T10:00:00Z', category: 'vitals', title: '受診結果', content: 'BNP 185（前回 320）。改善！体重コントロールと服薬継続の成果。医師から「この調子で体重管理を続けて」。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-04-22T10:00:00Z', name: '心不全フォロー', findings: 'BNP 185（改善）, Cr 1.3, eGFR 48, Na 139, K 4.3, Hb 11.2（軽度低下）' }
      ],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'エンレスト（サクビトリル/バルサルタン）', notes: '97/103mg ×2/日（ARNi）' },
        { timestamp: '2026-01-01T08:00:00Z', name: 'カルベジロール（アーチスト）', notes: '5mg ×2/日（βブロッカー）' },
        { timestamp: '2026-01-01T08:00:00Z', name: 'フロセミド', notes: '20mg 朝（利尿薬）' },
        { timestamp: '2026-03-25T08:00:00Z', name: 'ダパグリフロジン（フォシーガ）', notes: '10mg 朝（SGLT2阻害薬・心不全適応）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    gout: {
      diseases: ['痛風'],
      profile: { age: 42, gender: 'male', height: 175, weight: 88 },
      textEntries: [
        { timestamp: '2026-03-17T03:00:00Z', category: 'symptoms', title: '痛風発作', content: '夜中に右足親指の激痛で目が覚めた。真っ赤に腫れている。触れるだけで激痛（10/10）。昨日は同僚の送別会でビールをたくさん飲んだ。コルヒチン服用。' },
        { timestamp: '2026-03-24T10:00:00Z', category: 'medication', title: 'フェブリク開始', content: 'フェブキソスタット（フェブリク）20mg 開始。今後尿酸値 6.0 以下を目指す。発作予防にコルヒチン 0.5mg 3ヶ月間継続。' },
        { timestamp: '2026-03-31T09:00:00Z', category: 'vitals', title: '尿酸値測定', content: '尿酸値 8.4 mg/dL（目標 6.0 以下）。フェブリク開始1週間では下がりにくい。水分2L/日を目標に継続。' },
        { timestamp: '2026-04-07T21:00:00Z', category: 'nutrition', title: '食事改善', content: '禁酒2週間達成。プリン体の多い干物・レバーを避けている。外食でも刺身・豆腐・野菜を中心に選んでいる。' },
        { timestamp: '2026-04-14T09:00:00Z', category: 'vitals', title: '尿酸値再測定', content: '尿酸値 7.1 mg/dL（前回 8.4 から改善）。フェブリク増量（40mg）を医師と相談予定。体重 88→85kg（3kg減）。' },
        { timestamp: '2026-04-21T21:00:00Z', category: 'symptoms', title: '発作なし', content: '今月の発作ゼロ。コルヒチン継続中。フェブリク40mg で尿酸値 6.5 まで下がってきた。目標まであと一歩。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, pain_level: 0, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-14T10:00:00Z', name: '尿酸・代謝検査', findings: '尿酸 7.1（改善）, Cr 1.0, eGFR 80, TG 220, LDL 138, 空腹時血糖 108' }
      ],
      medications: [
        { timestamp: '2026-03-24T08:00:00Z', name: 'フェブキソスタット（フェブリク）', notes: '20mg→40mg 朝（尿酸産生抑制）' },
        { timestamp: '2026-03-24T08:00:00Z', name: 'コルヒチン', notes: '0.5mg 朝（発作予防・3ヶ月間）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    ckd: {
      diseases: ['慢性腎臓病（CKD）'],
      profile: { age: 63, gender: 'male', height: 168, weight: 74 },
      textEntries: [
        { timestamp: '2026-03-19T08:00:00Z', category: 'vitals', title: 'eGFR・血圧', content: 'eGFR 42（前回 47、6ヶ月前 51）。低下速度が年間 -9。血圧 148/92。降圧薬を増量する必要がありそう。' },
        { timestamp: '2026-03-26T10:00:00Z', category: 'medication', title: 'フォシーガ追加', content: 'フォシーガ（ダパグリフロジン）10mg 追加処方。腎保護目的。糖尿病なくても使えると説明された。' },
        { timestamp: '2026-04-02T08:00:00Z', category: 'vitals', title: '血圧改善', content: '朝の血圧 132/82。フォシーガ開始後1週間。浮腫がやや減った（体重 74→73kg）。利尿効果。' },
        { timestamp: '2026-04-09T09:00:00Z', category: 'nutrition', title: '食事記録', content: '減塩食を開始。味噌汁を1日1杯→0杯に。おひたしは素材だけ。塩分 6g/日の目標を初めて達成した日。' },
        { timestamp: '2026-04-16T11:00:00Z', category: 'vitals', title: '血圧安定', content: '朝 128/80・夕 130/82。目標達成。体重 73kg で安定。むくみはほぼなし。食事管理の効果が出ている。' },
        { timestamp: '2026-04-23T10:00:00Z', category: 'vitals', title: '受診結果', content: 'eGFR 44（前回 42 から改善）。尿タンパク/Cr比 0.8（前回 1.2 から低下）。フォシーガ・減塩が効いた。医師「この調子で続けましょう」。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-23T10:00:00Z', name: '腎機能検査', findings: 'eGFR 44（改善）, Cr 1.42, BUN 22, 尿タンパク/Cr 0.8（改善）, K 4.2, Hb 11.6（軽度低下）' }
      ],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'テルミサルタン（ミカルディス）', notes: '40mg 朝（ARB・腎保護降圧薬）' },
        { timestamp: '2026-03-26T08:00:00Z', name: 'ダパグリフロジン（フォシーガ）', notes: '10mg 朝（SGLT2阻害薬・CKD腎保護適応）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    osteoporosis: {
      diseases: ['骨粗鬆症'],
      profile: { age: 67, gender: 'female', height: 155, weight: 52 },
      textEntries: [
        { timestamp: '2026-03-12T09:00:00Z', category: 'vitals', title: '骨密度検査結果', content: 'DXA検査の結果。腰椎YAM 68%、大腿骨YAM 71%。骨粗鬆症と診断。昨年より5%低下しているとのこと。整形外科でアレンドロネートを処方された。' },
        { timestamp: '2026-03-19T08:00:00Z', category: 'medication', title: 'アレンドロネート開始', content: 'アレンドロネート（ボナロン）週1回35mg 開始。飲み方の注意：起床後すぐ、コップ1杯の水で飲む、30分は横にならない。逆流性食道炎に注意するよう言われた。' },
        { timestamp: '2026-03-25T08:00:00Z', category: 'symptoms', title: '転倒ヒヤリ', content: '夜中にトイレへ行くとき、廊下で足がもつれてヒヤリとした。転ばなかったけれど怖かった。足元灯を購入しようと決めた。バランス運動を始めることにした。' },
        { timestamp: '2026-04-01T10:00:00Z', category: 'nutrition', title: 'カルシウム食品記録', content: '今日の食事：ヨーグルト1個（カルシウム約120mg）、豆腐半丁（約120mg）、小魚の佃煮（約150mg）。合計約400mgで目標の700mgに届いていない。牛乳を追加しよう。' },
        { timestamp: '2026-04-08T11:00:00Z', category: 'activity', title: 'バランス体操', content: '整形外科士に教えてもらったバランス体操を毎朝10分実施中。片足立ち10秒×3回、スクワット15回。最初は5秒しかできなかった片足立ちが10秒できるようになった。' },
        { timestamp: '2026-04-15T09:00:00Z', category: 'vitals', title: '受診と薬剤確認', content: 'アレンドロネート1ヶ月後の受診。副作用なし。カルシウム700mg＋ビタミンD400IUサプリを追加で処方された。次回DXA検査は6ヶ月後。' },
        { timestamp: '2026-04-22T10:00:00Z', category: 'symptoms', title: '腰背部痛の経過', content: '腰の鈍痛が続いているが先月より軽くなった（5/10→3/10）。圧迫骨折はないと説明された。バランス体操と減痛薬（ロキソニン頓服）で管理中。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 4, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 4, pain_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, pain_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-15T10:00:00Z', name: '骨代謝マーカー・一般検査', findings: 'ALP 98（正常）, Ca 9.1, P 3.5, 25(OH)D 18（不足）, 骨型ALP 12.8（骨吸収マーカー改善中）' }
      ],
      medications: [
        { timestamp: '2026-03-19T08:00:00Z', name: 'アレンドロネート（ボナロン）', notes: '35mg 週1回 起床後（ビスフォスフォネート・骨吸収抑制）' },
        { timestamp: '2026-04-15T08:00:00Z', name: 'カルシウム＋ビタミンD3', notes: '700mg/400IU 朝食後（骨密度維持・骨折予防）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    menopause: {
      diseases: ['更年期障害'],
      profile: { age: 51, gender: 'female', height: 158, weight: 57 },
      textEntries: [
        { timestamp: '2026-03-10T07:00:00Z', category: 'symptoms', title: 'ほてり・夜間発汗', content: '今朝も4時に夜間発汗で目が覚めた。パジャマが濡れるくらいの発汗。昼間は突然のほてりが5〜6回（強さ7/10）。最後の月経から8ヶ月。閉経になったのかも。婦人科に予約した。' },
        { timestamp: '2026-03-17T10:00:00Z', category: 'consultation', title: '婦人科受診', content: 'FSH 63 mIU/mL（閉経レベル）、E2 15 pg/mL（低値）。更年期障害と診断。HRTか漢方か相談。まず加味逍遙散を試してみることになった。' },
        { timestamp: '2026-03-24T08:00:00Z', category: 'medication', title: '加味逍遙散開始', content: '加味逍遙散 2.5g 朝晩2回開始。漢方なので効果が出るまで2〜4週間かかると説明された。夜間発汗は変わらず。イライラは少し楽になった気がする。' },
        { timestamp: '2026-03-31T09:00:00Z', category: 'symptoms', title: '睡眠改善', content: '加味逍遙散2週間。夜間覚醒が3回→1〜2回に減った。ほてりはまだ5回程度/日だが強さが5/10に下がった。気分のムラは漢方で落ち着いてきている。' },
        { timestamp: '2026-04-07T10:00:00Z', category: 'medication', title: 'HRTへの切り替え相談', content: '再受診。加味逍遙散で気分は改善したが、ほてりが続くためHRTも相談。エストラジオールパッチ（ル・エストロジェル）＋黄体ホルモン処方。1〜2週間で効果出ると説明。' },
        { timestamp: '2026-04-14T08:00:00Z', category: 'symptoms', title: 'HRT開始1週間', content: 'HRT開始1週間。ほてり2〜3回/日（強さ4/10）に大幅改善。夜間発汗がほぼなくなった！睡眠7時間取れた。エネルギーが戻ってきた感じ。乳房の張りはあるが許容範囲。' },
        { timestamp: '2026-04-21T09:00:00Z', category: 'vitals', title: '骨密度・定期検査', content: '骨密度検査（DXA）：腰椎YAM 82%（正常範囲）。エストロゲン低下で骨密度も下がるとのこと。カルシウムサプリと日光浴を継続するよう指示。次回は6ヶ月後。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 6, pain_level: 3, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-17T10:00:00Z', name: 'ホルモン検査', findings: 'FSH 63 mIU/mL（閉経レベル）, LH 42, E2 15 pg/mL（低値）, TSH 2.1（正常）, コレステロール LDL 142（やや高め）' }
      ],
      medications: [
        { timestamp: '2026-03-24T08:00:00Z', name: '加味逍遙散', notes: '2.5g 朝晩2回（気分不安定・ほてり軽減）' },
        { timestamp: '2026-04-07T08:00:00Z', name: 'エストラジオールジェル（ル・エストロジェル）', notes: '1g 腕に塗布 就寝前（HRT・ほてり治療）' },
        { timestamp: '2026-04-07T08:00:00Z', name: 'ジドロゲステロン（デュファストン）', notes: '10mg 月15日間（HRTの子宮保護・黄体ホルモン）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    schizophrenia: {
      diseases: ['統合失調症'],
      profile: { age: 28, gender: 'male', height: 172, weight: 78 },
      textEntries: [
        { timestamp: '2026-03-11T09:00:00Z', category: 'symptoms', title: '幻聴が強くなった', content: '昨日から幻聴がひどい。「お前はダメだ」という声が1日に何度も聞こえる（強さ7/10）。眠れなくて夜中に何度も目が覚めた。外出が怖くなってきた。デイケアを休んだ。主治医に連絡した。' },
        { timestamp: '2026-03-18T10:00:00Z', category: 'medication', title: 'オランザピン増量', content: 'オランザピンを10mgから15mgに増量。主治医から「幻聴が強いときは無理に外出しなくていい」と言われた。服薬を続けることが最重要と再確認。体重が増えてきている（78→80kg）。' },
        { timestamp: '2026-03-25T09:00:00Z', category: 'symptoms', title: '幻聴が少し落ち着いた', content: '幻聴の強さが7/10→4/10に下がった。睡眠も改善（5時間→7時間）。外出が少しできるようになった。デイケアに1回参加した。スタッフから「表情が明るくなった」と言われた。' },
        { timestamp: '2026-04-01T10:00:00Z', category: 'activity', title: 'デイケア再開', content: 'デイケアに週2回参加。陶芸クラスとSSTに出席。他のメンバーと会話できた。陰性症状（意欲低下・社会引きこもり）はまだあるが、少しずつ動けるようになっている。' },
        { timestamp: '2026-04-08T09:00:00Z', category: 'symptoms', title: '薬の副作用', content: 'アカシジア（じっとしていられない、脚がムズムズ）が出てきた。主治医に相談したところ、ビペリデン（アキネトン）を追加処方された。体重は81kg（継続増加中）。食事を意識して減らしている。' },
        { timestamp: '2026-04-15T10:00:00Z', category: 'vitals', title: '受診と経過確認', content: '受診。幻聴ほぼなし（1/10）。陰性症状は継続中だが「デイケアに通えているので良い」と評価された。就労支援（IPS）への参加を提案された。血糖値 110、HbA1c 5.9（薬の影響で少し高め）。' },
        { timestamp: '2026-04-22T09:00:00Z', category: 'activity', title: '就労支援見学', content: '就労移行支援施設を見学した。パソコンを使った作業訓練があると知った。来月から週1〜2回通ってみることに。「働けるかも」という希望が少し出てきた。デイケア週2回も継続中。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-15T10:00:00Z', name: '代謝検査（抗精神病薬副作用モニタリング）', findings: '空腹時血糖 110, HbA1c 5.9, TG 180, LDL 125, 体重 81kg, BMI 27.4（オランザピン副作用で増加傾向）' }
      ],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'オランザピン（ジプレキサ）', notes: '10→15mg 就寝前（抗精神病薬）' },
        { timestamp: '2026-04-08T08:00:00Z', name: 'ビペリデン（アキネトン）', notes: '1mg 朝（EPS・アカシジア対策）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    alzheimers: {
      diseases: ['アルツハイマー病'],
      profile: { age: 74, gender: 'female', height: 152, weight: 50 },
      textEntries: [
        { timestamp: '2026-03-10T08:00:00Z', category: 'symptoms', title: '同じことを何度も聞く', content: '（娘が記録）母が今日の夕食のメニューを3回聞いた。先週の孫の誕生日パーティーを覚えていない。「さっき話したでしょ」と言ってしまった。もの忘れ外来の予約を取ることにした。', },
        { timestamp: '2026-03-17T10:00:00Z', category: 'consultation', title: 'もの忘れ外来 受診', content: 'MMSE 22点（軽度認知症レベル）。MRIで海馬萎縮あり。血液検査でpTau217高値。アルツハイマー型認知症と診断。ドネペジル（アリセプト）3mgから開始することになった。' },
        { timestamp: '2026-03-24T09:00:00Z', category: 'medication', title: 'アリセプト開始', content: 'ドネペジル3mg 就寝前に開始。最初の1週間は吐き気があったが徐々に落ち着いた。服薬管理は娘が担当。就寝前の服薬ルーティンを確立。' },
        { timestamp: '2026-03-31T10:00:00Z', category: 'activity', title: 'デイサービス見学', content: 'デイサービスを見学。歌・体操・塗り絵のプログラムがあった。「私は元気だからこういうところには行かない」と本人は抵抗。来週もう一度見学して慣れてもらう予定。' },
        { timestamp: '2026-04-07T09:00:00Z', category: 'symptoms', title: 'BPSD 夕暮れ症候群', content: '（娘が記録）夕方になると落ち着かなくなり「家に帰りたい」と言い出す（今いる場所が自宅なのに）。夕暮れ症候群と説明を受けた。夕方に散歩・音楽を聞かせると少し落ち着く。' },
        { timestamp: '2026-04-14T10:00:00Z', category: 'medication', title: 'アリセプト増量', content: 'アリセプト 3→5mg に増量。副作用は吐き気が少しあったが食後服薬に変更して改善。デイサービスに週2回通い始めた。スタッフから「歌が上手と笑顔が出るようになった」との報告。' },
        { timestamp: '2026-04-21T09:00:00Z', category: 'vitals', title: '受診・経過確認', content: 'MMSE 23点（前回 22 → 横ばい。アリセプトが効いている可能性）。「デイサービスに行くのが楽しみ」と本人が言うようになった。睡眠は改善。夕暮れ症候群は減少傾向。次回は6ヶ月後。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 3, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-17T10:00:00Z', name: '認知症鑑別検査', findings: 'MMSE 22点, pTau217 高値（アルツハイマー型確認）, MRI 海馬萎縮, TSH 正常, Vit B12 正常, 血糖 98, HbA1c 5.4' }
      ],
      medications: [
        { timestamp: '2026-03-24T08:00:00Z', name: 'ドネペジル（アリセプト）', notes: '3→5mg 就寝後（コリンエステラーゼ阻害薬・認知機能維持）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    sad: {
      diseases: ['社会不安障害'],
      profile: { age: 24, gender: 'female', height: 160, weight: 52 },
      textEntries: [
        { timestamp: '2026-03-09T20:00:00Z', category: 'symptoms', title: 'プレゼン前夜', content: '明日のゼミ発表がとても怖い。夜中まで準備したが「絶対に変な声が出る」「みんなに笑われる」という考えが止まらない。動悸がひどく眠れない。睡眠 2時間。' },
        { timestamp: '2026-03-10T15:00:00Z', category: 'symptoms', title: 'プレゼン後', content: 'なんとか発表できた。声が少し震えたが最後まで話せた。不安レベル 8/10。終わったらすぐ席に戻って話しかけられないようにした。やはり「変に思われたかも」という考えが消えない。' },
        { timestamp: '2026-03-17T10:00:00Z', category: 'consultation', title: '心療内科 初診', content: '社会不安障害と診断。エスシタロプラム（レクサプロ）5mgを処方された。4週間後に再診。カウンセリングも紹介された。「脳の誤警報」という説明でやや安心した。' },
        { timestamp: '2026-03-24T09:00:00Z', category: 'medication', title: 'レクサプロ1週間', content: 'レクサプロ1週間。吐き気が少しあったが夕食後に飲むことで改善。不安の強さはまだ変わらないが、医師から「2〜4週間かかる」と聞いていたので継続する。電話をかけることを週1回の目標にした。' },
        { timestamp: '2026-03-31T19:00:00Z', category: 'activity', title: '初めての段階的曝露', content: 'カウンセラーの指示で、今週のCBT課題：「コンビニで店員に一言話しかける」。不安レベル 6/10 だったがやってみた。最悪の事態（変な顔をされる）は起きなかった。少し達成感。' },
        { timestamp: '2026-04-07T10:00:00Z', category: 'symptoms', title: 'レクサプロ3週間', content: '不安の強さが少し下がった感じ（7/10→5/10）。電話を自分からかけることができた（友人あて）。まだ人前で話すのは怖いが、「絶対失敗する」という確信が少し薄れてきた。' },
        { timestamp: '2026-04-14T21:00:00Z', category: 'activity', title: 'CBT課題 達成', content: 'ゼミでの小グループ発表（3人向け）を回避せずに行った！不安 6/10→終わったら2/10。「思ったより大丈夫だった」という体験を記録。カウンセラーに報告予定。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 6, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-17T08:00:00Z', name: 'エスシタロプラム（レクサプロ）', notes: '5→10mg 夕食後（SSRI・社会不安障害の第一選択薬）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    anorexia: {
      diseases: ['摂食障害'],
      profile: { age: 19, gender: 'female', height: 163, weight: 47 },
      textEntries: [
        { timestamp: '2026-03-08T08:00:00Z', category: 'symptoms', title: '食事記録', content: '今日食べたもの：朝：なし。昼：サラダ（ドレッシングなし）。夜：白米100g・みそ汁。体重 47kg（1ヶ月前 49kgから減少）。「太るのが怖い」という気持ちが強い。でも体がだるい。' },
        { timestamp: '2026-03-15T10:00:00Z', category: 'consultation', title: '心療内科 受診', content: 'BMI 17.7（低体重）。拒食症の診断。亜鉛欠乏・ビタミンD不足・低血糖を指摘された。入院は本人が拒否。週1回の栄養士・心理士の外来で様子を見ることになった。' },
        { timestamp: '2026-03-22T09:00:00Z', category: 'nutrition', title: '食事再導入開始', content: '栄養士と一緒に「怖くない食品リスト」を作った。今週の目標：朝食を必ず食べること。ヨーグルト（100g）から始めることにした。食べた後30分はドキドキしたが嘔吐衝動はなかった。' },
        { timestamp: '2026-03-29T08:00:00Z', category: 'nutrition', title: '朝食継続', content: '朝食を1週間毎日食べた！ヨーグルト→バナナ半分も追加できた。体重 47.5kg（少し増えたが怖い気持ちと戦っている）。心理士から「これは回復の証拠」と言われた。' },
        { timestamp: '2026-04-05T09:00:00Z', category: 'symptoms', title: 'めまい改善', content: '以前あっためまい・立ちくらみが減ってきた。亜鉛サプリ開始2週間。食欲が少し出てきた気がする。まだ体重を見るのが怖いが、体調は明らかに改善している。' },
        { timestamp: '2026-04-12T10:00:00Z', category: 'nutrition', title: '初めてランチ外食', content: '友人とランチに行けた。自分でカフェのサラダプレートを選んで食べた。「みんなに見られている」という恐怖はあったが最後まで食べられた。1年ぶりの外食。達成感。' },
        { timestamp: '2026-04-19T09:00:00Z', category: 'vitals', title: '受診・体重確認', content: '体重 48.2kg（1ヶ月で+1.2kg）。BMI 18.1（低体重境界）。医師から「回復の軌道に乗っている」と言われた。亜鉛値も正常範囲に戻ってきた。次の目標BMI 20を目指す。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 4, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-15T10:00:00Z', name: '摂食障害スクリーニング', findings: 'BMI 17.7（低体重）, 亜鉛 58（低値 基準75以上）, 25(OH)D 14（不足）, 血糖 62（低血糖）, K 3.3（低め）, Hb 10.8（軽度貧血）' }
      ],
      medications: [
        { timestamp: '2026-03-15T08:00:00Z', name: '亜鉛サプリメント', notes: '25mg 朝食後（味覚・食欲改善・回復期補充）' },
        { timestamp: '2026-03-15T08:00:00Z', name: 'ビタミンD3', notes: '1000IU 朝食後（欠乏補正）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    thyroid_cancer: {
      diseases: ['甲状腺がん'],
      profile: { age: 46, gender: 'female', height: 158, weight: 55 },
      textEntries: [
        { timestamp: '2026-03-05T09:00:00Z', category: 'vitals', title: '術後3ヶ月 受診', content: 'Tg値 0.08（術後低値維持）、TgAb 陰性、TSH 0.08（抑制目標範囲）。頸部超音波は異常なし。「術後経過は良好」と言われた。チラーヂン 100μgを継続。' },
        { timestamp: '2026-03-12T08:00:00Z', category: 'symptoms', title: 'TSH抑制の副作用', content: '動悸が気になる。安静時の心拍数が90〜100。眠りが浅く夜中に目が覚める。体重が54→53kgに減少。TSH抑制のせい？次の受診で相談しようと思う。' },
        { timestamp: '2026-03-19T08:00:00Z', category: 'medication', title: 'チラーヂン微調整', content: 'TSH 0.04（低すぎる）と指摘。チラーヂン 100μg→88μg に微調整。「術後3年経過で低リスクになってきたので少し緩める」と説明された。ホッとした。' },
        { timestamp: '2026-03-26T09:00:00Z', category: 'vitals', title: '骨密度検査', content: 'DXA検査：腰椎YAM 83%（正常範囲）。TSH抑制療法2年で若干の低下が見られると言われた。カルシウム＋ビタミンD3を処方された。定期的な体重負荷運動も勧められた。' },
        { timestamp: '2026-04-02T08:00:00Z', category: 'symptoms', title: '動悸改善', content: 'チラーヂン微調整後2週間。安静時心拍数 82〜88に改善。夜の眠りも良くなった。体重は53kg で安定。副作用が減って生活しやすくなった。' },
        { timestamp: '2026-04-09T11:00:00Z', category: 'vitals', title: '受診・Tg確認', content: 'Tg 0.10（前回 0.08 から微増だが許容範囲）。TgAb 陰性。TSH 0.15（調整後の目標範囲に入った）。動悸の改善を報告したら医師から「調整成功」と言われた。次回は6ヶ月後。' },
        { timestamp: '2026-04-16T09:00:00Z', category: 'activity', title: 'ウォーキング開始', content: '骨密度維持のため毎日30分のウォーキングを開始。カルシウムサプリも継続中。術後の体調は安定していて、ほぼ手術前と変わらない生活に戻れた。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-09T10:00:00Z', name: '甲状腺がん術後モニタリング', findings: 'Tg 0.10（術後低値維持）, TgAb 陰性, TSH 0.15（抑制目標範囲）, FT4 1.8（やや高め・TSH抑制反映）, Ca 9.3, ALP 88' }
      ],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'レボチロキシン（チラーヂン）', notes: '100→88μg 朝空腹時（TSH抑制・甲状腺ホルモン補充）' },
        { timestamp: '2026-03-26T08:00:00Z', name: 'カルシウム＋ビタミンD3', notes: '700mg/400IU 朝食後（骨密度低下予防・TSH抑制副作用対策）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    sleep_apnea: {
      diseases: ['睡眠時無呼吸症候群'],
      profile: { age: 48, gender: 'male', height: 170, weight: 88 },
      textEntries: [
        { timestamp: '2026-03-08T08:00:00Z', category: 'symptoms', title: '日中の強い眠気', content: '会議中に2回居眠りしてしまった。毎朝頭が重く、起床時に頭痛がある。妻から「いびきがひどくて息が止まっている」と指摘された。ESS（眠気スコア）を測ったら15点（重度眠気）。睡眠外来に予約した。' },
        { timestamp: '2026-03-15T10:00:00Z', category: 'consultation', title: '睡眠外来 受診・検査', content: '簡易ポリグラフ検査の結果：AHI 38（重症OSA）。血液検査で血圧 148/92、空腹時血糖 112（やや高め）。CPAP療法を開始することになった。機器レンタル（レスメド）を処方。' },
        { timestamp: '2026-03-22T08:00:00Z', category: 'medication', title: 'CPAP開始1週間', content: 'CPAP開始1週間。最初の2日は呼吸に合わせる感覚が難しかった。3日目からは自然に眠れた。使用時間：平均5.2時間/日。機器AHI：4.8（良好）。朝の頭痛が消えた。' },
        { timestamp: '2026-03-29T08:00:00Z', category: 'symptoms', title: '眠気改善', content: 'ESS 15→9 に改善（正常範囲内）。日中の居眠りがなくなった。体重 88kg（変化なし）。妻から「いびきが全くなくなった」と言われた。マスクのリーク値が少し高い→調整した。' },
        { timestamp: '2026-04-05T08:00:00Z', category: 'vitals', title: '血圧改善', content: '朝の血圧 132/84（CPAP前 148/92 から改善）。CPAP使用時間：5.8時間/日（目標4時間以上を達成）。体重を減らすことにした。食事管理を始め、夕食の炭水化物を半減した。' },
        { timestamp: '2026-04-12T08:00:00Z', category: 'vitals', title: '受診・1ヶ月後', content: 'CPAP使用時間 平均6時間。AHI 3.2（目標5以下達成）。ESS 8（正常）。血圧 128/82。「CPAP は大成功」と評価された。体重 86kg（2kg減）。体重 85kg 以下が次の目標。' },
        { timestamp: '2026-04-19T08:00:00Z', category: 'activity', title: '体重管理継続', content: '食事管理2週間。体重 85.5kg（-2.5kg）。CPAPの使用時間 6.5時間/日に増えた。朝の起床が楽になった。仕事の集中力が戻ってきた感じ。次の目標は体重 80kg 以下。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, sleep_quality: 8 }
      ],
      bloodTests: [
        { timestamp: '2026-03-15T10:00:00Z', name: 'SAS合併症スクリーニング', findings: 'AHI 38（重症OSA）, 血圧 148/92, 空腹時血糖 112, HbA1c 5.8, TG 210, LDL 142, BMI 30.4' }
      ],
      medications: [],
      sleepData: [], activityData: [], meals: []
    },
    liver_disease: {
      diseases: ['慢性肝疾患（MASH・肝硬変）'],
      profile: { age: 56, gender: 'male', height: 172, weight: 84 },
      textEntries: [
        { timestamp: '2026-03-11T08:00:00Z', category: 'vitals', title: '肝機能悪化', content: 'ALT 98（基準値40以下）、AST 74。フィブロスキャン：14.2 kPa（肝硬変ライン12超）。主治医から「代償性肝硬変に進行している可能性がある」と言われた。禁酒継続中（2年）。体重 84kg、腹囲 96cm。' },
        { timestamp: '2026-03-18T10:00:00Z', category: 'consultation', title: '消化器内科 受診', content: 'フィブロスキャン 14.2 kPa で肝硬変確定（F4）。AFP 4.8（正常範囲）。血小板 11.2万（低下傾向）。食道静脈瘤なし（内視鏡確認）。ウルソ処方継続。「体重を5〜10%減量することで線維化が改善する可能性」と言われた。' },
        { timestamp: '2026-03-25T08:00:00Z', category: 'activity', title: '食事・運動記録', content: '今週から食事記録を始めた。塩分は目標6g/日で現在7.5g。週3回30分のウォーキングを開始。体重 83.5kg（先週から-0.5kg）。腹囲 95cm（1cm減）。むくみはなし。' },
        { timestamp: '2026-04-01T08:00:00Z', category: 'vitals', title: 'ALT改善傾向', content: 'ALT 72（前回98から改善）。体重 82.5kg（1ヶ月で-1.5kg）。倦怠感は以前より少し軽い（6/10→4/10）。アルコールはゼロを維持。コーヒー1日3杯（肝臓保護効果があると読んだ）を続けている。' },
        { timestamp: '2026-04-08T09:00:00Z', category: 'nutrition', title: '塩分管理', content: '塩分6g/日達成。味噌汁を週3回→週1回に減らした。魚は塩漬けではなく生鮮を選ぶ。かまぼこ・ウインナー・漬物を控えた。料理が難しいが少しずつ慣れてきた。' },
        { timestamp: '2026-04-15T10:00:00Z', category: 'vitals', title: '3ヶ月後 受診', content: 'ALT 55（改善継続）、AST 48、血小板 11.8万（横ばい）、アルブミン 4.0（正常）、PT 88%。体重 81kg（3ヶ月で-3kg）。AFP 4.2（正常）。「体重減少が肝機能改善に効いている。継続して」と言われた。次回エコー・AFP は6ヶ月後。' },
        { timestamp: '2026-04-22T08:00:00Z', category: 'symptoms', title: '倦怠感の変化', content: '倦怠感 3/10（開始時 6/10 から大幅改善）。ウォーキングが30分→45分できるようになった。体重 80.5kg（目標 77kg まであと3.5kg）。「体が軽くなった」と感じる。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-15T10:00:00Z', name: '肝機能・線維化マーカー', findings: 'ALT 55（改善）, AST 48, γGTP 62, 血小板 11.8万, アルブミン 4.0, PT 88%, AFP 4.2（正常）, フィブロスキャン 14.2→12.8 kPa（改善）' }
      ],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'ウルソデオキシコール酸（ウルソ）', notes: '200mg 毎食後3回（肝臓保護・胆汁酸代謝改善）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    cancer_fatigue: {
      diseases: ['がん治療副作用管理'],
      profile: { age: 52, gender: 'female', height: 160, weight: 57 },
      textEntries: [
        { timestamp: '2026-03-09T09:00:00Z', category: 'symptoms', title: '化学療法2回目後', content: 'パクリタキセル投与3日後。倦怠感 9/10。ベッドから出るのがやっと。悪心 5/10 で食事が半分しか食べられない。足先のしびれが少し出てきた（CIPN初期？）。口内炎1個。体重 55kg（開始時57kgから）。' },
        { timestamp: '2026-03-16T08:00:00Z', category: 'symptoms', title: '化学療法2週間後', content: '倦怠感 5/10に回復。悪心なし。足のしびれが持続（ピリピリ感・靴下を履いている感覚）。口内炎は治癒。白血球 2,100（好中球 1,200）。体重 56kg。短距離の散歩（10分）ができるようになった。' },
        { timestamp: '2026-03-23T10:00:00Z', category: 'medication', title: '制吐薬調整', content: '3回目の化学療法前に主治医と相談。アプレピタント（イメンド）を追加。投与後の悪心が7/10→3/10に大幅改善。制吐薬の効果を事前に記録していたおかげで「前回より悪心が強かった」と正確に伝えられた。' },
        { timestamp: '2026-03-30T09:00:00Z', category: 'activity', title: '軽い運動開始', content: '看護師から「疲れない程度に動いた方が回復が早い」と言われた。20分のウォーキングを3日おきに開始。倦怠感 4/10 の日は外出できた。「疲れたら休む、でも安静すぎない」を意識。' },
        { timestamp: '2026-04-06T08:00:00Z', category: 'symptoms', title: 'CIPN悪化', content: '足のしびれが足首まで広がった。冷たいものに触ると強い電気刺激のような感覚（冷感過敏）。鍋の取手が持ちにくくなってきた（手もしびれ）。主治医に報告→「パクリタキセルの累積用量が増えているためCIPNが出やすい」。デュロキセチン追加。' },
        { timestamp: '2026-04-13T09:00:00Z', category: 'medication', title: 'デュロキセチン開始', content: 'デュロキセチン 20mg 開始1週間。足のしびれの強さが7/10→5/10に改善。吐き気（デュロキセチン副作用）が数日あったが収まった。冷感過敏は続くが少し楽。鍼治療の予約も取った。' },
        { timestamp: '2026-04-20T10:00:00Z', category: 'vitals', title: '4回目化学療法後 受診', content: '倦怠感は4回目後の方が少し楽（3回目より短い回復期間）。CA125 28（前回42から低下）。体重 56.5kg（少し回復）。腫瘍科医から「治療効果あり・5回目に進む」と説明。CIPNは4/10 に改善傾向。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, sleep_quality: 4 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 4, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-04-20T10:00:00Z', name: '化学療法モニタリング', findings: 'WBC 3,200, 好中球 1,900, Hb 10.4（軽度貧血）, Plt 18.5万, CA125 28（改善）, Alb 3.8, Cr 0.72' }
      ],
      medications: [
        { timestamp: '2026-02-01T08:00:00Z', name: 'パクリタキセル（化学療法）', notes: '3週毎点滴（卵巣がん標準治療・CIPNリスクあり）' },
        { timestamp: '2026-03-23T08:00:00Z', name: 'アプレピタント（イメンド）', notes: '化学療法前日・当日・翌日（NK1受容体拮抗薬・強力制吐）' },
        { timestamp: '2026-04-06T08:00:00Z', name: 'デュロキセチン（サインバルタ）', notes: '20mg 朝食後（CIPN疼痛・しびれ改善）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    copd: {
      diseases: ['COPD（慢性閉塞性肺疾患）'],
      profile: { age: 68, gender: 'male', height: 165, weight: 62 },
      textEntries: [
        { timestamp: '2026-03-10T08:00:00Z', category: 'symptoms', title: '息切れの悪化', content: '今日は2階まで上がるのがとても辛かった。途中で休憩が必要だった（mMRC 3相当）。SpO2 93%（いつもより低い）。喀痰が増えて少し黄色っぽい。受診日まであと1週間、このまま待っていいか不安。' },
        { timestamp: '2026-03-17T10:00:00Z', category: 'consultation', title: '受診・急性増悪', content: '肺炎ではないが軽度の急性増悪と診断。プレドニゾロン30mg 5日間＋アモキシシリン処方。LAMA/LABA（ウルティブロ）に加えてSABA（サルブタモール）頓服を追加。スパイロ：FEV1 42%（重症）' },
        { timestamp: '2026-03-24T08:00:00Z', category: 'symptoms', title: '増悪改善', content: '喀痰の色が白色に戻った。SpO2 95〜96%（改善）。息切れは mMRC 2 に落ち着いた。プレドニゾロン終了。SABA（頓服）の使用回数：3回/日→0〜1回/日に減少。体重 63kg（増悪中は少し減っていた）。' },
        { timestamp: '2026-03-31T09:00:00Z', category: 'activity', title: '肺リハビリ開始', content: '近くの呼吸器リハビリクリニックに週2回通い始めた。最初はほんの5分歩くのが限界だったが、PT（理学療法士）に指導してもらいながら呼吸法を練習している。「口すぼめ呼吸」で少し楽になった。' },
        { timestamp: '2026-04-07T08:00:00Z', category: 'vitals', title: '肺リハビリ2週間', content: 'リハビリ開始2週間。6分間歩行距離：280m（前回 240m から改善）。SpO2 94〜96%で安定。息切れ mMRC 2 を維持。SABAの頓用なし（この1週間）。体重 63kg で安定。' },
        { timestamp: '2026-04-14T09:00:00Z', category: 'symptoms', title: '喀痰再び増加', content: '3日前から喀痰の量が増えた。色はまだ白色。SpO2 93〜94%に少し低下。発熱なし。SABA 1日2回使用。主治医に電話報告 → 「プレドニゾロン5日間 経口処方する、悪化したら受診」と指示。' },
        { timestamp: '2026-04-21T08:00:00Z', category: 'vitals', title: '受診・定期チェック', content: '増悪は軽度で収まった。FEV1 44%（前回より微改善）。肺リハビリ継続を評価された。禁煙22年目（37歳で禁煙）。在宅酸素療法（HOT）のラインはSpO2 88%が基準と再確認。まだHOT不要。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 6, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 4, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-04-21T10:00:00Z', name: 'COPD定期検査・スパイロメトリー', findings: 'FEV1 44%（重症COPD）, FEV1/FVC 52%, Hb 15.2, CRP 0.4（正常）, SpO2安静時 95%（6分歩行後 88%）' }
      ],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'グリコピロニウム/インダカテロール（ウルティブロ）', notes: '1カプセル 朝（LAMA/LABA配合・長時間作用型吸入）' },
        { timestamp: '2026-03-17T08:00:00Z', name: 'サルブタモール（サルタノール）', notes: '頓用・増悪時（SABA・速効性気管支拡張薬）' }
      ],
      sleepData: [], activityData: [], meals: []
    }
  }
};

// ME/CFS specific default analysis prompt
