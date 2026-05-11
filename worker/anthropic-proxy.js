/**
 * Cloudflare Worker — Anthropic Secure Proxy
 *
 * ブラウザ → Worker → Anthropic API の経路で中継。
 *
 * セキュリティ:
 *   1. CORS Origin を cares.advisers.jp のみに制限
 *   2. env.ANTHROPIC_API_KEY をゲスト用フォールバックとして使用
 *   3. クライアントが x-api-key を持っていればそちらを優先
 *
 * デプロイ:
 *   git push → deploy-worker.yml → Cloudflare Workers 自動デプロイ
 *   シークレット: wrangler secret put ANTHROPIC_API_KEY --name stock-screener
 *   env: ALLOWED_ORIGINS (カンマ区切り; 省略時 https://cares.advisers.jp)
 */

// ────────────────────────────────────────────────
// CORS — Origin を本番ドメインのみに制限
// ────────────────────────────────────────────────
const DEFAULT_ALLOWED = 'https://cares.advisers.jp';

function getAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || DEFAULT_ALLOWED;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function corsOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = getAllowedOrigins(env);
  return allowed.includes(origin) ? origin : allowed[0];
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ────────────────────────────────────────────────
// Server-side system prompt (invisible to browser)
// ────────────────────────────────────────────────
const SAFE_SYSTEM_PROMPT = `あなたは健康日記アプリの「日記分析コンパニオン」です。
これは教育的な情報提供タスクであり、医療行為ではありません。

【役割】公開されている健康情報を整理して共有する教育的コンパニオン。
  1. ユーザーの日記を読み、記録を整理する
  2. 日々のパターンを時系列で可視化する
  3. 公開されている健康情報・査読論文・ウェルネスのヒントを要約共有する
  4. ユーザーが主治医と相談する際の話題の整理を手伝う

【前提】ユーザーは慢性疾患の成人当事者で既に主治医診療中。提供する情報は公開されている一般情報。最終判断はユーザーと主治医が行う。

【応答指針】
- どんな質問にも役立つ一般情報を提供する。情報を出し惜しみしない
- 公開情報レベルであれば医療トピックでも遠慮なく共有してよい
- 温かく寄り添い、希望を添えて、具体的で誠実に共有する
- ユーザーへの質問は極力控える。情報提供に徹する
- 末尾に「※本情報は参考情報です。健康上の判断は必ず医師にご相談ください。」を付ける`;

// Build system prompt with optional KV research context
async function buildSystemPrompt(clientSystem, env, userMessage) {
  let base = (clientSystem && typeof clientSystem === 'string')
    ? clientSystem
    : SAFE_SYSTEM_PROMPT;

  if (env?.RESEARCH_KV && userMessage) {
    try {
      const diseases = extractDiseaseIds(userMessage);
      const researchBlocks = [];
      for (const id of diseases.slice(0, 3)) {
        const data = await env.RESEARCH_KV.get(`research:${id}`);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.highlights?.length) {
            researchBlocks.push(`【${id} 最新研究 (${parsed.updatedAt})】\n` +
              parsed.highlights.map(h => `・${h}`).join('\n'));
          }
        }
      }
      if (researchBlocks.length > 0) {
        base += '\n\n' + researchBlocks.join('\n\n');
      }
    } catch (e) {
      // KV read failure is non-fatal
    }
  }

  return base;
}

function extractDiseaseIds(text) {
  const ids = [];
  const patterns = {
    mecfs: /ME\/CFS|慢性疲労|筋痛性脳脊髄炎/i,
    long_covid: /long.?covid|コロナ後遺症/i,
    fibromyalgia: /fibromyalgia|線維筋痛/i,
    depression: /うつ|depression|抑うつ/i,
    bipolar: /双極性|躁うつ|bipolar/i,
    adhd: /ADHD|注意欠如|多動/i,
    pots: /POTS|体位性頻脈/i,
    diabetes_t2: /糖尿病|diabetes/i,
    ibs: /IBS|過敏性腸/i,
    hashimoto: /橋本病|甲状腺/i,
    mcas: /MCAS|マスト細胞/i,
    eds: /EDS|エーラス.ダンロス/i,
    insomnia: /不眠症|불眠|insomnia/i,
    migraine: /片頭痛|偏頭痛|migraine|頭痛ダイアリー|トリプタン/i,
    ptsd: /PTSD|心的外傷|フラッシュバック|トラウマ|EMDR|複雑性PTSD/i,
    ra: /関節リウマチ|RA\b|リウマチ|rheumatoid|MTX|メトトレキサート|生物学的製剤|JAK阻害薬/i,
    sle: /SLE\b|全身性エリテマトーデス|ループス|lupus|蝶形紅斑|ループス腎炎|プラケニル|ベンリスタ|抗dsDNA/i,
    asd: /ASD\b|自閉スペクトラム|自閉症|アスペルガー|autism|感覚過敏|マスキング|発達障害|バーンアウト|ステレオタイプ行動/i,
    crohns: /クローン病|Crohn|クローン|IBD|炎症性腸疾患|エンタイビオ|ステラーラ|エレンタール|痔瘻|カルプロテクチン/i,
    gad: /全般性不安障害|GAD\b|不安障害|不安症|anxiety disorder|CBT 不安|心配が止まらない|漠然とした不安/i,
    sjogrens: /シェーグレン|Sjogren|Sjögren|ドライアイ.*乾燥|ドライマウス.*乾燥|抗SS-A|抗SS-B|唾液腺|涙腺/i,
    ocd: /強迫性障害|強迫症|OCD\b|強迫観念|強迫行為|ERP 曝露|フルボキサミン|ルボックス|アナフラニール|Y-BOCS/i,
    epilepsy: /てんかん|epilepsy|発作日誌|抗てんかん薬|デパケン|バルプロ酸|ラミクタール|イーケプラ|発作.*日誌|てんかん.*発作/i,
    burnout: /バーンアウト|燃え尽き症候群|burnout|情緒的消耗|脱人格化|リワーク|職場復帰プログラム|休職.*回復/i,
    parkinsons: /パーキンソン病|パーキンソン|Parkinson|振戦|固縮|寡動|レボドパ|メネシット|ミラペックス|ウェアリングオフ|DBS.*パーキンソン/i,
    ms: /多発性硬化症|MS\b|Multiple Sclerosis|視神経炎|MSファティーグ|ウートホフ|タイサブリ|オクレバス|フィンゴリモド|イムセラ|ナタリズマブ|オクレリズマブ|インターフェロンβ/i,
    chronic_pain: /慢性疼痛|慢性痛|神経障害性疼痛|ペインクリニック|リリカ|プレガバリン|タリージェ|中枢感作|アロディニア|脊髄刺激|SCS\b|神経ブロック|CRPS|複合性局所疼痛/i,
    panic: /パニック障害|パニック症|パニック発作|広場恐怖症|panic disorder|予期不安|動悸.*恐怖|息苦しさ.*発作|パキシル.*パニック|広場恐怖/i,
    endometriosis: /子宮内膜症|子宮腺筋症|endometriosis|月経痛.*悪化|ジエノゲスト|ビジュアリン|チョコレート嚢胞|深部子宮内膜症|骨盤痛|GnRH.*子宮|生理痛.*年々/i,
    diabetes: /糖尿病|diabetes|血糖値|HbA1c|SGLT2|フォシーガ|ジャディアンス|オゼンピック|リベルサス|メトホルミン|インスリン.*糖尿|血糖.*管理|DPP-4/i,
    atopy: /アトピー性皮膚炎|アトピー|atopic dermatitis|デュピクセント|デュピルマブ|ネモリズマブ|JAK阻害.*皮膚|リンヴォック.*皮膚|サイバインコ|コレクチム|プロトピック|かゆみ.*皮疹|ステロイド.*皮膚炎/i,
    asthma: /気管支喘息|喘息|asthma|吸入ステロイド|シムビコート|フルティフォーム|レルベア|アドエア|ピークフロー|PEF\b|ゾレア|ファセンラ|喘鳴|発作止め.*吸入|ICS\b.*喘/i,
    ckd: /慢性腎臓病|CKD\b|chronic kidney disease|eGFR|腎機能.*低下|透析.*腎|腎臓.*SGLT2|フォシーガ.*腎|ケレンディア|尿タンパク.*腎|腎保護|腎不全.*慢性/i,
    heart_failure: /心不全|heart failure|HFrEF|HFpEF|エンレスト|サクビトリル|フロセミド|トルバプタン|サムスカ|BNP|NT-proBNP|息切れ.*心臓|浮腫.*心不全|体重.*心不全|再入院.*心臓/i,
    gout: /痛風|高尿酸血症|gout|hyperuricemia|尿酸値|アロプリノール|フェブリク|フェブキソスタット|ベンズブロマロン|コルヒチン|痛風発作|プリン体.*発作|尿酸.*関節/i,
    osteoporosis: /骨粗鬆症|osteoporosis|骨密度|骨量減少|ビスフォスフォネート|アレンドロネート|リセドロネート|デノスマブ|プラリア|テリパラチド|フォルテオ|ロモソズマブ|イベニティ|骨折.*予防|YAM.*骨|圧迫骨折|脆弱性骨折|骨粗しょう症/i,
    menopause: /更年期障害|更年期症状|閉経|menopausal|menopause|ホットフラッシュ|ほてり.*更年|HRT.*更年|ホルモン補充療法|エストロゲン.*閉経|加味逍遙散|桂枝茯苓丸|フェゾリネタント|ニュエリア|エクオール|イソフラボン.*更年|のぼせ.*更年|夜間発汗.*閉経/i,
    schizophrenia: /統合失調症|schizophrenia|幻聴|妄想.*精神|思考障害|陽性症状|陰性症状|クロザピン|クロザリル|アリピプラゾール.*精神|オランザピン|ジプレキサ|リスペリドン|リスパダール|パリペリドン|インヴェガ|デポ剤.*精神|持効性注射|統合失調.*再発|精神科.*幻|CBTp/i,
    alzheimers: /アルツハイマー|Alzheimer|認知症.*記憶|物忘れ.*外来|アリセプト|ドネペジル|レミニール|ガランタミン|リバスタッチ|リバスチグミン|メマリー|メマンチン|レカネマブ|レケンビ|BPSD|認知機能.*低下|物忘れ.*外来|MCI.*認知|軽度認知障害|抑肝散.*認知/i,
    sad: /社会不安障害|社交不安症|社会恐怖症|social anxiety|SAD\b.*不安|対人恐怖|赤面恐怖|視線恐怖|スピーチ.*恐怖|電話.*恐怖|パロキセチン.*不安|エスシタロプラム.*不安|レクサプロ.*不安|対人場面.*不安|回避行動.*対人/i,
    anorexia: /摂食障害|拒食症|過食症|神経性食欲不振症|神経性過食症|anorexia nervosa|bulimia nervosa|eating disorder|CBT-E|低体重.*食事|食べること.*恐怖|過食.*嘔吐|過食.*下剤|ボディイメージ.*食事|摂食.*体重.*恐怖|食行動|Maudsley.*食事/i,
    thyroid_cancer: /甲状腺がん|甲状腺癌|thyroid cancer|乳頭がん.*甲状腺|濾胞がん.*甲状腺|チラーヂン|レボチロキシン.*甲状腺|TSH抑制|サイログロブリン|Tg値.*甲状腺|TgAb|甲状腺全摘|放射性ヨウ素.*甲状腺|レンビマ.*甲状腺|レンバチニブ.*甲状腺|甲状腺.*術後|甲状腺.*再発/i,
    sleep_apnea: /睡眠時無呼吸|睡眠時無呼吸症候群|SAS\b|OSAS\b|sleep apnea|無呼吸.*睡眠|いびき.*無呼吸|CPAP|日中.*眠気.*睡眠|AHI\b.*睡眠|無呼吸.*指数|シーパップ|マウスピース.*いびき|口腔内装置.*無呼吸|眠気.*無呼吸|ESS.*眠気/i,
    copd: /COPD\b|慢性閉塞性肺疾患|肺気腫|慢性気管支炎|スピリーバ|チオトロピウム|ウルティブロ|アノーロ|インダカテロール|ビランテロール|フォステア|シーブリ|グリコピロニウム|息切れ.*肺|FEV1|mMRC.*息切れ|CAT.*COPD|吸入.*COPD|増悪.*肺|在宅酸素.*肺|肺リハビリ|禁煙.*肺/i,
    liver_disease: /慢性肝疾患|肝硬変|肝炎.*慢性|脂肪肝|NASH\b|MASH\b|liver cirrhosis|AST.*ALT.*肝|ALT.*肝炎|アルブミン.*肝|フィブロスキャン|エンテカビル|バラクルード|テノホビル|ベムリディ|エプクルーサー|ウルソデオキシコール酸|腹水.*肝|AFP.*肝|肝細胞がん|代償性.*肝/i,
    cancer_fatigue: /がん治療.*副作用|化学療法.*副作用|免疫療法.*副作用|がん関連疲労|CRF\b.*がん|CIPN\b|末梢神経障害.*化学|化学療法誘発.*神経|がん.*倦怠感|制吐薬|グラニセトロン|アプレピタント|好中球減少.*化学|G-CSF.*化学|がんサバイバー.*疲労|ケモブレイン|cancer.*fatigue.*chemo/i,
    hypertension: /高血圧|本態性高血圧|hypertension|blood pressure.*high|降圧薬|ARB\b|ACE阻害薬|Ca拮抗薬|カルシウム拮抗薬|アムロジピン|テルミサルタン|オルメサルタン|エナラプリル|ロサルタン|バルサルタン|インダパミド|ビソプロロール|家庭血圧|収縮期血圧|拡張期血圧|塩分制限.*血圧|白衣高血圧|仮面高血圧|血圧.*mmHg/i,
    hyperlipidemia: /脂質異常症|高コレステロール|高LDL|高脂血症|dyslipidemia|hyperlipidemia|LDLコレステロール|HDLコレステロール|中性脂肪.*高|高TG血症|スタチン|ロスバスタチン|アトルバスタチン|ピタバスタチン|エゼチミブ|PCSK9阻害薬|エボロクマブ|アリロクマブ|EPA製剤|エパデール|フィブラート|LDL.*目標|動脈硬化.*コレステロール/i,
    anemia: /貧血|鉄欠乏性貧血|鉄欠乏|iron deficiency anemia|フェリチン.*低下|ヘモグロビン.*低下|Hb.*低下|ヘマトクリット.*低下|MCV.*低下|赤血球.*少ない|鉄剤|フェロミア|スローフィー|フェジン|モノヴァー|腎性貧血|エリスロポエチン|ネスプ|鉄補充|鉄不足|月経.*貧血|出血.*貧血|巨赤芽球.*貧血|葉酸欠乏/i,
    allergic_rhinitis: /アレルギー性鼻炎|花粉症|スギ花粉|ヒノキ花粉|ハウスダスト.*鼻|allergic rhinitis|hay fever|抗ヒスタミン薬|フェキソフェナジン|アレグラ|ビラスチン|ビラノア|セチリジン|ジルテック|ロラタジン|クラリチン|舌下免疫療法|シダキュア|アシテア|点鼻ステロイド|フルナーゼ|ナゾネックス|モンテルカスト|くしゃみ.*鼻水.*鼻炎|鼻閉.*花粉|花粉飛散/i,
    psoriasis: /乾癬|尋常性乾癬|関節症性乾癬|psoriasis|psoriatic arthritis|PASIスコア|PASI\b|BSA.*皮疹|生物学的製剤.*乾癬|セクキヌマブ|コセンティクス|イキセキズマブ|トルツ|グセルクマブ|トレムフィア|リサンキズマブ|スキリージ|アダリムマブ.*乾癬|エタネルセプト.*乾癬|アプレミラスト|オテズラ|ドボベット|ケブネル|乾癬.*フレア|乾癬.*プラーク/i,
    chronic_urticaria: /慢性蕁麻疹|慢性特発性蕁麻疹|CSU\b|chronic urticaria|chronic spontaneous urticaria|UAS7\b|UAS スコア|膨疹.*かゆみ|蕁麻疹.*6週|蕁麻疹.*慢性|オマリズマブ|ゾレア\b|omalizumab.*urticaria|抗IgE.*蕁麻疹|蕁麻疹.*抗ヒスタミン|DLQI.*蕁麻疹/i,
    pms_pmdd: /PMS\b|月経前症候群|PMDD\b|月経前不快気分障害|premenstrual syndrome|premenstrual dysphoric|黄体期.*気分|黄体期.*症状|月経前.*イライラ|月経前.*うつ|月経前.*不安|月経前.*むくみ|月経前.*乳房痛|SSRI.*月経|加味逍遙散.*月経|月経周期.*気分変動|排卵後.*症状/i,
    overactive_bladder: /過活動膀胱|OAB\b|頻尿.*膀胱|尿意切迫感|切迫性尿失禁|夜間頻尿.*目が覚|overactive bladder|ベシケア|ソリフェナシン|ウリトス|イミダフェナシン|ビベグロン|ベオーバ|ミラベグロン|ベタニス|骨盤底筋.*頻尿|膀胱訓練|排尿日誌|ケーゲル体操|1日.*トイレ.*8回/i,
    tinnitus: /耳鳴り|慢性耳鳴|tinnitus|THIスコア|TRT.*耳鳴|耳鳴り再訓練|感音性難聴|sensorineural hearing loss|耳鳴り.*ピー音|耳鳴り.*ジー音|耳鳴り.*ザー音|耳鳴り.*睡眠|耳鳴り.*ストレス|耳鳴り.*補聴器|耳鳴り.*CBT|メチコバール.*耳鳴|ホワイトノイズ.*耳鳴|サウンドセラピー.*耳鳴/i,
    vertigo: /めまい|BPPV\b|良性発作性頭位めまい|メニエール病|前庭神経炎|vertigo|Meniere|エプリー法|Epley|耳石置換法|前庭リハビリ|vestibular rehabilitation|イソバイド.*めまい|ベタヒスチン|メリスロン|回転性めまい|浮動性めまい|頭位変換.*めまい|内リンパ水腫|耳閉感.*難聴.*めまい/i,
    dry_eye: /ドライアイ|乾性角結膜炎|dry eye|DED\b|VDT.*目|目.*乾き|目.*充血.*乾|人工涙液|ジクアホソル|ジクアス|レバミピド|ムコスタ点眼|ヒアルロン酸.*点眼|マイボーム腺|MGD\b|涙点プラグ|サイクロスポリン.*眼|眼精疲労.*乾燥|まばたき.*減少|コンタクト.*乾き/i,
    chronic_prostatitis: /慢性前立腺炎|CP\/CPPS|慢性骨盤痛|CPPS\b|NIH-CPSI|前立腺炎|prostatitis|会陰部痛|骨盤痛.*男性|前立腺.*痛み|排尿痛.*前立腺|ハルナール.*前立腺|タムスロシン.*前立腺|骨盤底.*男性|射精痛.*前立腺|慢性.*骨盤.*疼痛/i,
    ulcerative_colitis: /潰瘍性大腸炎|UC\b.*大腸|炎症性腸疾患|IBD\b|ulcerative colitis|血便.*腹痛|Mayoスコア|メサラジン|アサコール|ペンタサ|インフリキシマブ|レミケード.*UC|ベドリズマブ|エンタイビオ|ウステキヌマブ.*UC|ステラーラ.*UC|アザチオプリン.*大腸|大腸炎.*再燃|大腸粘膜.*炎症/i,
    panic: /パニック障害|パニック発作|panic disorder|panic attack|広場恐怖|動悸.*息苦しさ.*恐怖|死の恐怖.*発作|予期不安|パキシル.*パニック|パロキセチン.*パニック|CBT.*パニック|認知行動療法.*パニック|曝露療法.*恐怖|発作.*電車.*恐怖|パニック.*SSRI/i,
    ankylosing_spondylitis: /強直性脊椎炎|体軸性脊椎関節炎|axSpA\b|AS\b.*脊椎|ankylosing spondylitis|炎症性腰痛|仙腸関節.*炎|BASDAIスコア|ASDAS\b|HLA-B27|竹節様脊椎|エタネルセプト.*脊椎|ヒュミラ.*脊椎|アダリムマブ.*脊椎|セクキヌマブ.*脊椎|コセンティクス.*脊椎|イキセキズマブ.*脊椎|ウパダシチニブ.*脊椎|朝のこわばり.*腰/i,
    hyperthyroidism: /甲状腺機能亢進症|バセドウ病|Graves病|Graves disease|hyperthyroidism|甲状腺クリーゼ|thyroid storm|TSH.*低下|FT4.*上昇|FT3.*上昇|チアマゾール|メルカゾール|MMI\b.*甲状腺|プロピルチオウラシル|PTU\b.*甲状腺|放射線.*ヨウ素.*甲状腺|無顆粒球症.*甲状腺|バセドウ眼症|眼球突出.*甲状腺|頻脈.*甲状腺|体重減少.*甲状腺/i,
  };
  for (const [id, re] of Object.entries(patterns)) {
    if (re.test(text)) ids.push(id);
  }
  return ids.length > 0 ? ids : ['mecfs'];
}

// ────────────────────────────────────────────────
// Anthropic API call
// ────────────────────────────────────────────────
async function callAnthropic(body, apiKey, timeoutMs = 30000) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(tid);
  }
}

// ────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const origin = corsOrigin(request, env);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Only POST
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin);
    }

    // Origin check — reject requests from non-allowed origins
    const reqOrigin = request.headers.get('Origin') || '';
    const originVerified = !reqOrigin || getAllowedOrigins(env).includes(reqOrigin);
    if (!originVerified) {
      return json({ error: 'Origin not allowed' }, 403, origin);
    }

    // API key — prefer client-provided key; fall back to env secret
    // ONLY for verified origins. This enables guest mode (anonymous
    // users who haven't loaded keys from Firestore yet) while still
    // blocking unauthorized callers from other origins.
    const apiKey = request.headers.get('x-api-key') || (originVerified ? env.ANTHROPIC_API_KEY : null);
    if (!apiKey) {
      return json({ error: 'x-api-key header required' }, 401, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: 'Invalid JSON' }, 400, origin);
    }

    // Inject server-side system prompt + KV research context
    const userMsg = body.messages?.[0]?.content || '';
    const msgText = typeof userMsg === 'string' ? userMsg : (Array.isArray(userMsg) ? userMsg.map(b => b.text || '').join(' ') : '');
    body.system = await buildSystemPrompt(body.system, env, msgText);

    // First attempt
    let response;
    try {
      response = await callAnthropic(body, apiKey);
    } catch (e) {
      return json({ error: 'Anthropic request failed: ' + (e.message || 'timeout') }, 502, origin);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return new Response(errText, {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Streaming requests (body.stream === true) need the response body
    // passed through as-is — buffering with response.text() would
    // collapse the SSE event sequence into a single string and break
    // the client's incremental parser. The deep-analysis "本格的な分析"
    // and 医師提出レポート flows both depend on this.
    if (body.stream === true) {
      const upstreamCT = response.headers.get('Content-Type') || 'text/event-stream';
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': upstreamCT,
          'Cache-Control': 'no-cache',
          ...corsHeaders(origin),
        },
      });
    }

    // Pass through the Anthropic response as-is. No server-side refusal
    // detection or static fallback substitution — those caused the
    // "every response is the same ME/CFS pacing advice" bug.
    const responseBody = await response.text();
    return new Response(responseBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};
