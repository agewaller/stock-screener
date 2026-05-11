/**
 * Disease-LP affiliate resource panel — surfaces 3-5 curated
 * references (books, supplements, devices) per condition with
 * proper disclosure. Standalone — does not depend on the main app's
 * AffiliateEngine, so it works on the static LPs.
 *
 * Why not AdSense:
 *   Health content falls under YMYL ("Your Money or Your Life") in
 *   Google's quality guidelines and faces strict ad policy review.
 *   AdSense approval is risky and demonetization for medical claims
 *   is common. Affiliate links to relevant books / proven supplements
 *   are higher-trust and align with the guide content already on the
 *   page (no clickbait pressure).
 *
 * Disclosure:
 *   Each panel includes a clear "アフィリエイトリンクを含みます" note,
 *   complying with 景品表示法（ステマ規制 2023.10.1）which requires
 *   explicit disclosure of paid promotional links in Japan.
 */
(function () {
  'use strict';

  // Lookup keyed by data-app-param. Each entry is a small list of
  // search-term-based product cards. Using Amazon search (not ASIN)
  // means we don't have to maintain individual product pages — the
  // content survives even when individual products go out of stock.
  var CATALOGS = {
    mecfs: {
      title: '📚 ME/CFS の理解を深めるための関連リソース',
      items: [
        { kind: 'book', label: '『慢性疲労症候群 (ME/CFS) のすべて』医歯薬出版', q: '慢性疲労症候群 ME/CFS' },
        { kind: 'book', label: '『線維筋痛症と慢性疲労症候群を治す本』', q: '線維筋痛症 慢性疲労 治す' },
        { kind: 'supplement', label: 'CoQ10（ユビキノール 200mg）', q: 'コエンザイムQ10 ユビキノール 200mg' },
        { kind: 'supplement', label: 'メチル B12 1000μg（活性型）', q: 'メチルB12 1000 活性型' },
        { kind: 'device', label: 'Polar H10 心拍センサー（ペーシング用）', q: 'Polar H10 心拍センサー' }
      ]
    },
    long_covid: {
      title: '📚 Long COVID の対処に役立つリソース',
      items: [
        { kind: 'book', label: '『コロナ後遺症はなぜ続くのか』', q: 'コロナ後遺症 続く 治療' },
        { kind: 'supplement', label: 'ナットウキナーゼ（マイクロクロット仮説）', q: 'ナットウキナーゼ 2000FU' },
        { kind: 'supplement', label: 'ビタミン D 4000IU', q: 'ビタミンD 4000 IU' },
        { kind: 'device', label: 'パルスオキシメーター（SpO2 計測）', q: 'パルスオキシメーター 医療用' }
      ]
    },
    fibromyalgia: {
      title: '📚 線維筋痛症と向き合うためのリソース',
      items: [
        { kind: 'book', label: '『線維筋痛症 痛みからの解放』', q: '線維筋痛症 痛み 治療' },
        { kind: 'supplement', label: 'マグネシウム（グリシン酸）', q: 'マグネシウム グリシン酸' },
        { kind: 'supplement', label: 'CBD オイル（疼痛緩和）', q: 'CBDオイル 国内 ブロードスペクトラム' },
        { kind: 'device', label: '温熱パッド（広範囲）', q: '温熱パッド 広範囲 医療' }
      ]
    },
    pots: {
      title: '📚 POTS / 起立性不耐症のためのリソース',
      items: [
        { kind: 'supplement', label: '塩分タブレット（経口補水）', q: '経口補水 塩分タブレット' },
        { kind: 'device', label: 'コンプレッションストッキング 30-40 mmHg', q: 'コンプレッションストッキング 医療用 30 40' },
        { kind: 'book', label: '『起立性調節障害がよくわかる本』', q: '起立性調節障害 治す' }
      ]
    },
    mcas: {
      title: '📚 MCAS（肥満細胞活性化症候群）のリソース',
      items: [
        { kind: 'supplement', label: 'クエルセチン 500mg', q: 'クエルセチン 500mg' },
        { kind: 'supplement', label: 'ビタミン C（リポソーム）', q: 'リポソーム ビタミンC' },
        { kind: 'book', label: '『マスト細胞活性化症候群の基本』(英語書籍)', q: 'mast cell activation syndrome' }
      ]
    },
    eds: {
      title: '📚 EDS / 関節過可動性症候群のリソース',
      items: [
        { kind: 'device', label: '関節サポーター（手指）', q: '関節サポーター 手指 医療用' },
        { kind: 'book', label: '『エーラス・ダンロス症候群と暮らす』', q: 'エーラスダンロス 暮らす' },
        { kind: 'supplement', label: 'コラーゲンペプチド（タイプ I・III）', q: 'コラーゲンペプチド タイプ1 タイプ3' }
      ]
    },
    ibs: {
      title: '📚 IBS / 過敏性腸症候群のリソース',
      items: [
        { kind: 'book', label: '『低 FODMAP 食レシピ集』', q: '低FODMAP レシピ' },
        { kind: 'book', label: '『過敏性腸症候群がよくわかる本』', q: '過敏性腸症候群 よくわかる' },
        { kind: 'supplement', label: 'プロバイオティクス（B. infantis 35624）', q: 'プロバイオティクス Bifidobacterium infantis' },
        { kind: 'supplement', label: 'サイリウム（可溶性食物繊維）', q: 'サイリウム 食物繊維' }
      ]
    },
    hashimoto: {
      title: '📚 橋本病 / 甲状腺機能低下症のリソース',
      items: [
        { kind: 'supplement', label: 'セレン（200μg/日）', q: 'セレン 200 μg' },
        { kind: 'supplement', label: 'ブラジルナッツ（無塩・無漂白）', q: 'ブラジルナッツ 無塩' },
        { kind: 'supplement', label: 'ビタミン D 4000IU', q: 'ビタミンD 4000 IU' },
        { kind: 'book', label: '『橋本病・甲状腺の本』', q: '橋本病 甲状腺 本' }
      ]
    },
    depression: {
      title: '📚 うつ病・気分障害のリソース',
      items: [
        { kind: 'supplement', label: 'オメガ 3（EPA+DHA 2g/日）', q: 'オメガ3 EPA DHA 2000mg' },
        { kind: 'supplement', label: 'メチル葉酸（MTHFR 多型対応）', q: 'メチル葉酸 メチルフォレート' },
        { kind: 'book', label: '『うつヌケ』(田中圭一)', q: 'うつヌケ 田中圭一' },
        { kind: 'book', label: '『マンガでわかる認知行動療法』', q: 'マンガ 認知行動療法' }
      ]
    },
    insomnia: {
      title: '📚 不眠症の改善に役立つリソース',
      items: [
        { kind: 'supplement', label: 'マグネシウム（グリシン酸 400mg）', q: 'マグネシウム グリシン酸 400' },
        { kind: 'supplement', label: 'メラトニン（1-3mg）', q: 'メラトニン 1mg 3mg' },
        { kind: 'book', label: '『眠れなくなるほど面白い 図解 睡眠の話』', q: '眠れなくなるほど 図解 睡眠' },
        { kind: 'device', label: 'ホワイトノイズマシン', q: 'ホワイトノイズマシン 寝室' }
      ]
    },
    bipolar: {
      title: '📚 双極性障害と向き合うためのリソース',
      items: [
        { kind: 'book', label: '『双極性障害（躁うつ病）と向き合う』岡田尊司', q: '双極性障害 躁うつ病 向き合う' },
        { kind: 'book', label: '『CALM（気分チャート記録ガイド）』', q: '双極性障害 気分チャート 記録' },
        { kind: 'supplement', label: 'オメガ 3（EPA+DHA 2g）双極うつ補助に', q: 'オメガ3 EPA DHA 2000mg' },
        { kind: 'device', label: '光療法ランプ（季節性うつ・概日リズム調整）', q: '光療法ランプ 10000ルクス' }
      ]
    },
    adhd: {
      title: '📚 ADHD の理解と対策に役立つリソース',
      items: [
        { kind: 'book', label: '『ADHDの正体』岡田尊司', q: 'ADHDの正体 岡田尊司' },
        { kind: 'book', label: '『先延ばし解決の心理学』', q: '先延ばし ADHD 解決 生産性' },
        { kind: 'device', label: 'ノイズキャンセリングヘッドフォン（集中支援）', q: 'ノイズキャンセリング ヘッドフォン 集中' },
        { kind: 'supplement', label: 'オメガ 3（ADHD 小児〜成人の補助エビデンスあり）', q: 'オメガ3 EPA DHA ADHD' }
      ]
    },
    migraine: {
      title: '📚 片頭痛（偏頭痛）管理に役立つリソース',
      items: [
        { kind: 'book', label: '『頭痛の正しい治し方』日本頭痛学会監修', q: '片頭痛 頭痛 治し方 日本頭痛学会' },
        { kind: 'book', label: '『偏頭痛と上手に付き合う本』', q: '偏頭痛 片頭痛 付き合う 本' },
        { kind: 'supplement', label: 'マグネシウム（400mg/日 — 片頭痛予防エビデンスあり）', q: 'マグネシウム 400mg 片頭痛 予防' },
        { kind: 'supplement', label: 'リボフラビン（ビタミン B2 400mg）片頭痛予防', q: 'ビタミンB2 リボフラビン 400mg 片頭痛' },
        { kind: 'device', label: '気圧計（天気トリガー把握）', q: '気圧計 デジタル 片頭痛' }
      ]
    },
    ptsd: {
      title: '📚 PTSD・トラウマ回復に役立つリソース',
      items: [
        { kind: 'book', label: '『身体はトラウマを記録する』ベッセル・ヴァン・デア・コーク', q: '身体はトラウマを記録する ヴァン デア コーク' },
        { kind: 'book', label: '『複雑性 PTSD から回復する』', q: '複雑性PTSD 回復 本 CPTSD' },
        { kind: 'book', label: '『EMDR — トラウマを癒す』', q: 'EMDR トラウマ 癒す' },
        { kind: 'supplement', label: 'アシュワガンダ（コルチゾール調整・不安軽減）', q: 'アシュワガンダ KSM-66 ストレス' }
      ]
    },
    ra: {
      title: '📚 関節リウマチ（RA）管理に役立つリソース',
      items: [
        { kind: 'book', label: '『関節リウマチ 最新治療と生活のヒント』', q: '関節リウマチ 最新治療 生活' },
        { kind: 'book', label: '『リウマチと向き合う — 寛解をめざして』', q: 'リウマチ 寛解 向き合う 本' },
        { kind: 'device', label: '電動ハンドグリップ（握力リハビリ）', q: '電動ハンドグリップ リハビリ 関節' },
        { kind: 'supplement', label: 'オメガ 3（抗炎症 EPA+DHA 2g/日）', q: 'オメガ3 EPA DHA 2000mg 抗炎症' },
        { kind: 'supplement', label: 'ターメリック（クルクミン 抗炎症）', q: 'クルクミン ターメリック 関節 抗炎症' }
      ]
    },
    sle: {
      title: '📚 SLE（ループス）管理に役立つリソース',
      items: [
        { kind: 'book', label: '『ループス（SLE）と生きる — 難病との向き合い方』', q: 'ループス SLE 全身性エリテマトーデス 本' },
        { kind: 'book', label: '『自己免疫疾患の食事療法』', q: '自己免疫疾患 食事療法 抗炎症 本' },
        { kind: 'device', label: 'UVカット日焼け止め SPF50+ PA++++ 無添加', q: '日焼け止め SPF50 PA++++ 無添加 低刺激' },
        { kind: 'device', label: 'UVカット長袖インナー（光線過敏対策）', q: 'UVカット インナー 長袖 日焼け対策' },
        { kind: 'supplement', label: 'ビタミンD3（免疫調整・骨保護）', q: 'ビタミンD3 2000IU 免疫 骨密度' }
      ]
    },
    asd: {
      title: '📚 ASD（自閉スペクトラム症）に役立つリソース',
      items: [
        { kind: 'book', label: '『自閉スペクトラム症を生きる — 当事者からのガイド』', q: 'ASD 自閉スペクトラム症 当事者 本' },
        { kind: 'book', label: '『発達障害の仕事術 — 合理的配慮の活用法』', q: '発達障害 仕事術 合理的配慮 本' },
        { kind: 'device', label: 'ノイズキャンセリングイヤーホン（聴覚過敏対策）', q: 'ノイズキャンセリング イヤーホン 聴覚過敏' },
        { kind: 'device', label: 'アイマスク・遮光グッズ（視覚過敏対策）', q: '遮光 アイマスク 光過敏 視覚過敏' },
        { kind: 'supplement', label: 'マグネシウム（睡眠・神経系サポート）', q: 'マグネシウム グリシン 睡眠 神経' }
      ]
    },
    gad: {
      title: '📚 不安障害管理に役立つリソース',
      items: [
        { kind: 'book', label: '『不安をなくす練習 — 認知行動療法の入門』', q: '不安 認知行動療法 CBT 入門 本' },
        { kind: 'book', label: '『マインドフルネスストレス低減法（MBSR）入門』', q: 'マインドフルネス MBSR 不安 本' },
        { kind: 'supplement', label: 'L-テアニン（リラックス・集中サポート）', q: 'L-テアニン サプリ リラックス 集中' },
        { kind: 'supplement', label: 'マグネシウム グリシン（睡眠・筋弛緩）', q: 'マグネシウム グリシン 睡眠 緊張緩和' },
        { kind: 'device', label: 'バイオフィードバック HRV トレーナー', q: 'HRV バイオフィードバック 自律神経 呼吸' }
      ]
    },
    ocd: {
      title: '📚 強迫性障害（OCD）管理に役立つリソース',
      items: [
        { kind: 'book', label: '『強迫性障害の治療マニュアル — ERP実践ガイド』', q: '強迫性障害 OCD 認知行動療法 ERP 本' },
        { kind: 'book', label: '『マインドフルネスで強迫症と向き合う』', q: 'マインドフルネス 強迫 OCD 向き合う 本' },
        { kind: 'supplement', label: 'L-テアニン（不安緩和・リラックス）', q: 'L-テアニン リラックス 不安 サプリ' },
        { kind: 'supplement', label: 'イノシトール（強迫症への研究あり）', q: 'イノシトール サプリ 不安 強迫' },
        { kind: 'device', label: 'グラウンディンググッズ（感覚ツール）', q: 'グラウンディング 感覚 ストレスボール 感触' }
      ]
    },
    epilepsy: {
      title: '📚 てんかん管理に役立つリソース',
      items: [
        { kind: 'book', label: '『てんかんのある暮らし — 発作日誌と自己管理』', q: 'てんかん 発作日誌 自己管理 本' },
        { kind: 'device', label: 'てんかん発作アラート（ウェアラブル）', q: 'てんかん 発作 センサー ウェアラブル アラート' },
        { kind: 'device', label: '防水スマートウォッチ（転倒・発作検知）', q: 'スマートウォッチ 防水 転倒検知 健康管理' },
        { kind: 'supplement', label: 'マグネシウム（痙攣閾値の維持）', q: 'マグネシウム サプリ けいれん 神経' },
        { kind: 'book', label: '『てんかん 就労・運転・生活の手引き』', q: 'てんかん 就労 運転 生活 ガイド 本' }
      ]
    },
    burnout: {
      title: '📚 バーンアウト回復に役立つリソース',
      items: [
        { kind: 'book', label: '『燃え尽きる前に — バーンアウト予防と回復』', q: 'バーンアウト 燃え尽き 回復 予防 本' },
        { kind: 'book', label: '『セルフ・コンパッション — 自分を責めずに疲れをほぐす』', q: 'セルフコンパッション 自己慈悲 本 疲労' },
        { kind: 'supplement', label: 'アシュワガンダ KSM-66（コルチゾール調整）', q: 'アシュワガンダ KSM-66 ストレス コルチゾール' },
        { kind: 'supplement', label: 'マグネシウム グリシン（睡眠・筋弛緩）', q: 'マグネシウム グリシン 睡眠 リラックス' },
        { kind: 'device', label: 'Oura Ring（睡眠・HRV・回復スコア）', q: 'Oura Ring スマートリング 睡眠 HRV 回復' }
      ]
    },
    parkinsons: {
      title: '📚 パーキンソン病管理に役立つリソース',
      items: [
        { kind: 'book', label: '『パーキンソン病と生きる — 最新治療と日常の工夫』', q: 'パーキンソン病 最新治療 生活 本' },
        { kind: 'device', label: 'スマートウォッチ（振戦・活動量モニタ）', q: 'スマートウォッチ 振戦 活動量 健康管理' },
        { kind: 'device', label: '杖・歩行補助器（転倒予防）', q: '杖 歩行補助 転倒予防 リハビリ' },
        { kind: 'supplement', label: 'CoQ10（ミトコンドリア・神経保護）', q: 'CoQ10 ユビキノール サプリ 神経保護' },
        { kind: 'supplement', label: 'ビタミンD3+K2（骨保護・神経機能）', q: 'ビタミンD3 K2 骨粗鬆症 神経 サプリ' }
      ]
    },
    sjogrens: {
      title: '📚 シェーグレン症候群管理に役立つリソース',
      items: [
        { kind: 'book', label: '『シェーグレン症候群と生きる』', q: 'シェーグレン症候群 乾燥 自己免疫 本' },
        { kind: 'device', label: '防腐剤なし人工涙液（ドライアイ点眼）', q: '人工涙液 防腐剤なし 点眼 ドライアイ' },
        { kind: 'device', label: '超音波加湿器（室内保湿）', q: '加湿器 超音波 静音 乾燥対策' },
        { kind: 'device', label: '人工唾液スプレー（ドライマウス）', q: '人工唾液 スプレー ドライマウス 口の渇き' },
        { kind: 'supplement', label: 'ビタミンD3（免疫調整・骨保護）', q: 'ビタミンD3 免疫 骨密度 2000IU' }
      ]
    },
    crohns: {
      title: '📚 クローン病管理に役立つリソース',
      items: [
        { kind: 'book', label: '『クローン病・潰瘍性大腸炎を生きる』', q: 'クローン病 潰瘍性大腸炎 生きる 本' },
        { kind: 'book', label: '『IBDのための食事ガイド』', q: 'IBD 炎症性腸疾患 食事 ガイド 本' },
        { kind: 'supplement', label: 'ラクトバチルス プロバイオティクス（腸内環境）', q: 'プロバイオティクス ラクトバチルス 腸内細菌 IBD' },
        { kind: 'supplement', label: 'オメガ 3（腸炎症の抑制 EPA）', q: 'オメガ3 EPA DHA 腸 抗炎症' },
        { kind: 'device', label: '電子体重計（体重管理・低栄養チェック）', q: '体重計 体組成計 スマート 体脂肪' }
      ]
    },
    ms: {
      title: '📚 多発性硬化症管理に役立つリソース',
      items: [
        { kind: 'book', label: '『多発性硬化症と生きる — 再発管理と日常の工夫』', q: '多発性硬化症 再発 生活 本' },
        { kind: 'device', label: '冷却ベスト（ウートホフ現象・体温管理）', q: '冷却ベスト アイシング 体温管理 夏 スポーツ' },
        { kind: 'device', label: 'スマートウォッチ（疲労・活動量モニタ）', q: 'スマートウォッチ 活動量 疲労 健康管理' },
        { kind: 'supplement', label: 'ビタミンD3（免疫調整・MS研究で注目）', q: 'ビタミンD3 5000IU 免疫 神経 サプリ' },
        { kind: 'supplement', label: 'オメガ3 EPA/DHA（神経保護・抗炎症）', q: 'オメガ3 EPA DHA 神経 抗炎症 サプリ' }
      ]
    },
    chronic_pain: {
      title: '📚 慢性疼痛管理に役立つリソース',
      items: [
        { kind: 'book', label: '『痛みと向き合う — 慢性疼痛の認知行動療法』', q: '慢性疼痛 認知行動療法 痛み 本' },
        { kind: 'book', label: '『ペインクリニック受診ガイド』', q: 'ペインクリニック 神経ブロック 痛み 本' },
        { kind: 'device', label: 'TENS（低周波治療器・家庭用疼痛緩和）', q: 'TENS 低周波治療器 家庭用 痛み' },
        { kind: 'device', label: 'ホットパック（温熱療法）', q: 'ホットパック 温熱療法 慢性痛 腰痛' },
        { kind: 'supplement', label: 'マグネシウム（筋緊張緩和・神経痛）', q: 'マグネシウム サプリ 筋緊張 神経痛 グリシン酸' }
      ]
    },
    panic: {
      title: '📚 パニック障害管理に役立つリソース',
      items: [
        { kind: 'book', label: '『パニック障害・社交不安障害 — 自分でできる認知行動療法』', q: 'パニック障害 認知行動療法 自分でできる 本' },
        { kind: 'book', label: '『不安・パニックに悩む人のためのセルフヘルプワークブック』', q: '不安 パニック ワークブック CBT 本' },
        { kind: 'device', label: 'パルスオキシメーター（発作時の SpO2 確認）', q: 'パルスオキシメーター 血中酸素 心拍 指先' },
        { kind: 'supplement', label: 'テアニン（リラクゼーション・抗不安）', q: 'テアニン リラクゼーション 不安 サプリ' },
        { kind: 'supplement', label: 'マグネシウム（神経リラックス・睡眠）', q: 'マグネシウム グリシン酸 睡眠 リラクゼーション' }
      ]
    },
    endometriosis: {
      title: '📚 子宮内膜症管理に役立つリソース',
      items: [
        { kind: 'book', label: '『子宮内膜症 — 正しい知識と最新治療』', q: '子宮内膜症 治療 不妊 本' },
        { kind: 'book', label: '『妊活・子宮内膜症・不妊治療ガイド』', q: '子宮内膜症 不妊治療 妊活 本' },
        { kind: 'device', label: '使い捨て懐炉・温熱パッド（骨盤痛の温め）', q: '温熱パッド 腹部 骨盤 生理痛 腰痛' },
        { kind: 'supplement', label: 'マグネシウム（月経痛・筋緊張緩和）', q: 'マグネシウム サプリ 月経痛 筋肉 緩和' },
        { kind: 'supplement', label: 'ビタミンD3（免疫調整・炎症抑制）', q: 'ビタミンD3 免疫 炎症 子宮内膜症 サプリ' }
      ]
    }
  };

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Amazon JP search URL with affiliate tag. Tag is configurable via
  // <body data-amazon-tag="..."> or falls back to 'forestvoice-22'.
  function amazonSearchUrl(query) {
    var tag = (document.body && document.body.getAttribute('data-amazon-tag')) || 'forestvoice-22';
    return 'https://www.amazon.co.jp/s?k=' + encodeURIComponent(query) +
      '&tag=' + encodeURIComponent(tag);
  }

  function iconFor(kind) {
    return kind === 'book' ? '📖' : kind === 'supplement' ? '💊' : kind === 'device' ? '🔬' : '🔗';
  }

  onReady(function () {
    var key = (document.body && document.body.getAttribute('data-app-param')) || '';
    var catalog = CATALOGS[key];
    if (!catalog) return;

    var box = document.createElement('div');
    box.id = 'affiliate-resource-panel';
    box.style.cssText =
      'margin:24px 0;padding:16px 18px;background:#fafaff;' +
      'border:1px solid #e2e8f0;border-radius:12px;' +
      'font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif';

    var html = '<div style="font-size:14px;font-weight:700;color:#3730a3;margin-bottom:6px">' +
      catalog.title + '</div>' +
      '<div style="font-size:11px;color:#64748b;line-height:1.6;margin-bottom:10px;padding:6px 8px;background:#fef3c7;border-radius:6px">' +
      'ℹ️ <strong>本セクションには Amazon アソシエイト等のアフィリエイトリンクが含まれます</strong>。リンクから購入された場合、運営者に一定の手数料が支払われ、サービス運営費に充てられます（読者の支払額は変わりません）。記載商品の効果は個人差があります。購入前に主治医にご相談ください。' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">';

    catalog.items.forEach(function (item) {
      var url = amazonSearchUrl(item.q);
      html +=
        '<a href="' + url + '" target="_blank" rel="sponsored noopener noreferrer" ' +
        'style="display:block;padding:10px 12px;background:#fff;border:1px solid #e2e8f0;' +
        'border-radius:8px;text-decoration:none;color:#1e293b;font-size:12px;line-height:1.5;' +
        'transition:transform 0.1s">' +
        '<div style="font-size:14px;margin-bottom:2px">' + iconFor(item.kind) + '</div>' +
        '<div style="font-weight:600;color:#3730a3">' + item.label.replace(/</g, '&lt;') + '</div>' +
        '<div style="font-size:10px;color:#64748b;margin-top:4px">→ Amazon で探す</div>' +
        '</a>';
    });
    html += '</div>';
    html += '<div style="font-size:10px;color:#94a3b8;margin-top:8px">※ 健康日記は医療機関ではなく、本セクションも医療アドバイスではありません。</div>';

    box.innerHTML = html;

    // Place before the <footer>; same anchor convention as the
    // newsletter form so they stack naturally.
    var footer = document.querySelector('footer');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(box, footer);
    } else {
      document.body.appendChild(box);
    }
  });
})();
