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
        { id: 'chronic_pain', name: '慢性疼痛症候群', icd: 'MG30' },
        { id: 'narcolepsy', name: 'ナルコレプシー・特発性過眠症', icd: 'G47.4' },
        { id: 'phn', name: '帯状疱疹後神経痛（PHN）', icd: '8B11' }
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
        { id: 'dissociative', name: '解離性障害', icd: '6B6' },
        { id: 'panic', name: 'パニック障害', icd: 'F41.0' }
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
        { id: 'psoriasis', name: '乾癬（尋常性・関節症性）', icd: 'L40' },
        { id: 'immunodeficiency', name: '免疫不全症', icd: '4A0' },
        { id: 'allergy', name: 'アレルギー疾患', icd: '4A8' },
        { id: 'allergic_rhinitis', name: 'アレルギー性鼻炎・花粉症', icd: 'CA08' },
        { id: 'chronic_urticaria', name: '慢性蕁麻疹', icd: 'L50.1' },
        { id: 'dry_eye', name: 'ドライアイ（乾性角結膜炎）', icd: 'H04.1' },
        { id: 'alopecia', name: '円形脱毛症（AA）', icd: 'EE40' },
        { id: 'vitiligo', name: '白斑（尋常性白斑）', icd: 'EE60' }
      ]
    },
    {
      id: 'reproductive',
      name: '生殖器・泌尿器疾患',
      icon: '🌺',
      icd: 'ICD-11: 16-17',
      diseases: [
        { id: 'endometriosis', name: '子宮内膜症', icd: 'GA10' },
        { id: 'pcos', name: '多嚢胞性卵巣症候群（PCOS）', icd: 'GA30' },
        { id: 'menopause', name: '更年期障害', icd: 'GA30' },
        { id: 'pms_pmdd', name: 'PMS・PMDD（月経前症候群）', icd: 'GA34' },
        { id: 'overactive_bladder', name: '過活動膀胱（OAB）', icd: 'MF44' },
        { id: 'tinnitus', name: '耳鳴り・感音性難聴', icd: 'H93.1' },
        { id: 'vertigo', name: 'めまい・BPPV・メニエール病', icd: 'H81' },
        { id: 'chronic_prostatitis', name: '慢性前立腺炎（CP/CPPS）', icd: 'N41.1' },
        { id: 'interstitial_cystitis', name: '間質性膀胱炎（IC・膀胱痛症候群）', icd: 'MF55' },
        { id: 'loh', name: '男性更年期障害（LOH症候群）', icd: 'MA13' },
        { id: 'bph', name: '前立腺肥大症（BPH）', icd: 'GA90' }
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
        { id: 'hyperthyroidism', name: '甲状腺機能亢進症・バセドウ病', icd: 'E05' },
        { id: 'adrenal', name: '副腎機能不全', icd: '5A70' },
        { id: 'metabolic_syndrome', name: 'メタボリックシンドローム', icd: '5B81' },
        { id: 'obesity', name: '肥満症', icd: '5B81' },
        { id: 'gout', name: '痛風・高尿酸血症', icd: 'FA25' },
        { id: 'osteoporosis', name: '骨粗鬆症', icd: 'FB83' },
        { id: 'anemia', name: '鉄欠乏性貧血・慢性疾患性貧血', icd: 'D50' }
      ]
    },
    {
      id: 'cardiovascular',
      name: '循環器疾患',
      icon: '❤️',
      icd: 'ICD-11: 11',
      diseases: [
        { id: 'hypertension', name: '高血圧症', icd: 'BA00' },
        { id: 'hyperlipidemia', name: '脂質異常症', icd: 'E78' },
        { id: 'heart_failure', name: '心不全', icd: 'BD10' },
        { id: 'arrhythmia', name: '不整脈', icd: 'BC6' },
        { id: 'ihd', name: '虚血性心疾患', icd: 'BA80' },
        { id: 'dvt', name: '深部静脈血栓症', icd: 'BD40' },
        { id: 'raynauds', name: 'レイノー症候群', icd: 'BD30' },
        { id: 'atrial_fibrillation', name: '心房細動（AFib）', icd: 'I48' },
        { id: 'stroke', name: '脳卒中後遺症（脳梗塞・脳出血後）', icd: '8B20' }
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
        { id: 'gastroparesis', name: '胃不全麻痺', icd: 'DA44' },
        { id: 'ulcerative_colitis', name: '潰瘍性大腸炎（UC）', icd: 'K51' },
        { id: 'functional_dyspepsia', name: '機能性ディスペプシア（FD）', icd: 'DA45' },
        { id: 'chronic_pancreatitis', name: '慢性膵炎（慢性膵臓炎）', icd: 'DC31' },
        { id: 'constipation', name: '慢性便秘症', icd: 'DD91' }
      ]
    },
    {
      id: 'connective',
      name: '筋骨格・結合組織疾患',
      icon: '🦴',
      icd: 'ICD-11: 15',
      diseases: [
        { id: 'eds', name: 'EDS（エーラス・ダンロス症候群）', icd: 'LD28' },
        { id: 'hsd', name: '関節過可動症スペクトラム障害（HSD）', icd: 'FA93' },
        { id: 'ankylosing_spondylitis', name: '強直性脊椎炎（体軸性脊椎関節炎）', icd: 'M45' },
        { id: 'osteoarthritis', name: '変形性関節症（OA）', icd: 'M15' },
        { id: 'myasthenia', name: '重症筋無力症', icd: '8C60' },
        { id: 'polymyalgia', name: 'リウマチ性多発筋痛症', icd: 'FA21' },
        { id: 'chronic_back_pain', name: '慢性腰痛症', icd: 'ME84' },
        { id: 'behcet', name: 'ベーチェット病', icd: '4A44.00' },
        { id: 'dermatomyositis', name: '多発性筋炎・皮膚筋炎（IIM）', icd: 'L94.0' },
        { id: 'ssc', name: '全身性強皮症（SSc）', icd: 'LD50' },
        { id: 'nmosd', name: '視神経脊髄炎スペクトラム障害（NMOSD）', icd: '8A42' },
        { id: 'spinal_stenosis', name: '脊柱管狭窄症（腰部・頸部）', icd: 'FA88' }
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
        { id: 'chemo_side', name: '化学療法後遺症', icd: 'NE61' },
        { id: 'lymphedema', name: 'リンパ浮腫（続発性・がん治療後）', icd: 'BA96' }
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
    hyperlipidemia:     { world:   500_000_000, label: '約 5 億人（推計）', tier: 1, density: 'medium', source: '成人推計',
                          japan: 22_000_000, japanLabel: '約 2,200 万人',      japanSource: '国民健康栄養調査' },
    anemia:             { world: 2_000_000_000, label: '約 20 億人',      tier: 1, density: 'high',   source: 'WHO 全年齢',
                          japan: 15_000_000, japanLabel: '約 1,500 万人（推計）', japanSource: 'WHO・国内推計' },
    allergic_rhinitis:  { world: 1_000_000_000, label: '約 10 億人',      tier: 1, density: 'medium', source: 'WHO成人・小児',
                          japan: 42_000_000, japanLabel: '約 4,200 万人（花粉症含む）', japanSource: '環境省・日本アレルギー学会' },
    psoriasis:          { world:   125_000_000, label: '約 1.25 億人',    tier: 2, density: 'medium', source: 'WHO 2016',
                          japan:      430_000, japanLabel: '約 43 万人',           japanSource: '日本皮膚科学会' },
    chronic_urticaria:  { world:    75_000_000, label: '約 7,500 万人',   tier: 2, density: 'medium', source: '世界人口の約1%',
                          japan:     1_500_000, japanLabel: '約 150 万人',          japanSource: '国内推計' },
    pms_pmdd:           { world: 1_800_000_000, label: '月経女性の 70〜80%', tier: 1, density: 'high', source: 'WHO 世界推計',
                          japan:  22_000_000, japanLabel: '約 2,200 万人（推計）', japanSource: '国内有病率推計' },
    overactive_bladder: { world:   500_000_000, label: '約 5 億人',       tier: 1, density: 'medium', source: '世界推計 40歳以上',
                          japan:  10_800_000, japanLabel: '約 1,080 万人',         japanSource: '日本排尿機能学会' },
    tinnitus:           { world:   748_000_000, label: '約 7.5 億人',     tier: 1, density: 'medium', source: '世界推計',
                          japan:  30_000_000, japanLabel: '約 3,000 万人（成人の約30%）', japanSource: '国内推計' },
    vertigo:            { world:   300_000_000, label: '約 3 億人（推計）', tier: 2, density: 'medium', source: '成人推計',
                          japan:  15_000_000, japanLabel: '約 1,500 万人（推計）', japanSource: '国内推計' },
    dry_eye:            { world: 1_000_000_000, label: '約 10 億人',       tier: 2, density: 'high',   source: '世界推計（診断基準差あり）',
                          japan:  22_000_000, japanLabel: '約 2,200 万人',         japanSource: '日本涙液学会' },
    chronic_prostatitis:{ world:    50_000_000, label: '約 5,000 万人（推計）', tier: 2, density: 'low', source: '男性成人 5〜10%',
                          japan:   3_000_000, japanLabel: '約 300 万人（推計）',   japanSource: '国内推計' },
    ulcerative_colitis: { world:    10_000_000, label: '約 1,000 万人',         tier: 2, density: 'medium', source: '世界推計（西洋・日本に多い）',
                          japan:    230_000, japanLabel: '約 23 万人（指定難病）', japanSource: '厚生労働省 2022年' },
    panic:              { world:   240_000_000, label: '約 2.4 億人',           tier: 1, density: 'high',   source: '生涯有病率 3〜4%',
                          japan:   2_400_000, japanLabel: '約 240 万人（推計）',  japanSource: '日本精神神経学会' },
    ankylosing_spondylitis: { world: 23_800_000, label: '約 2,380 万人',         tier: 1, density: 'low',    source: 'GBD 2019 axSpA推計',
                          japan:    50_000, japanLabel: '約 5 万人（推計）',       japanSource: '国内推計（指定難病）' },
    hyperthyroidism:    { world:   200_000_000, label: '約 2 億人',              tier: 2, density: 'medium',  source: '甲状腺機能亢進症全体推計',
                          japan:   1_000_000, japanLabel: '約 60〜100 万人',      japanSource: '日本甲状腺学会' },
    narcolepsy:         { world:     3_000_000, label: '約 300 万人（推計）',     tier: 2, density: 'low',    source: '有病率 0.025〜0.05%',
                          japan:    20_000, japanLabel: '約 2 万人（指定難病）',   japanSource: '厚生労働省' },
    osteoarthritis:     { world: 528_000_000,   label: '約 5 億 2,800 万人',     tier: 1, density: 'high',   source: 'GBD 2019',
                          japan:  25_300_000, japanLabel: '約 2,530 万人（変形性膝関節症）', japanSource: '日本整形外科学会' },
    atrial_fibrillation: { world:  59_700_000,  label: '約 5,970 万人',          tier: 1, density: 'high',   source: 'GBD 2019',
                          japan:   1_000_000, japanLabel: '約 100 万人',          japanSource: '日本循環器学会' },
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
    chronic_back_pain:  { world: 619_000_000, label: '約 6.2 億人 (GBD 2020)',    tier: 2, density: 'medium', source: 'GBD Study 2020',
                          japan: 28_000_000, japanLabel: '約 2,800 万人',          japanSource: '日本整形外科学会推計' },
    behcet:             { world:    300_000, label: '約 30 万人 (推計)',            tier: 2, density: 'medium', source: 'Silk Road 分布',
                          japan:     20_000, japanLabel: '約 2 万人',              japanSource: '難病情報センター（指定難病第56号）' },
    dermatomyositis:    { world:    150_000, label: '約 15 万人 (推計)',            tier: 2, density: 'medium', source: '10万人に 1〜2 人',
                          japan:      25_000, japanLabel: '約 2.5 万人',            japanSource: '難病情報センター（指定難病第50・51号）' },
    ssc:                { world:  2_500_000, label: '約 250 万人 (推計)',           tier: 2, density: 'medium', source: '10万人に 24〜300 人',
                          japan:     50_000, japanLabel: '約 5 万人',              japanSource: '難病情報センター（指定難病第51号）' },
    nmosd:              { world:    350_000, label: '約 35 万人 (推計)',            tier: 2, density: 'medium', source: '10万人に 0.52〜4.4 人',
                          japan:       4_500, japanLabel: '約 4,500 人',            japanSource: '難病情報センター（指定難病第131号）' },
    spinal_stenosis:    { world:  500_000_000, label: '約 5 億人 (推計)',           tier: 2, density: 'medium', source: '腰部・頸部脊柱管狭窄症合計推計',
                          japan:   3_600_000, japanLabel: '約 360 万人',            japanSource: '日本整形外科学会推計' },
    functional_dyspepsia: { world: 800_000_000, label: '約 8 億人 (推計)',          tier: 2, density: 'medium', source: '世界有病率 約10%',
                          japan:  13_000_000, japanLabel: '約 1,300 万人',          japanSource: '日本消化器病学会推計' },
    interstitial_cystitis: { world: 10_000_000, label: '約 1,000 万人 (推計)',      tier: 2, density: 'high',   source: '世界有病率推計',
                          japan:      50_000, japanLabel: '約 5 万人',              japanSource: '厚労省推計' },
    loh:                { world:  200_000_000, label: '約 2 億人 (推計)',            tier: 2, density: 'medium', source: '40歳以上男性の 20〜30%',
                          japan:   6_000_000, japanLabel: '約 600 万人',            japanSource: '日本Men\'s Health医学会推計' },
    alopecia:           { world:  200_000_000, label: '約 2 億人 (推計)',            tier: 2, density: 'medium', source: '生涯有病率 約 2% (世界人口比)',
                          japan:   2_000_000, japanLabel: '約 200 万人',            japanSource: '日本皮膚科学会推計（生涯有病率 2%）' },
    phn:                { world:  100_000_000, label: '約 1 億人 (推計)',            tier: 2, density: 'high',   source: '帯状疱疹患者の 20〜30% が PHN 移行',
                          japan:     500_000, japanLabel: '年間約 50 万人発症',    japanSource: '帯状疱疹：年間100万人・PHN移行率20〜30%' },
    chronic_pancreatitis: { world: 10_000_000, label: '約 1,000 万人 (推計)',       tier: 2, density: 'high',   source: '人口 10 万人に 10〜50 人',
                          japan:      66_000, japanLabel: '約 6.6 万人',            japanSource: '日本膵臓学会全国調査' },
    lymphedema:         { world:  250_000_000, label: '約 2.5 億人 (推計)',          tier: 2, density: 'high',   source: 'がん治療後・フィラリア等含む世界推計',
                          japan:     300_000, japanLabel: '約 30 万人以上',         japanSource: '日本リンパ浮腫学会推計' },
    stroke:             { world:   80_000_000, label: '約 8,000 万人 (推計)',         tier: 2, density: 'high',   source: '脳卒中後遺症患者世界推計',
                          japan:   1_740_000, japanLabel: '約 174 万人',            japanSource: '厚生労働省患者調査 2020年' },
    bph:                { world:  630_000_000, label: '約 6.3 億人 (推計)',           tier: 2, density: 'medium', source: '60歳以上男性の約60%外挿',
                          japan:   5_300_000, japanLabel: '約 530 万人',            japanSource: '日本泌尿器科学会推計' },
    vitiligo:           { world:  200_000_000, label: '約 2 億人 (推計)',             tier: 2, density: 'medium', source: '生涯有病率 1〜2% (世界人口比)',
                          japan:   2_000_000, japanLabel: '約 200 万人',            japanSource: '日本皮膚科学会推計（有病率約 1〜2%）' },
    constipation:       { world: 1_000_000_000, label: '約 10 億人 (推計)',          tier: 2, density: 'medium', source: '世界有病率 14〜16% メタ解析外挿',
                          japan:  15_000_000, japanLabel: '約 1,500 万人',          japanSource: '日本消化器病学会推計（有病率 14〜16%）' },
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
    gerd: [
      '夕食後1時間ほどで胸焼けが始まる。横になると逆流感がひどく、昨夜も寝付けなかった。PPI（ラベプラゾール）を飲んでいるが、食後に飲んでいた。',
      '朝起きたときに口の中が酸っぱい。のどに何か引っかかる感じが続いている。食後すぐ横になるのが癖になっていた。食事と就寝の間隔を記録したい。'
    ],
    thyroid_hypo: [
      'チラージン（レボチロキシン）50μgを服用中。TSHは1.8で正常範囲内だが、まだ疲労感と冷えが取れない。朝起きるのが特につらく、体重が増え続けている。FT3も測ってほしいと思っている。',
      '甲状腺摘出後から毎日チラージンを飲んでいる。最近便秘がひどくなってきた。薬の飲み忘れを防ぐために記録したい。髪の毛も抜けやすくなってきた気がする。'
    ],
    nafld: [
      '健診でALTが68、γ-GTPが82と高く「脂肪肝」と言われた。BMI 27、お腹まわりが気になっている。食事改善を始めたいが何から手をつけていいかわからない。FIB-4スコアを記録したい。',
      '脂肪肝と診断されて3ヶ月。体重を4kg落としたらALTが68→42に改善してきた。地中海食を試している。清涼飲料水をやめて効果があった気がする。次の採血まで記録を続けたい。'
    ],
    cptsd: [
      '些細なことで感情が爆発してしまう。仕事でちょっと強めに言われただけでフラッシュバックが来る。昨夜も悪夢で目が覚めた。EMDRを始めたが、セッション後に疲弊する。記録を続けたい。',
      '人を信頼できない。少し親しくなると突然怖くなって距離を置いてしまう。「自分は壊れている」という気持ちが消えない。グラウンディングを練習中。感情の波のパターンを記録したい。'
    ],
    als: [
      'ALSFRS-R 今月 38点（先月 41点）。右手の筋力低下が進み、箸からスプーンに変えた。リルゾールを服用中。FVC 74%。来月の受診前に症状の変化を整理して主治医に伝えたい。',
      '球麻痺型。発話が聞き取りにくくなってきた。音声銀行の録音を急いでいる。嚥下はまだ問題ない。VOCA の練習を始めた。エダラボン点滴を月1回受けている。'
    ],
    neuropathy: [
      '両足の裏のしびれが続いている。糖尿病で15年。HbA1c 8.2%。プレガバリン75mgを飲み始めたが、眠気が強い。しびれの程度を毎日記録して主治医に見せたい。',
      '大腸がんの抗がん剤（オキサリプラチン）治療後から手足のしびれが続いている。冷たいものを触ると激しく痛む。治療終了から8ヶ月経つが改善しない。痛みの記録を続けたい。'
    ],
    cancer_survivor: [
      '乳がん手術から2年。タモキシフェンを毎日飲んでいる。CEAは正常範囲だが、検査の前後はいつも再発が怖くて眠れない。定期検査の結果を記録して、変化があったらわかるようにしたい。',
      '大腸がん術後1年。抗がん剤後のしびれが残っている。ケモブレインで仕事の集中力が落ちている。次の CT まであと2ヶ月。フォローアップスケジュールと症状を記録したい。'
    ],
    metabolic_syndrome: [
      '健診でメタボと言われた。腹囲 91cm・中性脂肪 189mg/dL・血圧 138/88。医師に「生活習慣を改善して」と言われたが、具体的に何から始めていいかわからない。腹囲と血圧を毎日記録して変化を追いたい。',
      '2型糖尿病の手前（空腹時血糖 107mg/dL）でメタボ判定。GLP-1の注射を開始して1ヶ月。体重が 3kg 減ったが、中性脂肪はまだ高い。血糖・体重・食事をまとめて記録して、次の受診に備えたい。'
    ],
    dysautonomia: [
      '立ち上がると頭がぼーっとして、ひどいときは倒れそうになる。起立性低血圧と言われた。朝は特に症状が強い。フロリネフを服用中だが、血圧の変動を毎日記録して主治医に報告したい。',
      '自律神経失調症と診断されて3年。動悸・めまい・胃腸の不調・発汗異常が重なって日常生活がつらい。検査では「異常なし」と言われることが多くて悔しい。症状パターンを記録して根拠を持って受診したい。'
    ],
    diabetes_t1: [
      '1型糖尿病で10年。フリースタイルリブレを使っている。低血糖が怖くて夜中に何度も目が覚める。HbA1c 7.2%だが食後血糖スパイクが気になる。CGMデータと食事・インスリン量を記録して次の受診で相談したい。',
      '先月1型糖尿病と診断された。まだインスリン量の調整に戸惑っている。カーボカウントの練習中。低血糖になるのが怖い。毎日の血糖・食事・インスリン量を記録して主治医に見せたい。'
    ],
    obesity: [
      '肥満症の診断を受けた（BMI 31、高血圧・NAFLD合併）。ウゴービ（セマグルチド）を始めて2ヶ月。4kg減ったが食欲が戻ってきた気がする。体重・食事・活動量を毎日記録して変化を管理したい。',
      'BMI 38で高度肥満症。2型糖尿病・睡眠時無呼吸を合併。スリーブ胃切除術を検討中。術前の記録として体重・血糖・血圧の変化を残しておきたい。甘いものへの依存をなんとかしたい。'
    ],
    adrenal: [
      '副腎機能不全でヒドロコルチゾン 20mg/日を服用中。発熱のたびにシックデイルールで倍量にするのが不安。副腎クリーゼを1回経験した。ホルモン補充量と症状の記録を続けたい。',
      'アジソン病と診断されて2年。ヒドロコルチゾン＋フロリネフ服用中。倦怠感と低血圧が続いていて、用量が適切かどうか次の受診で確認したい。シックデイの判断が難しく、記録で証拠を残したい。'
    ],
    celiac: [
      'セリアック病と診断されてグルテンフリー生活を始めて3ヶ月。外食で隠れグルテンを摂取してしまい腹痛が続いた。抗tTG-IgA抗体がまだ高い。食事日記と症状を記録して抗体値の改善を確認したい。',
      'セリアック病（小麦アレルギーではなく自己免疫疾患）。乾癬・橋本病も合併している。グルテンフリーを徹底しているつもりだが腹部症状がなくならない。交差汚染のリスクを記録して原因を特定したい。'
    ],
    polymyalgia: [
      'リウマチ性多発筋痛症（PMR）でプレドニゾロン 15mg から治療開始。肩・首・腰の朝のこわばりが著明に改善した。CRP・ESR を毎回記録して薬の減量タイミングを主治医と相談したい。',
      'PMR と診断されて8ヶ月。プレドニゾロンを 5mg まで減量した段階で症状が再燃した。ステロイドを長期服用しているため骨粗鬆症の予防薬も飲んでいる。症状と薬の記録を続けたい。'
    ],
    substance: [
      'アルコール依存症の治療中。断酒3ヶ月目。AA（アルコホーリクス・アノニマス）に週3回参加している。アカンプロサートを服用中。渇望が強い日・弱い日のパターンを記録して、主治医と次回の受診に備えたい。',
      '覚醒剤依存で3年ぶりの断薬を継続中。DARC でのプログラムに参加している。再使用の引き金（特定の人・場所・感情）を記録して回復を継続したい。断薬日数を記録することが自信になっている。'
    ],
    raynauds: [
      'レイノー症候群と診断されて2年。冬は毎日のように発作が起きる。ニフェジピン20mgを服用しているが、手袋をしていても発作が起きる。発作の回数・状況・外気温を記録して、主治医に相談したい。',
      '強皮症（SSc）合併のレイノー現象。指先に潰瘍が繰り返し出来て困っている。プロスタサイクリン点滴を年2回受けている。Ca拮抗薬＋シルデナフィルを内服中。発作と潰瘍の状態を記録して治療効果を評価したい。'
    ],
    tbi: [
      '交通事故による外傷性脳損傷から9ヶ月。身体的な傷は治ったが、記憶が定着しにくく、同時に2つのことができなくなった。神経心理士のリハビリを週2回受けている。頭痛・疲労・認知機能の変化を記録して主治医に報告したい。',
      'スポーツ中の脳震盪を繰り返してから、頭痛と集中力の低下が続く。CTE（慢性外傷性脳症）が心配。現在は休養とグラデーション復帰プロトコルを実行中。症状と活動量の記録でセーフリターン時期を判断したい。'
    ],
    dissociative: [
      '解離性同一性障害（DID）の治療中。複数の人格状態がある。解離エピソードが起きた時刻・状況・前後の記憶を記録して、主治医とのセッションに役立てたい。記録は回復のため、自分を責めるためではない。',
      '離人感・現実感消失症（DPDR）と診断されて1年。自分の体が遠く感じる時間が1日に何度もある。ストレスや睡眠不足が引き金になるようだ。誘発因子と症状の強さを記録して治療効果を評価したい。'
    ],
    immunodeficiency: [
      '普通変異型免疫不全症（CVID）と診断。月1回の静脈注射免疫グロブリン（IVIG）を受けている。毎年肺炎を繰り返していたが、治療開始後は感染症が減った。IgG値と感染症の記録を続けて次回の受診に備えたい。',
      'IgA欠乏症と診断。重篤な症状はないが、風邪や胃腸炎を繰り返す。指定難病の申請をした。感染症のたびに症状・診断・治療を記録して主治医に正確に伝えたい。'
    ],
    chemo_side: [
      '乳がんの術後補助化学療法（TC療法）を受けている。3週ごとに4サイクル。倦怠感・嘔気・脱毛がつらい。白血球が下がる時期（day8〜12）が特に体調が悪い。副作用のパターンを記録して次のサイクルに備えたい。',
      '非小細胞肺がんでニボルマブ（免疫チェックポイント阻害薬）の治療中。甲状腺機能低下症（irAE）が出てレボチロキシンを追加した。新たなirAEの出現を早期に記録して、主治医に迅速に報告したい。'
    ],
    hsd: [
      '関節過可動症スペクトラム障害（HSD）と診断されて2年。毎日のように関節が亜脱臼する。腰・膝・肩が特につらい。POTS（体位性頻脈）も合併。物理療法（PT）を週1回受けている。関節の状況とPOTS症状を記録して主治医に報告したい。',
      'hEDS（過可動型EDS）の確定診断。ベイトン基準9/9。慢性的な疼痛と関節不安定性が日常生活を制限している。低強度の筋力トレーニングで症状が改善してきた。活動量と疼痛・疲労のバランスを記録したい。'
    ],
    mold: [
      '築30年のマンションに住んでいる。2年前から倦怠感・頭痛・集中力低下が続き、複数の病院を回ったが原因不明と言われた。最近、浴室と押し入れのカビを業者に除去してもらったら少し症状が改善した気がする。環境と症状の相関を記録したい。',
      'CIRS（慢性炎症性応答症候群）の診断を受けた。室内空気質検査でERMI指数が高値だった。現在引越しを検討中。引越し前後で症状がどう変わるか記録して、カビ毒曝露との因果関係を確かめたい。'
    ],
    emf: [
      'スマートフォンやWi-Fiの近くにいると頭痛・集中力の低下・皮膚のピリピリ感が出る気がする。電磁波過敏症かもしれない。症状と環境（場所・使用デバイス・時間帯）を記録して、パターンを把握したい。',
      '電磁波過敏症と自己診断して生活を大きく制限している。スマートフォンを持てず、仕事にも影響が出ている。主治医に症状を正確に伝えるため、症状と生活状況を記録したい。'
    ],
    chronic_back_pain: [
      '慢性腰痛で整形外科に通って3年。椎間板ヘルニア（L4/L5）と診断されている。NSAIDsとリリカを服用中。雨の日と長時間座った後が特に辛い。痛みの強度と誘発因子を記録して、主治医に状態の変化を正確に伝えたい。',
      '腰部脊柱管狭窄症と診断。歩くと脚がしびれてくる（神経性間欠性跛行）。プレガバリンを服用中。手術は今のところ避けたい。歩行可能距離と痛みのパターンを記録して、次のブロック注射の効果を評価したい。'
    ],
    behcet: [
      'ベーチェット病と診断されて5年。口腔内潰瘍が毎月繰り返し、目の炎症（ぶどう膜炎）も2回経験した。コルヒチンとアザチオプリンを服用中。潰瘍の頻度・大きさ・誘発因子を記録して、次回の受診に備えたい。',
      '神経ベーチェット（神経型）と診断。めまい・頭痛・認知機能の変化が出てきた。シクロスポリンとプレドニゾロンで治療中。症状の日変動と薬の効果を記録して主治医に報告したい。'
    ],
    dermatomyositis: [
      '皮膚筋炎（DM）と診断されて1年。ヘリオトロープ疹・ゴットロン徴候・近位筋力低下が主な症状。プレドニゾロン + タクロリムスで治療中。間質性肺炎の合併も指摘されている。筋力・皮膚症状・SpO2を記録したい。',
      '抗MDA5抗体陽性の皮膚筋炎。急速進行性間質性肺炎のリスクが高いと言われた。シクロホスファミドパルスを受けている。呼吸状態と皮膚症状の変化を毎日記録して、急性増悪の早期発見に役立てたい。'
    ],
    ssc: [
      '全身性強皮症（SSc）の診断を受けて3年。レイノー症候群から始まり、指先の皮膚が硬くなってきた。肺の間質性肺炎も合併。ボセンタンとニフェジピンを服用している。指先の潰瘍とSpO2を毎日記録して変化を把握したい。',
      '抗セントロメア抗体陽性の限局性強皮症（ISSc）。主にレイノー現象と手指の硬化が症状。肺高血圧症の合併が心配。毎年の肺機能検査・右心カテーテルを受けている。症状の変化を記録して年1回の検査に備えたい。'
    ],
    nmosd: [
      '視神経脊髄炎スペクトラム障害（NMOSD）と診断されてイネビリズマブを月1回投与している。以前多発性硬化症と誤診されていた。再発の早期発見のために、視力変化・脊髄症状（手足のしびれ・排尿障害）を毎日記録したい。',
      '抗AQP4抗体陽性のNMOSD。視神経炎を2回経験して左眼の視力が低下した。現在サトラリズマブで再発予防中。再発の前触れとなる症状（Uhthoff現象・Lhermitte徴候）を日記に記録している。'
    ],
    spinal_stenosis: [
      '腰部脊柱管狭窄症と診断されて1年。歩くと右足がしびれて200m以上歩けない。少し前屈みになると楽になる。プロスタグランジンE1とNSAIDsを服用中。手術を避けたいので、歩行距離としびれを記録して保存療法の効果を確かめたい。',
      '頸部脊柱管狭窄症。手指のしびれと巧緻運動障害（ボタンが留めにくい）が主な症状。MRIで脊髄圧迫があると言われている。神経ブロックと理学療法を受けている。首の痛みと手指の動きを毎日記録して担当医に報告したい。'
    ],
    functional_dyspepsia: [
      '機能性ディスペプシア（FD）と診断されて2年。食後の胃もたれと早期満腹感が主な悩み。ピロリ菌除菌後も症状が続いている。六君子湯とモサプリドを服用中。何を食べると悪化するか食事日誌をつけて担当医に見せたい。',
      '食後にみぞおちが痛くて眠れない夜がある。内視鏡では異常なし。ストレスが多い職場環境。FDと診断されてPPIをもらったが効きが不十分。症状と食事・ストレスレベルの関係を記録して治療に役立てたい。'
    ],
    interstitial_cystitis: [
      '間質性膀胱炎と診断されて3年。1日30回以上のトイレ、膀胱が張ると激しい痛みが出る。ペントサンポリサルフェートとアミトリプチリンを服用中。食事でトリガーになるものを特定するために排尿日誌と食事記録をつけている。',
      'ハンナ型間質性膀胱炎。膀胱水圧拡張術を半年ごとに受けている。手術後2〜3ヶ月は症状が楽になるが、またぶり返す。夜間頻尿で睡眠が取れずQOLが著しく低下。症状の波と治療タイミングを記録して最適化したい。'
    ],
    loh: [
      '50代から倦怠感・気力の低下・性欲の減退が続いている。テストステロン検査で「低値」と言われた。LOH症候群（男性更年期障害）と診断。テストステロン補充療法（筋注）を始めて2ヶ月経つ。AMSスコアと体力の変化を記録して治療効果を確かめたい。',
      '45歳・男性。仕事のストレスが増えてからイライラ・不眠・集中力の低下が続く。うつかと思ったが、テストステロンが低かった。生活習慣改善（筋トレ・禁酒・睡眠改善）を始めたところ。気力・睡眠・体力の変化を毎日記録している。'
    ],
    alopecia: [
      '半年前から頭頂部に500円玉大の円形脱毛が3ヶ所できた。皮膚科でステロイド局注（3ヶ月）を受けたが改善が不十分。バリシチニブ（JAK阻害薬）を開始して1ヶ月経つ。脱毛範囲の変化と新しい産毛の出現を写真記録で管理したい。',
      '全頭型の円形脱毛症（AA）で全頭の毛が抜けている。橋本病も合併している。ウィッグを使いながら治療を続けている。DNCB（接触免疫療法）を月1回受けている。精神的に辛いが記録をつけることで治療を継続できている。'
    ],
    phn: [
      '帯状疱疹が治ってから3ヶ月以上経つが、左胸部の灼熱痛が消えない。服が皮膚に触れただけで激痛（アロディニア）があり、外出がつらい。プレガバリンとデュロキセチンを服用中。痛みの強さをNRSで毎日記録して主治医に見せている。',
      '71歳。帯状疱疹が右顔面に出た後、顔の痛みが半年以上続いている。眼帯状疱疹だったので右眼の視力が少し低下した。リドカインテープと三環系抗うつ薬を使用中。朝の痛みと夕方の痛みの違いを記録して薬の効果を確認している。'
    ],
    chronic_pancreatitis: [
      '10年間の多量飲酒が原因の慢性膵炎。禁酒して2年経つ。今でも食後に上腹部〜背中の痛みが出る。膵消化酵素薬（リパーゼ）とプレガバリンを服用中。脂肪便の有無・腹痛の記録を毎日つけて定期受診時に見せている。',
      '自己免疫性膵炎（IgG4関連）と診断されてステロイドを服用中。現在は膵炎の活動は落ち着いているが、膵外分泌不全が残っていて脂肪便が続く。体重が減りやすいので食事量・体重・血糖を毎日記録している。'
    ],
    lymphedema: [
      '乳がん手術（右乳房切除術＋腋窩リンパ節郭清）から1年。右腕がむくんでリンパ浮腫と診断された。弾性スリーブを毎日使用し、用手リンパドレナージを週2回受けている。腕の周径を毎週測定して浮腫の変化を記録している。',
      '子宮頸がんの治療（手術＋放射線）後に両足のリンパ浮腫が出た。弾性ストッキングが欠かせない。蜂窩織炎を2回経験したので感染の早期サインに注意している。浮腫の変化と皮膚の状態を毎日記録してセラピストとの連携に役立てている。'
    ],
    stroke: [
      '脳梗塞（左中大脳動脈領域）後3ヶ月。右手足の麻痺と失語症がある。毎日リハビリ（PT・OT・ST各30分）に通っている。mRS 3。歩行可能距離と言葉の出やすさを毎日記録してリハビリの進歩を確認したい。',
      '脳出血から半年。左手の巧緻障害が残り、箸が使いにくい。抗血小板薬（アスピリン）と降圧薬を服用中。再発予防のために血圧を毎日記録している。PT・OTは週2回で継続中。'
    ],
    bph: [
      '頻尿・夜間頻尿（夜3回）・残尿感で泌尿器科を受診。IPSS 19点（重症）。タムスロシン0.2mgを開始して3週間。排尿の勢いが少し改善した気がする。毎日の排尿回数と夜間排尿回数を記録して主治医に報告したい。',
      '前立腺肥大症でシロドシン服用中。射精障害の副作用が出ている。PSA 3.8 ng/mL。前立腺がんとの鑑別のため半年後に再検査予定。排尿症状スコアと副作用を記録して次回受診に備えたい。'
    ],
    vitiligo: [
      '白斑と診断されて2年。顔・首・手背に脱色素斑がある。PUVA療法を週2回受けているが効果はゆっくり。日焼けが怖くて外出時は日焼け止めが欠かせない。SALT スコアの変化を記録して治療効果を追いたい。',
      '尋常性白斑でルキソリチニブクリーム（ruxolitinib）の塗布を開始して2ヶ月。左頬の白斑が少し色素が戻ってきた。橋本病も合併しているのでTSHも管理している。白斑の広がりと色素再生を毎日写真で記録している。'
    ],
    constipation: [
      '慢性便秘症で週1〜2回しか排便がない。ブリストル便形状スコアは1〜2。酸化マグネシウムを飲んでいるが効果が不十分。排便回数・便形状・腹部症状を毎日記録して主治医に改善を相談したい。',
      '過敏性腸症候群（便秘型）で下剤を飲み続けているが、繰り返し便秘になる。リナクロチドを追加して1ヶ月。お腹の張りと排便のパターンを記録して薬の調整に役立てたい。'
    ],
    mcs: [
      '化学物質過敏症（MCS）と診断されて5年。香水・消臭剤・排気ガスで頭痛・めまい・息苦しさが出る。外出が難しくなり引きこもり気味。曝露した化学物質と症状を記録して、回避する品目を特定したい。',
      'シックハウス症候群・MCSで自宅をオーガニック素材にリフォームした。新しい環境に変えてから症状が60%改善した気がする。どの化学物質が最も影響するかを引き続き記録して、生活改善を続けたい。'
    ],
    lyme: [
      'ライム病と診断されてドキシサイクリンを3週間服用した。抗菌薬終了後も疲労・関節痛・ブレインフォグが続いている。PTLDS（治療後ライム病症候群）と言われた。症状の波と生活への影響を記録して専門医に相談したい。',
      '山歩き後にマダニに咬まれ、遊走性紅斑が出た。ライム病と診断。アモキシシリンを21日間服用中。治療効果と症状の変化を毎日記録して完治を目指したい。倦怠感と関節痛が主な症状。'
    ],
    dvt: [
      '下肢の深部静脈血栓症と診断されてリバーロキサバン（イグザレルト）を服用中。右足の腫脹はかなり改善したが、弾性ストッキングをずっと履かないといけない。3ヶ月後まで薬を続ける予定。次の超音波検査まで症状を記録したい。',
      '卵巣がんの治療中にDVTを発症。低分子ヘパリン（クレキサン）を毎日自己注射している。がんが活動している限り抗凝固療法を続けると言われた。注射部位の記録と Dダイマーの値を管理したい。'
    ],
    eating: [
      '神経性過食症（BN）の治療中。CBT-Eを週1回受けている。過食→嘔吐のサイクルを記録して、主治医と治療の効果を確認したい。誘因（ストレス・孤独感）と気分を記録することが治療の一環。記録は回復のため、制限のためではない。',
      '拒食症から回復中。再栄養後、体重は安定してきたが、食事への恐怖はまだある。治療チームとの共有用に食事と気分を記録したい。食べられた記録を残すことが回復の証明になる。'
    ],
    sibo: [
      'IBS-D と言われて3年。低FODMAP食を試したが改善が不十分で、SIBO の呼気検査（水素型陽性）を受けた。リファキシミン治療を終えて2週間経つが、まだ腹部膨満感とガスが続く。食事と症状を記録して再発パターンを把握したい。',
      '食後30〜60分で腹が張って痛くなる。硫黄臭のガスも出て恥ずかしい。医師に「過敏性腸症候群」と言われているが、SIBO の検査をしていない。記録を続けて専門医に持っていきたい。'
    ],
    gastroparesis: [
      '1型糖尿病を20年。最近、食後2〜3時間で嘔吐することが増えた。血糖が食後に下がって数時間後に急上昇するパターンが出てきた。胃排出シンチグラフィで「軽度の胃排出遅延」と診断。食事量と嘔気を記録して管理したい。',
      '胃不全麻痺と診断されてドンペリドンを服用中。少量しか食べられず体重が2ヶ月で4kg減った。嘔吐の頻度と食事内容を記録して、栄養士との相談に役立てたい。'
    ],
    arrhythmia: [
      '心室性期外収縮（VPC）が多発して動悸が辛い。1万回/日以上と言われホルター心電図で確認された。ビソプロロールを服用中だが減量してほしい。動悸の頻度と誘発因子（コーヒー・ストレス・寝不足）を記録したい。',
      '発作性心房細動（PAF）と診断されてアピキサバン（エリキュース）を服用中。カテーテルアブレーションを半年後に予定している。発作の頻度・持続時間・誘因を記録してアブレーション前の情報として整理したい。'
    ],
    ihd: [
      '昨年、急性心筋梗塞（STEMI）で緊急PCI（ステント留置）を受けた。今はアスピリン＋クロピドグレル＋ロスバスタチン＋ビソプロロール・ラミプリルを服用中。LDL-Cの目標達成と薬の服用を毎日記録して次回の受診に備えたい。',
      '安定狭心症でニトログリセリンを携帯している。最近、歩くと胸の締め付けが出るようになった。1週間に何回使っているか記録して、主治医に状態の変化を伝えたい。'
    ],
    pulmonary_fibrosis: [
      'IPF（特発性肺線維症）と診断されてニンテダニブを服用中。下痢の副作用が強く服薬が辛い。SpO2を毎日測定しているが、歩くと88%まで下がることがある。呼吸機能の変化を記録して受診時に報告したい。',
      '膠原病（強皮症）に合併した間質性肺炎。ピルフェニドンを服用中。在宅酸素療法（2L/分）を使い始めた。息切れの程度と酸素使用量を記録して急性増悪の早期発見に役立てたい。'
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
    },
    hypertension: {
      diseases: ['高血圧'],
      profile: { age: 58, gender: 'female', height: 158, weight: 62 },
      textEntries: [
        { timestamp: '2026-03-10T07:00:00Z', category: 'vitals', title: '朝の血圧測定', content: '起床後5分安静にして測定。朝 158/96 mmHg（高い…）、脈拍 78。夕方 144/88 mmHg。アムロジピン飲み始めて2週間、まだ目標（135/85未満）に届かない。頭が重い感じがする朝があるが血圧が高い日と一致する気がする。' },
        { timestamp: '2026-03-17T07:00:00Z', category: 'vitals', title: '1週間の平均血圧', content: '朝平均 150/92 mmHg。少し下がってきた。先生に記録を見せたら「降圧薬の効果が出てきている」と言われた。塩分制限を続けている（みそ汁は週3回、外食は控えて）。体重 62kg 変わらず。' },
        { timestamp: '2026-03-24T08:00:00Z', category: 'medication', title: '降圧薬追加', content: '診察でアムロジピン5mgにテルミサルタン40mgを追加。「ARBとCa拮抗薬の組み合わせは相性が良い」と説明された。副作用（足のむくみ）がないか注意するよう言われた。帰りに減塩レシピ本を買った。' },
        { timestamp: '2026-03-31T07:00:00Z', category: 'vitals', title: '2剤目開始1週間', content: '朝 138/86 mmHg（初めて目標に近い値）。脈拍 72。嬉しい！足のむくみは今のところなし。塩分摂取量を意識して5g/日以下を目標に。夕食は塩を使わず出汁の旨味で調理。体重 61.5kg（500g減）。' },
        { timestamp: '2026-04-07T07:00:00Z', category: 'activity', title: '運動開始', content: '内科医から「有酸素運動が血圧を5〜8mmHg下げる」と聞いて、毎朝20分のウォーキングを開始。1週間続いた。血圧 朝 136/84 mmHg（目標達成！）、夕 132/82 mmHg。歩くと気分が上がる。' },
        { timestamp: '2026-04-14T07:00:00Z', category: 'vitals', title: '白衣高血圧の可能性', content: '先週の診察では 152/94 mmHg（緊張した）、家庭血圧は 136/84 mmHg で安定。先生に報告 →「家庭血圧の方が信頼性が高い。白衣効果の可能性がある。このまま家庭血圧を記録し続けてください」と言われ安心。' },
        { timestamp: '2026-04-21T07:00:00Z', category: 'vitals', title: '3ヶ月目の報告', content: '朝平均 134/83 mmHg（3ヶ月で 158→134 に改善）。体重 60.5kg（1.5kg減）。塩分制限・運動・降圧薬3種の組み合わせが効いた。副作用は今のところなし。次回は3ヶ月後の受診。血圧手帳（アプリ）のグラフを見せたら先生に褒められた。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T07:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-08T07:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-15T07:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T07:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-21T09:00:00Z', name: '高血圧定期検査', findings: '血圧 134/83（家庭血圧平均）、Cr 0.68（正常）、eGFR 82、Na 140、K 4.1、尿アルブミン/Cr比 18（正常範囲）、LDL 118、TG 95' }
      ],
      medications: [
        { timestamp: '2026-03-03T08:00:00Z', name: 'アムロジピン（ノルバスク）5mg', notes: '朝食後 1錠（Ca拮抗薬・長時間作用型）' },
        { timestamp: '2026-03-24T08:00:00Z', name: 'テルミサルタン（ミカルディス）40mg', notes: '朝食後 1錠（ARB・腎保護作用あり）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    hyperlipidemia: {
      diseases: ['脂質異常症'],
      profile: { age: 53, gender: 'male', height: 172, weight: 78 },
      textEntries: [
        { timestamp: '2026-03-08T09:00:00Z', category: 'symptoms', title: '健診でLDL高値を指摘', content: '健診結果が届いた。LDL 168 mg/dL（要精検）、TG 185 mg/dL（高め）、HDL 42 mg/dL（低め）。初めて指摘されて驚いた。父が55歳で心筋梗塞を起こしているので不安。来週かかりつけ医に相談予定。' },
        { timestamp: '2026-03-15T10:00:00Z', category: 'consultation', title: '脂質異常症の診断', content: '内科受診。詳しい採血：LDL 172、TG 198、HDL 40、non-HDL-C 205。「脂質異常症（混合型）の診断。まず3ヶ月間の食事・運動療法を試しましょう」と言われた。父の家族性高コレステロール血症の可能性は「LDL 200を超えたら検査」とのこと。' },
        { timestamp: '2026-03-22T08:00:00Z', category: 'activity', title: '食事改善スタート', content: '管理栄養士のオンライン指導を受けた。飽和脂肪酸（バター・肉の脂身・全脂肪乳製品）を減らし、青魚（サバ・イワシ）を週3回に増やす目標。食物繊維（大麦・豆類・野菜）を意識的に摂取。ランチの唐揚げ定食→サバ定食に変えた。' },
        { timestamp: '2026-03-29T08:00:00Z', category: 'activity', title: 'ウォーキング開始', content: '毎朝30分のウォーキングを開始。3週間で体重 78kg → 77.2kg（800g減）。HDLは食事改善と運動で上がるらしい。腹囲を毎週測定：93cm → 92cm（1cm減）。内臓脂肪が落ちるとTGも下がると聞いた。' },
        { timestamp: '2026-04-12T08:00:00Z', category: 'vitals', title: '1ヶ月後採血', content: '3ヶ月待つ前に自己判断で採血検査（人間ドック）。LDL 152（168→152）、TG 156（198→156）、HDL 45（40→45）。食事・運動で少し改善！でも先生の「LDL 140未満を目標」にはまだ届かない。' },
        { timestamp: '2026-04-19T10:00:00Z', category: 'consultation', title: 'スタチン開始', content: '3ヶ月食事療法の中間レビュー。「改善傾向はあるが目標LDL 140には届かない。父の心筋梗塞歴を考えるとリスクが高い。ロスバスタチン2.5mg を追加しましょう」と説明された。副作用（筋肉痛・CK上昇）の注意事項を聞いた。' },
        { timestamp: '2026-04-26T08:00:00Z', category: 'medication', title: 'スタチン開始1週間', content: 'ロスバスタチン 2.5mg 朝食後を開始。今のところ副作用（筋肉痛・倦怠感）はなし。筋肉痛が出たらCK検査を受けるよう言われている。食事改善・運動も継続。1ヶ月後に採血予定（LDL目標 120mg/dL未満）。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-12T09:00:00Z', name: '脂質異常症 採血（1ヶ月後）', findings: 'LDL 152（目標140未満に向けて改善中）、TG 156、HDL 45、non-HDL-C 178、AST 22、ALT 24（肝酵素正常）、CK 112（正常）、血糖 98、HbA1c 5.4' }
      ],
      medications: [
        { timestamp: '2026-04-19T08:00:00Z', name: 'ロスバスタチン（クレストール）2.5mg', notes: '朝食後 1錠（スタチン・HMG-CoA還元酵素阻害薬・筋肉痛に注意）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    anemia: {
      diseases: ['鉄欠乏性貧血'],
      profile: { age: 31, gender: 'female', height: 162, weight: 52 },
      textEntries: [
        { timestamp: '2026-03-05T09:00:00Z', category: 'symptoms', title: '健診でHb低値', content: '会社健診の結果：Hb 9.8 g/dL（基準値 12.0以上）、フェリチン 4.2 ng/mL（基準値 12以上）。「貧血・要精検」の紙が来た。最近ずっとだるくて、ちょっとした坂道で息が切れると思っていた。月経多い（7〜8日続く・血塊あり）のが原因かもしれない。' },
        { timestamp: '2026-03-12T10:00:00Z', category: 'consultation', title: '内科受診', content: '詳しい採血：Hb 9.6, フェリチン 3.8, MCV 72（小球性）, TIBC 452（高い）。「重度の鉄欠乏性貧血。フェロミア（硫酸第一鉄）1日3回、食前か食後2時間に服用」と処方された。月経過多の原因を調べるため婦人科受診も勧められた。' },
        { timestamp: '2026-03-19T09:00:00Z', category: 'medication', title: '鉄剤1週間目', content: 'フェロミア開始1週間。便が黒くなった（先生に聞いたら「鉄剤の正常反応」とのこと）。少し便秘。胃がちょっと重い感じ。倦怠感は 8/10 → 7/10 に少し改善か。夕方になると特に疲れやすい。' },
        { timestamp: '2026-03-26T08:00:00Z', category: 'activity', title: '食事改善', content: '栄養士に相談。ヘム鉄が多いレバー・牛赤身肉・マグロを意識して食べるように。朝食にほうれん草+オレンジジュースの組み合わせ（非ヘム鉄+ビタミンC）。お茶・コーヒーは鉄剤服用の前後1時間は避けている。' },
        { timestamp: '2026-04-09T09:00:00Z', category: 'vitals', title: '1ヶ月後採血', content: 'Hb 11.2（9.6→11.2）、フェリチン 12.1（3.8→12.1）。1ヶ月でかなり改善！息切れが減った。倦怠感 5/10。階段がだいぶ楽になった。先生に「まだフェリチンが低いので鉄剤は6ヶ月続けましょう」と言われた。' },
        { timestamp: '2026-04-16T10:00:00Z', category: 'consultation', title: '婦人科受診', content: '婦人科では「子宮筋腫（2cm・多発）が月経過多の原因」と診断。今すぐ手術は不要で、経過観察とジエノゲスト（低用量ピル）で月経量を減らす提案。「鉄剤治療と合わせることで貧血が改善しやすくなる」と説明された。' },
        { timestamp: '2026-04-23T09:00:00Z', category: 'vitals', title: '2ヶ月目経過', content: 'ジエノゲスト開始2週間。月経量が格段に減った（ナプキン5枚/日→2枚/日）。Hb 12.1（ほぼ正常範囲！）、フェリチン 22。倦怠感 3/10 に改善。朝の通勤も苦じゃなくなった。フェロミアはあと4ヶ月続ける予定。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 7, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 6, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-09T10:00:00Z', name: '鉄欠乏性貧血 採血（1ヶ月後）', findings: 'Hb 11.2（改善中）, MCV 78, フェリチン 12.1, TIBC 380（改善）, 血清鉄 48, CRP 0.2（正常）' }
      ],
      medications: [
        { timestamp: '2026-03-12T08:00:00Z', name: 'フェロミア（硫酸第一鉄）50mg', notes: '1日3回 食前（空腹時吸収が良い・胃腸症状がある場合は食後可）' },
        { timestamp: '2026-04-16T08:00:00Z', name: 'ジエノゲスト（ビジュアル）1mg', notes: '1日2回（子宮筋腫による月経過多の治療・月経量減少で鉄喪失を抑制）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    allergic_rhinitis: {
      diseases: ['アレルギー性鼻炎（花粉症）'],
      profile: { age: 35, gender: 'male', height: 174, weight: 70 },
      textEntries: [
        { timestamp: '2026-02-15T08:00:00Z', category: 'symptoms', title: '花粉シーズン開始', content: '今年もスギ花粉の季節が来た。今朝起きたらくしゃみ連発（15回以上）、水のような鼻水が止まらない。目のかゆみ 3/3。鼻閉は今のところ2/3。TNSS 8/12。アレグラを飲んだが午後まで効きが弱い感じ。昨年より花粉が多いらしい。' },
        { timestamp: '2026-02-22T08:00:00Z', category: 'medication', title: '点鼻ステロイド追加', content: '耳鼻科受診。「アレグラに加えてフルナーゼ点鼻薬を追加しましょう。点鼻は毎日続けることが大事」と言われた。鼻の中を見て「炎症が強い」と。ナゾネックスに変更（薬局在庫の関係）。使い方を教えてもらった（中央の鼻中隔を避けて外側に向けて噴霧）。' },
        { timestamp: '2026-03-01T07:00:00Z', category: 'vitals', title: '点鼻薬開始1週間', content: 'ナゾネックス+アレグラ継続。TNSS 8→5 に改善！特に鼻閉（詰まり）が明らかに楽になった。くしゃみ・鼻水はまだ続くが回数が減った。目のかゆみ 2/3（点眼薬も追加）。仕事中の集中力が戻ってきた。' },
        { timestamp: '2026-03-08T09:00:00Z', category: 'activity', title: 'マスク・外出対策', content: '花粉飛散量多い日（環境省サイトで「非常に多い」）は不織布マスク2枚重ね。外から帰ったら玄関で服を払い、すぐ洗顔・うがい。これだけで室内での鼻水がかなり減った。空気清浄機をフル稼働（フィルター清掃した）。' },
        { timestamp: '2026-03-15T08:00:00Z', category: 'consultation', title: '舌下免疫療法の相談', content: '「来シーズンに向けて舌下免疫療法（シダキュア）を始めませんか」と勧められた。「3〜5年続けると根本的な改善が期待できる。ただし毎日服用が必須」と説明された。来月5月から開始予定（スギ花粉シーズン外から開始するルール）。' },
        { timestamp: '2026-03-22T07:00:00Z', category: 'vitals', title: '3月下旬ピーク', content: 'ヒノキ花粉も飛散開始で症状が再度悪化。TNSS 7/12。目のかゆみが特に強い（3/3）。ビラノアに変更（眠気が出にくいとのこと）。点鼻薬は継続。睡眠 5時間（鼻閉で途中覚醒2回）。在宅勤務の日は症状が楽だった。' },
        { timestamp: '2026-04-12T07:00:00Z', category: 'symptoms', title: '花粉シーズン収束', content: '4月に入りスギ・ヒノキ花粉が収束してきた。TNSS 2/12（ほぼ正常）。点鼻薬・点眼薬は5月初旬まで続けて徐々に中止予定。5月から舌下免疫療法（シダキュア）開始の予約を取った。来年に向けて根治を目指す！' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T08:00:00Z', fatigue_level: 5, sleep_quality: 4 },
        { timestamp: '2026-03-08T08:00:00Z', fatigue_level: 4, sleep_quality: 5 },
        { timestamp: '2026-03-22T08:00:00Z', fatigue_level: 5, sleep_quality: 4 },
        { timestamp: '2026-04-12T08:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-15T09:00:00Z', name: 'アレルギー検査', findings: 'スギ特異的IgE: クラス5（強陽性）, ヒノキ特異的IgE: クラス4, ハウスダスト/ダニ: クラス3, 総IgE 480 IU/mL' }
      ],
      medications: [
        { timestamp: '2026-02-15T07:00:00Z', name: 'ビラスチン（ビラノア）20mg', notes: '起床後すぐ空腹時に1錠（第2世代抗ヒスタミン薬・眠気少ない）' },
        { timestamp: '2026-02-22T07:00:00Z', name: 'モメタゾン点鼻薬（ナゾネックス）', notes: '1日2回 各鼻孔2プッシュ（鼻噴霧ステロイド・毎日継続が重要）' },
        { timestamp: '2026-02-22T07:00:00Z', name: 'ケトチフェン点眼液（ザジテン）', notes: '1日2回 目のかゆみ・充血（抗アレルギー点眼）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    psoriasis: {
      diseases: ['乾癬（尋常性乾癬）'],
      profile: { age: 42, gender: 'male', height: 175, weight: 80 },
      textEntries: [
        { timestamp: '2026-03-03T09:00:00Z', category: 'symptoms', title: 'フレア開始', content: 'ストレスの多かった2月末から皮疹が再燃。両肘・膝・頭皮に赤い鱗屑プラーク。PASIスコア 14（中等症）。かゆみは 5/10。外用薬（ドボベット）を再開した。仕事のプレゼンが近くてストレスが続いている。' },
        { timestamp: '2026-03-10T09:00:00Z', category: 'consultation', title: '皮膚科受診', content: '主治医「このフレアの重症度からすると外用薬だけでは難しい。セクキヌマブ（コセンティクス）の皮下注射を始めましょう」と提案された。2年前にアダリムマブを使ったが効果が落ちてきた経緯がある。インフォームドコンセントを受けてセクキヌマブ同意書にサイン。' },
        { timestamp: '2026-03-17T09:00:00Z', category: 'medication', title: 'セクキヌマブ開始', content: 'セクキヌマブ初回投与（300mg 皮下注射）。注射部位の発赤が少し。初回投与4回を週1回、その後月1回のスケジュール。副作用（口腔カンジダ・上気道感染・炎症性腸疾患リスク）について説明を受けた。外用薬は継続。' },
        { timestamp: '2026-03-31T09:00:00Z', category: 'vitals', title: '3週後の変化', content: 'セクキヌマブ3回終了。PASIスコア 14→7 に改善（50%減）。肘の皮疹が薄くなってきた。かゆみ 2/10 に大幅改善。睡眠が楽になった（かゆみで目覚めなくなった）。頭皮の鱗屑もかなり減少。体調全般は良好。' },
        { timestamp: '2026-04-07T09:00:00Z', category: 'vitals', title: '4回目・誘導終了', content: '週1回の誘導投与4回目終了。次回から月1回の維持療法。PASI 14→3（PASI 75達成！）。BSA（体表面積）5%未満に改善。膝の皮疹がほぼ消えた。肘にわずかに残るが生活の質は大幅改善（DLQI 6→2）。' },
        { timestamp: '2026-04-21T09:00:00Z', category: 'vitals', title: '維持療法1ヶ月目', content: '月1回の維持療法開始。PASI 2（PASI 90近い）。皮疹がほぼ消失。関節痛は以前から少しあったが「もしかして関節症性乾癬？」とリウマチ科受診の提案を受けた。膝・指のこわばり（朝15分程度）が週に数回ある。' },
        { timestamp: '2026-04-28T10:00:00Z', category: 'consultation', title: 'リウマチ科受診', content: '関節エコーで「手指に早期滑膜炎の所見」。CASPAR基準で関節症性乾癬の診断。「セクキヌマブはPsAにも効果があるのでこのまま継続」と言われた。関節の進行を定期エコーでモニタリング予定。早期発見でよかった。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, sleep_quality: 8 }
      ],
      bloodTests: [
        { timestamp: '2026-04-07T09:00:00Z', name: '乾癬・生物学的製剤開始前スクリーニング', findings: 'QFT（結核）陰性, HBs抗原陰性, 抗HCV陰性, CRP 1.2（炎症あり）, WBC 6,800, 尿酸 7.2, AST 28, ALT 32（正常）' }
      ],
      medications: [
        { timestamp: '2026-03-17T09:00:00Z', name: 'セクキヌマブ（コセンティクス）300mg', notes: '皮下注射 週1×4回→月1回（IL-17A阻害薬・尋常性乾癬・関節症性乾癬）' },
        { timestamp: '2026-03-03T09:00:00Z', name: 'カルポトリオール/ベタメタゾン（ドボベット）', notes: '1日1回 皮疹部位に塗布（ビタミンD3/ステロイド配合軟膏・外用）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    chronic_urticaria: {
      diseases: ['慢性蕁麻疹（慢性特発性蕁麻疹）'],
      profile: { age: 38, gender: 'female', height: 163, weight: 56 },
      textEntries: [
        { timestamp: '2026-02-10T09:00:00Z', category: 'symptoms', title: '蕁麻疹が3ヶ月続いている', content: '昨年11月から蕁麻疹が出ている。毎日ではないが週4〜5日、特に夕方から夜にかけて全身に膨疹（ミミズ腫れ）が出る。かゆみ 7/10。抗ヒスタミン薬（アレグラ）を飲んでいるが翌朝にはまた出る。UAS7スコア 21（重症）。皮膚科受診予約した。' },
        { timestamp: '2026-02-17T10:00:00Z', category: 'consultation', title: '皮膚科受診・慢性蕁麻疹診断', content: '皮膚科「6週間以上続いているので慢性特発性蕁麻疹の診断です。アレルギー検査で原因を探りましたが特定のアレルゲンは見つかりません」。アレグラを ビラノア（より眠気が少ない）に変更。4週間後に再診。' },
        { timestamp: '2026-02-24T09:00:00Z', category: 'medication', title: 'ビラノア開始1週間', content: 'ビラノア 20mg 1日1回。眠気はなくなった（アレグラより明らかに楽）。しかし蕁麻疹の出現頻度はほとんど変わらない。UAS7スコア 19。夜にかゆくて目が覚めることが1〜2回/週。仕事中に膨疹が出てくるのが恥ずかしい。' },
        { timestamp: '2026-03-17T10:00:00Z', category: 'consultation', title: '再診・増量', content: 'UAS7 19（改善不十分）。先生「ビラノアを2倍量（40mg）に増やしましょう」。2倍量での副作用（眠気・口渇）について説明を受けた。「まだ改善なければオマリズマブ（ゾレア）の選択肢もある」と話があった。' },
        { timestamp: '2026-03-24T09:00:00Z', category: 'vitals', title: '増量2週間', content: 'ビラノア 40mg に増量して2週間。UAS7 19→13（中等度に改善）。膨疹の大きさが少し小さくなった気がする。かゆみ 4/10（7→4）。睡眠中に目が覚めることはなくなった。もう少し続けて様子を見る。' },
        { timestamp: '2026-04-14T10:00:00Z', category: 'consultation', title: 'オマリズマブ導入', content: 'UAS7 12（まだ中等度）。先生「このまま長期間続けるよりオマリズマブを導入しましょう。重症難治性蕁麻疹に保険適用あり」。ゾレア 300mg 皮下注射 月1回を開始。抗ヒスタミン薬は継続。' },
        { timestamp: '2026-04-28T09:00:00Z', category: 'vitals', title: 'ゾレア初回後2週間', content: 'ゾレア 初回投与2週間後。UAS7 12→4（著明改善）！！蕁麻疹が4日以上出ていない。かゆみが 1/10 にまで下がった。「こんなに楽になれると思っていなかった」と先生に報告。次回投与まで日記を続ける。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 2, sleep_quality: 8 }
      ],
      bloodTests: [
        { timestamp: '2026-02-17T09:00:00Z', name: '慢性蕁麻疹スクリーニング', findings: 'CRP 0.3, 好酸球 2.8%, 総IgE 142 IU/mL, 甲状腺（TSH正常）, 抗TPO抗体 陰性, 血算正常, 食物アレルゲン特異的IgE 陰性' }
      ],
      medications: [
        { timestamp: '2026-02-17T08:00:00Z', name: 'ビラスチン（ビラノア）40mg', notes: '朝食前1錠（第2世代抗ヒスタミン薬2倍量・眠気少ない）' },
        { timestamp: '2026-04-14T09:00:00Z', name: 'オマリズマブ（ゾレア）300mg', notes: '月1回 皮下注射（抗IgE抗体・重症慢性蕁麻疹）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    pms_pmdd: {
      diseases: ['月経前不快気分障害（PMDD）'],
      profile: { age: 29, gender: 'female', height: 160, weight: 54 },
      textEntries: [
        { timestamp: '2026-03-06T09:00:00Z', category: 'symptoms', title: '月経前の3日間がつらい', content: '排卵から月経まで、特に月経前3〜7日がひどい。抑うつ・過敏・イライラが 9/10。「なぜ自分はこんなにダメなんだろう」と思い詰めることがある。むくみ（+1.5kg）・乳房痛・頭痛も毎回。月経が来ると1日で嘘のように楽になる。これがもう3年続いている。' },
        { timestamp: '2026-03-13T10:00:00Z', category: 'consultation', title: '心療内科受診・PMDD診断', content: '先生「症状が月経周期に連動していること、黄体期に限定していること、日常生活に著しく支障があること——これはPMDDの診断基準を満たしています」。エスシタロプラム（レクサプロ）10mgを月経予定日14日前から月経開始まで服用する「黄体期間欠投与」を提案された。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'medication', title: '黄体期間欠SSRI開始', content: 'レクサプロ10mg、排卵後に服用開始（基礎体温で排卵を確認）。初日は少し眠気と吐き気があったが2日目から消えた。月経前1週間の気分スコア 9→6 に改善（初月）。まだ効果が出始めたところ。' },
        { timestamp: '2026-04-03T09:00:00Z', category: 'vitals', title: '2周期目・効果確認', content: '2周期目のSSRI黄体期服用。気分スコア 月経前 8日間平均 5/10（以前は 9/10）。「死にたい」「消えたい」という思考は今月は出なかった。むくみ・乳房痛は残るが気分が安定すると対処しやすい。職場での過敏反応も少し落ち着いた。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'activity', title: '生活習慣改善の効果', content: '卵胞期（月経終了後）は気分が良い週。この時期に運動（ランニング30分×週3回）・減塩食・カフェイン制限を習慣化。黄体期に入っても以前より開始が遅く・軽度になっている感じ。睡眠8時間確保が特に効いている気がする。' },
        { timestamp: '2026-04-24T09:00:00Z', category: 'vitals', title: '3周期目：SSRI安定効果', content: '3周期目。気分スコア月経前平均 4/10（3ヶ月前：9/10 から大幅改善）。パートナーからも「月経前でも落ち着いてる」と言われた。職場での人間関係トラブルもほぼなし。月経来る3日前まで仕事が普通にできるようになった。副作用はほぼなし。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 6, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 4, sleep_quality: 7 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-22T09:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-13T09:00:00Z', name: 'PMS/PMDD スクリーニング', findings: 'TSH 1.8（正常）, FSH 6.2, LH 8.4, E2 42（卵胞期）, プロゲステロン 0.3（卵胞期・正常）, Hb 12.8, フェリチン 28（軽度低値）' }
      ],
      medications: [
        { timestamp: '2026-03-20T08:00:00Z', name: 'エスシタロプラム（レクサプロ）10mg', notes: '排卵日〜月経開始まで服用（SSRI・黄体期間欠投与・PMDDに有効）' },
        { timestamp: '2026-03-20T08:00:00Z', name: 'マグネシウム 300mg', notes: '就寝前 毎日（PMS症状・睡眠質改善の補助）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    overactive_bladder: {
      diseases: ['過活動膀胱（OAB）'],
      profile: { age: 62, gender: 'female', height: 155, weight: 58 },
      textEntries: [
        { timestamp: '2026-03-04T08:00:00Z', category: 'symptoms', title: '頻尿で外出が怖い', content: '1日15回以上トイレに行く。夜も2〜3回起きる。外出すると「トイレが近くにあるか」が頭から離れない。電車の中で急に我慢できなくなって1度漏れた。恥ずかしくて誰にも言えなかった。更年期からひどくなった気がする。泌尿器科を受診しようと思う。' },
        { timestamp: '2026-03-11T10:00:00Z', category: 'consultation', title: '泌尿器科受診・OAB診断', content: '排尿日誌を持参（1日14回・夜2回・切迫感エピソード8回/日）。尿流量測定・残尿測定（20mL・正常）・尿細胞診（陰性）。「過活動膀胱（OAB）の診断です。まず骨盤底筋訓練と膀胱訓練を試しましょう」。ベシケア5mgが処方された。' },
        { timestamp: '2026-03-18T08:00:00Z', category: 'activity', title: '骨盤底筋訓練開始', content: '理学療法士に骨盤底筋訓練を教わった。「肛門・膣・尿道口を締める→10秒→緩める→10回×1日3セット」。最初は正しくできているか不安だったが、コツを掴んだ気がする。膀胱訓練（切迫感が来ても10分待つ練習）も開始。' },
        { timestamp: '2026-03-25T08:00:00Z', category: 'vitals', title: 'ベシケア2週間後', content: 'ベシケア5mg開始2週間。1日14回→10回に減少。夜間2〜3回→1〜2回に改善。切迫感強度 8→5に改善。口が渇く（副作用）が軽度。便秘には今のところなし。外出時に少し余裕が出てきた。電車に乗れるようになった。' },
        { timestamp: '2026-04-08T10:00:00Z', category: 'consultation', title: '1ヶ月後の受診', content: '1日10回・夜1〜2回・切迫感エピソード3〜4回/日（改善傾向）。先生「ベシケアの効果が出ています。β3作動薬のビベグロン（ベオーバ）に変更すると口渇が少なくなる可能性があります」とのこと。切替えを検討中。骨盤底筋訓練は毎日継続できている。' },
        { timestamp: '2026-04-22T08:00:00Z', category: 'vitals', title: '2ヶ月目・安定化', content: 'ビベグロン50mg に変更2週間。口渇がほぼなくなった！排尿回数 8〜9回/日に改善（目標8回未満に近い）。夜間1回。切迫感エピソード2回/日。「スーパーで試着室に行けた」「電車で座席を離れず過ごせた」という小さな達成が嬉しい。骨盤底筋訓練を続ける。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-11T09:00:00Z', name: 'OABスクリーニング', findings: '尿細胞診 陰性, 残尿量 20mL（正常）, PSA N/A（女性）, 尿一般 白血球（-）感染なし, 血糖 105, HbA1c 5.8%（境界域）, eGFR 68' }
      ],
      medications: [
        { timestamp: '2026-04-08T08:00:00Z', name: 'ビベグロン（ベオーバ）50mg', notes: '朝食後 1錠（β3作動薬・口渇少ない・高齢者に安全）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    tinnitus: {
      diseases: ['耳鳴り・感音性難聴'],
      profile: { age: 55, gender: 'male', height: 172, weight: 74 },
      textEntries: [
        { timestamp: '2026-02-18T09:00:00Z', category: 'symptoms', title: '耳鳴りが3ヶ月続く', content: '右耳に「ピー」という高音の耳鳴りが3ヶ月前から続いている。最初は気にならなかったが、最近は静かな場所で特に気になり、夜眠れないことがある。THIスコアをネットで調べたら28点（軽中等度）。耳鼻科を受診しようと思う。' },
        { timestamp: '2026-02-25T10:00:00Z', category: 'consultation', title: '耳鼻科受診・感音性難聴+耳鳴り診断', content: '純音聴力検査：右4000Hz 55dB（中等度感音性難聴）、左30dB。「騒音性難聴による高音域難聴と慢性耳鳴りです。TRT（耳鳴り再訓練療法）とサウンドセラピーが有効です。まずは補聴器の評価と、寝る前のホワイトノイズ生成器を試しましょう」。メコバラミン500μgが処方された。' },
        { timestamp: '2026-03-04T08:00:00Z', category: 'vitals', title: 'THIスコア測定・ホワイトノイズ開始', content: 'THI（耳鳴りハンディキャップ検査）: 28点（軽中等度）。就寝時にホワイトノイズマシン開始。最初の夜は違和感があったが、耳鳴りが「紛れる」感覚で入眠が少し楽だった。メコバラミン1錠朝食後も開始。騒音職場（印刷工場）での耳栓着用を徹底することにした。' },
        { timestamp: '2026-03-18T09:00:00Z', category: 'activity', title: 'TRTカウンセリング開始', content: 'TRT（耳鳴り再訓練療法）のカウンセリング第1回。「耳鳴りは危険信号ではない」「脳が雑音として無視できるよう再訓練する」と説明を受けた。サウンドジェネレーターの設定（耳鳴りより小さい音量）。「耳鳴りに集中しないようにする」という考え方が目からウロコ。' },
        { timestamp: '2026-04-08T10:00:00Z', category: 'consultation', title: '6週間後の受診', content: 'THIスコア: 28点→18点（12点改善）。「就寝時の影響が改善している」と報告。先生「TRTのカウンセリング効果と音響療法が機能しています。引き続きサウンドセラピーを継続してください。耳栓着用も継続を」。補聴器は「もう少し様子を見ましょう」。' },
        { timestamp: '2026-04-22T08:00:00Z', category: 'vitals', title: '2ヶ月目・日常の変化', content: '耳鳴り強度: 7→5（VAS）。THIスコア: 18点。「静かすぎる環境（風呂・就寝前）で気になる」というパターンが明確になった。対策としてBGMを常に流すように変更。職場の騒音対策（耳栓+イヤーマフ）で「仕事中は悪化していない」と実感。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 5, sleep_quality: 4 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-02-25T09:00:00Z', name: '聴力・耳鳴り初回評価', findings: '純音聴力検査 右4kHz 55dB（中等度難聴）, 左4kHz 30dB, 耳鳴りマッチング 右 4000Hz 55dBHL, MRI 正常（聴神経腫瘍除外）, 甲状腺 正常, 血圧 128/82' }
      ],
      medications: [
        { timestamp: '2026-02-25T09:00:00Z', name: 'メコバラミン（メチコバール）500μg', notes: '朝食後 1錠（末梢神経・聴覚神経保護）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    vertigo: {
      diseases: ['めまい・BPPV・メニエール病'],
      profile: { age: 48, gender: 'female', height: 158, weight: 54 },
      textEntries: [
        { timestamp: '2026-02-10T09:00:00Z', category: 'symptoms', title: '突然の回転性めまい発作', content: '朝起き上がった瞬間に激しい回転性めまい。「部屋がぐるぐる回る」感覚で立てなかった。30秒ほどで治まったが、その後もフワフワ感が続いた。耳鳴り・難聴はない。頭を動かすと症状が再現する。ネットで調べるとBPPVかもしれない。翌日耳鼻科を受診した。' },
        { timestamp: '2026-02-11T10:00:00Z', category: 'consultation', title: '耳鼻科受診・BPPV診断', content: 'ディックス・ホールパイク検査：陽性（右後半規管型BPPV）。眼振あり。「耳石が後半規管に入り込んでいます。エプリー法で治します」とその場で施術。「耳石を元の位置に戻す操作です」。施術後30分の安静。「1〜3回で80%が改善します」。自宅での注意点も指導された。' },
        { timestamp: '2026-02-14T08:00:00Z', category: 'vitals', title: 'エプリー法1回後', content: 'エプリー法施術から3日後。めまい発作の頻度が激減（3回/日→1回/日）。まだ「寝返りで少し揺れる感じ」があるが、立てないほどの発作はなくなった。高い棚のものを取る時はまだ不安。2週間後に再診予約あり。' },
        { timestamp: '2026-02-25T10:00:00Z', category: 'consultation', title: '2週間後の受診・完全改善確認', content: 'ディックス・ホールパイク検査：陰性。「BPPVは完全に解消されました」。「再発率は年30%程度あります。同じ症状が出たらすぐ受診してください。ビタミンD不足がBPPV再発と関連するという研究があります」。ビタミンD3 1000IU サプリ開始を提案された。' },
        { timestamp: '2026-04-03T09:00:00Z', category: 'symptoms', title: 'BPPV再発＋左耳の変化', content: '2ヶ月後に再発。今度は左耳側。さらに左耳の「こもり感」と低音の耳鳴りが出現。翌日耳鼻科を受診。今回はエプリー法＋「左耳側の低音難聴がある」と指摘。「メニエール病の可能性も考慮します」。イソバイドシロップとベタヒスチン（メリスロン）が処方された。' },
        { timestamp: '2026-04-15T10:00:00Z', category: 'consultation', title: 'メニエール病疑い・治療開始', content: 'グリセロールテスト実施（低音域改善→内リンパ水腫の示唆）。「メニエール病疑いとして治療を始めます」。塩分制限（6g/日）・ストレス管理・十分な睡眠を指導。イソバイドシロップ30mL 朝夕2回＋ベタヒスチン12mg 毎食後継続。発作日誌の記録を依頼された。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 6, sleep_quality: 4 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 4, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-04-03T09:00:00Z', name: '聴力・めまい精査', findings: '純音聴力検査 左低音（250Hz 50dB, 500Hz 45dB）感音性難聴, グリセロールテスト 陽性（低音域改善）, MRI 正常, 血圧 118/74, 甲状腺 正常, 抗核抗体 陰性' }
      ],
      medications: [
        { timestamp: '2026-04-03T09:00:00Z', name: 'イソバイドシロップ 70% 30mL', notes: '朝夕食後（浸透圧利尿薬・内リンパ水腫軽減）' },
        { timestamp: '2026-04-03T09:00:00Z', name: 'ベタヒスチンメシル酸塩（メリスロン）12mg', notes: '毎食後 1錠（前庭機能改善・内耳血流）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    dry_eye: {
      diseases: ['ドライアイ（乾性角結膜炎）'],
      profile: { age: 39, gender: 'female', height: 162, weight: 52 },
      textEntries: [
        { timestamp: '2026-02-17T09:00:00Z', category: 'symptoms', title: '目の乾き・充血が悪化', content: 'テレワーク開始から1年、目の乾き・充血がひどくなった。市販の目薬（ロートドライエイド）を1日10回以上使っても改善しない。午後になると視界がかすむ。コンタクトレンズが痛くて使えなくなった。眼科を受診しようと思う。' },
        { timestamp: '2026-02-24T11:00:00Z', category: 'consultation', title: '眼科受診・MGD型ドライアイ診断', content: '涙液量（シルマーテスト）: 8mm（境界域）。BUT（涙液層破壊時間）: 3秒（正常10秒以上）。フルオレセイン染色：点状表層角膜症あり。マイボーム腺評価：分泌物白濁・閉塞あり（MGD）。「マイボーム腺機能不全型ドライアイです」。ジクアス・ムコスタ点眼が処方された。' },
        { timestamp: '2026-03-03T08:00:00Z', category: 'activity', title: 'ホットアイマスク・点眼開始', content: 'ジクアス（ジクアホソル）6回/日・ムコスタ（レバミピド）4回/日の点眼開始。就寝前に蒸気ホットアイマスク（10分）開始。「マイボーム腺の脂を溶かして排出を促す」と説明を受けた。VDT作業中に20-20-20ルール（20分→20フィート→20秒休眠）を実践開始。' },
        { timestamp: '2026-03-17T09:00:00Z', category: 'vitals', title: '3週間後・充血改善', content: '目の乾きVAS: 8→5に改善。充血スコア: 3→1（写真で記録）。BUT: 再測定3秒→6秒に改善。コンタクトレンズをデイリーに変更して装用時間を8時間以内に制限。VDT作業時間を1日10時間→8時間に短縮。点眼回数が守れている。' },
        { timestamp: '2026-04-07T11:00:00Z', category: 'consultation', title: '1.5ヶ月後の再診', content: 'BUT: 7秒（改善傾向）。点状角膜症：軽快。「ジクアスとムコスタの2剤が効いています。引き続き温罨法を継続してください。コンタクトレンズの装用時間制限は守って」。オフィスに加湿器（湿度50〜60%）を設置したことで午後の悪化が改善。' },
        { timestamp: '2026-04-21T08:00:00Z', category: 'vitals', title: '2ヶ月目・安定化', content: '目の乾きVAS: 3。「1年ぶりにコンタクトレンズを1日6時間装用できた」。ホットアイマスクが就寝前の習慣になった。デスクの加湿器を買い足してリモートワーク環境も整えた。次回受診で涙点プラグの必要性を再評価する予定。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-02-24T10:00:00Z', name: 'ドライアイ初回評価', findings: 'シルマーテスト 8mm（境界域）, BUT 3秒（異常: 正常10秒以上）, フルオレセイン染色 点状角膜症あり（grade 2）, マイボーム腺 MGD grade 2, 抗核抗体 陰性（シェーグレン除外）' }
      ],
      medications: [
        { timestamp: '2026-02-24T10:00:00Z', name: 'ジクアホソルナトリウム（ジクアス）3%', notes: '1日6回点眼（ムチン分泌促進・涙液量増加）' },
        { timestamp: '2026-02-24T10:00:00Z', name: 'レバミピド（ムコスタ点眼）2%', notes: '1日4回点眼（角膜上皮修復・ムチン産生促進）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    chronic_prostatitis: {
      diseases: ['慢性前立腺炎（CP/CPPS）'],
      profile: { age: 34, gender: 'male', height: 175, weight: 72 },
      textEntries: [
        { timestamp: '2026-01-20T09:00:00Z', category: 'symptoms', title: '会陰部の慢性的な痛み', content: '3ヶ月前から会陰部・睾丸・下腹部に鈍痛が続く。排尿後に痛みが増す。射精後に翌日まで痛みが残ることがある。頻尿（1日10〜12回）・残尿感もある。泌尿器科を受診した。NIH-CPSIスコアをネットで確認したら29点（重症）だった。' },
        { timestamp: '2026-01-27T10:00:00Z', category: 'consultation', title: '泌尿器科受診・CP/CPPS診断', content: '尿検査：細菌（-）、白血球少量。PSA：1.2ng/mL（正常）。エコー：前立腺やや腫大・石灰化あり。NIH-CPSI：29点（重症）。「細菌は検出されないため慢性骨盤痛症候群（CPPS）の診断です。α遮断薬とニューキノロン系抗生剤を試します」。ハルナール0.2mg・シプロフロキサシン500mg処方。' },
        { timestamp: '2026-02-10T08:00:00Z', category: 'vitals', title: '抗生剤2週間後・効果なし', content: 'シプロフロキサシン2週間後。会陰部痛：NRS 7→6（変化少ない）。頻尿：11回→10回。先生「細菌性でなかったため抗生剤の効果は限定的でした。ハルナールを継続して理学療法士による骨盤底筋弛緩療法を試しましょう」。骨盤底PT予約を入れた。' },
        { timestamp: '2026-02-24T09:00:00Z', category: 'activity', title: '骨盤底筋弛緩療法開始', content: '骨盤底PT第1回。「CPPSの多くは骨盤底筋の過緊張が原因」と説明。「CPの8割は筋緊張型」。骨盤底を締めるのでなく「緩める」エクササイズを指導された。深呼吸・ダウントレーニング・仙骨マッサージ。座位を減らすことの重要性を説明された。' },
        { timestamp: '2026-03-17T10:00:00Z', category: 'consultation', title: '2ヶ月後・再評価', content: 'NIH-CPSI: 29→18点（11点改善・中等度に改善）。「骨盤底PTの効果が出ています。頻尿も9回/日に減少。タダラフィル5mgを追加で骨盤血流を改善しましょう」。スタンディングデスク導入・自転車通勤中止・エルゴノミクスクッション使用開始。' },
        { timestamp: '2026-04-21T08:00:00Z', category: 'vitals', title: '3ヶ月後・安定化', content: '会陰部痛NRS: 7→3（大幅改善）。NIH-CPSI: 18→12点（中等度）。頻尿：8〜9回/日。「以前は電車でも痛みを気にしていたが、今は仕事に集中できる」。タダラフィルは週3回服用。骨盤底PTは月2回のメンテナンスに移行。CBTのワークも自宅で継続中。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-01-27T10:00:00Z', name: 'CP初回精査', findings: '尿一般 細菌（-）, 白血球（+/-)（軽度）, PSA 1.2ng/mL（正常: <4.0）, 残尿測定 38mL（軽度増加）, 腹部エコー 前立腺やや腫大 28mL, 血液 正常範囲' }
      ],
      medications: [
        { timestamp: '2026-01-27T10:00:00Z', name: 'タムスロシン塩酸塩（ハルナール）0.2mg', notes: '朝食後 1錠（α1遮断薬・平滑筋弛緩・排尿改善）' },
        { timestamp: '2026-03-17T10:00:00Z', name: 'タダラフィル（シアリス）5mg', notes: '週3回（PDE5阻害薬・骨盤血流改善・勃起機能）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    ulcerative_colitis: {
      diseases: ['潰瘍性大腸炎（UC）'],
      profile: { age: 27, gender: 'male', height: 178, weight: 65 },
      textEntries: [
        { timestamp: '2026-01-12T08:00:00Z', category: 'symptoms', title: '血便・腹痛が再燃', content: '3ヶ月間の寛解後、先週から血便（排便の1/4が血液混じり）と腹痛（NRS 6）が再現。排便回数が1日3〜4回から7〜8回に増加。緊急排便も1日3回。診断から2年目、2回目の再燃。「また再燃してしまった」という焦りと疲れがある。明日消化器内科を受診する。' },
        { timestamp: '2026-01-13T10:00:00Z', category: 'consultation', title: '消化器内科受診・中等症再燃の診断', content: 'Mayoスコア: 8点（中等症。排便回数3・血便2・内視鏡所見2（前回）・医師評価2）。血液検査：CRP 2.8mg/dL上昇、白血球10,200。「中等症の再燃です。プレドニゾロン30mgを開始してメサラジンを増量（2.4→4.0g）します。2週後に効果を確認します」。' },
        { timestamp: '2026-01-27T10:00:00Z', category: 'consultation', title: '2週後の経過評価', content: 'プレドニゾロン2週間後。血便スコア: 2→1（改善傾向）。排便回数: 7〜8→4〜5回/日。CRP: 0.8mg/dL（改善）。先生「ステロイドは効いていますが、今回2回目の再燃です。ステロイド依存を防ぐためにインフリキシマブへの生物学的製剤導入を検討しましょう」。' },
        { timestamp: '2026-02-10T10:00:00Z', category: 'vitals', title: 'インフリキシマブ初回投与', content: 'インフリキシマブ（レミケード）5mg/kg初回点滴。3時間かけて点滴。輸液反応なし。「2週間後・6週間後に2回目・3回目、その後は8週間ごと」の予定。ステロイドは毎週5mgずつ減量予定。「生物学的製剤を使うことへの不安はあったが、寛解維持のためと決意した」。' },
        { timestamp: '2026-03-10T10:00:00Z', category: 'consultation', title: '3回目投与（6週）・効果確認', content: 'インフリキシマブ3回目投与（6週）前の評価。Mayoスコア: 8→3点（軽症〜寛解境界）。排便回数: 4→2〜3回/日。血便: ほぼ消失（微量のみ）。CRP: 0.3mg/dL（正常範囲）。ステロイドは10mgに減量完了。先生「良い反応です。8週間隔の維持療法に移行します」。' },
        { timestamp: '2026-04-22T08:00:00Z', category: 'vitals', title: '3ヶ月後・寛解確認', content: 'インフリキシマブ4回目（14週）投与。Mayoスコア: 1点（寛解）。排便1〜2回/日。血便なし。CRP 0.1mg/dL。ステロイドは完全離脱（0mg）。「就活の面接に集中できるようになった」。次の内視鏡は3ヶ月後。食事制限も緩和中（乳製品以外はほぼ制限なし）。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 2, sleep_quality: 8 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 2, sleep_quality: 8 }
      ],
      bloodTests: [
        { timestamp: '2026-01-13T10:00:00Z', name: 'UC再燃時評価', findings: 'CRP 2.8mg/dL（高値）, 白血球 10,200, Hb 12.8g/dL（軽度低下）, アルブミン 3.5g/dL（低下傾向）, 便潜血（++++）, カルプロテクチン 1,250μg/g（高値）, Mayoスコア 8（中等症）' },
        { timestamp: '2026-04-22T10:00:00Z', name: '寛解時評価', findings: 'CRP 0.1mg/dL（正常）, Hb 14.2g/dL（正常）, アルブミン 4.1g/dL, カルプロテクチン 85μg/g（正常化傾向）, Mayoスコア 1（寛解）' }
      ],
      medications: [
        { timestamp: '2026-02-10T10:00:00Z', name: 'インフリキシマブ（レミケード）5mg/kg', notes: '8週ごと点滴（TNF-α阻害生物学的製剤・維持療法）' },
        { timestamp: '2026-01-13T10:00:00Z', name: 'メサラジン（アサコール）400mg', notes: '3錠×3回 = 3,600mg/日（5-ASA・寛解維持基本薬）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    panic: {
      diseases: ['パニック障害'],
      profile: { age: 32, gender: 'female', height: 160, weight: 52 },
      textEntries: [
        { timestamp: '2026-01-15T09:00:00Z', category: 'symptoms', title: '電車で突然の発作', content: '電車の中で突然、激しい動悸・息苦しさ・「このまま死ぬかもしれない」という恐怖感に襲われた。次の駅で降りて20分休んでようやく回復。過去2ヶ月で5回同じような発作があった。救急を2回受診したが心電図・血液検査は正常。心療内科を予約した。' },
        { timestamp: '2026-01-22T10:00:00Z', category: 'consultation', title: '心療内科受診・パニック障害診断', content: 'パニック障害の診断（ICD-10: F41.0）。発作は「過換気が引き起こす身体感覚の誤認」という心理教育を受けた。「今の発作は危険ではない。しかし回避を続けると広場恐怖に進展する」との説明。パロキセチン（パキシル）10mgを開始。「最初の2週間は気分が揺れることがある」。' },
        { timestamp: '2026-02-05T08:00:00Z', category: 'vitals', title: 'SSRI2週間後・副作用と発作減少', content: 'パロキセチン10mg→20mgに増量。最初の1週は吐き気・眠気あり（徐々に軽減）。発作頻度: 5回/2ヶ月→2回/2週間（まだある）。電車は今も怖くて乗れない。先生「薬が効いてくるまで4〜6週かかります。CBTも並行して始めましょう」。CBT担当のカウンセラー予約。' },
        { timestamp: '2026-02-19T09:00:00Z', category: 'activity', title: 'CBT第2回・腹式呼吸と認知再構成', content: 'CBT2回目。「発作中に"死ぬかもしれない"という考えは実際に起きていない。次に同じ考えが浮かんだら"これは不安感覚であって危険信号ではない"とリフレーミングする」。腹式呼吸（4秒吸・2秒止・6秒吐）の練習。呼吸法を1日2回練習することにした。' },
        { timestamp: '2026-03-10T10:00:00Z', category: 'consultation', title: '2ヶ月後・薬効確認と曝露療法開始', content: '発作頻度: 0回/3週間（寛解傾向！）。先生「パロキセチンの効果が出ています。次のステップとして、電車の曝露療法を段階的に行いましょう」。CBTセラピストと「曝露ヒエラルキー」を作成（①駅のホームに立つ→②1駅乗る→③朝の混雑時間に乗る）。' },
        { timestamp: '2026-04-15T08:00:00Z', category: 'vitals', title: '3ヶ月後・電車に乗れた', content: 'パロキセチン20mg継続中。発作: 過去6週間で1回（軽度・自分でコントロールできた）。曝露ヒエラルキー: ①②③すべて完了！「朝の混雑した電車で3駅乗れた」。予期不安スコア: 8→3に大幅改善。「まだ少し怖いが"怖いけど乗れる"に変わった」。CBTセッションを月1回に移行。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-01-22T10:00:00Z', name: 'パニック障害初回評価', findings: '心電図 正常（QT正常・不整脈なし）, 甲状腺機能 正常（TSH 1.8）, 血糖 88mg/dL（低血糖除外）, 24時間Holter心電図 正常（頻脈エピソードなし）, 心エコー 正常（WPW症候群除外）' }
      ],
      medications: [
        { timestamp: '2026-01-22T10:00:00Z', name: 'パロキセチン（パキシル）20mg', notes: '朝食後 1錠（SSRI・パニック障害第一選択・最低12ヶ月継続）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    ankylosing_spondylitis: {
      diseases: ['強直性脊椎炎（体軸性脊椎関節炎）'],
      profile: { age: 29, gender: 'male', height: 176, weight: 70 },
      textEntries: [
        { timestamp: '2026-01-08T08:00:00Z', category: 'symptoms', title: '朝のこわばりと炎症性腰痛', content: '朝起きると腰が1〜2時間こわばって動けない。動くと少し楽になる。座っているとかえって痛みが増す。20代から徐々にひどくなった。整形外科でヘルニアと言われたが、治療しても改善しない。ネットで「炎症性腰痛」を知り、リウマチ科を受診することにした。' },
        { timestamp: '2026-01-15T10:00:00Z', category: 'consultation', title: 'リウマチ科受診・axSpA診断', content: 'HLA-B27：陽性。骨盤MRI：両側仙腸関節に骨髄浮腫あり（STIR high signal）。CRP 1.8mg/dL（上昇）。BASDAIスコア: 7.2/10（高活動性）。「非X線性体軸性脊椎関節炎（nr-axSpA）の診断です。NSAIDsから始めましょう」。セレコキシブ200mg 朝夕が処方された。' },
        { timestamp: '2026-02-05T08:00:00Z', category: 'vitals', title: 'NSAID4週間後・効果限定的', content: 'セレコキシブ4週間後。朝のこわばり：120分→80分（改善傾向だが不十分）。BASDAIスコア: 7.2→5.8（改善しているが5以上は高活動性）。夜間痛：NRS 7→5。先生「NSAIDsの効果は部分的です。2剤目のNSAIDsに変えて3ヶ月様子を見た後、生物学的製剤の適応を考えます」。インドメタシン徐放錠に変更。' },
        { timestamp: '2026-03-10T10:00:00Z', category: 'consultation', title: '生物学的製剤（IL-17阻害薬）開始', content: 'BASDAIスコア: 5.4（NSAIDsで高活動性が持続→生物学的製剤の適応）。「アダリムマブ（TNF阻害）またはセクキヌマブ（IL-17阻害）から選べます。乾癬はないがIBD症状もないため、どちらでも可。日本の承認が新しいセクキヌマブ150mgを選びました」。隔週注射を自己注射で開始。' },
        { timestamp: '2026-04-07T10:00:00Z', category: 'consultation', title: '4週後の評価・著効確認', content: 'セクキヌマブ4週後。BASDAIスコア: 5.4→2.8（大幅改善・低活動性）。朝のこわばり：80分→15分！夜間痛: NRS 5→2（ほぼ消失）。CRP: 0.2mg/dL（正常）。「これほど改善するとは思わなかった。8週ごとの注射で維持療法に移行します」。水泳を週3回開始した。' },
        { timestamp: '2026-04-22T08:00:00Z', category: 'vitals', title: '3ヶ月・QOL劇的改善', content: 'BASDAIスコア: 2.1（非活動性に近い）。朝のこわばり: 5分のみ。「電車で座って通勤できるようになった」「仕事のデスクワークが苦じゃなくなった」「週3回の水泳が習慣に」。次のMRIで仙腸関節の骨髄浮腫の消退を確認予定。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 2, sleep_quality: 8 }
      ],
      bloodTests: [
        { timestamp: '2026-01-15T10:00:00Z', name: 'axSpA初回評価', findings: 'HLA-B27 陽性, CRP 1.8mg/dL（高値）, ESR 42mm/hr, 白血球 正常, MRI両側仙腸関節 骨髄浮腫あり（grade 2）, BASDAIスコア 7.2/10' },
        { timestamp: '2026-04-07T10:00:00Z', name: 'セクキヌマブ4週後評価', findings: 'CRP 0.2mg/dL（正常）, ESR 12mm/hr, BASDAIスコア 2.8/10（低活動性）, 副作用なし' }
      ],
      medications: [
        { timestamp: '2026-03-10T10:00:00Z', name: 'セクキヌマブ（コセンティクス）150mg', notes: '初回〜4週まで毎週・以後8週ごと自己注射（IL-17A阻害・axSpA）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    hyperthyroidism: {
      diseases: ['甲状腺機能亢進症（バセドウ病）'],
      profile: { age: 26, gender: 'female', height: 163, weight: 48 },
      textEntries: [
        { timestamp: '2026-01-10T09:00:00Z', category: 'symptoms', title: '動悸・体重減少・手の震え', content: '3ヶ月で5kg体重減少。食欲はあるのに痩せる。心拍数が常に100〜110拍/分で動悸がつらい。手が震えて文字が書きにくい。暑がりで汗が多い。首が太くなった感じ。不安感・イライラも増した。内科を受診したら甲状腺機能亢進症と言われ内分泌科を紹介された。' },
        { timestamp: '2026-01-17T10:00:00Z', category: 'consultation', title: '内分泌科受診・バセドウ病確定診断', content: '甲状腺エコー：びまん性腫大（30mL）。TSH <0.01μIU/mL（測定限界以下）。FT4 4.2ng/dL（正常0.8-1.8）。TRAb（TSH受容体抗体）: 21IU/L（強陽性・バセドウ病確定）。「チアマゾール（メルカゾール）30mgを開始します。4週後に血液検査を行います。発熱・咽頭痛が出たら即日受診を」。プロプラノロール20mg 朝夕も追加。' },
        { timestamp: '2026-01-24T08:00:00Z', category: 'vitals', title: 'チアマゾール1週間後', content: 'チアマゾール1週間後。心拍数: 108→92bpm。体重: 48→48.5kg（微増傾向）。「動悸が少し楽になった」。発熱・咽頭痛なし（副作用なし確認）。プロプラノロールで安静時心拍85前後に安定しつつある。' },
        { timestamp: '2026-02-14T10:00:00Z', category: 'consultation', title: '4週後・甲状腺機能の正常化', content: 'TSH: 0.03μIU/mL（まだ低値だが改善）。FT4: 2.1ng/dL（高値だが改善）。「チアマゾールが効いています。20mgに減量し、4週後に再検査」。TRAb: 18IU/L（まだ高い）。心拍数: 78bpm（正常化）。プロプラノロールを中止。体重: 49.5kg（1.5kg増加）。' },
        { timestamp: '2026-03-14T10:00:00Z', category: 'vitals', title: '2ヶ月後・ほぼ正常化', content: 'TSH: 0.4μIU/mL（正常低値）。FT4: 1.5ng/dL（正常範囲内！）。チアマゾール10mgに減量。「動悸・震え・暑さは消失」。体重: 51kg（発症前の体重に回復）。「再発率は30〜50%。寛解後18〜24ヶ月は服薬を続けましょう」。TRAb：12IU/L（低下中）。' },
        { timestamp: '2026-04-22T08:00:00Z', category: 'vitals', title: '3ヶ月・安定化', content: 'TSH: 1.2μIU/mL（完全正常化）。FT4: 1.2ng/dL（正常）。チアマゾール5mgに減量（低用量維持）。TRAb: 6IU/L（正常化に近づく）。「発症前の状態に戻った感覚」。再発のリスクを下げるため、ストレス管理・禁煙（非喫煙）・定期的なチェックを継続。眼症状はなし。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 2, sleep_quality: 8 }
      ],
      bloodTests: [
        { timestamp: '2026-01-17T10:00:00Z', name: 'バセドウ病初診評価', findings: 'TSH <0.01μIU/mL（測定不能）, FT4 4.2ng/dL（高値）, FT3 9.8pg/mL（高値）, TRAb 21IU/L（強陽性・バセドウ病確定）, 白血球 正常（8,200）, 肝機能 正常, 甲状腺エコー びまん性腫大30mL' },
        { timestamp: '2026-04-22T10:00:00Z', name: '3ヶ月後評価', findings: 'TSH 1.2μIU/mL（正常）, FT4 1.2ng/dL（正常）, TRAb 6IU/L（正常化傾向）, 白血球 正常' }
      ],
      medications: [
        { timestamp: '2026-01-17T10:00:00Z', name: 'チアマゾール（メルカゾール）5mg', notes: '1錠/日（30mg→5mg に減量・低用量維持療法）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    narcolepsy: {
      diseases: ['ナルコレプシー・特発性過眠症'],
      profile: { age: 19, gender: 'male', height: 174, weight: 65 },
      textEntries: [
        { timestamp: '2026-01-06T08:00:00Z', category: 'symptoms', title: '高校からの居眠りが大学でも続く', content: '高校1年から授業中に止められない眠気が続いていた。当時は「怠け者」と思われた。大学入学後もひどくなる一方で、笑ったり驚いたりすると膝が崩れる感覚（情動脱力発作？）が月2〜3回ある。ESS（エプワース眠気尺度）: 19/24点（重度過眠）。大学の保健センターで睡眠専門科を紹介された。' },
        { timestamp: '2026-01-20T10:00:00Z', category: 'consultation', title: '睡眠専門科受診・ナルコレプシー1型診断', content: '終夜睡眠検査（PSG）：REM潜時8分（正常>20分）・REM 4エピソード/夜。反復睡眠潜時検査（MSLT）：平均睡眠潜時3.2分（<8分で異常）・SOREMPsあり。髄液オレキシン（ヒポクレチン-1）：68pg/mL（基準値<110で1型確定）。HLA-DQB1*06:02 陽性。「ナルコレプシー1型の確定診断です。モダフィニルを開始しましょう」。' },
        { timestamp: '2026-01-27T08:00:00Z', category: 'vitals', title: 'モダフィニル開始1週間後', content: 'モダフィニル200mg 朝食後 開始1週間。日中の眠気が「劇的に改善」。午後の授業を初めて最後まで起きていられた。ESS: 19→13点（改善）。情動脱力発作は継続（笑うと膝が崩れる）。計画仮眠（昼食後12時15分〜12時35分・20分）も開始。' },
        { timestamp: '2026-02-10T10:00:00Z', category: 'consultation', title: '3週後・情動脱力への追加治療', content: 'ESS: 13→9点（10点未満・目標達成）。モダフィニルの効果は良好。「情動脱力発作はモダフィニルでは改善しません。クロミプラミン（アナフラニール）10mgを就寝前に追加しましょう」。クロミプラミン追加。1週間後に情動脱力が月2〜3回→0〜1回に激減。' },
        { timestamp: '2026-03-10T08:00:00Z', category: 'activity', title: '計画仮眠の効果が定着', content: '計画仮眠（昼・夕方×各20分）を習慣化。「仮眠後30分は頭が非常に鮮明」。1限の授業（8:30〜）が一番辛いため、7時15分に自宅を出て大学の仮眠室を利用するルーティンが確立した。指定難病の申請も完了し、医療費助成を受けられるようになった。' },
        { timestamp: '2026-04-15T08:00:00Z', category: 'vitals', title: '大学2年・安定した日常', content: 'ESS: 8点（正常範囲内！）。情動脱力発作: 月0〜1回（ほぼ消失）。「サークル活動に参加できるようになった」「友達に病気を打ち明けたら理解してもらえた」。モダフィニル+クロミプラミン継続。指定難病の公的サポートで医療費の自己負担が軽減されている。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-01-20T10:00:00Z', name: 'ナルコレプシー確定診断', findings: 'MSLT 平均睡眠潜時 3.2分（<8分・異常）, SOREMPs 4/5回, PSG REM潜時 8分（<15分・異常）, 髄液オレキシン-1 68pg/mL（<110pg/mL・1型確定）, HLA-DQB1*06:02 陽性' }
      ],
      medications: [
        { timestamp: '2026-01-27T08:00:00Z', name: 'モダフィニル（モディオダール）200mg', notes: '朝食後 1錠（覚醒促進薬・日中過眠の第一選択）' },
        { timestamp: '2026-02-10T10:00:00Z', name: 'クロミプラミン（アナフラニール）10mg', notes: '就寝前 1錠（三環系抗うつ薬・情動脱力発作の抑制）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    osteoarthritis: {
      diseases: ['変形性関節症（OA）'],
      profile: { age: 68, gender: 'female', height: 155, weight: 65 },
      textEntries: [
        { timestamp: '2026-01-08T08:00:00Z', category: 'symptoms', title: '膝の痛みで階段が辛い', content: '両膝の痛みが1年前から悪化。特に右膝がひどく、朝起きて15分ほどこわばる。階段の上り下りがつらく、買い物も短時間しかできない。体重が10年で8kg増加した。近所の整形外科でX線を撮ると「変形性膝関節症のグレード3（中等度）」と言われた。' },
        { timestamp: '2026-01-15T10:00:00Z', category: 'consultation', title: '整形外科受診・OAグレード3診断', content: 'X線：Kellgren-Lawrence分類 右膝Grade 3（関節裂隙狭小・骨棘形成・硬化）、左膝Grade 2。WOMAC初期スコア: 疼痛16/20・機能49/68・こわばり6/8。「変形性膝関節症の中等症です。ヒアルロン酸注射・ロキソプロフェン・体重管理・大腿四頭筋訓練から始めましょう」。週1回のヒアルロン酸注射（5回コース）開始。' },
        { timestamp: '2026-02-05T10:00:00Z', category: 'vitals', title: 'ヒアルロン酸5回コース終了', content: 'ヒアルロン酸関節内注射5回終了。右膝痛NRS: 8→5（改善）。朝のこわばり: 15分→8分。歩行距離: 100m→300m（大幅改善）。「スーパーの買い物をカートなしでできた」。体重: 65kg→63.5kg（1.5kg減）。大腿四頭筋訓練（膝伸展運動・1日2回）を毎日実施。' },
        { timestamp: '2026-03-10T10:00:00Z', category: 'consultation', title: '2ヶ月後の再診・デュロキセチン追加', content: 'WOMAC: 疼痛16→11・機能49→36（改善）。「ヒアルロン酸の効果はあります。ただ、夜間痛が残っているため中枢性疼痛感作への対策としてデュロキセチン（サインバルタ）20mgを追加しましょう」。次のヒアルロン酸注射コースを3ヶ月後に予定。' },
        { timestamp: '2026-04-07T08:00:00Z', category: 'vitals', title: '3ヶ月後・体重減少で症状改善', content: '体重: 65kg→61kg（4kg減・目標5%達成）。右膝痛NRS: 5→3（「電車の座席でも楽に座れるようになった」）。夜間痛: ほぼ消失。朝のこわばり: 5分以内。歩行距離: 500m以上。「週3回の水中ウォーキングと膝体操が習慣に。デュロキセチンも夜間痛に効いている」。' },
        { timestamp: '2026-04-22T10:00:00Z', category: 'vitals', title: '4ヶ月目・安定した生活', content: 'WOMAC: 疼痛8・機能28・こわばり3（全項目改善）。体重: 60.5kg（当初から4.5kg減）。「孫を連れて公園を30分歩けた」。次のヒアルロン酸コースは6月予定。人工関節手術は今のところ検討していない。リハビリを続けて現在の状態を維持する。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-01-15T10:00:00Z', name: 'OA初回評価', findings: 'X線 右膝 Kellgren-Lawrence Grade 3, 左膝 Grade 2, WOMAC初期スコア 71/96（中等症）, CRP 0.2mg/dL（正常）, 尿酸 4.8mg/dL（正常）, RF 陰性（RA除外）, 血糖 108, HbA1c 6.1%' }
      ],
      medications: [
        { timestamp: '2026-01-15T10:00:00Z', name: 'ヒアルロン酸ナトリウム注射（サイビスク）', notes: '週1回 関節内注射×5回コース（潤滑・衝撃吸収・軟骨保護）' },
        { timestamp: '2026-03-10T10:00:00Z', name: 'デュロキセチン（サインバルタ）20mg', notes: '夕食後 1錠（中枢性疼痛感作・夜間痛に有効）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    sjogrens: {
      diseases: ['シェーグレン症候群'],
      profile: { age: 52, gender: 'female', height: 158, weight: 52 },
      textEntries: [
        { timestamp: '2026-01-10T09:00:00Z', category: 'symptoms', title: '口と目が乾いて辛い', content: '2年前から口の乾きがひどく、食事中も水が必要。目も乾いて「砂が入ったような」感覚が一日中続く。疲れやすく、午後は仕事に集中できない。かかりつけ医から眼科・リウマチ科へ紹介。' },
        { timestamp: '2026-01-25T10:00:00Z', category: 'consultation', title: 'リウマチ科受診・シェーグレン症候群診断', content: 'シルマーテスト右5mm/左4mm（正常≥10mm）、抗SS-A抗体480U/mL（強陽性）、抗SS-B抗体120U/mL（陽性）、IgG 2,400mg/dL（高値）、C4 10mg/dL（低値）。「原発性シェーグレン症候群の確定診断です。ESSDAIスコア8（中等度活動性）。ヒドロキシクロロキン（プラケニル）とピロカルピン（サラジェン）から開始しましょう」。' },
        { timestamp: '2026-02-20T10:00:00Z', category: 'vitals', title: '1ヶ月後・乾燥症状が少し改善', content: '口腔乾燥VAS: 8→6、眼乾燥VAS: 7→5。ピロカルピン5mg 1日3回で発汗・顔のほてりが出るが、乾燥には効果あり。人工涙液ヒアルロン酸点眼を1日6回使用。ヒドロキシクロロキンは効果発現まで2〜3ヶ月かかると説明を受けた。' },
        { timestamp: '2026-03-15T10:00:00Z', category: 'consultation', title: '3ヶ月後の再診・疲労改善', content: 'ESSDAIスコア: 8→5（低活動性）。口腔乾燥VAS: 6→4。眼乾燥VAS: 5→3。「ヒドロキシクロロキンの効果が出てきています。疲労感も改善傾向。IgG 2,400→1,980mg/dL（低下）。6ヶ月に1回の眼科検査（網膜症スクリーニング）を予定。リンパ節腫大・体重減少には注意を」。' },
        { timestamp: '2026-04-10T08:00:00Z', category: 'vitals', title: '4ヶ月目・日常生活が戻ってきた', content: '午後の疲労NRS: 8→5。「午後も仕事に集中できる時間が増えた」。口腔乾燥VAS: 4。食事中の水が減り、普通に会話できる。唾液腺マッサージを毎日実施。う蝕予防フッ素うがい・キシリトールガムを継続。眼乾燥VAS: 3。コンタクトレンズは断念した。' },
        { timestamp: '2026-04-28T09:00:00Z', category: 'vitals', title: '安定期・リンパ腫サーベイランス', content: 'ESSDAIスコア: 4（低活動性を維持）。口腔乾燥VAS: 3、眼乾燥VAS: 3。体重安定、リンパ節腫大なし。3ヶ月に1回の血液検査（IgG・C4・LDH）でリンパ腫サーベイランス継続。「ヒドロキシクロロキンを続ける限りはこの状態を維持できると思います」。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 4, sleep_quality: 7 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 4, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-01-25T10:00:00Z', name: '初回血液検査', findings: '抗SS-A抗体 480 U/mL (強陽性), 抗SS-B抗体 120 U/mL (陽性), IgG 2400 mg/dL (高値), C4 10 mg/dL (低値), LDH 185 IU/L (正常), RF 64 IU/mL (弱陽性), シルマーテスト 右5mm 左4mm (低下)' }
      ],
      medications: [
        { timestamp: '2026-01-25T10:00:00Z', name: 'ヒドロキシクロロキン（プラケニル）200mg', notes: '1日2回 朝夕食後（疲労・関節痛・腺外症状に有効。眼科検査必須）' },
        { timestamp: '2026-01-25T10:00:00Z', name: 'ピロカルピン（サラジェン）5mg', notes: '1日3回 食前（唾液・涙液分泌促進。発汗・腹痛の副作用あり）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    atrial_fibrillation: {
      diseases: ['心房細動'],
      profile: { age: 67, gender: 'male', height: 170, weight: 78 },
      textEntries: [
        { timestamp: '2026-01-06T07:00:00Z', category: 'symptoms', title: '急に脈がバラバラになった', content: '朝起きたら「心臓がドキドキして脈がバラバラ」。息切れと軽いめまいが1時間続いたため救急搬送。心電図で心房細動（持続性）と診断。安静時心拍数 125回/分（不規則）。「脳梗塞のリスクが高いため、すぐに抗凝固薬を開始します」と告げられた。' },
        { timestamp: '2026-01-06T15:00:00Z', category: 'consultation', title: '救急・心房細動診断・DOAC開始', content: '12誘導心電図：絶対性不整脈・f波。心エコー：左房径 46mm（拡大）、弁膜症なし。CHA₂DS₂-VAScスコア: 4（高リスク）。「アピキサバン（エリキュース）5mg 1日2回を開始します。脳梗塞リスクが年5〜7%あります。レートコントロールのためビソプロロール2.5mgも追加」。カテーテルアブレーション（肺静脈隔離術）を2ヶ月後に予定。' },
        { timestamp: '2026-01-25T08:00:00Z', category: 'vitals', title: '3週間後・心拍コントロール改善', content: '安静時心拍: 125→82回/分（コントロール良好）。動悸の自覚症状: NRS 7→4。「ビソプロロールで脈が落ち着いた。ただ時々バラバラ感がある」。血圧 132/78mmHg。アピキサバン継続中・出血症状なし。6分間歩行テスト: 420m（発症前より低下）。アブレーション前の準備として心臓CT予定。' },
        { timestamp: '2026-03-05T10:00:00Z', category: 'consultation', title: 'カテーテルアブレーション施行', content: '肺静脈隔離術（PVI）+後壁隔離。手術時間3.5時間。術後：洞調律回復、心拍数68回/分（規則正し）。「肺静脈の4本すべてを隔離しました。成功です。アピキサバンは術後2ヶ月継続後に評価、ビソプロロールは漸減予定」。2日後に退院。' },
        { timestamp: '2026-04-05T08:00:00Z', category: 'vitals', title: 'アブレーション1ヶ月後・洞調律維持', content: '1ヶ月後の外来で洞調律を確認（Holter心電図 24時間モニタリング：AF再発なし）。動悸: 消失。6分間歩行: 520m（改善）。体重: 78→75kg（3kg減）。アルコールを週3合→週1合に減量。「洞調律が維持できています。3ヶ月後にアピキサバン継続か中止かを評価します」。' },
        { timestamp: '2026-04-28T08:00:00Z', category: 'vitals', title: '4ヶ月後・安定維持', content: 'Holter心電図（再検）：洞調律維持・PAC散見・AF再発なし。「術後4ヶ月での洞調律維持は良い経過です。アピキサバンをあと2ヶ月継続後、CHA₂DS₂-VAScスコアを再評価して中止を検討します」。ビソプロロール1.25mgに漸減。睡眠時無呼吸の精査（CPAP検討）の紹介状を受け取った。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-01-06T15:00:00Z', name: '救急時・初期評価', findings: '心電図 絶対性不整脈, 心拍125回/分, TSH 1.8 mIU/L (正常・甲状腺性除外), eGFR 72 mL/min/1.73m², HbA1c 6.4%, 血清K 4.1 mEq/L, CRP 0.3 mg/dL, BNP 185 pg/mL (中等度上昇), 心エコー 左房径46mm' }
      ],
      medications: [
        { timestamp: '2026-01-06T15:00:00Z', name: 'アピキサバン（エリキュース）5mg', notes: '1日2回 朝夕食後（脳梗塞・全身性塞栓症予防。出血に注意）' },
        { timestamp: '2026-01-06T15:00:00Z', name: 'ビソプロロール2.5mg', notes: '朝食後1錠（レートコントロール→術後1.25mgに漸減）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    myasthenia: {
      diseases: ['重症筋無力症'],
      profile: { age: 34, gender: 'female', height: 162, weight: 54 },
      textEntries: [
        { timestamp: '2026-01-12T08:00:00Z', category: 'symptoms', title: '右目が下がってきた・夕方に二重に見える', content: '2ヶ月前から夕方になると右まぶたが重くなる。「物が二重に見える（複視）」が1週間前から出始めた。朝起きたときは問題ないが夕方は目が開けにくい。神経内科に紹介された。' },
        { timestamp: '2026-01-20T10:00:00Z', category: 'consultation', title: '神経内科受診・重症筋無力症（眼筋型）診断', content: 'アイスパックテスト陽性（冷却で眼瞼下垂改善）。エドロホニウム試験陽性。AChR抗体 15.3 nmol/L（強陽性）。胸部CT：胸腺腫なし。「眼筋型重症筋無力症の確定診断です。ピリドスチグミン60mg 1日3回から開始します」。QMGスコア（眼筋項目）: 8/12。' },
        { timestamp: '2026-02-05T08:00:00Z', category: 'vitals', title: '2週間後・ピリドスチグミン効果確認', content: '右眼瞼下垂: 朝なし・夕方軽度。複視: 激減（1日1〜2回、短時間）。「薬が効いています。服薬30分後が一番調子が良い」。服薬3回 → 4回に増量。QMGスコア: 8→4（改善）。プレドニゾロン隔日10mgを追加。' },
        { timestamp: '2026-03-10T10:00:00Z', category: 'consultation', title: '2ヶ月後の再診・全身型への移行懸念', content: '先週から「食事中に噛みにくい・飲み込みにくい」症状が出現。「眼筋型から全身型への移行の可能性があります。プレドニゾロンを20mg/日に増量し、タクロリムス（プログラフ）1mgを追加します」。嚥下スクリーニング：軽度の嚥下障害。入院での精密評価を勧められたが外来加療を選択。' },
        { timestamp: '2026-04-08T08:00:00Z', category: 'vitals', title: '3ヶ月後・嚥下障害改善・軽快', content: '嚥下障害: ほぼ消失（「普通に食事ができる」）。右眼瞼下垂: 朝なし・夕方ほぼなし。複視: 消失。QMGスコア: 4→2（著明改善）。AChR抗体: 15.3→8.1 nmol/L（低下）。プレドニゾロン15mgに漸減開始。「タクロリムスが効いてきました」。' },
        { timestamp: '2026-04-25T09:00:00Z', category: 'vitals', title: '4ヶ月後・安定・就労継続中', content: 'QMGスコア: 2（最小限の症状）。眼瞼下垂・複視: 消失。嚥下: 正常。「フルタイム勤務に戻れた」。プレドニゾロン10mg/日（隔日投与に向けて漸減中）。タクロリムス継続。「クリーゼ誘発薬（フルオロキノロン系抗菌薬など）は絶対に避けてください」と繰り返し説明を受けた。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 2, sleep_quality: 8 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 2, sleep_quality: 8 }
      ],
      bloodTests: [
        { timestamp: '2026-01-20T10:00:00Z', name: '初回血液検査', findings: 'AChR抗体 15.3 nmol/L (強陽性), MuSK抗体 陰性, 抗核抗体 1:40 (弱陽性), TSH 1.5 mIU/L (正常), CK 78 IU/L (正常), 胸部CT 胸腺腫なし' }
      ],
      medications: [
        { timestamp: '2026-01-20T10:00:00Z', name: 'ピリドスチグミン（メスチノン）60mg', notes: '1日4回 食前（コリンエステラーゼ阻害・症状対症。服薬30〜60分後が効果のピーク）' },
        { timestamp: '2026-02-05T10:00:00Z', name: 'プレドニゾロン10mg', notes: '隔日服用（免疫抑制）→20mg/日→15mg/日に増量後漸減' },
        { timestamp: '2026-03-10T10:00:00Z', name: 'タクロリムス（プログラフ）1mg', notes: '夕食後（免疫抑制・ステロイド減量補助。血中濃度モニタリング必要）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    pcos: {
      diseases: ['多嚢胞性卵巣症候群（PCOS）'],
      profile: { age: 27, gender: 'female', height: 162, weight: 67 },
      textEntries: [
        { timestamp: '2026-01-08T09:00:00Z', category: 'symptoms', title: '生理が3〜4ヶ月こない・体重増加', content: '高校生のころから生理不順。最近は3〜4ヶ月生理が来ないことも。顎や首筋に産毛が増え、にきびが治らない。体重がここ2年で8kg増加。婦人科を受診した。' },
        { timestamp: '2026-01-15T10:00:00Z', category: 'consultation', title: '婦人科受診・PCOS確定診断', content: '経腟超音波: 両卵巣多嚢胞像（12個以上の小卵胞/卵巣）。血液検査: LH 12.3 mIU/mL（高値）、FSH 5.1 mIU/mL（正常）、LH/FSH比 2.4（>2でPCOS基準）、テストステロン 0.68 ng/mL（高値）、インスリン 18.5 μIU/mL（高値）、HOMA-IR 3.8（インスリン抵抗性）。「多嚢胞性卵巣症候群（PCOS）の確定診断です。メトホルミンと低用量ピルから始めましょう」。' },
        { timestamp: '2026-02-10T08:00:00Z', category: 'vitals', title: '1ヶ月後・体重減少開始', content: '低GI食・週150分の有酸素運動を開始。体重: 67→65kg（2kg減）。メトホルミン500mg 1日2回（消化器症状軽度・食後服薬で改善）。低用量ピル（LEP）服薬開始。月経: まだ来ていないが腹部の不快感が減少。にきびが少し減ったと感じる。' },
        { timestamp: '2026-03-15T10:00:00Z', category: 'consultation', title: '2ヶ月後の再診・ホルモン改善', content: 'インスリン: 18.5→12.1 μIU/mL（改善）。HOMA-IR: 3.8→2.3（改善）。LH: 12.3→8.1（低下）。テストステロン: 0.68→0.45 ng/mL（低下）。体重: 64kg。「メトホルミンとピルの効果が出ています。6ヶ月後に排卵有無を評価します。不妊希望がある場合はその時点でピル中止・排卵誘発に移行します」。' },
        { timestamp: '2026-04-10T08:00:00Z', category: 'vitals', title: '3ヶ月後・生活改善で体調向上', content: '体重: 63.5kg（当初から3.5kg減・約5%減達成）。にきび: 顎・額ともに著明改善。多毛: 顎のうぶ毛が減少してきた。エネルギー: 午後の眠気が減った。食事日記で精製炭水化物を減らした効果が実感できている。ピルの副作用（むくみ）は軽度で継続できている。' },
        { timestamp: '2026-04-28T09:00:00Z', category: 'vitals', title: '4ヶ月後・安定・妊娠計画を相談', content: 'HOMA-IR: 1.9（正常域到達）。LH/FSH比: 1.5（正常化）。テストステロン: 0.38 ng/mL（正常範囲内）。「ホルモン値が大幅に改善しました。妊娠を希望するタイミングでピルを中止し、クロミフェン・レトロゾールによる排卵誘発に進みます」。現在は不妊希望まだなくピル継続中。2型糖尿病リスクの定期スクリーニング（年1回HbA1c）を開始した。' }
      ],
      symptoms: [
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-08T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-22T08:00:00Z', fatigue_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-01-15T10:00:00Z', name: '初回ホルモン検査', findings: 'LH 12.3 mIU/mL (高値), FSH 5.1 mIU/mL, LH/FSH比 2.4 (高値), テストステロン 0.68 ng/mL (高値), インスリン 18.5 μIU/mL, HOMA-IR 3.8 (インスリン抵抗性), HbA1c 5.7%, LDL 118 mg/dL, 経腟超音波: 両卵巣多嚢胞像 (12個以上/卵巣)' }
      ],
      medications: [
        { timestamp: '2026-01-15T10:00:00Z', name: 'メトホルミン塩酸塩500mg', notes: '1日2回 食直後（インスリン抵抗性改善・消化器症状軽減のため食後服用）' },
        { timestamp: '2026-01-15T10:00:00Z', name: '低用量エストロゲン・プロゲスチン配合薬（LEP）', notes: '毎日1錠（月経調整・アンドロゲン抑制・子宮内膜保護）' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    gerd: {
      diseases: ['逆流性食道炎（GERD）'],
      profile: { age: 51, gender: 'male', height: 170, weight: 78 },
      textEntries: [
        { timestamp: '2026-03-18T21:00:00Z', category: 'symptoms', title: '胸焼け記録開始', content: '夕食（天ぷら定食）の約1時間後から胸焼けがひどい。逆流感もある。PPI（ネキシウム20mg）は食後に飲んでいた。' },
        { timestamp: '2026-03-20T08:00:00Z', category: 'medication', title: 'PPI服用タイミング変更', content: '医師に相談しPPIを食前30分前に変更。今日の朝は食前に服用。' },
        { timestamp: '2026-03-23T21:30:00Z', category: 'symptoms', title: '', content: '食前PPI3日目。昨夜の胸焼けは弱くなってきた気がする。食事は天ぷらを避け、脂肪少なめにした。' },
        { timestamp: '2026-03-27T09:00:00Z', category: 'nutrition', title: 'トリガー特定', content: 'コーヒーを2杯飲んだ後に逆流感が増した。チョコレートも気になっていた。カフェインを減らしてみる。' },
        { timestamp: '2026-04-02T22:00:00Z', category: 'symptoms', title: '夜間症状', content: 'のどの異物感（梅核気）が続いている。夜中3時頃に胸焼けで目が覚めた。枕を高くしてみる。' },
        { timestamp: '2026-04-05T09:00:00Z', category: 'vitals', title: '頭部挙上就寝開始', content: '楔型枕を購入。頭部を15cm高くして就寝。夜間覚醒が減った。' },
        { timestamp: '2026-04-10T21:00:00Z', category: 'symptoms', title: '改善実感', content: '胸焼け頻度: 毎日 → 週2-3回に減少。食後3時間の就寝禁止ルールを守っている。体重も1kg減った。' },
        { timestamp: '2026-04-18T09:00:00Z', category: 'nutrition', title: '食事記録継続', content: '高脂肪食・コーヒー・アルコールを控えたところ症状がかなり安定。医師提出用に記録を整理したい。' }
      ],
      symptoms: [
        { timestamp: '2026-03-18T08:00:00Z', fatigue_level: 3, sleep_quality: 4, pain_level: 3 },
        { timestamp: '2026-03-25T08:00:00Z', fatigue_level: 3, sleep_quality: 5, pain_level: 2 },
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 2, sleep_quality: 6, pain_level: 1 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 2, sleep_quality: 7, pain_level: 1 }
      ],
      bloodTests: [
        { timestamp: '2026-03-15T10:00:00Z', name: '上部消化管内視鏡検査', findings: 'びらん性GERD（LA分類 grade B）。Barrett食道なし。H. pylori 陰性。' }
      ],
      medications: [
        { timestamp: '2026-03-18T08:00:00Z', name: 'エソメプラゾール（ネキシウム）20mg', notes: '食前30分に服用に変更。毎朝継続中。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    neuropathy: {
      diseases: ['末梢神経障害（糖尿病性ニューロパチー）'],
      profile: { age: 63, gender: 'female', height: 158, weight: 68 },
      textEntries: [
        { timestamp: '2026-03-08T08:00:00Z', category: 'symptoms', title: 'しびれ記録開始', content: '両足の裏のしびれ NRS 6/10。「靴下を履いたような」感覚。夜間に悪化。HbA1c 8.2%。糖尿病歴15年。神経内科を受診しプレガバリン 75mg を開始。' },
        { timestamp: '2026-03-12T08:00:00Z', category: 'medication', title: 'プレガバリン開始1週間', content: 'プレガバリン 75mg/日（就寝前）開始。眠気が強く、朝のふらつきあり。しびれは NRS 5/10 に若干改善した気がする。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'vitals', title: '血糖記録', content: 'HbA1c 8.2%→7.8%（2ヶ月で改善）。空腹時血糖 145→118 mg/dL。食事制限を徹底した。神経障害の改善は血糖管理が鍵だと実感。' },
        { timestamp: '2026-03-28T08:00:00Z', category: 'symptoms', title: '転倒エピソード', content: '夜中にトイレに行くときに足元がふらついて転倒しそうになった。バランス感覚の低下を感じる。暗がりでの深部感覚障害が怖い。階段は手すりを使うことにした。' },
        { timestamp: '2026-04-10T08:00:00Z', category: 'medication', title: 'プレガバリン増量', content: 'プレガバリン 75mg→150mg に増量（主治医指示）。眠気は慣れてきた。しびれ NRS 4/10 に改善。夜間の痛みが減った。' },
        { timestamp: '2026-04-20T09:00:00Z', category: 'symptoms', title: 'フットケア開始', content: '足の定期観察を始めた。右足の親指に小さな水ぶくれを発見（痛みを感じていなかった）。傷があると感染リスクが高いため、皮膚科を受診して処置してもらった。' },
        { timestamp: '2026-04-28T08:00:00Z', category: 'symptoms', title: '1ヶ月半の変化', content: 'しびれ NRS 平均 6→3.5 に改善。HbA1c 7.6%（目標 7%以下に向け継続）。プレガバリン 150mg の眠気は慣れた。転倒なし。フットケア継続中。' }
      ],
      symptoms: [
        { timestamp: '2026-03-08T08:00:00Z', fatigue_level: 5, sleep_quality: 4, pain_level: 6 },
        { timestamp: '2026-03-28T08:00:00Z', fatigue_level: 5, sleep_quality: 5, pain_level: 5 },
        { timestamp: '2026-04-10T08:00:00Z', fatigue_level: 4, sleep_quality: 6, pain_level: 4 },
        { timestamp: '2026-04-28T08:00:00Z', fatigue_level: 3, sleep_quality: 6, pain_level: 3 }
      ],
      bloodTests: [
        { timestamp: '2026-03-05T10:00:00Z', name: '糖尿病管理・神経障害検査', findings: 'HbA1c 8.2%、空腹時血糖 145 mg/dL、LDL 118 mg/dL、ビタミン B12 312 pg/mL（正常）、神経伝導速度検査：感覚神経伝導速度低下（足部）' }
      ],
      medications: [
        { timestamp: '2026-03-08T08:00:00Z', name: 'プレガバリン（リリカ）75mg', notes: '就寝前。3/28 より 150mg に増量。眠気・ふらつきのモニタリング継続。' },
        { timestamp: '2026-01-01T08:00:00Z', name: 'メコバラミン（メチコバール）500μg', notes: '毎朝。ビタミン B12 補充・神経修復サポート。' },
        { timestamp: '2026-01-01T08:00:00Z', name: 'エパルレスタット（キネダック）', notes: '毎食前。糖尿病性神経障害の進行抑制。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    als: {
      diseases: ['ALS（筋萎縮性側索硬化症）'],
      profile: { age: 61, gender: 'male', height: 171, weight: 67 },
      textEntries: [
        { timestamp: '2026-03-05T09:00:00Z', category: 'symptoms', title: 'ALSFRS-R 記録（3月）', content: 'ALSFRS-R 合計 42点。言語 4、唾液 4、嚥下 4、筆記 3、切る 3、食事 4、着替え 4、歩行 3、階段 3、呼吸補助 4、臥位呼吸 4、呼吸不全 4。右手の筋力が更に低下。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'medication', title: 'リルゾール継続', content: 'リルゾール 50mg×2回/日継続中。副作用なし。肝機能（ALT/AST）は正常範囲内。エダラボン点滴は来週予定。' },
        { timestamp: '2026-03-20T10:00:00Z', category: 'symptoms', title: '呼吸機能検査', content: 'FVC 74%（前回 78%）。夜間の息苦しさはまだない。NPPV 導入の目安（50%）まで余裕あり。酸素飽和度 97-98%。' },
        { timestamp: '2026-03-28T14:00:00Z', category: 'symptoms', title: '音声銀行録音', content: '音声銀行の録音を開始。VOVE に200文章録音済み。発話はまだ聞き取れるが早めに録音しておきたい。' },
        { timestamp: '2026-04-05T09:00:00Z', category: 'symptoms', title: 'ALSFRS-R 記録（4月）', content: 'ALSFRS-R 合計 39点（先月比 -3）。筆記 2、切る 2、歩行 2 に低下。補装具（AFO）を左足に装着開始。' },
        { timestamp: '2026-04-15T10:00:00Z', category: 'symptoms', title: '視線入力装置導入', content: 'Tobii Dynavox を試用。視線入力でのタイピングを練習中。最初は疲れるが徐々に慣れてきた。' },
        { timestamp: '2026-04-25T09:00:00Z', category: 'symptoms', title: '次回受診準備', content: 'ALSFRS-R の推移グラフ・FVC・症状変化をまとめた。SOD1遺伝子検査の結果（陰性）を確認。tofersen は対象外。次回受診で胃瘻の時期について相談予定。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 5, brain_fog: 1, sleep_quality: 6, pain_level: 2 },
        { timestamp: '2026-04-05T09:00:00Z', fatigue_level: 6, brain_fog: 1, sleep_quality: 5, pain_level: 2 },
        { timestamp: '2026-04-25T09:00:00Z', fatigue_level: 7, brain_fog: 2, sleep_quality: 5, pain_level: 3 }
      ],
      bloodTests: [
        { timestamp: '2026-03-12T10:00:00Z', name: '定期血液検査（リルゾール管理）', findings: 'ALT 28 U/L、AST 24 U/L、肝機能正常。CK 320 U/L（筋崩壊マーカー・軽度上昇）。FVC 74%。' }
      ],
      medications: [
        { timestamp: '2026-01-10T08:00:00Z', name: 'リルゾール（リルテック）50mg', notes: '朝夕食前。肝機能を月1回モニタリング。' },
        { timestamp: '2026-02-01T10:00:00Z', name: 'エダラボン（ラジカット）', notes: '月1回点滴（10日間連続→14日休薬サイクル）。外来点滴。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    cptsd: {
      diseases: ['複雑性PTSD（C-PTSD）'],
      profile: { age: 35, gender: 'female', height: 162, weight: 55 },
      textEntries: [
        { timestamp: '2026-03-05T21:00:00Z', category: 'symptoms', title: 'フラッシュバック記録', content: '職場で上司に強い口調で指摘された後、強烈なフラッシュバック（幼少期の記憶）。胸が苦しく、1時間職場トイレにこもった。感情爆発 9/10。' },
        { timestamp: '2026-03-08T09:00:00Z', category: 'medication', title: 'EMDR 開始', content: '心療内科でEMDR第1回。安全な場所のイメージを確立。今日は処理はせず、安定化のみ。セラピスト信頼できそう。' },
        { timestamp: '2026-03-15T21:00:00Z', category: 'symptoms', title: 'グラウンディング実践', content: '夜中にフラッシュバック。5-4-3-2-1 法を試した。10分ほどで現実に戻れた（以前は30分以上かかった）。記録することで「必ず終わる」と実感できてきた。' },
        { timestamp: '2026-03-22T09:00:00Z', category: 'symptoms', title: 'トリガー記録', content: '強い男性の声、急な叱責、ドアを強く閉める音がトリガーと判明。上司に会議前に「大きな声は避けてほしい」と伝えた。職場理解が進んでいる。' },
        { timestamp: '2026-04-05T09:00:00Z', category: 'symptoms', title: 'EMDR 第5回', content: '幼少期の記憶1つを処理。SUDS（苦痛度）10→3に低下。身体の重さが軽くなった感覚。今夜は悪夢なし（珍しい）。' },
        { timestamp: '2026-04-18T20:00:00Z', category: 'symptoms', title: '感情調節の変化', content: '今週の感情爆発は2回（先月は毎日）。コンテナ技法を使えるようになってきた。「感情は波であり、必ず落ち着く」が体験として少し理解できてきた。' },
        { timestamp: '2026-04-25T09:00:00Z', category: 'symptoms', title: '中間評価', content: 'PCL-5 スコア（PTSD症状）55→38（臨床的意義ある改善）。睡眠時間 4→6時間に改善。まだ対人関係は難しいが、フラッシュバックの頻度は半減した。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 9, brain_fog: 8, sleep_quality: 2, pain_level: 5 },
        { timestamp: '2026-03-15T09:00:00Z', fatigue_level: 8, brain_fog: 7, sleep_quality: 3, pain_level: 4 },
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 6, brain_fog: 5, sleep_quality: 4, pain_level: 3 },
        { timestamp: '2026-04-25T09:00:00Z', fatigue_level: 5, brain_fog: 4, sleep_quality: 5, pain_level: 2 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-08T09:00:00Z', name: 'EMDR（週1回）', notes: 'EMDR認定セラピスト（臨床心理士）。段階的治療プロトコル（安全化→処理）。' },
        { timestamp: '2026-03-01T08:00:00Z', name: 'エスシタロプラム（レクサプロ）10mg', notes: '精神科処方。PTSD症状・抑うつの補助。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    nafld: {
      diseases: ['NAFLD（非アルコール性脂肪肝）'],
      profile: { age: 48, gender: 'male', height: 172, weight: 82 },
      textEntries: [
        { timestamp: '2026-03-10T08:00:00Z', category: 'symptoms', title: '健診で脂肪肝指摘', content: 'ALT 68, AST 42, γ-GTP 95。BMI 27.6。腹囲 92cm。超音波で脂肪肝（中等度）。FIB-4: 1.45（グレーゾーン）。生活改善を始める。' },
        { timestamp: '2026-03-15T08:00:00Z', category: 'nutrition', title: '食事記録開始', content: '清涼飲料水・ジュース類を完全にやめた。昼食をコンビニ弁当→サラダ+鯖缶に変更。夜のビールも控えている。' },
        { timestamp: '2026-03-25T09:00:00Z', category: 'vitals', title: '体重記録', content: '体重 82.0→79.8kg（-2.2kg/2週間）。同じ条件（朝食前・起床後）での計測を継続。' },
        { timestamp: '2026-04-05T08:00:00Z', category: 'nutrition', title: '地中海食試行', content: 'サバ・イワシを週3回。オリーブオイルに変更。白米を半分に減らし、大豆・豆腐を増やした。コーヒー（ブラック）を毎朝2杯。' },
        { timestamp: '2026-04-12T09:00:00Z', category: 'vitals', title: '体重継続', content: '体重 78.6kg（開始比 -3.4kg）。腹囲 89cm（-3cm）。倦怠感がやや改善。朝起きやすくなった。' },
        { timestamp: '2026-04-20T08:00:00Z', category: 'symptoms', title: '運動追加', content: '週3回の速歩（30分/回）を開始。血糖値への意識も高まってきた。右脇腹のだるさは感じなくなった。' },
        { timestamp: '2026-04-28T10:00:00Z', category: 'vitals', title: '採血結果（中間）', content: 'ALT 68→44、γ-GTP 95→61。FIB-4: 1.45→1.18（低リスク域に改善）。体重 77.8kg（-4.2kg、目標の5%達成）。次の目標は-7%。' }
      ],
      symptoms: [
        { timestamp: '2026-03-10T08:00:00Z', fatigue_level: 6, sleep_quality: 5, pain_level: 2 },
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 4, sleep_quality: 6, pain_level: 1 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 3, sleep_quality: 7, pain_level: 1 },
        { timestamp: '2026-04-28T08:00:00Z', fatigue_level: 2, sleep_quality: 7, pain_level: 0 }
      ],
      bloodTests: [
        { timestamp: '2026-03-10T10:00:00Z', name: '肝機能検査（初回）', findings: 'ALT 68 U/L, AST 42 U/L, γ-GTP 95 U/L, 血小板 18万, 中性脂肪 210 mg/dL, HDL 42 mg/dL, 血糖 108 mg/dL, HbA1c 5.9%' },
        { timestamp: '2026-04-28T10:00:00Z', name: '肝機能検査（6週後）', findings: 'ALT 44 U/L, AST 30 U/L, γ-GTP 61 U/L, 中性脂肪 158 mg/dL, 体重 77.8kg' }
      ],
      medications: [],
      sleepData: [], activityData: [], meals: []
    },
    thyroid_hypo: {
      diseases: ['甲状腺機能低下症'],
      profile: { age: 54, gender: 'female', height: 157, weight: 62 },
      textEntries: [
        { timestamp: '2026-03-15T08:00:00Z', category: 'symptoms', title: 'チラージン開始から3ヶ月', content: 'TSH 3.2 → 1.8に改善。しかし倦怠感・冷え・便秘は継続中。体重は54→62kg（8ヶ月で+8kg）。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'medication', title: 'チラージン服用タイミング変更', content: '朝食前30分→起床直後（空腹時）に変更。カルシウム・鉄剤との服用間隔を4時間空けることを確認。' },
        { timestamp: '2026-03-28T21:00:00Z', category: 'symptoms', title: 'FT3測定依頼', content: 'TSHは1.8で正常範囲だが、FT3が低い可能性を主治医に相談。T3/T4併用療法について聞いてみたい。' },
        { timestamp: '2026-04-05T08:00:00Z', category: 'vitals', title: '体温記録開始', content: '朝の基礎体温 36.0℃。低体温が続いている。冷え性・手足の冷たさが慢性的。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'nutrition', title: 'ヨウ素・セレン管理', content: '昆布など過剰なヨウ素摂取を控える。セレンを含むブラジルナッツ（1-2粒/日）を追加。グルテンフリーを試験中。' },
        { timestamp: '2026-04-18T08:00:00Z', category: 'symptoms', title: '若干の改善', content: '服用タイミング変更から4週間。便秘が少し改善（週2→4回）。朝の倦怠感は7/10→5/10に。体重は変わらず。' },
        { timestamp: '2026-04-25T09:00:00Z', category: 'medication', title: 'チラージン増量相談', content: 'FT3 2.8 pg/mL（基準値 2.3-4.0）下限付近。主治医にチラージン75μgへの増量を相談予定。' }
      ],
      symptoms: [
        { timestamp: '2026-03-15T08:00:00Z', fatigue_level: 8, brain_fog: 6, sleep_quality: 4, pain_level: 3 },
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 7, brain_fog: 5, sleep_quality: 5, pain_level: 2 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 5, brain_fog: 4, sleep_quality: 5, pain_level: 2 },
        { timestamp: '2026-04-25T08:00:00Z', fatigue_level: 4, brain_fog: 3, sleep_quality: 6, pain_level: 1 }
      ],
      bloodTests: [
        { timestamp: '2026-03-10T10:00:00Z', name: '甲状腺機能検査', findings: 'TSH 1.8 mIU/L（基準 0.5-4.0）、FT4 1.1 ng/dL（正常下限）、FT3 2.8 pg/mL（低め）、抗TPO抗体 820 IU/mL（高値）' }
      ],
      medications: [
        { timestamp: '2026-03-15T08:00:00Z', name: 'レボチロキシン（チラージン）50μg', notes: '起床直後（空腹時）に服用。カルシウム・鉄剤との間隔4時間以上。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    cancer_survivor: {
      diseases: ['乳がん（術後ホルモン療法中）'],
      profile: { age: 52, gender: 'female', height: 160, weight: 58 },
      textEntries: [
        { timestamp: '2026-03-10T08:00:00Z', category: 'symptoms', title: 'FCR（再発不安）記録', content: '次の CT まで3週間。なんとなく体の各部が気になって「再発では？」と考えてしまう。睡眠が浅い。CBTの先生に言われた通り、症状を具体的に記録してみることにした。' },
        { timestamp: '2026-03-18T09:00:00Z', category: 'medication', title: 'タモキシフェン3年目', content: 'タモキシフェン 20mg 継続中。ホットフラッシュが気になるが耐えている。骨密度検査の予約を取った。' },
        { timestamp: '2026-03-25T10:00:00Z', category: 'vitals', title: 'フォローアップ受診', content: 'CEA 1.8 ng/mL（正常）。胸部 CT：異常なし。主治医から「問題ない」と言われて少し安心した。次回は6ヶ月後。マンモグラフィも予約した。' },
        { timestamp: '2026-04-02T08:00:00Z', category: 'symptoms', title: 'ケモブレイン', content: '会議で言葉が出てこないことが増えた。メモを取っても忘れる。化学療法後1年半経っても続いている。有酸素運動（週3回・30分）を始めてみた。' },
        { timestamp: '2026-04-15T09:00:00Z', category: 'symptoms', title: '認知機能の変化', content: '有酸素運動を2週間続けたら、少し集中力が戻った気がする。仕事でのミスが減った。運動の継続が大事だと実感。' },
        { timestamp: '2026-04-22T08:00:00Z', category: 'vitals', title: '骨密度検査（DEXA）', content: 'T スコア -1.3（骨減少症の範囲）。アロマターゼ阻害薬ではなくタモキシフェンなので影響は少ないが、カルシウム 1,200mg/日 + ビタミン D 1,000IU/日 を追加。' },
        { timestamp: '2026-04-28T09:00:00Z', category: 'symptoms', title: '1ヶ月の振り返り', content: '再発不安：「受診日に記録→安心のサイクル」が少しできてきた。ケモブレインは運動で改善傾向。体重管理（BMI 22）を目標に食事改善も継続中。' }
      ],
      symptoms: [
        { timestamp: '2026-03-10T08:00:00Z', fatigue_level: 5, brain_fog: 6, sleep_quality: 4, pain_level: 2 },
        { timestamp: '2026-03-25T08:00:00Z', fatigue_level: 4, brain_fog: 5, sleep_quality: 5, pain_level: 1 },
        { timestamp: '2026-04-15T08:00:00Z', fatigue_level: 3, brain_fog: 4, sleep_quality: 6, pain_level: 1 },
        { timestamp: '2026-04-28T08:00:00Z', fatigue_level: 3, brain_fog: 3, sleep_quality: 6, pain_level: 1 }
      ],
      bloodTests: [
        { timestamp: '2026-03-25T10:00:00Z', name: 'がんフォローアップ検査', findings: 'CEA 1.8 ng/mL（正常）、CA15-3 12 U/mL（正常）、胸部 CT：異常なし、骨密度 T スコア -1.3（骨減少症）' }
      ],
      medications: [
        { timestamp: '2024-03-01T08:00:00Z', name: 'タモキシフェン 20mg', notes: '毎朝。乳がん術後ホルモン療法 5 年間継続中（3年目）。' },
        { timestamp: '2026-04-22T08:00:00Z', name: 'カルシウム + ビタミン D', notes: 'Ca 1,200mg/日 + ビタミン D 1,000IU/日。骨密度低下予防。' }
      ],
      sleepData: [], activityData: [], meals: []
    },

    metabolic_syndrome: {
      diseases: ['メタボリックシンドローム'],
      profile: { age: 54, gender: 'male', height: 172, weight: 84 },
      textEntries: [
        { timestamp: '2026-03-10T07:30:00Z', category: 'vitals', title: 'メタボ健診結果', content: '腹囲 94cm・血圧 142/90・中性脂肪 212mg/dL・HDL 36mg/dL・空腹時血糖 112mg/dL。3 項目すべて該当でメタボ確定。医師から「このままでは 5 年以内に糖尿病になる可能性が高い」と言われた。生活習慣を変えることを決意。' },
        { timestamp: '2026-03-15T08:00:00Z', category: 'symptoms', title: '食事記録を開始', content: '夕食の炭水化物を減らした（白米 1 杯→ 0.5 杯、ラーメン禁止）。ビール毎日 2 缶→週末のみに。清涼飲料水をやめて水・お茶に変更。' },
        { timestamp: '2026-03-22T07:30:00Z', category: 'vitals', title: '1週間後の体重', content: '体重 84.0kg→82.6kg（1.4kg 減）。腹囲 94→93cm。血圧 138/86 に少し改善。まだ継続が必要。特定保健指導を申し込んだ。' },
        { timestamp: '2026-04-01T08:00:00Z', category: 'symptoms', title: '特定保健指導スタート', content: '保健師との面接で目標設定：①腹囲 88cm 以下（3ヶ月後）②週 150 分ウォーキング③アルコール週 2 日以内。スマートウォッチで歩数 8,000 歩/日を目標にした。' },
        { timestamp: '2026-04-15T07:00:00Z', category: 'vitals', title: '中間チェック', content: '体重 80.8kg（−3.2kg）。腹囲 91cm。血圧 132/82 に改善。毎朝 30 分のウォーキングが習慣化。昼食を定食→小盛りに変更。中性脂肪はまだ測定していないが受診時に確認予定。' },
        { timestamp: '2026-04-28T08:00:00Z', category: 'medication', title: 'フェノフィブラート開始', content: 'TG がなかなか下がらないため医師がフェノフィブラート 80mg を処方。「運動と食事は続けて。薬はあくまでサポート」と言われた。EPA 製剤（エパデール）も追加検討中。' },
        { timestamp: '2026-05-08T08:00:00Z', category: 'vitals', title: '2ヶ月後の血液検査', content: '中性脂肪 212→148mg/dL（基準値内！）。HDL 36→42mg/dL。血糖 112→104mg/dL。血圧 128/80（自宅測定平均）。体重 79.5kg（−4.5kg）。医師から「このまま続けば半年でメタボ脱出できる」と言われた。' }
      ],
      symptoms: [
        { timestamp: '2026-03-10T07:30:00Z', fatigue_level: 4, sleep_quality: 5, pain_level: 1 },
        { timestamp: '2026-03-22T07:30:00Z', fatigue_level: 3, sleep_quality: 5, pain_level: 1 },
        { timestamp: '2026-04-15T07:00:00Z', fatigue_level: 2, sleep_quality: 6, pain_level: 1 },
        { timestamp: '2026-05-08T08:00:00Z', fatigue_level: 2, sleep_quality: 7, pain_level: 1 }
      ],
      bloodTests: [
        { timestamp: '2026-03-10T07:30:00Z', name: 'メタボ健診', findings: '中性脂肪 212mg/dL・HDL 36mg/dL・空腹時血糖 112mg/dL・HbA1c 5.9%・γ-GTP 72 IU/L' },
        { timestamp: '2026-05-08T08:00:00Z', name: '2ヶ月後フォローアップ', findings: '中性脂肪 148mg/dL（改善）・HDL 42mg/dL（改善）・空腹時血糖 104mg/dL（改善）・HbA1c 5.6%・γ-GTP 48 IU/L' }
      ],
      medications: [
        { timestamp: '2026-04-28T08:00:00Z', name: 'フェノフィブラート 80mg', notes: '毎朝。高トリグリセリド血症の治療。' }
      ],
      sleepData: [], activityData: [], meals: []
    },

    dysautonomia: {
      diseases: ['自律神経障害（起立性低血圧）'],
      profile: { age: 42, gender: 'female', height: 162, weight: 51 },
      textEntries: [
        { timestamp: '2026-03-08T09:00:00Z', category: 'symptoms', title: '起立直後の記録', content: '起立時血圧：96/64 mmHg（起立後 3 分）。横臥位 118/74。差が大きい日は頭がくらくらして目の前が暗くなりかける。今日は台所で 10 分立ちっぱなしで限界だった。' },
        { timestamp: '2026-03-15T08:30:00Z', category: 'medication', title: 'フロリネフ 0.1mg 開始', content: '神経内科でフロリネフ（フルドロコルチゾン）0.1mg を処方。「塩分を少し増やして水分を 2L/日とるように」との指示。弾性ストッキングも購入した。' },
        { timestamp: '2026-03-22T09:00:00Z', category: 'vitals', title: 'フロリネフ 1 週間後', content: '起立時血圧：108/70（改善！）。浮腫が足首に少し出てきた。朝の頭ふらつきは 7→4 に減少。立位を 15 分保てるようになった。' },
        { timestamp: '2026-04-01T10:00:00Z', category: 'symptoms', title: '胃腸の不調が続く', content: '便秘（3日に1回）と食後の膨満感が強い。消化管の自律神経障害も影響しているらしい。食後は横にならないように意識しているが、横になりたくなる。' },
        { timestamp: '2026-04-12T09:30:00Z', category: 'medication', title: 'ミドドリン追加', content: 'ミドドリン（メカミラミン）2.5mg を午前・午後に追加。血圧が安定してきた。立ちくらみが週 2〜3 回→週 1 回に減少。外出できる機会が増えた。' },
        { timestamp: '2026-04-25T08:00:00Z', category: 'vitals', title: 'ティルト試験結果', content: 'ティルト試験陽性。起立後 10 分で血圧が 30mmHg 以上低下（起立性低血圧確定）。心拍は 88 bpm まで上昇（POTS 基準の 30bpm 増加には達せず）。診断：神経性起立性低血圧。' },
        { timestamp: '2026-05-05T09:00:00Z', category: 'symptoms', title: '2ヶ月の変化まとめ', content: '立ちくらみ：週 10 回→週 1 回。家事の立ち作業：5 分→20 分に延長。外出（30 分程度）が週 3 回できるようになった。汗の異常（顔のみ大量発汗）は変わらず。便秘は食物繊維増加で改善傾向。' }
      ],
      symptoms: [
        { timestamp: '2026-03-08T09:00:00Z', fatigue_level: 7, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-03-22T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-04-12T09:30:00Z', fatigue_level: 4, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-05-05T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-25T08:00:00Z', name: 'ティルト試験・自律神経検査', findings: 'ティルト試験陽性（起立後 10 分で 30mmHg 以上低下）。HRV（心拍変動）低下。血液検査：電解質正常・Na 141 mEq/L・抗核抗体陰性' }
      ],
      medications: [
        { timestamp: '2026-03-15T08:30:00Z', name: 'フルドロコルチゾン 0.1mg', notes: '毎朝。起立性低血圧治療。塩分・水分増量と併用。' },
        { timestamp: '2026-04-12T09:30:00Z', name: 'ミドドリン 2.5mg', notes: '午前・午後の 2 回。血管収縮薬。就寝前は禁止。' }
      ],
      sleepData: [], activityData: [], meals: []
    },

    diabetes_t1: {
      diseases: ['1型糖尿病'],
      profile: { age: 28, gender: 'female', height: 158, weight: 52 },
      textEntries: [
        { timestamp: '2026-03-05T07:00:00Z', category: 'vitals', title: 'CGM データ確認', content: 'フリースタイルリブレ（LibreLink）でのデータ：TIR（70-180mg/dL）= 68%、TBR（<70mg/dL）= 8%（夜間低血糖が主因）。医師の目標は TIR >70%。夜間の低血糖を減らすためにグラルギンの量を調整中。' },
        { timestamp: '2026-03-10T12:30:00Z', category: 'symptoms', title: '低血糖エピソード', content: '昼食前に血糖 52mg/dL で軽い低血糖。ブドウ糖 15g を摂取して 15 分後に 93mg/dL に回復（15-15 ルール）。原因は昼食のカーボカウントのミス（実際のカーボは想定の 1.5 倍だった）。記録を続けてパターンを把握したい。' },
        { timestamp: '2026-03-18T09:00:00Z', category: 'medication', title: 'インスリン調整', content: 'グラルギン（基礎インスリン）：18U→16U に減量。夜間低血糖が続いていたため。リスプロ（超速効型）のインスリン感度係数（ISF）を 50→55 に変更。主治医と相談の上で調整した。' },
        { timestamp: '2026-03-25T08:00:00Z', category: 'vitals', title: '3ヶ月検査結果', content: 'HbA1c 7.1%（前回 7.4%）。C-ペプチド 0.1ng/mL（ほぼゼロ、膵β細胞機能なし確認）。TSH 3.8 mIU/L（橋本病合併、経過観察中）。eGFR 98（腎機能正常）。網膜症スクリーニング：異常なし。' },
        { timestamp: '2026-04-05T07:30:00Z', category: 'symptoms', title: 'カーボカウント改善', content: 'DAFNE（正常食事のためのインスリン量調整）コースの内容を復習。パスタ・寿司のGI値を意識して食後スパイクを改善。フリースタイルリブレで食後 1h・2h の血糖を確認しながら調整。食後 2h 血糖を 180mg/dL 以下に抑えられるようになってきた。' },
        { timestamp: '2026-04-20T07:00:00Z', category: 'vitals', title: '月次 CGM レポート', content: 'TIR 74%（目標達成！）、TBR（低血糖）5%（改善）、TAR（高血糖）21%。グラルギン調整が効いた。運動（週 3 回ジョギング）後の低血糖リスクに備えて、運動前に炭水化物 10〜15g を補食するようにした。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T07:00:00Z', fatigue_level: 4, sleep_quality: 5, pain_level: 1 },
        { timestamp: '2026-03-18T09:00:00Z', fatigue_level: 3, sleep_quality: 6, pain_level: 1 },
        { timestamp: '2026-04-20T07:00:00Z', fatigue_level: 2, sleep_quality: 7, pain_level: 1 }
      ],
      bloodTests: [
        { timestamp: '2026-03-25T08:00:00Z', name: '糖尿病定期検査', findings: 'HbA1c 7.1%（改善）、C-ペプチド 0.1ng/mL（内因性インスリン枯渇）、TSH 3.8 mIU/L（橋本病経過観察）、抗GAD抗体 陽性確認済み、eGFR 98、尿中アルブミン陰性' }
      ],
      medications: [
        { timestamp: '2025-01-01T08:00:00Z', name: 'グラルギン（トレシーバ）16U', notes: '就寝前。基礎インスリン。' },
        { timestamp: '2025-01-01T08:00:00Z', name: 'リスプロ（ヒューマログ）食直前', notes: '食事ごとに炭水化物量に応じて調整（IC比 1:10）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },

    obesity: {
      diseases: ['肥満症（高度肥満・合併症あり）'],
      profile: { age: 45, gender: 'female', height: 158, weight: 86 },
      textEntries: [
        { timestamp: '2026-03-01T08:00:00Z', category: 'vitals', title: '肥満症診断・治療開始', content: '体重 86kg・BMI 34.5・腹囲 97cm。血圧 148/94・睡眠時無呼吸（AHI 18）合併。主治医からウゴービ（セマグルチド 0.25mg/週）を処方。食事記録アプリも始めた。カロリー目標 1,400kcal/日。' },
        { timestamp: '2026-03-15T08:00:00Z', category: 'symptoms', title: 'ウゴービ 2 週間後', content: '食欲が確実に減った。以前は夕食後にお菓子を食べずにいられなかったが、今は食べたいと思わない。吐き気が最初の 3〜4 日あったが今は消えた。体重 84.2kg（−1.8kg）。' },
        { timestamp: '2026-04-01T08:00:00Z', category: 'vitals', title: '1ヶ月後の計測', content: '体重 81.5kg（−4.5kg）。腹囲 93cm（−4cm）。血圧 138/88（改善）。歩数：5,000→8,000歩/日に自然に増えた。1,400kcal をほぼ達成できている（たんぱく質 80g 目標）。' },
        { timestamp: '2026-04-08T08:00:00Z', category: 'medication', title: 'セマグルチド 0.5mg に増量', content: '主治医の指示で 0.5mg/週 に増量。吐き気はなかった。体重減少のプラトー（停滞期）が来たときに 1.0mg→1.7mg→2.4mg と段階的に増量する計画。' },
        { timestamp: '2026-04-20T08:00:00Z', category: 'symptoms', title: '睡眠の改善', content: 'CPAP の AHI が 18→9 に改善（体重減少の効果？）。日中の眠気が減ってきた。午後の倦怠感が少なくなり仕事の集中力が戻ってきた。ウォーキング 30 分を朝晩に追加した。' },
        { timestamp: '2026-05-05T08:00:00Z', category: 'vitals', title: '2ヶ月まとめ', content: '体重 78.9kg（−7.1kg・−8.3%）。BMI 31.6。腹囲 90cm（−7cm）。血圧 132/84（改善継続）。HbA1c 検査待ち。睡眠の質スコアが向上。「体が軽くなった」実感あり。目標：あと 10kg 減でメタボ脱出・肥満症改善。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T08:00:00Z', fatigue_level: 6, sleep_quality: 4, pain_level: 3 },
        { timestamp: '2026-04-01T08:00:00Z', fatigue_level: 4, sleep_quality: 5, pain_level: 2 },
        { timestamp: '2026-05-05T08:00:00Z', fatigue_level: 3, sleep_quality: 6, pain_level: 2 }
      ],
      bloodTests: [
        { timestamp: '2026-03-01T08:00:00Z', name: '肥満症検査', findings: 'BMI 34.5・腹囲 97cm・血圧 148/94・TG 198mg/dL・HDL 38mg/dL・HbA1c 6.2%（糖尿病予備群）・ALT 52 IU/L・γ-GTP 68 IU/L（脂肪肝傾向）' }
      ],
      medications: [
        { timestamp: '2026-03-01T08:00:00Z', name: 'セマグルチド（ウゴービ）0.5mg', notes: '週1回皮下注射。0.25mg から増量中。GLP-1受容体作動薬。' },
        { timestamp: '2025-06-01T08:00:00Z', name: 'アムロジピン 5mg', notes: '毎朝。高血圧治療。' }
      ],
      sleepData: [], activityData: [], meals: []
    },

    adrenal: {
      diseases: ['副腎機能不全（アジソン病）'],
      profile: { age: 38, gender: 'female', height: 163, weight: 55 },
      textEntries: [
        { timestamp: '2026-03-05T08:00:00Z', category: 'vitals', title: '朝の血圧・症状', content: '血圧 88/56（起立後 84/52）。疲労度 7/10。ヒドロコルチゾン 10mg を 8時・5mg を 12時・5mg を 17時 に服用。今日は曇りで気分がさらに重い。塩分を意識してとった（塩飴1個）。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'symptoms', title: 'シックデイ実施', content: '喉の痛みと 37.8℃の発熱。シックデイルールでヒドロコルチゾンを倍量（20+10+10mg）に増量。症状が軽快したら元に戻す予定。医師から「38℃以上・嘔吐・外傷時は ER へ」と言われているので注意している。' },
        { timestamp: '2026-03-20T08:00:00Z', category: 'vitals', title: '定期検査', content: 'Na 137 mEq/L（低め）・K 4.2 mEq/L（正常）・コルチゾール ACTH 刺激後 15μg/dL（低値、副腎機能不全確認）。フロリネフ 0.1mg で血圧は改善傾向。体重 55kg（安定）。電解質バランスに注意を続ける。' },
        { timestamp: '2026-04-03T07:30:00Z', category: 'symptoms', title: '好調期', content: 'ヒドロコルチゾンの用量調整（朝 15mg に増量）で、午前中の倦怠感がかなり改善した。血圧 98/64 に改善。外出が週 3 回できるようになった。ただし昼以降は疲れが出る。' },
        { timestamp: '2026-04-18T08:00:00Z', category: 'symptoms', title: '低血糖エピソード', content: '朝食を遅らせたら血糖が 62mg/dL（冷汗・動悸）。ブドウ糖を摂取して回復。副腎機能不全では低血糖が起こりやすい。朝食を遅らせないよう注意。副腎クリーゼのリスクが低血糖と重なると危険。' },
        { timestamp: '2026-05-02T09:00:00Z', category: 'vitals', title: '2ヶ月まとめ', content: '血圧：平均 96/62（改善）。倦怠感：7→4（改善）。シックデイ：1回（適切に対応できた）。副腎クリーゼ：なし。夏に向けて脱水・熱中症リスクが上がるため、塩分・水分管理を強化する予定。アジソン病患者向けの緊急カードをいつも財布に入れている。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T08:00:00Z', fatigue_level: 7, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-04-03T07:30:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 6 },
        { timestamp: '2026-05-02T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-20T08:00:00Z', name: '副腎機能検査', findings: 'Na 137 mEq/L・K 4.2 mEq/L・コルチゾール基礎値 3.2μg/dL（低値）・ACTH 刺激後ピーク 15μg/dL（低値）・ACTH 162 pg/mL（高値、原発性確認）・抗21-水酸化酵素抗体 陽性（自己免疫性確認）' }
      ],
      medications: [
        { timestamp: '2024-01-01T08:00:00Z', name: 'ヒドロコルチゾン 15mg/5mg/5mg', notes: '8時・12時・17時に分割服用。シックデイ時は倍量。' },
        { timestamp: '2024-01-01T08:00:00Z', name: 'フルドロコルチゾン 0.1mg', notes: '毎朝。鉱質コルチコイド補充（原発性のため必要）。塩分増量と併用。' }
      ],
      sleepData: [], activityData: [], meals: []
    },

    celiac: {
      diseases: ['セリアック病'],
      profile: { age: 34, gender: 'female', height: 164, weight: 54 },
      textEntries: [
        { timestamp: '2026-03-01T09:00:00Z', category: 'vitals', title: '診断・グルテンフリー開始', content: '小腸内視鏡でヴィラ萎縮（Marsh 3b）・抗tTG-IgA 156 U/mL（基準値 <20）を確認。セリアック病確定診断。今日からグルテンフリー食を開始。管理栄養士の指導を受けた。ラベルの確認・外食の注意点を学んだ。' },
        { timestamp: '2026-03-15T08:00:00Z', category: 'symptoms', title: '2週間後の変化', content: '腹部膨満感と下痢が明らかに減少。以前は毎日あった軟便が週 1〜2 回に。疲労感も少し改善。外食は完全にやめてお弁当持参に変更。醤油の代わりにグルテンフリー醤油を使用中。' },
        { timestamp: '2026-03-28T12:00:00Z', category: 'symptoms', title: '交差汚染エピソード', content: '友人の家で夕食。グルテンフリーのつもりで食べたが翌朝から腹痛・下痢・強い疲労感。おそらくパンを切ったまな板を共用した影響（交差汚染）。20ppm 以下のグルテンでも反応する場合があることを実感した。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'vitals', title: '1ヶ月後検査', content: '抗tTG-IgA 98 U/mL（低下傾向！）。鉄欠乏性貧血：Hb 10.8→11.6 g/dL（改善）。ビタミンD 24 ng/mL（まだ不足）→サプリ 2,000IU/日追加。体重 52kg→54kg（栄養吸収の改善）。' },
        { timestamp: '2026-05-05T09:00:00Z', category: 'vitals', title: '2ヶ月まとめ', content: '抗tTG-IgA 61 U/mL（下降継続）。腸の修復に6〜12ヶ月かかると言われているが着実に改善している。倦怠感・腹部症状：ほぼ消失。グルテンフリー生活が安定してきた。職場の昼食も対応できるレパートリーが増えた。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 7, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-03-15T08:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-05-05T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-01T09:00:00Z', name: 'セリアック病確定診断', findings: '抗tTG-IgA 156 U/mL（高値）・抗EMA-IgA 陽性・Hb 10.8g/dL・ビタミンD 18ng/mL・鉄 38μg/dL（低値）・HLA-DQ2 陽性' },
        { timestamp: '2026-05-05T09:00:00Z', name: '2ヶ月後フォローアップ', findings: '抗tTG-IgA 61 U/mL（改善傾向）・Hb 11.9g/dL・ビタミンD 31ng/mL（改善）・鉄 58μg/dL（改善）' }
      ],
      medications: [
        { timestamp: '2026-03-01T09:00:00Z', name: 'ビタミンD 2,000IU/日', notes: 'グルテンフリー食開始後の栄養補充。' },
        { timestamp: '2026-03-01T09:00:00Z', name: '鉄剤（フェロ・グラデュメット）', notes: '鉄欠乏性貧血の補充治療。食間に服用。' }
      ],
      sleepData: [], activityData: [], meals: []
    },

    substance: {
      diseases: ['アルコール依存症'],
      profile: { age: 48, gender: 'male', height: 173, weight: 76 },
      textEntries: [
        { timestamp: '2026-03-01T09:00:00Z', category: 'symptoms', title: '断酒開始', content: '入院でアルコール離脱を管理（ジアゼパムで安全に断酒）。振戦・発汗・不眠が3日間続いたが病院で管理できた。断酒1日目。今日から記録を続ける。AA のリストを受け取った。' },
        { timestamp: '2026-03-08T10:00:00Z', category: 'medication', title: 'アカンプロサート開始', content: '退院。アカンプロサート（レグテクト）1998mg/日（3回食後）開始。主治医に「最初の3ヶ月が最もリラプスリスクが高い」と言われた。AA に本日初参加。緊張したが「ここが自分の居場所だ」と感じた。' },
        { timestamp: '2026-03-20T11:00:00Z', category: 'symptoms', title: '断酒20日目', content: '渇望が強い日：仕事でイライラした後と、週末の夜（一人でいる時）。AA のスポンサー（経験者の支援者）が見つかった。毎日の「渇望スコア（0〜10）」を記録し始めた。今日は4/10。' },
        { timestamp: '2026-04-05T09:00:00Z', category: 'symptoms', title: '断酒36日目', content: '睡眠が改善してきた（断酒前：ほぼ毎晩眠れない→今週は6時間以上眠れる日が5日）。渇望は週に1〜2回、スコア 5〜6/10。スリップ（再飲酒）なし。家族との会話が増えてきた。AA は週3回参加。' },
        { timestamp: '2026-05-01T10:00:00Z', category: 'symptoms', title: '断酒60日目', content: '断酒2ヶ月到達。AAの60日チップをもらった。渇望は週に1回以下・スコア 3/10 程度。体重 2kg 減（アルコールカロリーが消えた分）。肝機能検査：AST 28・ALT 32（正常化）。アカンプロサートを継続中。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 8, pain_level: 4, sleep_quality: 2 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 4 },
        { timestamp: '2026-04-05T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 6 },
        { timestamp: '2026-05-01T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-01T09:00:00Z', name: '入院時採血', findings: 'AST 88・ALT 102・γ-GTP 245（高値）・MCV 102fl（大球性）・アルコール性肝障害の所見' },
        { timestamp: '2026-05-01T09:00:00Z', name: '断酒60日後採血', findings: 'AST 28・ALT 32・γ-GTP 45（改善）。肝機能は著明改善。' }
      ],
      medications: [
        { timestamp: '2026-03-08T08:00:00Z', name: 'アカンプロサート（レグテクト）1998mg/日', notes: '毎食後3回。断酒補助薬（グルタミン酸系正常化）。自己中断しないこと。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    raynauds: {
      diseases: ['レイノー症候群（原発性）'],
      profile: { age: 32, gender: 'female', height: 160, weight: 50 },
      textEntries: [
        { timestamp: '2026-03-05T09:00:00Z', category: 'symptoms', title: '受診記録', content: '毎年冬に両手指が白→青→赤に変わる発作が頻繁。今シーズンは1日5〜8回。血液検査・爪郭毛細血管顕微鏡では異常なし→原発性レイノー病と診断。ニフェジピン徐放製剤 20mg を開始。' },
        { timestamp: '2026-03-12T10:00:00Z', category: 'medication', title: 'ニフェジピン1週間後', content: 'ニフェジピン開始7日。発作回数 5〜8回→3〜4回/日に減少（約40%改善）。頭痛・ほてりの副作用があるが、1週間で慣れてきた。手袋（電熱タイプ）を購入して外出時に着用。' },
        { timestamp: '2026-03-25T09:00:00Z', category: 'symptoms', title: '寒波後の状況', content: '先週の寒波（最低気温 -4℃）で発作が増悪。ニフェジピン増量（30mg）を主治医に相談→承認。寒冷刺激と発作の記録を記録することで「-2℃以下で特に悪化」のパターンを発見。' },
        { timestamp: '2026-04-15T10:00:00Z', category: 'symptoms', title: '暖かくなってきた', content: '4月以降、発作が著明に減少（0〜1回/日）。気温上昇がはっきりと影響している。ニフェジピンを20mgに戻した。来冬に向けて電熱手袋・マフラー・カイロを準備しておく予定。ANA 再検査: 陰性（膠原病の合併除外確認）。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 3, pain_level: 4, sleep_quality: 6 },
        { timestamp: '2026-03-12T09:00:00Z', fatigue_level: 3, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 3, pain_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-05T09:00:00Z', name: '初診時採血', findings: 'ANA 陰性・抗Scl-70抗体 陰性・抗セントロメア抗体 陰性・SS-A/B 陰性・甲状腺正常→原発性レイノー病と確定' }
      ],
      medications: [
        { timestamp: '2026-03-05T08:00:00Z', name: 'ニフェジピン徐放製剤 20〜30mg', notes: '毎朝。冬季は30mgに増量。副作用：頭痛・ほてり（徐々に慣れる）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    dvt: {
      diseases: ['深部静脈血栓症（DVT）'],
      profile: { age: 56, gender: 'female', height: 160, weight: 68 },
      textEntries: [
        { timestamp: '2026-03-12T14:00:00Z', category: 'symptoms', title: 'DVT発症', content: '右足のふくらはぎが昨日から腫れて痛い。下肢静脈エコーで右膝窩静脈〜大腿静脈に血栓を確認。Dダイマー 3.8 μg/mL（高値）。ウェルズスコア 3点（高確率）。原因は骨折後の3週間の安静と考えられる。リバーロキサバン15mg×2/日を開始。' },
        { timestamp: '2026-03-16T10:00:00Z', category: 'symptoms', title: '1週間後', content: '右足の腫脹が8→5に改善。歩行時の痛みも軽減。弾性ストッキング（30〜40mmHg）を起床から就寝まで着用。リバーロキサバンの内服を食後に合わせて継続（食事と共に服用が吸収を高める）。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'vitals', title: '1ヶ月後エコー', content: '下肢静脈エコー：血栓はやや縮小傾向。大腿静脈に残遺血栓あり。Dダイマー 1.2 μg/mL（改善）。リバーロキサバン 20mg×1/日に移行（21日目以降）。3ヶ月間の治療継続決定。' },
        { timestamp: '2026-05-05T10:00:00Z', category: 'vitals', title: '血栓性素因検査', content: 'プロテインC活性：78%（正常）・プロテインS抗原：65%（境界域）・抗リン脂質抗体：陰性。今回は骨折後という誘因があったため、血栓性素因は積極的な問題なしとの判断。3ヶ月で抗凝固療法終了予定。弾性ストッキングは2年継続を指示された。' }
      ],
      symptoms: [
        { timestamp: '2026-03-12T09:00:00Z', fatigue_level: 4, pain_level: 7, sleep_quality: 5 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 3, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 2, pain_level: 2, sleep_quality: 7 },
        { timestamp: '2026-05-05T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-12T09:00:00Z', name: '発症時', findings: 'Dダイマー 3.8μg/mL（高値）・PT-INR 1.0（正常）・血算正常' },
        { timestamp: '2026-04-10T09:00:00Z', name: '1ヶ月後', findings: 'Dダイマー 1.2μg/mL（改善）・腎機能正常（DOAC継続適応確認）' }
      ],
      medications: [
        { timestamp: '2026-03-12T08:00:00Z', name: 'リバーロキサバン（イグザレルト）', notes: '初期15mg×2/日（21日間）→20mg×1/日（食後）。3ヶ月治療。自己中断厳禁。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    eating: {
      diseases: ['神経性過食症（BN）'],
      profile: { age: 24, gender: 'female', height: 162, weight: 55 },
      textEntries: [
        { timestamp: '2026-03-10T11:00:00Z', category: 'symptoms', title: 'CBT-E 開始', content: '心療内科でCBT-E（認知行動療法-摂食障害強化版）を週1回開始。過去3ヶ月は週3〜4回の過食と嘔吐のサイクル。担当医の勧めで「過食の前の感情・状況」を記録することから始める。カロリー制限のための記録ではなく、回復のための記録と位置づけている。' },
        { timestamp: '2026-03-20T10:00:00Z', category: 'symptoms', title: '記録2週間', content: 'トリガーパターンが見えてきた。仕事でミスをした夜・一人でいる週末の夜に過食が集中している。「孤独感+完璧主義の崩壊」がトリガー。CBTでセラピストに報告した。今週の過食は2回（先週5回→改善）。' },
        { timestamp: '2026-04-05T12:00:00Z', category: 'medication', title: 'フルオキセチン開始', content: '精神科医よりフルオキセチン（プロザック）60mg/日を処方。BNへの第一選択薬。「過食衝動が少し和らぐことがある」との説明。副作用は今のところ吐き気のみ。' },
        { timestamp: '2026-04-20T10:00:00Z', category: 'symptoms', title: '6週間後の変化', content: 'フルオキセチン開始6週間。過食の頻度が週1〜2回に減少（初診時5〜6回/週→）。嘔吐はほぼなくなってきた。CBTで「食事の正規化」を練習中。3食を決まった時間に食べる習慣をつけている。' },
        { timestamp: '2026-05-12T11:00:00Z', category: 'symptoms', title: '2ヶ月後の評価', content: 'EDE-Q（摂食障害評価尺度）スコア：初診時4.8→2.1（回復傾向）。過食は週0〜1回程度。嘔吐はほぼなくなった。歯科を受診したらエナメル質の浸食が見つかった（嘔吐による酸蝕症）。回復は続いている。' }
      ],
      symptoms: [
        { timestamp: '2026-03-10T09:00:00Z', fatigue_level: 6, pain_level: 2, sleep_quality: 4 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 5, pain_level: 1, sleep_quality: 5 },
        { timestamp: '2026-04-20T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 6 },
        { timestamp: '2026-05-12T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-10T09:00:00Z', name: '初診時採血', findings: 'K 3.4 mEq/L（軽度低下・嘔吐による）・歯科所見：エナメル質浸食・Alb 3.8g/dL（境界）' },
        { timestamp: '2026-05-12T09:00:00Z', name: '2ヶ月後採血', findings: 'K 4.0 mEq/L（正常化）・Alb 4.1g/dL（改善）' }
      ],
      medications: [
        { timestamp: '2026-04-05T08:00:00Z', name: 'フルオキセチン（プロザック同等）60mg', notes: '毎朝。BN への SSRI 第一選択。過食衝動の軽減効果。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    sibo: {
      diseases: ['SIBO（小腸内細菌増殖症）'],
      profile: { age: 35, gender: 'female', height: 162, weight: 54 },
      textEntries: [
        { timestamp: '2026-03-10T08:00:00Z', category: 'symptoms', title: '呼気検査結果', content: 'ラクツロース呼気検査：水素 90分で38ppm上昇（正常<20ppm）。水素型SIBO陽性と診断。IBS-Dと言われて3年だが原因がわかってほっとした。リファキシミン（自費）を処方された。' },
        { timestamp: '2026-03-15T09:00:00Z', category: 'medication', title: 'リファキシミン開始', content: '自費でリファキシミン 1,650mg/日（550mg×3回）×14日間開始。副作用は今のところなし。食事は低FODMAP継続。' },
        { timestamp: '2026-03-25T11:00:00Z', category: 'symptoms', title: '治療後1週間', content: 'リファキシミン終了から1週間。腹部膨満感が 8→4 に大幅改善。ガスの発生が減った。腸の「ゴロゴロ」音も静かになってきた。' },
        { timestamp: '2026-04-05T09:00:00Z', category: 'vitals', title: '治療後呼気検査', content: '再検査：水素ガス 90分で8ppm（正常域）。SIBO 根絶確認。低FODMAP食を継続して再発予防に努める。プロキネティクス（モサプリド）を追加処方された。' },
        { timestamp: '2026-04-20T08:00:00Z', category: 'symptoms', title: '再発？', content: '低FODMAP から通常食に移行した途端に腹部膨満感が戻り始めた。玉ねぎ・豆類を食べた翌日が特に悪い。高FODMAP食品を絞り込んでいる。モサプリドが効いているかどうか判断が難しい。' },
        { timestamp: '2026-05-10T10:00:00Z', category: 'symptoms', title: '現状', content: 'FODMAPの個人感受性を絞り込み中。玉ねぎ・ニンニク・小麦は明確なトリガー。乳製品・豆類は少量なら許容できる。腹部症状は 4/10程度で安定。プロキネティクスを継続中。' }
      ],
      symptoms: [
        { timestamp: '2026-03-10T09:00:00Z', fatigue_level: 5, pain_level: 7, sleep_quality: 5 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 3, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-20T09:00:00Z', fatigue_level: 4, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-05-10T09:00:00Z', fatigue_level: 3, pain_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-15T08:00:00Z', name: 'リファキシミン 1,650mg/日（自費）', notes: '14日間終了。SIBO根絶確認。' },
        { timestamp: '2026-04-05T08:00:00Z', name: 'モサプリド 15mg/日', notes: '毎食前。腸管運動改善（再発予防）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    gastroparesis: {
      diseases: ['胃不全麻痺（ガストロパレシス）'],
      profile: { age: 44, gender: 'female', height: 158, weight: 47 },
      textEntries: [
        { timestamp: '2026-03-08T09:00:00Z', category: 'symptoms', title: '診断確定', content: '2型糖尿病歴12年。半年前から食後2〜3時間で嘔吐することが続く。胃排出シンチグラフィ：4時間後残留率 42%（重度遅延と診断）。担当医から「糖尿病性胃不全麻痺」と告げられた。体重 2ヶ月で 5kg 減少。' },
        { timestamp: '2026-03-12T08:00:00Z', category: 'medication', title: 'ドンペリドン開始', content: 'ドンペリドン 30mg/日（食前）開始。少量頻回食（1日5回・1回150mL以下）に切り替え。揚げ物・高脂肪食を除去。' },
        { timestamp: '2026-03-25T10:00:00Z', category: 'symptoms', title: '2週間後', content: '嘔吐回数 1日3→1回に減少。食事量が少し増えた。GCSI スコア（自己評価）：4.2→2.8 改善。体重は 47kg で安定し始めた。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'vitals', title: '血糖改善', content: 'CGM データ：食後血糖スパイクが減少。低血糖→遅発性高血糖のパターンが改善。HbA1c 8.6→8.1%（少し改善）。インスリンを食事開始15分後に打つタイミングに変更したことが功を奏した。' },
        { timestamp: '2026-05-05T11:00:00Z', category: 'symptoms', title: '現状', content: '嘔吐は週1〜2回程度。1日4〜5回の少量食を継続。体重 47.8kg（微増）。栄養士と連携して液体補充食（エンシュアリキッド）を1本/日追加している。経腸栄養は今のところ回避できている。' }
      ],
      symptoms: [
        { timestamp: '2026-03-08T09:00:00Z', fatigue_level: 8, pain_level: 6, sleep_quality: 4 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 6, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-05-05T09:00:00Z', fatigue_level: 4, pain_level: 2, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-08T09:00:00Z', name: '初診時採血', findings: 'HbA1c 8.6%・空腹時血糖 178mg/dL・Alb 3.4g/dL（低栄養傾向）' },
        { timestamp: '2026-04-10T09:00:00Z', name: '1ヶ月後採血', findings: 'HbA1c 8.1%（改善）・Alb 3.6g/dL（改善）' }
      ],
      medications: [
        { timestamp: '2026-03-12T08:00:00Z', name: 'ドンペリドン 30mg/日', notes: '毎食前（1日3回）。プロキネティクス。' },
        { timestamp: '2026-03-12T08:00:00Z', name: 'インスリン グラルギン（基礎）+ アスパルト（速効）', notes: '食事開始15分後投与に変更。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    arrhythmia: {
      diseases: ['発作性心房細動（PAF）'],
      profile: { age: 52, gender: 'male', height: 172, weight: 78 },
      textEntries: [
        { timestamp: '2026-03-05T22:00:00Z', category: 'symptoms', title: '発作初回記録', content: '夜11時頃、突然の動悸。Apple Watch ECGで「心房細動の可能性」のアラート。心拍数 128bpm。20分後に自然停止。翌朝に循環器内科受診。' },
        { timestamp: '2026-03-08T10:00:00Z', category: 'medication', title: '抗凝固薬開始', content: 'CHA₂DS₂-VAScスコア 2点（年齢52・高血圧）。アピキサバン（エリキュース）5mg×2/日を開始。「血栓予防が最優先」との説明。抗不整脈薬は様子見。' },
        { timestamp: '2026-03-20T21:00:00Z', category: 'symptoms', title: '2回目の発作', content: '3時間持続の心房細動。飲酒（ビール350mL×2本）の翌日。心拍数最高148bpm。自然停止。アルコールが誘発因子と確信。' },
        { timestamp: '2026-04-05T09:00:00Z', category: 'medication', title: 'フレカイニド開始', content: 'ホルター心電図で発作性AFと確定。フレカイニド 100mg×2/日を追加（器質的心疾患なしを心エコーで確認）。アルコールを禁止。' },
        { timestamp: '2026-04-20T11:00:00Z', category: 'symptoms', title: '6週間経過', content: 'フレカイニド開始後、発作なし。禁酒を継続。Apple Watch のECGを毎朝記録。睡眠の質を改善（就寝前のカフェイン禁止）。カテーテルアブレーションを10月に予約。' },
        { timestamp: '2026-05-15T10:00:00Z', category: 'vitals', title: '現在の状況', content: 'アブレーション前評価のため心臓MRI施行。器質的異常なし・左房径 42mm（軽度拡大）。CHA₂DS₂-VAScスコア 2点でアピキサバン継続。禁酒 2ヶ月で体重 2kg 減少も達成。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 4, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 4 },
        { timestamp: '2026-04-20T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-05-15T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-08T09:00:00Z', name: '初診時採血', findings: '甲状腺正常・電解質正常・腎機能正常（クレアチニン 0.9mg/dL）→DOAC適応確認' }
      ],
      medications: [
        { timestamp: '2026-03-08T08:00:00Z', name: 'アピキサバン（エリキュース）10mg/日', notes: '朝夕5mgずつ。心房細動の脳梗塞予防（DOAC）。CHA₂DS₂-VAScスコア 2点。' },
        { timestamp: '2026-04-05T08:00:00Z', name: 'フレカイニド 200mg/日', notes: '朝夕100mgずつ。発作性AF予防（器質的心疾患なし確認済み）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    ihd: {
      diseases: ['陳旧性心筋梗塞（PCI後管理）'],
      profile: { age: 60, gender: 'male', height: 168, weight: 74 },
      textEntries: [
        { timestamp: '2026-03-01T09:00:00Z', category: 'medication', title: '退院後服薬確認', content: 'STEMI（前壁）でDES植込み（LADへ）から3ヶ月経過。退院薬：アスピリン 100mg・チカグレロル 180mg/日・ロスバスタチン 20mg・ラミプリル 5mg・ビソプロロール 2.5mg。副作用として軽い息切れ（β遮断薬か？）がある。' },
        { timestamp: '2026-03-15T10:00:00Z', category: 'vitals', title: '外来受診結果', content: 'LDL-C 62mg/dL（目標<70達成）・血圧 125/76・心拍数 62/分。心エコー EF 48%（入院時55%→低下傾向、主治医は経過観察）。心リハ開始を勧められた。' },
        { timestamp: '2026-03-25T08:00:00Z', category: 'symptoms', title: '心リハ開始', content: '心臓リハビリテーション外来 開始（週2回）。エルゴメーター 20分・低強度有酸素。最初の回は息切れがあったが、「ターゲット心拍 100bpm」で管理。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'symptoms', title: '心リハ3週目', content: '心リハ3週目。運動耐容能が向上し、歩行20分で息切れが出なくなった。体重も 76→74kg（2kg減）。禁煙継続（3ヶ月目）。ニコチネルパッチ使用中。' },
        { timestamp: '2026-05-12T10:00:00Z', category: 'vitals', title: '2ヶ月後外来', content: 'LDL-C 58mg/dL（さらに改善）・血圧 122/74・EF 52%（回復傾向）。主治医から「このまま続けてください」との評価。チカグレロル継続（DES後12ヶ月）、12ヶ月後にクロピドグレルへ変更予定。禁煙3ヶ月完全達成。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-05-12T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-15T09:00:00Z', name: '外来採血', findings: 'LDL-C 62mg/dL（目標<70達成）・CRP 0.4mg/dL・HbA1c 6.1%・クレアチニン 1.0mg/dL' },
        { timestamp: '2026-05-12T09:00:00Z', name: '2ヶ月後採血', findings: 'LDL-C 58mg/dL（さらに改善）・CRP 0.2mg/dL・EF 52%（心エコー）' }
      ],
      medications: [
        { timestamp: '2026-03-01T08:00:00Z', name: 'アスピリン 100mg + チカグレロル 180mg/日（DAPT）', notes: 'DES植込み後12ヶ月継続必須。自己中断禁止。' },
        { timestamp: '2026-03-01T08:00:00Z', name: 'ロスバスタチン 20mg', notes: '夕食後。LDL-C<70mg/dL目標。' },
        { timestamp: '2026-03-01T08:00:00Z', name: 'ラミプリル 5mg + ビソプロロール 2.5mg', notes: '朝。心リモデリング予防・心拍数コントロール。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    pulmonary_fibrosis: {
      diseases: ['特発性肺線維症（IPF）'],
      profile: { age: 67, gender: 'male', height: 170, weight: 65 },
      textEntries: [
        { timestamp: '2026-03-03T10:00:00Z', category: 'symptoms', title: 'IPF診断・治療開始', content: 'IPFと確定診断（HRCT でUIPパターン・外科的肺生検）。FVC 74%・DLco 58%・SpO2安静時 96%・歩行後 89%。ニンテダニブ 300mg/日（150mg×2）開始。担当医から「進行を遅らせる薬で完治はないが、有効性は確認されている」と説明された。' },
        { timestamp: '2026-03-12T08:00:00Z', category: 'medication', title: 'ニンテダニブ副作用', content: '服薬7日目から下痢が毎日（1日3〜4回）。ニンテダニブの最も多い副作用。主治医の指示で一時150mg/日（75mg×2）に減量し、症状が軽減。整腸剤（ビオフェルミン）を追加。' },
        { timestamp: '2026-03-25T09:00:00Z', category: 'symptoms', title: '1ヶ月後経過', content: 'ニンテダニブ 150mg→225mgに再増量。下痢は週3〜4回程度に落ち着いた。外出時のSpO2を記録：歩行500m後に SpO2 90%。在宅酸素を検討し始めた。咳は乾性咳嗽が持続（1日10〜15回）。' },
        { timestamp: '2026-04-15T11:00:00Z', category: 'medication', title: 'HOT 開始', content: '6分間歩行試験でSpO2 83%まで低下。在宅酸素療法（HOT）を開始（2L/分・労作時のみ）。ポータブル酸素ボンベを使って外出できるようになった。心理的な抵抗感はあったが、外出が楽になった。' },
        { timestamp: '2026-05-10T09:00:00Z', category: 'vitals', title: '3ヶ月後肺機能検査', content: 'FVC 71%（開始時74%、3%低下—IPFの標準的な進行ペース）・DLco 55%（開始時58%）。SpO2安静時 95%。「ニンテダニブが効いている可能性あり—年間で4〜5%低下なら平均的」と主治医のコメント。インフルエンザ・肺炎球菌ワクチン接種済み。' }
      ],
      symptoms: [
        { timestamp: '2026-03-03T09:00:00Z', fatigue_level: 6, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 6, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-05-10T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-03T09:00:00Z', name: '診断時検査', findings: 'KL-6 1,850 U/mL（高値）・SP-D 180 ng/mL（高値）・LDH 234 IU/L・ANA 陰性・抗MDA5抗体 陰性（膠原病関連ILD除外）' },
        { timestamp: '2026-05-10T09:00:00Z', name: '3ヶ月後', findings: 'KL-6 1,720 U/mL（微減）・SP-D 165 ng/mL・肝機能正常（ニンテダニブ副作用モニタリング）' }
      ],
      medications: [
        { timestamp: '2026-03-03T08:00:00Z', name: 'ニンテダニブ 225mg/日（オフェブ）', notes: '朝夕食後（副作用で150→225mgに調整中）。抗線維化薬。下痢副作用に注意。' },
        { timestamp: '2026-04-15T08:00:00Z', name: '在宅酸素 2L/分（労作時）', notes: 'ポータブルボンベ使用。6分間歩行でSpO2 83%→HOT適応。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    polymyalgia: {
      diseases: ['リウマチ性多発筋痛症（PMR）'],
      profile: { age: 68, gender: 'female', height: 156, weight: 58 },
      textEntries: [
        { timestamp: '2026-03-05T09:00:00Z', category: 'symptoms', title: '診断時の症状', content: '両肩・頸部・骨盤帯の朝のこわばりが3週間以上続く。特に起床時はつらく、腕を頭の上に上げられない。夜中に痛みで目が覚める。CRP 4.8mg/dL・ESR 62mm/h。リウマチ科でPMRと診断されプレドニゾロン 15mg を開始した。' },
        { timestamp: '2026-03-10T08:00:00Z', category: 'medication', title: 'プレドニゾロン 3 日後の劇的改善', content: 'プレドニゾロン開始 3 日後に肩のこわばりが 8→2 に激減。「まるで別人のよう」という感覚。ステロイドへの劇的な反応がPMR診断の支持所見の一つとなった。朝の起き上がりがスムーズになった。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'vitals', title: '2 週間後検査', content: 'CRP 0.4mg/dL（ほぼ正常化）・ESR 28mm/h（改善）。症状消失。プレドニゾロンを 12.5mg に減量（2週間で 2.5mg ずつ減量する計画）。骨粗鬆症予防のためビスホスホネート（アレンドロン酸）とビタミンD・カルシウムを開始。' },
        { timestamp: '2026-04-15T09:00:00Z', category: 'symptoms', title: '減量中の再燃', content: 'プレドニゾロン 7.5mg まで減量した段階で肩・腰の症状が再燃（こわばり 5/10、CRP 1.8mg/dL）。主治医と相談して 10mg に戻した。「早く減量しすぎた」との判断。減量スピードを 1mg/月に変更。' },
        { timestamp: '2026-05-08T09:00:00Z', category: 'vitals', title: '現在の状況', content: 'プレドニゾロン 9mg。CRP 0.6mg/dL。症状は安定（こわばり 1〜2/10）。減量スピードを落としたことで再燃なし。骨密度（DEXA）：T スコア -2.1（骨粗鬆症域）。アレンドロン酸を継続中。巨細胞性動脈炎への進展を警戒して頭痛・視力変化を自己チェック中。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 7, pain_level: 8, sleep_quality: 4 },
        { timestamp: '2026-03-10T08:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-05-08T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-05T09:00:00Z', name: '診断時検査', findings: 'CRP 4.8mg/dL・ESR 62mm/h・IL-6 28pg/mL（高値）・RF 陰性・抗CCP抗体 陰性・Hb 11.2g/dL（慢性炎症性貧血）' },
        { timestamp: '2026-05-08T09:00:00Z', name: 'フォローアップ', findings: 'CRP 0.6mg/dL（改善）・ESR 31mm/h・Hb 12.4g/dL・骨密度 T スコア -2.1（骨粗鬆症）' }
      ],
      medications: [
        { timestamp: '2026-03-05T09:00:00Z', name: 'プレドニゾロン 9mg', notes: '毎朝。PMR治療の主軸。月1mgずつ減量中（再燃時は増量）。' },
        { timestamp: '2026-03-20T09:00:00Z', name: 'アレンドロン酸 35mg', notes: '週1回（月曜朝、起床後すぐ水で服用・30分は横にならない）。ステロイド性骨粗鬆症予防。' },
        { timestamp: '2026-03-20T09:00:00Z', name: 'ビタミンD 800IU + カルシウム 1000mg', notes: '骨粗鬆症予防補充。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    dissociative: {
      diseases: ['解離性同一性障害（DID）'],
      profile: { age: 28, gender: 'female', height: 158, weight: 52 },
      textEntries: [
        { timestamp: '2026-03-03T10:00:00Z', category: 'symptoms', title: '解離エピソード記録開始', content: '幼少期の複合トラウマ歴。現在は精神科で週1回の心理療法（IFS：内的家族システム療法）を受けている。今日は午後に2時間の健忘エピソード。夕方に気づいたら机の前にいたが、何をしていたか覚えていない。IFSセラピストの勧めで日記を始めた。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'symptoms', title: '解離の波', content: '今週は比較的安定していた（解離エピソード 0回）。グラウンディング技法（5-4-3-2-1感覚法）を朝晩実践している。仕事中のフラッシュバックが1回あったが、短時間（5分程度）で戻れた。TIPスキル（体温・運動・呼吸）が役に立った。' },
        { timestamp: '2026-03-20T22:00:00Z', category: 'symptoms', title: 'スイッチング記録', content: '夜に人格の切り替わり（スイッチング）が起きた。翌朝にノートに書かれた文字が自分の字でない。パートナーから「昨夜は別の人みたいだった」と言われた。セラピストに報告予定。グラウンディングの安全ルーティンを就寝前に実施。' },
        { timestamp: '2026-04-05T10:00:00Z', category: 'medication', title: '補助薬調整', content: 'フラッシュバック・不眠に対してクエチアピン 25mg（就寝前）を開始。強制的な薬ではなく補助として。睡眠が少し改善（4→6時間連続）。解離エピソードは週1〜2回に減少。解離のトリガー（大きな音・人混み）を把握できてきた。' },
        { timestamp: '2026-04-22T11:00:00Z', category: 'symptoms', title: 'フェーズ2移行', content: 'IFSセラピスト評価：「安定化フェーズの目標達成」。フェーズ2（トラウマ処理）への移行を検討中。EMDRの準備として安全な場所のイメージを確立。解離エピソードの頻度 週2→0〜1回に改善。日記の記録が「スイッチング後の確認ツール」として機能している。' },
        { timestamp: '2026-05-14T09:00:00Z', category: 'symptoms', title: '2ヶ月後評価', content: 'DES（解離体験尺度）スコア 42→28（改善）。解離エピソードの頻度が 月8→月2〜3回に大幅減少。健忘の持続時間も 2時間→30分以内に短縮。パートでの就労（週15時間）を再開。日記記録が「自分の連続性」を保つ助けになっている実感がある。' }
      ],
      symptoms: [
        { timestamp: '2026-03-03T09:00:00Z', fatigue_level: 7, pain_level: 3, sleep_quality: 3 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 6, pain_level: 3, sleep_quality: 4 },
        { timestamp: '2026-04-05T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-05-14T09:00:00Z', fatigue_level: 4, pain_level: 2, sleep_quality: 6 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-04-05T22:00:00Z', name: 'クエチアピン 25mg（就寝前）', notes: '不眠・フラッシュバック軽減目的の補助薬。主な治療は心理療法（IFS）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    immunodeficiency: {
      diseases: ['普通変異型免疫不全症（CVID）'],
      profile: { age: 38, gender: 'male', height: 175, weight: 68 },
      textEntries: [
        { timestamp: '2026-03-02T10:00:00Z', category: 'symptoms', title: 'CVID診断経緯', content: '30歳から毎年市中肺炎を繰り返し（計5回入院）。昨年末に血清IgG 280mg/dL（基準値700以上）・IgA 12mg/dL・IgM 28mg/dLと著明に低下。B細胞数は正常だが抗体産生不全と診断→普通変異型免疫不全症（CVID）と確定。指定難病（第65号）申請中。' },
        { timestamp: '2026-03-08T10:00:00Z', category: 'medication', title: 'IVIG開始', content: '静脈注射免疫グロブリン（IVIG）4週ごと 400mg/kg 開始。最初の投与はクリニックで6時間かけて点滴。副反応（頭痛・関節痛）が数時間続いたが翌日には改善。次回からは抗ヒスタミン薬を前投薬することになった。' },
        { timestamp: '2026-03-28T11:00:00Z', category: 'vitals', title: 'IgGトラフ値初回', content: '2回目IVIG前のIgGトラフ値：580mg/dL（初回 280→改善）。目標トラフ値は700-1000mg/dL。次回は用量を450mg/kgに増量予定。投与後の倦怠感も1日で改善（前回は2日）。感染症なし（IVIG開始後1ヶ月で初の感染症ゼロ）。' },
        { timestamp: '2026-04-25T10:00:00Z', category: 'vitals', title: '3回目IVIG後評価', content: '3回目IVIG後トラフ値：820mg/dL（目標達成！）。この3ヶ月で感染症: 0回（例年は年3〜4回の肺炎）。副反応も前投薬で最小限。指定難病認定通知来る→医療費の自己負担が大幅軽減。生ワクチン（MMR・水痘等）は禁忌であることを確認済み。' },
        { timestamp: '2026-05-10T09:00:00Z', category: 'symptoms', title: '現状', content: '4回目IVIG前。IgGトラフ値は目標範囲内を維持（820mg/dL）。体力・活動量が著明改善。仕事（フルタイム）に復帰できた。年1回の胸部CT・肺機能検査（間質性肺炎・気管支拡張症の合併確認）を予約。CVID患者会（日本PID患者会）に入会した。' }
      ],
      symptoms: [
        { timestamp: '2026-03-02T09:00:00Z', fatigue_level: 7, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-03-28T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-04-25T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-05-10T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-02T09:00:00Z', name: '確定診断時採血', findings: 'IgG 280mg/dL・IgA 12mg/dL・IgM 28mg/dL（著明低下）。B細胞数正常・抗体産生能低下。HIV 陰性。' },
        { timestamp: '2026-04-25T09:00:00Z', name: '3回目IVIG前トラフ値', findings: 'IgG 820mg/dL（目標達成）。CRP 0.2mg/dL（正常）。肝機能正常。' }
      ],
      medications: [
        { timestamp: '2026-03-08T09:00:00Z', name: 'ポリグロビンN 5%（IVIG）450mg/kg/4週', notes: '4週ごと点滴（6時間）。前投薬：フェキソフェナジン 60mg＋アセトアミノフェン 500mg。トラフ値目標 700-1000mg/dL。' },
        { timestamp: '2026-03-08T09:00:00Z', name: 'スルファメトキサゾール/トリメトプリム（バクタ）1錠/日', notes: '月水金。ニューモシスチス肺炎（PCP）予防。CD4数が低い間は継続。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    chemo_side: {
      diseases: ['乳がん術後補助化学療法（TC療法）副作用管理'],
      profile: { age: 48, gender: 'female', height: 160, weight: 58 },
      textEntries: [
        { timestamp: '2026-03-05T10:00:00Z', category: 'symptoms', title: 'TC療法1サイクル目開始', content: '乳がん（HER2陰性）の術後補助化学療法。ドセタキセル+シクロホスファミド（TC療法）4サイクルを3週ごとに実施。1日目：点滴は5時間。前投薬（デキサメタゾン・グラニセトロン）で当日の嘔気は軽度。帰宅後は強い倦怠感。' },
        { timestamp: '2026-03-08T09:00:00Z', category: 'symptoms', title: 'Day 4: 好中球最低期前', content: '嘔気 6/10（持続中）。制吐薬（グラニセトロン）を追加服用。食欲なし—リンゴジュース・スポーツドリンクのみ摂取。体温 36.8°C（正常）。脱毛が始まった（シャワー後に大量抜毛）—これは覚悟していたが辛い。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'vitals', title: 'Day 8: WBC 最低値', content: '好中球減少のピーク期。体温 37.2°C（要注意—38°C以上で即受診）。外出を控えて自宅静養。G-CSFの自己注射（フィルグラスチム）を3日間実施。フィルグラスチムの副作用：骨痛（腰・胸骨）が強い—鎮痛薬（アセトアミノフェン）で対処。' },
        { timestamp: '2026-03-20T10:00:00Z', category: 'symptoms', title: 'Day 16: 回復期', content: '体力が戻ってきた（倦怠感 7→3）。嘔気も消失。食欲も戻り、普通食を食べられた。脱毛はほぼ完了（ウィッグを作製）。爪の変色（黒くなる）が出始めた—主治医に報告済みで経過観察。' },
        { timestamp: '2026-04-02T10:00:00Z', category: 'medication', title: '2サイクル目', content: '2サイクル目開始。制吐薬のプロトコルを強化（デキサメタゾン3日間＋オランザピン追加）。1サイクル目より嘔気が軽減（4/10）。骨痛への対策：G-CSFをDay3から開始（早めに打つ）。末梢神経障害（手指のしびれ）が出始めた—ドセタキセルの副作用。' },
        { timestamp: '2026-05-12T10:00:00Z', category: 'vitals', title: '4サイクル目完了', content: 'TC療法全4サイクル完了！ 末梢神経障害（手指のしびれ）が残存（5/10）—主治医から「3〜6ヶ月で改善することが多い」との説明。爪変色は6本。脱毛はウィッグで対応中。術後ホルモン療法（アナストロゾール）を開始。定期フォローアップ体制に移行。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 6, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-03-12T09:00:00Z', fatigue_level: 8, pain_level: 5, sleep_quality: 4 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-05-12T09:00:00Z', fatigue_level: 3, pain_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-12T09:00:00Z', name: 'Day 8 CBC（好中球最低期）', findings: 'WBC 1,200/μL・好中球数 200/μL（G4：発熱性好中球減少症リスク高）。体温 37.2°C→G-CSF継続。' },
        { timestamp: '2026-05-12T09:00:00Z', name: '4サイクル後CBC', findings: 'WBC 6,800/μL（正常回復）・好中球数 4,100/μL。CEA・CA15-3：正常範囲。' }
      ],
      medications: [
        { timestamp: '2026-03-05T08:00:00Z', name: 'TC療法（ドセタキセル+シクロホスファミド）3週ごと×4', notes: '全4サイクル完了。前投薬：デキサメタゾン・グラニセトロン・オランザピン。' },
        { timestamp: '2026-03-12T08:00:00Z', name: 'フィルグラスチム（G-CSF）自己注射', notes: 'Day 3〜5（または医師指示）。骨痛の副作用あり→アセトアミノフェンで対処。' },
        { timestamp: '2026-05-12T08:00:00Z', name: 'アナストロゾール 1mg/日（ホルモン療法）', notes: '術後補助ホルモン療法。5〜10年継続予定。ホットフラッシュ・骨密度低下に注意。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    ssc: {
      diseases: ['全身性強皮症（びまん皮膚硬化型：dcSSc）'],
      profile: { age: 48, gender: 'female', height: 158, weight: 50 },
      textEntries: [
        { timestamp: '2026-03-02T10:00:00Z', category: 'symptoms', title: 'SSc診断・治療開始', content: '2年前からレイノー現象、半年前から手指・前腕の皮膚硬化・腫脹が出現。抗Scl-70（トポイソメラーゼI）抗体陽性。高分解能CT：両下肺野に蜂巣肺（UIPパターン）。FVC 72%・DLco 62%。びまん皮膚硬化型SSc（dcSSc）確定診断。指定難病（第51号）申請済み。ニフェジピン + ボセンタン + ミコフェノール酸モフェチル（MMF）開始。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'symptoms', title: 'レイノー発作記録', content: '冬はほぼ毎日レイノー発作（白→青→赤、両手10指）。ニフェジピン40mgで1日2〜3回に減少（治療前は5〜8回）。電熱手袋を購入して外出時に着用。指先の潰瘍が右示指に出現（直径5mm）。皮膚硬化スコア（mRSS）：18点（活動性あり）。' },
        { timestamp: '2026-03-25T10:00:00Z', category: 'vitals', title: 'SpO2モニタリング', content: 'SpO2 安静時 96%・階段昇降後 91%（間質性肺炎の影響）。KL-6 1,200 U/mL（高値）・SP-D 180 ng/mL。MMF 2g/日（500mg×4）が間質性肺炎の安定化に寄与している可能性。皮膚硬化は顔面・口周囲にも及んできた（開口制限：最大開口 35mm）。' },
        { timestamp: '2026-04-15T10:00:00Z', category: 'medication', title: 'ニンテダニブ追加', content: 'SSc-ILD（強皮症合併間質性肺炎）に対してニンテダニブ（INBUILD試験適応）300mg/日を追加。下痢副作用（1日2〜3回）が始まったが整腸剤で対処。デジタル潰瘍（右示指）が治癒（4週間で上皮化）。ボセンタン継続（デジタル潰瘍予防）。' },
        { timestamp: '2026-05-14T09:00:00Z', category: 'vitals', title: '3ヶ月後評価', content: 'FVC 71%（開始時72%、ほぼ安定）・DLco 60%（わずかに低下）。KL-6 1,100 U/mL（改善傾向）。皮膚硬化スコア（mRSS）18→15点（わずかに改善）。レイノー発作回数 2〜3→1〜2回/日（安定）。ニンテダニブの下痢は4週目から減少した。自覚症状は「少し安定してきた」実感。' }
      ],
      symptoms: [
        { timestamp: '2026-03-02T09:00:00Z', fatigue_level: 7, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 6, pain_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 6, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-05-14T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-02T09:00:00Z', name: '確定診断時採血', findings: '抗Scl-70抗体 強陽性・ANA 1:640（核小体型）・KL-6 1,200 U/mL・SP-D 180 ng/mL・BNP 28pg/mL（正常）・BNP正常（肺高血圧なし）' },
        { timestamp: '2026-05-14T09:00:00Z', name: '3ヶ月後採血', findings: 'KL-6 1,100 U/mL（改善）・BNP 32pg/mL（正常）・肝機能正常（ニンテダニブモニタリング）' }
      ],
      medications: [
        { timestamp: '2026-03-02T08:00:00Z', name: 'ニフェジピン徐放製剤 40mg', notes: '毎朝。レイノー現象・デジタル潰瘍予防。副作用：頭痛・ほてり。' },
        { timestamp: '2026-03-02T08:00:00Z', name: 'ボセンタン 250mg/日', notes: 'エンドセリン受容体拮抗薬。デジタル潰瘍予防・肺高血圧予防。肝機能モニタリング月1回。' },
        { timestamp: '2026-03-02T08:00:00Z', name: 'ミコフェノール酸モフェチル（MMF）2g/日', notes: 'SSc-ILDの免疫抑制。腎機能・血球モニタリング。' },
        { timestamp: '2026-04-15T08:00:00Z', name: 'ニンテダニブ 300mg/日', notes: 'SSc-ILDの抗線維化薬。下痢副作用→整腸剤と食後服用で対処。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    nmosd: {
      diseases: ['視神経脊髄炎スペクトラム障害（NMOSD・抗AQP4抗体陽性）'],
      profile: { age: 36, gender: 'female', height: 163, weight: 57 },
      textEntries: [
        { timestamp: '2026-03-03T10:00:00Z', category: 'symptoms', title: 'NMOSD 2回目再発後', content: '3年前に視神経炎（右眼：急性視力低下）でMSと診断されたが、抗AQP4抗体陽性・NMO-IgG陽性で再診断→NMOSD確定。β-インターフェロン（MS治療）から中止。イネビリズマブ（ウプリジナ）静注を月1回（初回・2週後、以後月1回）開始。右眼視力 0.5（完全回復せず）。今回初めて記録をつけ始めた。' },
        { timestamp: '2026-03-15T09:00:00Z', category: 'symptoms', title: '視神経炎後の変化記録', content: 'Uhthoff現象（体温上昇で視力が一時的に悪化）：入浴後・運動後に右眼が霞む→30分で回復。Lhermitte徴候（頸部前屈で電撃痛）：朝の着替え時に出現→脊髄症状モニタリング要。排尿障害（残尿感）：残尿65mL（膀胱機能障害）→泌尿器科紹介。イネビリズマブ初回投与後：副作用なし。' },
        { timestamp: '2026-03-28T11:00:00Z', category: 'medication', title: 'ステロイドパルス後評価', content: '2回目再発（左眼視神経炎）に対するメチルプレドニゾロンパルス（1g×5日）後3週間。左眼視力 0.1→0.6（部分回復）。色覚障害（赤色が鮮明でない）は残存。再発予防薬変更：イネビリズマブ → サトラリズマブ（皮下注射・月1回・自己注射可）に変更検討中。' },
        { timestamp: '2026-04-20T10:00:00Z', category: 'symptoms', title: '再発なし3週間', content: 'サトラリズマブに切り替えて1ヶ月。再発なし（再発間隔が延びている）。脊髄MRI：前回病変の縮小確認。排尿障害：ソリフェナシン（膀胱訓練）で改善（残尿30mL）。Uhthoff現象：運動後も出現するが5分で回復→運動を継続（適度な有酸素運動は許容と指示）。' },
        { timestamp: '2026-05-15T10:00:00Z', category: 'vitals', title: '5ヶ月後評価', content: '再発なし5ヶ月（治療変更後）。右眼視力 0.5（安定）・左眼視力 0.7（回復中）。EDSS（障害度スコア）：2.0（軽度障害）。サトラリズマブ継続（副作用なし）。排尿障害：残尿20mL（ほぼ正常化）。日記記録が「再発の前触れ症状」の早期検出に役立っている実感がある。' }
      ],
      symptoms: [
        { timestamp: '2026-03-03T09:00:00Z', fatigue_level: 6, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-03-28T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-04-20T09:00:00Z', fatigue_level: 4, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-05-15T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-03T09:00:00Z', name: '確定診断時採血', findings: '抗AQP4抗体（NMO-IgG）陽性（高力価）・ANA 1:80（境界）・CSF（腰椎穿刺）：オリゴクローナルバンド 陰性（MSとの鑑別）・IL-6 高値（NMOSD の特徴）' },
        { timestamp: '2026-05-15T09:00:00Z', name: '5ヶ月後採血', findings: '抗AQP4抗体：低下傾向（治療効果）。リンパ球数：正常（イネビリズマブ/サトラリズマブのモニタリング）。' }
      ],
      medications: [
        { timestamp: '2026-03-03T09:00:00Z', name: 'サトラリズマブ（エンスプリング）120mg/4週 皮下注射', notes: '抗IL-6受容体抗体。NMOSD再発予防。自己注射可能（冷蔵保存）。' },
        { timestamp: '2026-03-03T08:00:00Z', name: 'ソリフェナシン（ベシケア）5mg', notes: '過活動膀胱・排尿障害（NMOSD合併）。残尿測定を定期的に実施。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    spinal_stenosis: {
      diseases: ['腰部脊柱管狭窄症'],
      profile: { age: 68, gender: 'male', height: 168, weight: 72 },
      textEntries: [
        { timestamp: '2026-03-05T10:00:00Z', category: 'symptoms', title: '診断から1ヶ月', content: '1年前から歩くと右足の外側がしびれてくる。300m歩くと休まないといけない（間欠性跛行）。前かがみになると楽になる。MRIで「L4-5レベルの腰部脊柱管狭窄症」と確定診断。プロスタグランジンE1（オパルモン）とロキソプロフェンを処方された。手術はなるべく避けたい。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'symptoms', title: '歩行記録', content: '今日の歩行：自宅→コンビニ（200m）で右足しびれ出現→ベンチで3分休憩→また歩けた。休憩なしで歩ける距離：150〜200m。前かがみ（シルバーカー使用）だと300m歩けた。痛みNRS 4/10、しびれNRS 5/10。プロスタグランジンを2週間服用しているがまだ改善は感じない。' },
        { timestamp: '2026-04-02T11:00:00Z', category: 'treatment', title: '硬膜外ブロック1回目', content: '整形外科クリニックで硬膜外神経ブロック（L4-5、ステロイド＋局所麻酔）を受けた。施術後6時間は右足のしびれが消えた。翌日から徐々に再発したが、ピーク時のしびれがNRS 5→3に改善。歩行距離：300mで休憩が必要だったのが400mまで伸びた。理学療法（体幹安定化訓練）も週1回開始。' },
        { timestamp: '2026-04-25T09:00:00Z', category: 'symptoms', title: 'PT2ヶ月評価', content: '理学療法（ドローイン・骨盤傾斜）を2ヶ月継続。毎朝10分の体幹トレを習慣化。歩行可能距離：150m→500mに改善（大幅改善！）。痛みNRS 2/10・しびれNRS 2/10。排尿障害：なし（膀胱直腸障害出たら即受診と医師に言われている）。硬膜外ブロック2回目を来月予定。' },
        { timestamp: '2026-05-18T10:00:00Z', category: 'symptoms', title: '3ヶ月まとめ', content: '保存療法（薬・ブロック・理学療法）で大幅改善。現在700m程度は休まず歩ける。スーパーの買い物カートを使うとさらに楽（前傾姿勢の効果）。手術を回避できる可能性が出てきた。次回MRI（3ヶ月後）で骨棘の変化を確認予定。毎日の歩行距離記録が治療選択の根拠になっている。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 5, pain_level: 5, sleep_quality: 6 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 4, pain_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-02T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 7 },
        { timestamp: '2026-04-25T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 },
        { timestamp: '2026-05-18T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-05T09:00:00Z', name: 'MRI診断時採血', findings: 'CRP 0.2mg/dL（正常）・血糖 108mg/dL（境界）・腎機能正常・貧血なし。MRI L4-5：黄色靱帯肥厚・硬膜管面積 70mm²（正常：100mm²以上）' }
      ],
      medications: [
        { timestamp: '2026-03-05T08:00:00Z', name: 'リマプロストアルファデクス（オパルモン）15μg/日', notes: 'プロスタグランジンE1製剤。脊柱管内血流改善。腰部脊柱管狭窄症の第一選択薬。食直前服用。' },
        { timestamp: '2026-03-05T08:00:00Z', name: 'ロキソプロフェン 60mg/回（頓服）', notes: '疼痛時のみ。胃保護のためPPIと併用。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    functional_dyspepsia: {
      diseases: ['機能性ディスペプシア（FD・食後愁訴症候群）'],
      profile: { age: 38, gender: 'female', height: 162, weight: 54 },
      textEntries: [
        { timestamp: '2026-03-01T11:00:00Z', category: 'symptoms', title: '記録開始', content: '2年前からずっと食後の胃もたれが辛い。食べ始めてすぐ満腹感が出る（早期満腹感）。200g以上食べられないので体重が減ってきた。内視鏡（ガスリー）で異常なし・ピロリ菌陰性。消化器内科で「機能性ディスペプシア（FD）の食後愁訴症候群型（PDS型）」と診断された。六君子湯とモサプリドを処方された。' },
        { timestamp: '2026-03-15T10:00:00Z', category: 'symptoms', title: '食事日誌2週間まとめ', content: '食事記録をつけ始めて分かったこと：脂質が多い食事（揚げ物・ステーキ）で翌日まで胃もたれが続く。コーヒーを飲むと30分後に胃痛（NRS 4）。炭酸飲料はガスで腹部膨満感が悪化。逆に、白米・卵・白身魚・豆腐は症状が出にくい。少量（100〜150g）を1日5〜6回に分けて食べると楽。' },
        { timestamp: '2026-04-01T09:00:00Z', category: 'medication', title: '六君子湯2ヶ月評価', content: '六君子湯（7.5g/日）を2ヶ月服用。早期満腹感が NRS 7→4 に改善（！）。胃もたれは NRS 6→5（やや改善）。食事量が 200g→280g に増加。体重 52.0kg→53.2kg（＋1.2kg）。モサプリドはあまり効果を実感できず。主治医：「続けましょう、もう少し改善するかも」。ストレスのある週は悪化するパターンも明確になってきた。' },
        { timestamp: '2026-04-20T10:00:00Z', category: 'symptoms', title: 'ストレスと症状の関連', content: '職場の繁忙期（4月・新入社員研修を担当）に入ってから症状悪化。NRS 平均：胃もたれ 6、早期満腹感 6。ストレスレベル 8/10（多忙）の週は症状スコアが高いパターンが記録に明確に現れている。主治医に相談→アミトリプチリン（10mg/夜）を追加。「脳腸相関のアプローチ」と説明された。' },
        { timestamp: '2026-05-15T10:00:00Z', category: 'medication', title: 'アミトリプチリン1ヶ月', content: 'アミトリプチリン追加1ヶ月。胃もたれ NRS 6→3（大幅改善）。食事量 280g→350g に増加。体重 53.2kg→54.8kg（順調回復）。繁忙期が落ち着いたこともあり相乗効果。日記記録で「食事・ストレス・症状」の三角関係が可視化でき、主治医との会話の質が変わった。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 5, pain_level: 5, sleep_quality: 6 },
        { timestamp: '2026-03-15T09:00:00Z', fatigue_level: 5, pain_level: 5, sleep_quality: 6 },
        { timestamp: '2026-04-01T09:00:00Z', fatigue_level: 4, pain_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-20T09:00:00Z', fatigue_level: 6, pain_level: 6, sleep_quality: 5 },
        { timestamp: '2026-05-15T09:00:00Z', fatigue_level: 3, pain_level: 3, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-01T09:00:00Z', name: '初診時採血・内視鏡', findings: 'CRP正常・甲状腺機能正常・血糖正常。上部消化管内視鏡：異常なし（胃潰瘍・胃癌なし）。H.pylori 抗体陰性（除菌歴なし）。' }
      ],
      medications: [
        { timestamp: '2026-03-01T08:00:00Z', name: '六君子湯エキス顆粒 7.5g/日', notes: '胃排出促進・グレリン分泌刺激。食前30分服用。FD・PDS型に保険適用。' },
        { timestamp: '2026-03-01T08:00:00Z', name: 'モサプリドクエン酸塩（ガスモチン）15mg/日', notes: '消化管運動改善薬。食後服用。' },
        { timestamp: '2026-04-20T22:00:00Z', name: 'アミトリプチリン（トリプタノール）10mg 就寝前', notes: '三環系抗うつ薬・少量使用。内臓知覚過敏・FD の脳腸相関治療。眠気に注意（就寝前に服用）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    interstitial_cystitis: {
      diseases: ['間質性膀胱炎（ハンナ型・膀胱痛症候群）'],
      profile: { age: 44, gender: 'female', height: 160, weight: 55 },
      textEntries: [
        { timestamp: '2026-03-02T10:00:00Z', category: 'symptoms', title: '間質性膀胱炎の経過', content: '4年前から頻尿・骨盤痛が悪化。最初は「細菌性膀胱炎」と繰り返し抗菌薬を処方されたが改善なし。膀胱内視鏡（麻酔下）でハンナ病変を確認→「ハンナ型間質性膀胱炎」確定診断。現在ペントサンポリサルフェート（SP-54）とアミトリプチリン 25mg を服用中。1日の排尿回数 30〜35回、夜間頻尿 6〜8回。' },
        { timestamp: '2026-03-18T09:00:00Z', category: 'symptoms', title: '排尿日誌まとめ', content: '排尿日誌1週間分：1日排尿回数 平均31回（最多38回・最少25回）、夜間頻尿 平均6.5回（睡眠分断が深刻）。1回排尿量：平均 60〜80mL（膀胱容量が著しく低下）。膀胱充満時の痛み NRS 7/10（排尿後は3/10に下がる）。トリガー食品の確認：コーヒー・オレンジジュース・トマト・チョコレートで増悪を確認。' },
        { timestamp: '2026-04-05T11:00:00Z', category: 'treatment', title: '膀胱水圧拡張術（2回目）', content: '膀胱水圧拡張術（麻酔下）実施。ハンナ病変に対して電気凝固術も同時施行。術後1週間：排尿回数 31→20回（大幅減少）・夜間頻尿 7→3回。骨盤痛 NRS 7→3。前回（6ヶ月前）と同様の改善。「効果は3〜6ヶ月持続する」と主治医から説明。1日の記録を継続して次回拡張術のタイミングを判断する。' },
        { timestamp: '2026-04-28T10:00:00Z', category: 'symptoms', title: '拡張術後3週間', content: '排尿回数：15〜18回/日に安定（IC としてはかなり良い状態）。夜間頻尿：2〜3回（以前の7〜8回から大幅改善）。睡眠の質が回復した実感がある。IC 食事（酸性食品・カフェイン・アルコール・スパイシー完全除去）を継続。体重が安定している（以前は痛みで食事が減っていた）。骨盤底筋リラクゼーション（PT指導）も並行して継続。' },
        { timestamp: '2026-05-16T10:00:00Z', category: 'symptoms', title: '拡張術後6週間', content: 'やや症状がぶり返し始めた：排尿回数 18→23回/日に増加。骨盤痛 NRS 4（先週2から増悪）。「ぶり返しのパターン」が記録で見えてきた→次の拡張術は術後3〜4ヶ月目が最適と主治医と相談。ペントサンポリサルフェートを増量（100mg×3→100mg×4）検討中。記録が「治療サイクルの最適化」に役立っている。' }
      ],
      symptoms: [
        { timestamp: '2026-03-02T09:00:00Z', fatigue_level: 7, pain_level: 7, sleep_quality: 3 },
        { timestamp: '2026-03-18T09:00:00Z', fatigue_level: 7, pain_level: 6, sleep_quality: 3 },
        { timestamp: '2026-04-05T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-28T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 },
        { timestamp: '2026-05-16T09:00:00Z', fatigue_level: 5, pain_level: 4, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-02T09:00:00Z', name: '細菌培養・尿検査', findings: '尿培養：陰性（細菌性膀胱炎ではない）。尿細胞診：陰性（膀胱癌否定）。尿中好酸球：検出（ハンナ型IC の特徴的所見）。過去4年の繰り返し尿培養：全て陰性。' }
      ],
      medications: [
        { timestamp: '2026-03-02T08:00:00Z', name: 'ペントサンポリサルフェートナトリウム（SP-54）300mg/日', notes: '膀胱粘膜保護薬。IC 第一選択薬。効果発現まで3〜6ヶ月かかることがある。食前1時間に服用。' },
        { timestamp: '2026-03-02T22:00:00Z', name: 'アミトリプチリン（トリプタノール）25mg 就寝前', notes: '内臓痛覚過敏の軽減・夜間頻尿による睡眠障害の改善。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    loh: {
      diseases: ['男性更年期障害（LOH症候群・加齢性腺機能低下症）'],
      profile: { age: 53, gender: 'male', height: 173, weight: 82 },
      textEntries: [
        { timestamp: '2026-03-03T10:00:00Z', category: 'symptoms', title: 'LOH診断', content: '2年前から疲れやすく気力が出ない。性欲の低下・勃起力の低下。集中力・記憶力の低下を感じる。うつ病かと思って心療内科を受診したが「うつの基準は満たさない」と言われた。泌尿器科でテストステロン測定：総テストステロン 210ng/dL・遊離テストステロン 6.5pg/mL（ともに低値）。AMS スコア 45点（中等度）→LOH症候群と診断。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'medication', title: 'TRT開始2週間', content: 'テストステロン補充療法（筋注：エナント酸テストステロン 250mg/4週）開始2週間。今週のAMSスコア：38点（45→38、やや改善）。エネルギーが少し戻ってきた実感あり。性欲：変化感じない（まだ早いかも）。副作用：注射部位の痛みあり。PSA検査：1.2ng/mL（正常範囲）。血球（多血症チェック）：Hct 44%（正常）。' },
        { timestamp: '2026-04-10T11:00:00Z', category: 'medication', title: 'TRT2ヶ月評価', content: 'TRT 2ヶ月目の採血：総テストステロン 580ng/dL（正常範囲）・遊離テストステロン 14.2pg/mL（改善）。AMSスコア 45→32（改善）。疲労感：大幅改善（朝のだるさがなくなった）。性欲：回復してきた。集中力：「仕事のパフォーマンスが上がった」実感。体重：82kg→81kg（筋肉増加・脂肪減少）。筋トレ週3回を継続している。' },
        { timestamp: '2026-04-28T10:00:00Z', category: 'symptoms', title: '生活習慣改善の効果', content: '筋トレ（週3回・週60分）と良質な睡眠（7時間確保）を継続中。飲酒を週3回→週1回に減らした。体重 81→79kg（-3kg）。腹囲 95→90cm（内臓脂肪の減少）。BMI 27→26。テストステロン値との相乗効果を感じる。AMSスコア：28点（軽度範囲）。「10年前の自分に戻った気分」と主治医に伝えた。' },
        { timestamp: '2026-05-18T10:00:00Z', category: 'vitals', title: '3ヶ月後の総評', content: 'TRT 3ヶ月・筋トレ継続。AMSスコア 45→25（著明改善）。体重 82→78kg。Hct 45%（多血症なし）・PSA 1.3ng/mL（変化なし・前立腺は問題なし）。6ヶ月後に次回採血予定。「このまま治療を継続するか、3〜6ヶ月の休薬試験をするか」を主治医と相談中。毎日の記録が「治療前との比較」を可能にした。' }
      ],
      symptoms: [
        { timestamp: '2026-03-03T09:00:00Z', fatigue_level: 7, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 6, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-04-28T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-05-18T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 8 }
      ],
      bloodTests: [
        { timestamp: '2026-03-03T09:00:00Z', name: '初診時採血（早朝採血）', findings: '総テストステロン 210ng/dL（基準値 270〜1070ng/dL、低値）・遊離テストステロン 6.5pg/mL（基準値 8.5pg/mL以上、低値）・LH・FSH：正常（原発性腺機能低下でなく加齢性）・PSA 1.2ng/mL（正常）・Hct 44%・甲状腺正常・血糖 HbA1c 5.9%（境界）' },
        { timestamp: '2026-04-10T09:00:00Z', name: 'TRT 2ヶ月後採血', findings: '総テストステロン 580ng/dL（正常化）・遊離テストステロン 14.2pg/mL（正常化）・Hct 45%（多血症なし）・PSA 1.3ng/mL（変化なし）' }
      ],
      medications: [
        { timestamp: '2026-03-05T10:00:00Z', name: 'エナント酸テストステロン 250mg 4週毎筋注', notes: 'TRT（テストステロン補充療法）。泌尿器科で実施。PSA・Hct 定期モニタリング必須。前立腺肥大症・前立腺癌に禁忌。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    alopecia: {
      diseases: ['円形脱毛症（汎発性・全頭型）'],
      profile: { age: 32, gender: 'female', height: 160, weight: 52 },
      textEntries: [
        { timestamp: '2026-03-01T10:00:00Z', category: 'symptoms', title: 'バリシチニブ開始', content: '円形脱毛症で3年以上悩んでいる。ステロイド局注を10回以上受けたが脱毛が進行して全頭型になった。今月からバリシチニブ（JAK阻害薬・4mg/日）を開始。帽子とウィッグで日常生活は送れているが、精神的なダメージが大きい。橋本病も合併している。脱毛範囲と新しい産毛の出現を毎週記録する。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'treatment', title: 'バリシチニブ3週間', content: 'バリシチニブ開始3週間。頭部の後頭部エリアに細い産毛が出始めた（！）。SALTスコア：98→93（僅かだが改善の兆し）。副作用：軽度の倦怠感（最初の2週間）・ニキビ様皮疹が額に少し出た。甲状腺（TSH）は安定。血球・肝機能モニタリング異常なし。主治医：「6ヶ月で効果を判定する。継続しましょう」。' },
        { timestamp: '2026-04-15T09:00:00Z', category: 'symptoms', title: '2ヶ月目の評価', content: '後頭部から頭頂部にかけて産毛が増えてきた。直径 1cm 以上の産毛ゾーンが6ヶ所確認できた（写真記録）。SALTスコア：93→78（明らかな改善！）。まつ毛・眉毛も少し戻ってきた。精神的に「少しずつ回復している」実感があって、気持ちが前向きになってきた。副作用は落ち着いた（ニキビ様皮疹が消退）。' },
        { timestamp: '2026-05-10T10:00:00Z', category: 'symptoms', title: '3ヶ月まとめ', content: 'SALTスコア：78→52（著明改善・50%以上の発毛回復）。頭部全体に薄く産毛が広がっている。色は薄いが均一な発毛が続いている。バリシチニブ継続（用量を検討中・減量するか維持か）。PSA：女性なので測定なし。橋本病の甲状腺機能：安定（TSH 2.1）。精神状態：大幅改善。ウィッグを外でして出歩ける回数が増えた。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 5 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 6 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-05-10T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-01T09:00:00Z', name: 'バリシチニブ開始前採血', findings: 'TSH 2.3（橋本病：安定）・抗TPO抗体 高値・ANA 1:80（弱陽性）・血球：正常・肝機能：正常・脂質：正常。バリシチニブ適応確認（感染症スクリーニング陰性・帯状疱疹ワクチン接種済み）。' },
        { timestamp: '2026-05-10T09:00:00Z', name: '3ヶ月後フォローアップ採血', findings: 'TSH 2.1（安定）・血球：正常・肝機能：正常・LDL-C：正常・帯状疱疹再活性化なし。' }
      ],
      medications: [
        { timestamp: '2026-03-01T08:00:00Z', name: 'バリシチニブ（オルミエント）4mg/日', notes: 'JAK阻害薬。重症円形脱毛症に2023年承認。6ヶ月で治療効果を評価。感染症・血栓・帯状疱疹に注意。' },
        { timestamp: '2026-03-01T08:00:00Z', name: 'チラーヂンS 50μg/日', notes: '橋本病（甲状腺機能低下症）の補充療法。TSHモニタリング3〜6ヶ月毎。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    phn: {
      diseases: ['帯状疱疹後神経痛（PHN・左胸部）'],
      profile: { age: 72, gender: 'female', height: 154, weight: 50 },
      textEntries: [
        { timestamp: '2026-03-05T10:00:00Z', category: 'symptoms', title: 'PHN 6ヶ月目', content: '帯状疱疹（左胸部）を昨年9月に発症。抗ウイルス薬（バラシクロビル）で治療し皮疹は治ったが、痛みだけが続いている（PHN）。左胸部に灼熱痛（NRS 7/10）と、衣服が触れると激痛（アロディニア）がある。プレガバリン 150mg/日とアミトリプチリン 10mg（就寝前）を服用中。毎日の痛みを記録してペインクリニックに報告している。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'symptoms', title: '痛みの記録2週間', content: '朝の痛み平均 NRS 5/10。夕方〜夜に悪化（NRS 7〜8）。アロディニア：コットンの服は比較的OK。ナイロン系・ウール系は激痛。就寝時に左側を下にできないため睡眠の質が著しく低下（中途覚醒 3〜4回/夜）。プレガバリンの眠気が強い（日中もぼーっとする）→主治医に相談したい。' },
        { timestamp: '2026-04-08T11:00:00Z', category: 'treatment', title: '硬膜外ブロック', content: 'ペインクリニックで硬膜外神経ブロック（T5-6 レベル、ステロイド＋局所麻酔）を実施。施術後3時間：痛みがNRS 0になった（感動！）。翌日から徐々に再発したが、ピーク時 NRS 7→4 に改善。夜の中途覚醒が3〜4回→1回に減った。プレガバリンを 150→75mg に減量しても効果が保たれている（眠気が軽減）。' },
        { timestamp: '2026-05-02T10:00:00Z', category: 'symptoms', title: '2ヶ月評価', content: 'ブロック後1ヶ月。痛みは NRS 4/10（朝）・5/10（夜）に安定。アロディニアは改善（ウール以外はほぼ我慢できる）。睡眠：中途覚醒 1〜2回に減少。「6ヶ月前の半分の痛みになった」実感。2回目のブロック注射を来月予定。プレガバリン 75mg + アミトリプチリン 10mg を継続。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 7, pain_level: 7, sleep_quality: 3 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 6, pain_level: 7, sleep_quality: 3 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 5, pain_level: 4, sleep_quality: 6 },
        { timestamp: '2026-05-02T09:00:00Z', fatigue_level: 4, pain_level: 4, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-05T09:00:00Z', name: 'ペインクリニック初診時採血', findings: '血糖 HbA1c 5.5%（正常）・甲状腺正常・腎機能正常（プレガバリン用量調整に必要）・帯状疱疹（VZV）抗体価：高値（6ヶ月前の帯状疱疹後）' }
      ],
      medications: [
        { timestamp: '2026-03-05T08:00:00Z', name: 'プレガバリン（リリカ）75mg/日（減量後）', notes: '神経障害性疼痛の第一選択薬。腎機能に合わせて用量調整。眠気・ふらつきに注意（高齢者では転倒リスク）。' },
        { timestamp: '2026-03-05T22:00:00Z', name: 'アミトリプチリン（トリプタノール）10mg 就寝前', notes: '三環系抗うつ薬。PHNの疼痛軽減・睡眠改善。口渇・便秘・眠気の副作用。' },
        { timestamp: '2026-04-08T10:00:00Z', name: 'リドカインテープ（ペンレス）', notes: 'アロディニアのある部位に貼付。局所麻酔作用。服着用前に貼付するとアロディニアが軽減。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    chronic_pancreatitis: {
      diseases: ['慢性膵炎（アルコール性・非代償期）'],
      profile: { age: 55, gender: 'male', height: 170, weight: 62 },
      textEntries: [
        { timestamp: '2026-03-02T10:00:00Z', category: 'symptoms', title: '禁酒2年後の状態', content: '慢性膵炎の診断から5年。最初の3年は断酒に失敗して増悪を繰り返したが、2年前からようやく完全禁酒できている。今は腹痛の急性増悪は年1回程度に減った。しかし膵外分泌不全（脂肪便・栄養吸収不全）と膵性糖尿病（HbA1c 8.2%）が続いている。体重が5年前より10kg減っている（62kg→52kgを目指しているが...逆に減りすぎ）。' },
        { timestamp: '2026-03-18T09:00:00Z', category: 'symptoms', title: '食事記録と症状', content: '低脂肪食（1食あたり脂質 10〜15g以内）を続けている。揚げ物・バター・マーガリンを完全除去。脂肪便（白っぽい・油っぽい便）：週3〜4回出ている（膵消化酵素薬を使っているが完全に抑えられない）。食後の腹痛：NRS 4/10（以前の8/10から大幅改善）。体重：62kg → 61.5kg（微減・栄養吸収不全が続いている）。' },
        { timestamp: '2026-04-05T11:00:00Z', category: 'medication', title: '消化酵素増量効果', content: '膵消化酵素薬（パンクレリパーゼ）を食事ごとに 25,000→40,000 単位に増量。脂肪便：週3〜4回→週1〜2回（大幅改善！）。腹部膨満感の軽減。体重：61.5kg→62.5kg（1kg増加）。脂溶性ビタミン補充（ビタミンD・E・K）を追加した。HbA1c：8.2%→7.5%（インスリン増量の効果）。' },
        { timestamp: '2026-05-15T10:00:00Z', category: 'vitals', title: '3ヶ月まとめ', content: '禁酒継続（2年2ヶ月）。急性増悪：この3ヶ月は0回（！）。脂肪便：週1回以下。体重：62.5kg（安定）。HbA1c：7.2%（目標の7.5%以下を達成）。血清アミラーゼ：60 U/L（正常）。腹部CT（年1回）：膵石の増大なし・膵管拡張安定。次のCTを半年後に予定。毎日の食事記録が「何を食べると脂肪便が出るか」の特定に役立っている。' }
      ],
      symptoms: [
        { timestamp: '2026-03-02T09:00:00Z', fatigue_level: 5, pain_level: 4, sleep_quality: 6 },
        { timestamp: '2026-03-18T09:00:00Z', fatigue_level: 5, pain_level: 4, sleep_quality: 6 },
        { timestamp: '2026-04-05T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 7 },
        { timestamp: '2026-05-15T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-02T09:00:00Z', name: '定期採血', findings: 'アミラーゼ 85 U/L（軽度高値）・リパーゼ 95 U/L（高値）・HbA1c 8.2%・空腹時血糖 178mg/dL・アルブミン 3.5g/dL（低値〜境界）・脂溶性VIT（25-OH ビタミンD）：14 ng/mL（低値）' },
        { timestamp: '2026-05-15T09:00:00Z', name: '3ヶ月後採血', findings: 'アミラーゼ 60 U/L（正常化）・HbA1c 7.2%（改善）・アルブミン 3.8g/dL（改善）・25-OH ビタミンD：22 ng/mL（補充効果）' }
      ],
      medications: [
        { timestamp: '2026-03-02T08:00:00Z', name: 'パンクレリパーゼ（クレオン）40,000単位/食', notes: '膵消化酵素補充。食事と同時に服用。脂肪便・栄養吸収不全を改善。胃酸で失活するためPPIと併用。' },
        { timestamp: '2026-03-02T08:00:00Z', name: 'インスリングラルギン（ランタス）20単位/就寝前', notes: '膵性糖尿病の治療。膵インスリン産生能低下に対する補充。血糖測定毎日。' },
        { timestamp: '2026-03-02T08:00:00Z', name: 'プレガバリン（リリカ）75mg/日', notes: '慢性膵炎の神経障害性疼痛。腹痛・背部痛の管理。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    lymphedema: {
      diseases: ['リンパ浮腫（乳がん術後・続発性・右上肢）'],
      profile: { age: 56, gender: 'female', height: 158, weight: 60 },
      textEntries: [
        { timestamp: '2026-03-03T10:00:00Z', category: 'symptoms', title: 'リンパ浮腫1年目', content: '乳がん手術（右乳房切除＋腋窩リンパ節郭清 15個）から1年。術後3ヶ月から右腕がむくみ始め、リンパ浮腫 ISL Stage 2 と診断。弾性スリーブ（mmHg 20〜30）を毎日着用し、週2回の用手リンパドレナージ（MLD）をリンパ浮腫セラピスト（CLT）から受けている。右上肢周径（肘上10cm）：健側 28cm、患側 32cm（＋4cm）。' },
        { timestamp: '2026-03-18T09:00:00Z', category: 'symptoms', title: '周径測定週次記録', content: '右上肢周径（肘上10cm）：先週 32.0cm → 今週 31.5cm（-0.5cm 改善）。右手首：先週 17.5cm → 17.2cm（改善）。朝（弾性スリーブ着用前）の測定。夕方は 32.5〜33cm になることが多い（立位・活動後に増大）。皮膚：乾燥なし・発赤なし・熱感なし（蜂窩織炎の早期サインなし）。弾性スリーブ装着後の圧迫感は慣れてきた。' },
        { timestamp: '2026-04-10T11:00:00Z', category: 'treatment', title: 'MLD自己施行を習得', content: 'リンパ浮腫セラピストから自己 MLD（簡易版）の指導を受けた。首・腋窩・腹部のリンパ節への誘導が主目標。毎朝 15 分の自己 MLD を開始。週2回のプロによる MLD と組み合わせることで効果が維持しやすくなった。周径（肘上10cm）：32.0→30.8cm（2週間で -1.2cm！）。セラピスト：「日々のセルフケアが最も大切」。' },
        { timestamp: '2026-05-08T10:00:00Z', category: 'symptoms', title: '2ヶ月まとめ', content: '周径（肘上10cm）：入院時32.0cm → 現在 30.2cm（-1.8cm）。LVA（リンパ管静脈吻合術）を行う形成外科への紹介を主治医と相談中。蜂窩織炎：今月はなし（発赤・熱感があればすぐセラピストか主治医に連絡する約束）。水中ウォーキングを週2回追加。「動くことで浮腫が減る」実感がある。毎週の周径記録グラフが治療モチベーションになっている。' }
      ],
      symptoms: [
        { timestamp: '2026-03-03T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-03-18T09:00:00Z', fatigue_level: 4, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 },
        { timestamp: '2026-05-08T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-03T09:00:00Z', name: 'リンパ浮腫外来初診時採血', findings: '血清アルブミン 4.0g/dL（正常）・CRP 0.1（感染なし）・甲状腺正常・腎機能正常。リンパシンチグラフィ：右腋窩のドレナージ欠損（腋窩郭清後の変化）を確認。' }
      ],
      medications: [
        { timestamp: '2026-03-03T08:00:00Z', name: 'ヒルドイドローション（ヘパリン類似物質）患側腕に塗布', notes: '保湿・皮膚バリア維持。感染リスクを下げるために毎日塗布。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    emf: {
      diseases: ['電磁波過敏症（EHS）・機能性身体症候群'],
      profile: { age: 40, gender: 'female', height: 162, weight: 56 },
      textEntries: [
        { timestamp: '2026-03-03T10:00:00Z', category: 'symptoms', title: '症状の始まり', content: '3年前から、スマートフォンを長時間使うと頭痛・ピリピリ感・集中力低下が出るようになった。Wi-Fi機器を自宅から撤去し、有線LANに切り替えた。スマートフォンは機内モードで使用中。症状が「電磁波」から来ていると確信しているが、内科・神経科・心療内科では「電磁波との因果関係は証明されていない」と言われた。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'symptoms', title: '外出困難の記録', content: 'カフェや図書館ではWi-Fiが多く、入った直後から頭痛（5/10）が始まる。電車内でスマートフォンを使っている乗客が多く、頭痛が悪化。外出を週1〜2回に制限している。在宅ワークに切り替えたが、仕事の効率が落ちている。睡眠の質も低下（4〜5時間で目が覚める）。' },
        { timestamp: '2026-03-25T10:00:00Z', category: 'symptoms', title: '心療内科受診', content: '心療内科医から「症状は実在するが電磁波との関連を示す客観的証拠はない」と説明を受けた。睡眠障害・不安症状を治療することを提案された。ミルタザピン 15mg（睡眠改善）とSSRI（パロキセチン 10mg）の処方を受けた。「電磁波が原因」という考えには複雑な気持ちがある。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'medication', title: '睡眠改善効果', content: 'ミルタザピン開始3週間。睡眠時間が 4→6時間に改善。睡眠の質向上と同時に、頭痛の頻度も減少（週7→4回）。主治医：「睡眠不足が症状を悪化させていた可能性が高い」。電磁波曝露と症状の記録を続けているが、睡眠良好の日は同じ環境でも症状が軽いパターンに気づいた。' },
        { timestamp: '2026-05-05T11:00:00Z', category: 'symptoms', title: '認知行動療法（CBT）開始', content: 'CBT（認知行動療法）を週1回開始。「電磁波が危険」という信念と症状の関係を客観視する練習。段階的に曝露を試みている（最初は10分→20分→30分のスマートフォン使用）。頭痛は出るが「以前より短時間で回復するようになった」実感がある。週の外出回数が2→4回に増加。' }
      ],
      symptoms: [
        { timestamp: '2026-03-03T09:00:00Z', fatigue_level: 7, pain_level: 5, sleep_quality: 4 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 6, pain_level: 4, sleep_quality: 4 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-05-05T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-03T09:00:00Z', name: '除外診断のための採血', findings: '甲状腺（TSH・FT4）正常・貧血なし・電解質正常・CRP正常・ANA陰性。神経学的検査：異常なし。MRI脳：異常なし。電磁波曝露との因果関係を支持する客観的検査所見は見つからなかった。' }
      ],
      medications: [
        { timestamp: '2026-03-25T22:00:00Z', name: 'ミルタザピン 15mg（就寝前）', notes: '睡眠障害改善目的。電磁波過敏症の直接治療ではなく、睡眠と不安症状へのアプローチ。' },
        { timestamp: '2026-03-25T08:00:00Z', name: 'パロキセチン 10mg（朝）', notes: '不安症状・身体化への対処。徐々に増量予定。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    chronic_back_pain: {
      diseases: ['慢性腰痛症（椎間板ヘルニア・腰部脊柱管狭窄症）'],
      profile: { age: 52, gender: 'male', height: 172, weight: 78 },
      textEntries: [
        { timestamp: '2026-03-03T09:00:00Z', category: 'symptoms', title: '慢性腰痛の現状', content: '腰部椎間板ヘルニア（L4/L5）と腰部脊柱管狭窄症（中等度）の合併診断。3年前から徐々に悪化。現在、右下肢への放散痛（VAS 6/10）と間欠性跛行（歩行可能距離：約200m）。坐骨神経痛で夜間の睡眠が妨げられることがある。NSAIDsとプレガバリン75mg×2/日を服用。' },
        { timestamp: '2026-03-10T09:00:00Z', category: 'medication', title: '神経ブロック実施', content: '硬膜外ステロイド注射（ESI：L3/4）を実施。注射後2日間で放散痛が 6→3/10 に改善。歩行可能距離も 200m→350m に増加。3週間は効果が持続した。プレガバリンを150mg×2/日に増量。' },
        { timestamp: '2026-03-25T10:00:00Z', category: 'symptoms', title: '理学療法開始', content: '週2回の理学療法開始。腰椎安定化訓練（ドローイン・バードドッグ）と牽引療法を組み合わせ。5回後に「体幹が以前より安定している」実感。放散痛の頻度が減少。腰を反らす動作が特に危険因子（仕事中の重量物挙上で悪化）。職場での作業環境を改善（リフトを使用）。' },
        { timestamp: '2026-04-15T09:00:00Z', category: 'vitals', title: '3ヶ月後MRI評価', content: 'MRI再撮影：L4/5のヘルニアが縮小傾向（7mm→5mm）。狭窄は変化なし。歩行可能距離 350→500m（50%改善）。VAS 6→4/10。主治医から「手術は今の段階では不要」との判断。プレガバリンを75mg×2/日に減量（副作用：眠気が改善）。' },
        { timestamp: '2026-05-12T10:00:00Z', category: 'symptoms', title: '現在の状況', content: '理学療法3ヶ月。VAS 3〜4/10（安定）。歩行距離 500m→700m（継続改善）。プレガバリン継続（75mg×2）。NSAIDsは「必要時のみ」に切り替え（週1〜2回）。職場の作業環境改善後、症状の悪化が明らかに減少。雨の日は依然として悪化するが予測できるようになった。' }
      ],
      symptoms: [
        { timestamp: '2026-03-03T09:00:00Z', fatigue_level: 6, pain_level: 7, sleep_quality: 4 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 5, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 4, pain_level: 4, sleep_quality: 6 },
        { timestamp: '2026-05-12T09:00:00Z', fatigue_level: 3, pain_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [],
      medications: [
        { timestamp: '2026-03-03T08:00:00Z', name: 'プレガバリン（リリカ）150mg/日', notes: '朝夕75mgずつ。神経障害性疼痛。眠気の副作用あり—朝食後に服用で軽減。' },
        { timestamp: '2026-03-03T08:00:00Z', name: 'セレコキシブ 200mg（頓服）', notes: '疼痛増悪時のみ。長期NSAIDs→胃粘膜保護薬と併用。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    behcet: {
      diseases: ['ベーチェット病（不全型）'],
      profile: { age: 35, gender: 'male', height: 175, weight: 68 },
      textEntries: [
        { timestamp: '2026-03-03T10:00:00Z', category: 'symptoms', title: 'ベーチェット病診断', content: '口腔内アフタ性潰瘍（月3〜5回）・陰部潰瘍（過去2回）・皮膚症状（結節性紅斑）・眼症状（ぶどう膜炎 1回経験）でベーチェット病と診断（指定難病第56号）。コルヒチン 0.5mg×2/日を開始。日本のベーチェット病診断基準：大症状3つ（口腔・陰部・眼）+ 皮膚症状を満たす。' },
        { timestamp: '2026-03-15T09:00:00Z', category: 'medication', title: 'コルヒチン1週間後', content: 'コルヒチン開始7日。口腔潰瘍の新規出現が 月5→2回に減少。腹部不快感（下痢気味）の副作用あり—食後に服用で改善。アザチオプリン（免疫抑制薬）を追加するかを主治医と検討中。ベーチェット病友の会に入会して情報交換を始めた。' },
        { timestamp: '2026-03-28T10:00:00Z', category: 'vitals', title: '眼科受診', content: '定期眼科受診（3ヶ月ごと）。細隙灯検査：眼炎症再燃なし（1年以上再燃なし）。視力 1.0/0.8（正常）。眼科医から「眼病変がなければ視力温存は可能」との評価。コルヒチン継続が眼発作予防に貢献している可能性あり。' },
        { timestamp: '2026-04-20T09:00:00Z', category: 'symptoms', title: '口腔潰瘍の誘発因子', content: '記録を分析すると、口腔潰瘍の誘発因子が明確に。①ストレス（仕事の締め切り）②睡眠不足（6時間未満）③歯磨き後のラウリル硫酸ナトリウム含有歯磨き粉。SLS不含歯磨き粉に変えてから発現頻度がさらに減少（月2→1回）。' },
        { timestamp: '2026-05-15T10:00:00Z', category: 'vitals', title: '3ヶ月評価', content: '口腔潰瘍 月1〜2回（治療前の月5回から改善）。陰部潰瘍・皮膚病変：過去3ヶ月は発症なし。眼病変：安定継続。CRP 0.3mg/dL（低下傾向）。コルヒチン継続。アザチオプリンは眼発作がなければ見送り方針。生活改善（睡眠確保・SLS不含歯磨き粉）の効果が記録で明確に確認できた。' }
      ],
      symptoms: [
        { timestamp: '2026-03-03T09:00:00Z', fatigue_level: 5, pain_level: 6, sleep_quality: 5 },
        { timestamp: '2026-03-28T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-04-20T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-05-15T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-03T09:00:00Z', name: '初診時採血', findings: 'CRP 1.8mg/dL・ESR 28mm/h・WBC 7,200（正常）・HLA-B51 陽性（日本のベーチェット病の約60%に陽性）' },
        { timestamp: '2026-05-15T09:00:00Z', name: '3ヶ月後採血', findings: 'CRP 0.3mg/dL（著明改善）・ESR 15mm/h（正常化）' }
      ],
      medications: [
        { timestamp: '2026-03-08T08:00:00Z', name: 'コルヒチン 1.0mg/日', notes: '朝夕0.5mgずつ。ベーチェット病の口腔/陰部潰瘍・皮膚病変予防。食後服用で下痢軽減。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    dermatomyositis: {
      diseases: ['皮膚筋炎（抗MDA5抗体陽性型）'],
      profile: { age: 42, gender: 'female', height: 160, weight: 56 },
      textEntries: [
        { timestamp: '2026-03-01T10:00:00Z', category: 'symptoms', title: '皮膚筋炎確定診断', content: '半年前からヘリオトロープ疹（両眼瞼の紫紅色変色）・ゴットロン徴候（指関節の落屑性紅斑）・近位筋力低下（階段昇降困難）が出現。筋生検でDM確定。抗MDA5抗体陽性→急速進行性間質性肺炎（RPILD）高リスクと説明を受け、強化療法を開始。' },
        { timestamp: '2026-03-08T09:00:00Z', category: 'medication', title: 'シクロホスファミドパルス開始', content: 'ステロイドパルス（メチルプレドニゾロン 1g×3日間）→プレドニゾロン 60mg/日 + シクロホスファミドパルス（500mg/m² 月1回）。タクロリムス 3mg/日を追加。SpO2 安静時 96%・労作後 90%。CT：間質性肺炎（GGO散在）。' },
        { timestamp: '2026-03-25T10:00:00Z', category: 'vitals', title: '1ヶ月後評価', content: 'SpO2 安静時 97%（改善）・労作後 93%（改善）。筋力：MMT 近位筋 3→4（改善）。皮疹（ヘリオトロープ・ゴットロン）は改善傾向。CK 2,800→1,200IU/L（改善）。フェリチン 2,800→1,500ng/mL（改善—高フェリチンはMDA5陽性DMの活動性指標）。' },
        { timestamp: '2026-04-20T09:00:00Z', category: 'medication', title: 'プレドニゾロン減量開始', content: 'PSL 60→50mg/日（10mg減量）。ILD改善を確認してから慎重に減量。副作用：ムーンフェイス・血糖上昇（空腹時血糖 118mg/dL—ステロイド糖尿病に注意）・不眠。ビスホスホネート（アレンドロン酸）とカルシウム・VitD追加（ステロイド性骨粗鬆症予防）。' },
        { timestamp: '2026-05-18T10:00:00Z', category: 'vitals', title: '2.5ヶ月後評価', content: 'PSL 40mg/日。SpO2 安静時 97%・労作後 95%（著明改善）。CT：GGOが縮小傾向。MMT 近位筋 4/5（ほぼ正常）。CK 680IU/L（正常近く）。フェリチン 850ng/mL（著明改善）。抗MDA5抗体価：低下傾向。「このペースが続けば6ヶ月でPSL 20mg以下を目標にできる」との主治医評価。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 9, pain_level: 6, sleep_quality: 4 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 7, pain_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-20T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 4 },
        { timestamp: '2026-05-18T09:00:00Z', fatigue_level: 4, pain_level: 2, sleep_quality: 5 }
      ],
      bloodTests: [
        { timestamp: '2026-03-01T09:00:00Z', name: '確定診断時採血', findings: 'CK 5,800IU/L・LDH 820IU/L・フェリチン 8,200ng/mL（著明高値）・抗MDA5抗体 陽性（強陽性）・ANA 1:320' },
        { timestamp: '2026-05-18T09:00:00Z', name: '2.5ヶ月後採血', findings: 'CK 680IU/L（著明改善）・フェリチン 850ng/mL（改善）・KL-6 480 U/mL（間質性肺炎活動性低下）' }
      ],
      medications: [
        { timestamp: '2026-03-08T08:00:00Z', name: 'プレドニゾロン 40mg/日（漸減中）', notes: '60→50→40mgと慎重減量中。ステロイド性骨粗鬆症・糖尿病に注意。血糖モニタリング要。' },
        { timestamp: '2026-03-08T08:00:00Z', name: 'タクロリムス（プログラフ）3mg/日', notes: '朝食後。DM・ILD への免疫抑制。トラフ値 5〜10ng/mL目標。腎機能モニタリング要。' },
        { timestamp: '2026-03-08T09:00:00Z', name: 'シクロホスファミドパルス 500mg/m²/月', notes: '毎月1回点滴。急速進行性ILD（RPILD）の強化療法。白血球・出血性膀胱炎に注意。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    mold: {
      diseases: ['カビ毒曝露症候群（CIRS）'],
      profile: { age: 44, gender: 'female', height: 162, weight: 60 },
      textEntries: [
        { timestamp: '2026-03-01T10:00:00Z', category: 'symptoms', title: '症状の始まり', content: '築25年の一戸建て。2年前から倦怠感・頭痛・集中力の著しい低下・鼻の詰まりが続く。甲状腺・自己免疫・血液検査はすべて正常。神経内科でも異常なし。「自律神経失調」と言われたが、なぜ家にいる時間が長い日ほど症状が重いのかが気になる。' },
        { timestamp: '2026-03-10T09:00:00Z', category: 'symptoms', title: '環境調査開始', content: '外泊した際（ホテル3泊）に症状が著明に改善（倦怠感 8→3）。帰宅後すぐに悪化。「家に原因がある」と確信。浴室・押し入れ・エアコン内部を業者にチェックしてもらうとカビが多数発見（クロカワカビ・アスペルギルス）。室内空気質検査（ERMI）を依頼。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'vitals', title: 'ERMI検査結果', content: 'ERMI指数 +8.5（リスク高：3以上が閾値）。特にStachybotrys chartarum（毒性の強いカビ）の胞子が検出。専門業者による大規模カビ除去工事（3日間）を実施。浴室・押し入れ・エアコン・床下の除カビ・防カビ処理。' },
        { timestamp: '2026-04-05T09:00:00Z', category: 'symptoms', title: 'カビ除去後3週間', content: 'カビ除去後3週間。倦怠感 8→5（改善傾向）。頭痛の頻度が週7→3回に減少。集中力も少し戻ってきた。医師にCIRS（慢性炎症性応答症候群）の検査を依頼。MMP-9・TGF-β1・MSH（メラノサイト刺激ホルモン）の採血を実施。' },
        { timestamp: '2026-04-20T10:00:00Z', category: 'vitals', title: 'CIRSバイオマーカー結果', content: 'MMP-9 826ng/mL（基準<332：高値）・TGF-β1 3,842pg/mL（基準<2,382：高値）・MSH 14pg/mL（基準35-81：著明低値）。HLA-DR遺伝子検査：感受性ハプロタイプ確認（11-3-52B型）。CIRS診断基準を満たすと判断。コレスチラミン（CSM）療法を検討中。' },
        { timestamp: '2026-05-15T10:00:00Z', category: 'symptoms', title: '引越し後2週間', content: '新居（築3年・RC造）に引越して2週間。倦怠感 5→2（著明改善）。頭痛 週3→0回。集中力がほぼ戻った（以前の仕事のパフォーマンスに近づいている）。「こんなに違うのか」という実感。MMP-9 再検査：426ng/mL（改善）。曝露除去が最も有効な治療だったと実感。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 8, pain_level: 5, sleep_quality: 4 },
        { timestamp: '2026-04-05T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-04-20T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-05-15T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-04-05T09:00:00Z', name: 'CIRSバイオマーカー', findings: 'MMP-9 826ng/mL（高値）・TGF-β1 3,842pg/mL（高値）・MSH 14pg/mL（著明低値）。一般血液検査は正常範囲。' },
        { timestamp: '2026-05-15T09:00:00Z', name: '引越し後再検査', findings: 'MMP-9 426ng/mL（改善傾向）。症状改善と並行して炎症マーカーも低下中。' }
      ],
      medications: [],
      sleepData: [], activityData: [], meals: []
    },
    hsd: {
      diseases: ['関節過可動症スペクトラム障害（HSD）・過可動型EDS'],
      profile: { age: 29, gender: 'female', height: 165, weight: 54 },
      textEntries: [
        { timestamp: '2026-03-05T10:00:00Z', category: 'symptoms', title: 'HSD診断確定', content: 'ベイトン基準 8/9（両肘・両膝・両手小指の過伸展 + 体前屈で手のひらが床につく）。以前は「EDS疑い」だったが、皮膚弾力・血管合併症なしでhEDSの基準には届かずHSDと確定。毎日のように腰・膝・肩が亜脱臼する感覚がある。POTS合併（起立時心拍数 +37bpm）。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'symptoms', title: '物理療法開始', content: '理学療法士（過可動症専門）の指導で筋力訓練開始。「安定化訓練」：体幹・股関節周囲筋・肩甲骨安定筋を強化。高強度・反動のある動き（ヨガ・ストレッチ）は禁止。1週目は翌日のPEM様の疲労があったが、「軽度の痛みは正常」と言われた。' },
        { timestamp: '2026-03-25T09:00:00Z', category: 'medication', title: 'POTS管理', content: 'POTS対策：塩分 4g/日追加・水分 2.5L/日・圧迫靴下（30-40mmHg）着用。フルドロコルチゾン 0.05mg/日（朝）を開始。起立時の頭痛・めまいが 8→5/10 に改善。亜脱臼回数が週15→10回に減少（体幹トレーニングの効果か）。' },
        { timestamp: '2026-04-15T09:00:00Z', category: 'symptoms', title: '6週後評価', content: '体幹トレーニング6週間。亜脱臼回数 週10→5回（67%減少）。慢性疼痛 7→5/10。POTS症状も改善傾向（心拍数差 37→22bpm）。筋力が上がって関節の感覚が「締まってきた」感じ。生理周期でHSD症状が悪化することを発見（排卵後〜月経前の関節ゆるみ増加）。' },
        { timestamp: '2026-05-12T09:00:00Z', category: 'vitals', title: '3ヶ月評価', content: '亜脱臼 週5→2〜3回（継続改善）。疼痛 5/10（慢性痛は残存）。POTS：起立試験 +22bpm（正常域に近づいた）。フルドロコルチゾン継続。障害者手帳申請（難治性疼痛+POTS）を検討中。職場にテレワーク申請→承認。記録が「症状の波のパターン把握」に役立っている。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 8, pain_level: 7, sleep_quality: 4 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 6, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 5, pain_level: 5, sleep_quality: 6 },
        { timestamp: '2026-05-12T09:00:00Z', fatigue_level: 4, pain_level: 4, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-05T09:00:00Z', name: '確定診断時検査', findings: 'コラーゲン関連遺伝子（COL5A1/COL3A1）変異なし（hEDS除外）・ANA 陰性・RF 陰性・甲状腺正常→HSD確定診断' }
      ],
      medications: [
        { timestamp: '2026-03-25T08:00:00Z', name: 'フルドロコルチゾン 0.05mg/日（POTS）', notes: '朝。血圧・循環血漿量増加目的。血圧・電解質モニタリング要。' },
        { timestamp: '2026-03-05T08:00:00Z', name: 'アセトアミノフェン 500mg（頓服）', notes: '亜脱臼後の急性疼痛。NSAIDsより安全（胃腸への影響少ない）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    mcs: {
      diseases: ['化学物質過敏症（MCS）'],
      profile: { age: 42, gender: 'female', height: 158, weight: 52 },
      textEntries: [
        { timestamp: '2026-03-05T10:00:00Z', category: 'symptoms', title: '診断と環境整備', content: '化学物質過敏症（MCS）と診断されて3年。香水・洗剤・排気ガスで頭痛・めまい・認知障害・皮膚発赤が出る。現在は自宅を無香料・オーガニック素材に全面改装（半年かかった）。外出は週2〜3回に制限。今日から症状日記を開始。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'symptoms', title: '曝露記録①', content: 'スーパーに行ったら、隣の人の香水で頭痛（7/10）・眼の刺激・思考力低下が発現。30分後に安全な自宅に戻っても2時間は症状が続いた。柔軟剤の香りが特に反応が強いことを確認（以前の記録と一致）。マスク着用（活性炭フィルター）で次回からは対策。' },
        { timestamp: '2026-03-25T11:00:00Z', category: 'symptoms', title: '自宅環境評価', content: '自宅の揮発性有機化合物（VOC）測定：TVOC 0.05mg/m³（WHO基準 0.3以下）→良好。隣家の洗濯物干し時（柔軟剤の香り）で窓越しに反応することを発見。窓開けのタイミングを変えた。近所のコンビニの排気口が風向きで流れてくる時間帯に症状が悪化するパターンも記録。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'medication', title: 'サポート療法', content: '抗ヒスタミン薬（フェキソフェナジン）を曝露前に服用すると症状が軽減することを発見（強度 7→4/10）。活性炭マスク（N95+活性炭フィルター）を曝露時に使用。ビタミンC 1000mg・N-アセチルシステイン 600mgのサプリを始めた（酸化ストレス軽減目的）。' },
        { timestamp: '2026-05-05T10:00:00Z', category: 'symptoms', title: '2ヶ月評価', content: '曝露回数が記録で「可視化」されたことで回避行動が改善。重篤曝露（症状 7/10以上）が月8回→月3回に減少。軽度曝露は週1〜2回。回避できていない主なトリガー：他人の香水（公共交通機関）・排気ガス（幹線道路沿い）。在宅ワーク中心に切り替えたことが最も効果的だった。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 7, pain_level: 5, sleep_quality: 5 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 6, pain_level: 4, sleep_quality: 5 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-05-05T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-05T09:00:00Z', name: '初診時検査', findings: 'ANA・RF・TSH・IgE（総）・重金属（水銀・鉛・カドミウム）：すべて基準範囲内。VOC曝露バイオマーカー（尿中代謝物）検査中。' }
      ],
      medications: [
        { timestamp: '2026-04-10T08:00:00Z', name: 'フェキソフェナジン 120mg（外出前頓服）', notes: '曝露前30分に服用。症状軽減効果あり（主治医承認済み）。眠気なし。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    tbi: {
      diseases: ['外傷性脳損傷後遺症（高次脳機能障害）'],
      profile: { age: 34, gender: 'male', height: 175, weight: 72 },
      textEntries: [
        { timestamp: '2026-03-05T10:00:00Z', category: 'symptoms', title: '受傷9ヶ月後・初診', content: '交通事故（自転車 vs 車）による中等症TBI（GCS 11）から9ヶ月。外傷は治癒したが、記憶障害・注意障害・易疲労性が残存。神経心理検査：ワーキングメモリ 72点（-1.9SD）・処理速度 68点（-2.1SD）。高次脳機能障害と診断。リハビリ開始。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'symptoms', title: '1週目のリハビリ', content: '作業療法 週2回・言語療法 週1回開始。外部補助記憶（スマートフォンのアラーム・メモ）の習慣化訓練中。午後は極端に疲れやすく、午後3時以降は認知機能が著しく低下する。頭痛は毎日（強度 5/10）。' },
        { timestamp: '2026-03-25T09:00:00Z', category: 'medication', title: 'アマンタジン開始', content: 'アマンタジン（対称性アマンタジン）100mg×2 開始。TBI後の認知機能改善・注意力向上の報告あり。1〜2週間後に効果判定予定。睡眠が浅く、夢が多い（薬の影響かも）。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'symptoms', title: 'アマンタジン4週後', content: 'アマンタジン開始4週間。注意力の持続が 20分→35分に改善。疲労感は依然として強いが、午後の「壁」が少し遅くなった（3時→4時半ごろ）。頭痛は 5→3/10 に軽減。作業療法士のフィードバック：「カレンダー使用率が大幅に向上」。' },
        { timestamp: '2026-04-28T10:00:00Z', category: 'symptoms', title: '就労移行の相談', content: '事故前はエンジニアとして勤務。就労移行支援事業所に見学。週3日・1日4時間の段階的復帰プランを提案された。「情報処理の速度と集中力の持続が課題」とOT評価。障害者手帳3級を申請中。' },
        { timestamp: '2026-05-15T09:00:00Z', category: 'vitals', title: '6ヶ月後神経心理検査', content: '神経心理再検査：ワーキングメモリ 79点（-1.4SD）・処理速度 74点（-1.7SD）（両指標で改善）。注意力テスト：持続30分（3→1ヶ月前の2倍）。作業療法士：「補助記憶の習慣化が定着した」。就労移行開始（週3日・4時間）。疲労度は改善傾向（7→5/10）。' }
      ],
      symptoms: [
        { timestamp: '2026-03-05T09:00:00Z', fatigue_level: 8, pain_level: 6, sleep_quality: 4 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 7, pain_level: 5, sleep_quality: 4 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 6, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-05-15T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-05T09:00:00Z', name: '初診時検査', findings: 'MRI 脳（3T）：右前頭葉・左側頭葉に微小出血（ヘモジデリン沈着）。神経心理検査：WMS-R ワーキングメモリ 72点・処理速度 68点（両項目 -2SD 以下）' }
      ],
      medications: [
        { timestamp: '2026-03-25T08:00:00Z', name: 'アマンタジン 200mg/日', notes: '朝昼 100mg ずつ。TBI後認知改善目的。午後3時以降は飲まない（不眠予防）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    stroke: {
      diseases: ['脳卒中後遺症（左中大脳動脈領域梗塞・右片麻痺・失語）'],
      profile: { age: 67, gender: 'male', height: 168, weight: 72 },
      textEntries: [
        { timestamp: '2026-03-01T10:00:00Z', category: 'symptoms', title: '回復期病院への転院時', content: '脳梗塞発症から1ヶ月。右上下肢の麻痺（MMT 3/5）と失語症（Broca型）が残っている。mRS 3（軽度〜中等度障害）。回復期リハビリ病院に転院。PT（歩行訓練）・OT（上肢機能・ADL）・ST（言語訓練）を毎日実施。抗血小板薬（クロピドグレル 75mg）・スタチン（ロスバスタチン 5mg）・降圧薬（ARB）を内服。血圧目標 130/80mmHg未満。' },
        { timestamp: '2026-03-20T09:00:00Z', category: 'symptoms', title: 'リハビリ3週目', content: '歩行が監視歩行レベルに改善。T字杖を使えば病棟を1周できるようになった（100m程度）。言葉が少し出やすくなった。「ありがとう」「はい」は確実に言える。家族の顔はわかるが名前がすぐに出ない（喚語困難）。右手の細かい動作（箸・書字）は依然困難。血圧 128/76 mmHg（朝測定）。' },
        { timestamp: '2026-04-10T11:00:00Z', category: 'vitals', title: '6週目評価', content: 'FIM（機能的自立度評価表）：入院時 62点 → 84点（改善）。歩行距離：100m → 250m（T字杖使用）。ST：短文なら伝えられるようになった。「痛い」「お腹すいた」「散歩したい」などの意思表示可能。OT：右手でスプーンが握れるようになった（箸はまだ困難）。退院予定：再来月（自宅退院目標）。' },
        { timestamp: '2026-05-12T10:00:00Z', category: 'symptoms', title: '退院前評価', content: '自宅退院に向けた家屋評価を実施。玄関の段差と浴室に手すりを設置予定。FIM 98点。歩行：T字杖で平地500m。言語：日常会話の約60%理解・発話可能。ADL：食事（スプーン）・更衣（一部介助）・排泄（自立）・入浴（要見守り）。外来リハ（週2回）に移行予定。再発予防薬の継続を確認した。血圧今月平均 125/74mmHg（良好）。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 7, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-03-20T09:00:00Z', fatigue_level: 6, pain_level: 2, sleep_quality: 5 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 5, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-05-12T09:00:00Z', fatigue_level: 4, pain_level: 2, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-01T09:00:00Z', name: '転院時採血', findings: 'LDL 112 mg/dL（スタチン開始前）・HbA1c 6.1%（境界域）・Hb 13.8・Cr 0.98・PT-INR 1.0・心電図：洞調律（AF なし）' },
        { timestamp: '2026-05-01T09:00:00Z', name: '外来採血（2ヶ月後）', findings: 'LDL 72 mg/dL（スタチン効果・目標達成）・HbA1c 5.9%（改善）・腎機能正常' }
      ],
      medications: [
        { timestamp: '2026-02-01T08:00:00Z', name: 'クロピドグレル 75mg（朝食後）', notes: '抗血小板薬。脳梗塞再発予防。内服忘れに注意。' },
        { timestamp: '2026-02-01T08:00:00Z', name: 'ロスバスタチン 5mg（夕食後）', notes: 'スタチン。LDL目標 70mg/dL未満。横紋筋融解症に注意（筋痛が出たらすぐ報告）。' },
        { timestamp: '2026-02-01T08:00:00Z', name: 'オルメサルタン 20mg（朝食後）', notes: 'ARB。降圧目標 130/80mmHg未満。脳卒中再発リスク低減のため血圧管理が最重要。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    bph: {
      diseases: ['前立腺肥大症（BPH・IPSS中等症→重症）'],
      profile: { age: 68, gender: 'male', height: 170, weight: 72 },
      textEntries: [
        { timestamp: '2026-03-03T10:00:00Z', category: 'symptoms', title: '泌尿器科初診', content: '頻尿（日中8回・夜間3回）・残尿感・尿勢低下を主訴に初診。IPSS 22点（重症）・QoL 5点（非常につらい）。直腸診：前立腺腫大（くるみ大）。PSA 2.8 ng/mL（年齢基準内）。残尿測定 95mL（超音波）。タムスロシン 0.4mg/日を開始。生活習慣の見直し（夕方以降の水分制限・カフェイン制限）を指導された。' },
        { timestamp: '2026-03-25T09:00:00Z', category: 'medication', title: 'α1遮断薬1ヶ月効果', content: 'タムスロシン開始3週間後。IPSS 22→15点（中等症に改善）。夜間頻尿 3→2回に減少。尿勢は改善を実感。残尿量は再測定で 50mL（改善）。立ちくらみは最初の1週間のみ。起き上がりをゆっくりすることで対処できている。QoL 5→3点（かなり改善）。' },
        { timestamp: '2026-04-15T11:00:00Z', category: 'medication', title: 'デュタステリド追加', content: '前立腺が大きめ（30cc以上推定）のため、デュタステリド 0.5mg/日を追加。5α還元酵素阻害薬。PSAが半分程度になる副作用に注意（PSA追跡に影響）。射精量の減少が出ることも説明された。タムスロシン＋デュタステリドの併用療法（コンビネーション療法）。効果発現まで3〜6ヶ月かかると説明あり。' },
        { timestamp: '2026-05-15T10:00:00Z', category: 'vitals', title: '3ヶ月まとめ', content: 'IPSS 22→11点（中等症の下限近く）。夜間頻尿 3→1〜2回。QoL 5→2点（比較的良い）。PSA：2.8→1.5 ng/mL（デュタステリドによる低下 - 正常反応）。残尿量 50→25mL（改善）。排尿日誌：1日平均5〜6回（初診時8〜10回から改善）。次の3ヶ月でさらなる改善を期待。手術（TURP / HoLEP）は現時点では不要。' }
      ],
      symptoms: [
        { timestamp: '2026-03-03T09:00:00Z', fatigue_level: 4, pain_level: 1, sleep_quality: 4 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 5 },
        { timestamp: '2026-04-15T09:00:00Z', fatigue_level: 3, pain_level: 1, sleep_quality: 6 },
        { timestamp: '2026-05-15T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-03T09:00:00Z', name: '初診時採血', findings: 'PSA 2.8 ng/mL（年齢基準内・要注意上限）・Cr 0.85（腎機能正常）・尿沈渣：白血球0〜1/HPF（感染なし）・血糖 105mg/dL' },
        { timestamp: '2026-05-15T09:00:00Z', name: '3ヶ月後採血', findings: 'PSA 1.5 ng/mL（デュタステリドによる低下・予定範囲内）・Cr 0.83（腎機能維持）' }
      ],
      medications: [
        { timestamp: '2026-03-03T08:00:00Z', name: 'タムスロシン（ハルナール）0.4mg/日', notes: '朝食後。α1遮断薬。立ちくらみに注意（最初の1週間）。' },
        { timestamp: '2026-04-15T08:00:00Z', name: 'デュタステリド（アボルブ）0.5mg/日', notes: '朝食後。5α還元酵素阻害薬。効果発現まで3〜6ヶ月。PSAが約半分に低下（正常）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    vitiligo: {
      diseases: ['白斑（尋常性白斑・非分節型・顔・体幹・四肢）'],
      profile: { age: 28, gender: 'female', height: 163, weight: 55 },
      textEntries: [
        { timestamp: '2026-03-02T10:00:00Z', category: 'symptoms', title: '皮膚科初診', content: '2年前から頬・首・手背に白い斑点が出始め、徐々に広がった。SALT スコア 8%（体表面積の8%に脱色素斑）。組織学的に白斑（vitiligo）確定。非分節型（尋常性白斑）。橋本病・甲状腺機能低下症を合併（チラージン服用中）。日焼け後に白斑境界が目立つため夏が特につらい。自己免疫との関係を説明された。' },
        { timestamp: '2026-03-18T09:00:00Z', category: 'medication', title: 'ルキソリチニブクリーム開始', content: 'ルキソリチニブクリーム（Opzelura・1.5%）を顔の白斑に1日2回塗布開始。JAK1/2阻害薬。「効果が出るまで24週かかることもある」と説明された。顔以外（体幹・四肢）にはタクロリムス軟膏 0.1%（プロトピック）を継続。毎週写真を撮って変化を記録することを勧められた。' },
        { timestamp: '2026-04-10T11:00:00Z', category: 'symptoms', title: 'ルキソリチニブ4週目', content: 'ルキソリチニブ開始から4週間。左頬の白斑（約2×3cm）の縁に薄い色素沈着が戻ってきた！主治医：「早期反応例で良好」。皮膚の発赤・かゆみなどの副作用はなし。体幹の白斑はプロトピックでほぼ変化なし（NB-UVBを追加提案された）。VESスコア（白斑広がり）：前回と同等（進行は止まっている）。' },
        { timestamp: '2026-05-10T10:00:00Z', category: 'symptoms', title: '3ヶ月まとめ', content: '3ヶ月経過。SALT スコア 8% → 5%（3%改善・約38%縮小）。顔の反応が最も良好。左頬：白斑の70%が色素再生。右頬：40%再生。首は20%程度改善。NB-UVB光線療法を週2回開始（NB-UVB照射）し、体幹・四肢の白斑にも効果が出始めた。橋本病：TSH 2.1（安定）。精神面：白斑が改善するにつれて自信が戻ってきた。日焼け止めはSPF50+を通年塗布。' }
      ],
      symptoms: [
        { timestamp: '2026-03-02T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 6 },
        { timestamp: '2026-03-18T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 6 },
        { timestamp: '2026-04-10T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 },
        { timestamp: '2026-05-10T09:00:00Z', fatigue_level: 1, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-02T09:00:00Z', name: '初診時採血（自己免疫スクリーニング）', findings: 'TSH 3.2（やや高め）・FT4 1.0（正常）・抗TPO抗体 850 IU/mL（高値・橋本病）・ANA 1:40陰性・血糖・腎機能正常' },
        { timestamp: '2026-05-10T09:00:00Z', name: '3ヶ月後採血', findings: 'TSH 2.1（改善）・FT4 1.1（正常）・25-OH ビタミンD 28 ng/mL（補充効果）' }
      ],
      medications: [
        { timestamp: '2026-01-01T08:00:00Z', name: 'レボチロキシン（チラージン）50μg/朝', notes: '橋本病・甲状腺機能低下症の治療。TSH目標 1〜2.5。' },
        { timestamp: '2026-03-18T08:00:00Z', name: 'ルキソリチニブクリーム 1.5%（Opzelura）1日2回', notes: 'JAK1/2阻害薬。顔の白斑に塗布。効果発現まで最大24週。' },
        { timestamp: '2026-03-18T08:00:00Z', name: 'タクロリムス軟膏 0.1%（プロトピック）1日2回', notes: '顔以外の白斑部位。カルシニューリン阻害薬。長期使用時は悪性腫瘍リスクに注意（ステロイドより安全とされる）。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    constipation: {
      diseases: ['慢性便秘症（機能性・便秘型IBS合併・難治性）'],
      profile: { age: 62, gender: 'female', height: 155, weight: 53 },
      textEntries: [
        { timestamp: '2026-03-01T10:00:00Z', category: 'symptoms', title: '消化器内科初診', content: '10年以上の慢性便秘。週1〜2回の排便（ブリストルスコア 1〜2）。腹部膨満感・鼓腸・左下腹部の不快感が毎日ある。酸化マグネシウム 1,000mg/日を5年以上内服しているが効果が不十分。大腸内視鏡（5年前）：器質的異常なし。Rome IV 基準：機能性便秘（FC）確定。排便日誌をつけるよう指示された。' },
        { timestamp: '2026-03-18T09:00:00Z', category: 'medication', title: 'リナクロチド追加', content: '機能性便秘に対してリナクロチド 0.25mg/日（ByovizTD・クロリナコチド）を朝食30分前に追加。腸管内 cGMP↑ → クロライドチャンネル活性化 → 腸液分泌促進 → 排便促進。主な副作用：下痢（注意）・腹痛。最初の1〜2週間は軟便になりやすいとのこと。酸化マグネシウムは 500mg/日に減量。' },
        { timestamp: '2026-04-08T11:00:00Z', category: 'symptoms', title: 'リナクロチド3週目', content: 'リナクロチド開始後3週間。排便回数 週1〜2回 → 週4〜5回（ほぼ毎日）に改善！ブリストルスコア 1〜2 → 3〜4（普通便）に改善。腹部膨満感が明らかに軽減した。副作用（下痢）：最初の1週間に2回（軽度・自然軽快）。現在は問題なし。腸が「動いている」感覚が戻ってきた。QOLの大幅な改善を実感。' },
        { timestamp: '2026-05-10T10:00:00Z', category: 'vitals', title: '2ヶ月まとめ', content: '排便回数：週1〜2 → 週4〜5回（安定）。ブリストルスコア：平均 3.5（普通便）。腹部膨満感：以前より60〜70%軽減。排便時の努力：「力まずに出る」日が増えた。体重：53kg → 53.5kg（微増・栄養吸収の改善）。食物繊維：1日 18g（目標 20g）。水分：1日 1.5L。ウォーキング：週4日・20分（継続）。次回受診：3ヶ月後。酸化マグネシウムの中止を検討中。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-03-18T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 5 },
        { timestamp: '2026-04-08T09:00:00Z', fatigue_level: 3, pain_level: 2, sleep_quality: 6 },
        { timestamp: '2026-05-10T09:00:00Z', fatigue_level: 2, pain_level: 1, sleep_quality: 7 }
      ],
      bloodTests: [
        { timestamp: '2026-03-01T09:00:00Z', name: '初診時採血（器質的疾患除外）', findings: 'CEA 1.8 ng/mL（正常）・TSH 2.2（正常）・Ca 9.2（正常）・血糖 98mg/dL・貧血なし・便潜血（2回）：陰性' }
      ],
      medications: [
        { timestamp: '2026-02-01T08:00:00Z', name: '酸化マグネシウム（当初1,000mg → 現在500mg/日）', notes: '緩下剤。水分を引き込んで軟便化。腎機能低下時は高Mg血症に注意。長期使用中。' },
        { timestamp: '2026-03-18T08:00:00Z', name: 'リナクロチド 0.25mg（朝食30分前）', notes: '腸液分泌促進薬（グアニル酸シクラーゼC作動薬）。機能性便秘・IBS-Cに適応。最初の1〜2週間は下痢に注意。' }
      ],
      sleepData: [], activityData: [], meals: []
    },
    lyme: {
      diseases: ['ライム病（慢性・PTLDS）'],
      profile: { age: 45, gender: 'female', height: 163, weight: 58 },
      textEntries: [
        { timestamp: '2026-03-01T10:00:00Z', category: 'symptoms', title: 'ライム病診断', content: '昨年9月の登山後からひどい疲労・関節痛が続く。今年1月に血清抗体検査（ELISA + Western Blot）陽性でライム病（ボレリア感染）と確定。ドキシサイクリン 200mg/日 ×21日間を終えたが、倦怠感・関節痛・ブレインフォグが依然として残っている。PTLDS（治療後ライム病症候群）と診断された。' },
        { timestamp: '2026-03-12T09:00:00Z', category: 'symptoms', title: '症状の波', content: '倦怠感は日によって大きく変動する。悪い日（5〜7/10）と比較的良い日（2〜3/10）が交互に来る。朝起きたときに関節のこわばり（30分以上）。集中力が続かず、以前は得意だった読書が2ページ以上続かない。' },
        { timestamp: '2026-03-25T09:00:00Z', category: 'medication', title: 'サポーティブケア', content: 'ライム専門医（感染症内科）の受診。追加抗菌薬の適応なしとの判断（PTLDSには証拠が不十分）。睡眠衛生改善・段階的有酸素運動・認知行動療法（CBT）を推奨された。補助サプリ：CoQ10 200mg・マグネシウム 200mgを開始（主治医承認済み）。' },
        { timestamp: '2026-04-10T09:00:00Z', category: 'symptoms', title: '段階的運動開始', content: '作業療法士の指導で段階的運動療法開始。週3日・1回15分のウォーキングから。PEM（労作後倦怠感）を避けるため「話しながら運動できる」強度を厳守。最初の2週間は疲労増悪なし。運動記録を続けることで「できている」実感が得られる。' },
        { timestamp: '2026-04-28T10:00:00Z', category: 'vitals', title: '2ヶ月後評価', content: '倦怠感 7→5/10（改善傾向）。関節痛の朝のこわばりが 30分→15分に改善。認知症状（ブレインフォグ）は依然として顕著。ウォーキングを週4日・25分に増やせた。睡眠の質がやや改善（4→6/10）。CoQ10とマグネシウムの継続効果は判断中。' },
        { timestamp: '2026-05-15T10:00:00Z', category: 'symptoms', title: '現在の状況', content: '症状は緩やかな改善傾向。倦怠感 4〜5/10・関節痛 3/10・ブレインフォグ 5/10。週4日のウォーキング（30分）が習慣化。CBT（認知行動療法）のグループプログラムに参加中（月2回）。在宅ワークに週20時間まで復帰できた（事故前は週40時間）。「記録することで回復を見える化できる」という実感がある。' }
      ],
      symptoms: [
        { timestamp: '2026-03-01T09:00:00Z', fatigue_level: 8, pain_level: 6, sleep_quality: 4 },
        { timestamp: '2026-03-25T09:00:00Z', fatigue_level: 7, pain_level: 5, sleep_quality: 4 },
        { timestamp: '2026-04-28T09:00:00Z', fatigue_level: 5, pain_level: 3, sleep_quality: 6 },
        { timestamp: '2026-05-15T09:00:00Z', fatigue_level: 4, pain_level: 3, sleep_quality: 6 }
      ],
      bloodTests: [
        { timestamp: '2026-03-01T09:00:00Z', name: 'ライム病確定検査', findings: 'Borrelia burgdorferi IgG ELISA 陽性→Western Blot 5バンド陽性（CDC基準満たす）。CRP 正常・ANA 陰性・RF 陰性（他疾患除外）。' }
      ],
      medications: [
        { timestamp: '2026-01-15T08:00:00Z', name: 'ドキシサイクリン 200mg/日（終了）', notes: '21日間終了。抗菌薬療法完了。PTLDSに対する追加治療は保留。' },
        { timestamp: '2026-03-25T08:00:00Z', name: 'CoQ10 200mg + マグネシウム 200mg', notes: '朝食後。抗酸化・ミトコンドリアサポート（主治医承認済み補助サプリ）。' }
      ],
      sleepData: [], activityData: [], meals: []
    }
  }
};

// ME/CFS specific default analysis prompt
