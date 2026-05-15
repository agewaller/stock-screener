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
    cptsd: {
      title: '📚 複雑性PTSD（C-PTSD）の回復に役立つリソース',
      items: [
        { kind: 'book', label: '『身体はトラウマを記録する』ベッセル・ヴァン・デア・コーク', q: '身体はトラウマを記録する ヴァン デア コーク' },
        { kind: 'book', label: '『複雑性PTSDから回復する — 虐待・ネグレクト・機能不全家族』', q: '複雑性PTSD 回復 虐待 ネグレクト 機能不全 家族 本' },
        { kind: 'book', label: '『愛着障害の克服 — 「愛されなかった子ども」のヒーリングへ』', q: '愛着障害 克服 愛されなかった 子ども ヒーリング 本' },
        { kind: 'supplement', label: 'アシュワガンダ（コルチゾール調整・過覚醒の緩和）', q: 'アシュワガンダ KSM-66 ストレス 過覚醒' },
        { kind: 'book', label: '『マインドフルネスストレス低減法』ジョン・カバットジン', q: 'マインドフルネス ストレス低減 瞑想 カバットジン 本' }
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
    },
    diabetes: {
      title: '📚 糖尿病管理に役立つリソース',
      items: [
        { kind: 'book', label: '『2型糖尿病 食事・運動・薬の最新ガイド』', q: '糖尿病 食事 運動 管理 本' },
        { kind: 'device', label: '血糖測定器・CGMリーダー（持続血糖モニタ）', q: '血糖測定器 CGM 持続 グルコース モニター' },
        { kind: 'device', label: 'スマート体重計（体脂肪・筋肉量）', q: 'スマート体重計 体組成 体脂肪 Wi-Fi' },
        { kind: 'supplement', label: 'ベルベリン（血糖調整・腸内細菌叢）', q: 'ベルベリン 血糖 腸内細菌 サプリ' },
        { kind: 'supplement', label: 'クロム（インスリン感受性向上）', q: 'クロム サプリ 血糖値 インスリン 感受性' }
      ]
    },
    atopy: {
      title: '📚 アトピー性皮膚炎管理に役立つリソース',
      items: [
        { kind: 'book', label: '『アトピー性皮膚炎 — 最新治療とスキンケア』', q: 'アトピー性皮膚炎 スキンケア 治療 本' },
        { kind: 'device', label: '加湿器（室内保湿・乾燥対策）', q: '加湿器 超音波 静音 乾燥 保湿' },
        { kind: 'supplement', label: 'ヘパリン類似物質（ヒルドイド）タイプ保湿剤', q: 'ヘパリン類似物質 保湿 ローション アトピー' },
        { kind: 'supplement', label: 'ビタミンD3（免疫調整・皮膚バリア）', q: 'ビタミンD3 免疫 皮膚 アトピー サプリ' },
        { kind: 'supplement', label: 'プロバイオティクス（腸内細菌・アレルギー抑制）', q: 'プロバイオティクス 腸内細菌 アレルギー アトピー' }
      ]
    },
    asthma: {
      title: '📚 気管支喘息管理に役立つリソース',
      items: [
        { kind: 'book', label: '『気管支喘息 — 最新治療と日常管理ガイド』', q: '気管支喘息 治療 管理 本' },
        { kind: 'device', label: 'ピークフローメーター（PEF 自宅測定）', q: 'ピークフローメーター 喘息 肺活量 自宅 測定' },
        { kind: 'device', label: '空気清浄機（花粉・ダニ・PM2.5 除去）', q: '空気清浄機 花粉 ハウスダスト PM2.5 除去' },
        { kind: 'supplement', label: 'ビタミンD3（気道炎症・免疫調整）', q: 'ビタミンD3 気道 免疫 炎症 喘息 サプリ' },
        { kind: 'supplement', label: 'マグネシウム（気管支拡張補助）', q: 'マグネシウム 気管支 拡張 喘息 サプリ' }
      ]
    },
    ckd: {
      title: '📚 慢性腎臓病管理に役立つリソース',
      items: [
        { kind: 'book', label: '『慢性腎臓病と食事 — 透析を遠ざける腎臓病食』', q: '慢性腎臓病 食事 低タンパク 腎臓病 本' },
        { kind: 'device', label: '上腕式血圧計（毎朝の血圧管理）', q: '上腕式 血圧計 自動 医療機器 精度' },
        { kind: 'device', label: '体重計・体組成計（浮腫・体水分モニタ）', q: '体重計 体組成計 スマート 体脂肪 水分量' },
        { kind: 'supplement', label: '重曹（炭酸水素ナトリウム・代謝性アシドーシス補正）', q: '重曹 炭酸水素ナトリウム 食品用 腎臓' },
        { kind: 'book', label: '『腎臓病を知る — CKD の基礎知識と透析準備』', q: '腎臓病 CKD 透析 基礎知識 本' }
      ]
    },
    heart_failure: {
      title: '📚 心不全管理に役立つリソース',
      items: [
        { kind: 'book', label: '『心不全 — 再入院を防ぐ毎日の自己管理』', q: '心不全 自己管理 再入院 体重 本' },
        { kind: 'device', label: '上腕式血圧計（毎朝の血圧・心拍管理）', q: '上腕式 血圧計 自動 心拍 不整脈' },
        { kind: 'device', label: 'デジタル体重計（毎朝の体重変化チェック）', q: 'デジタル体重計 スマート Wi-Fi 体重管理' },
        { kind: 'supplement', label: 'CoQ10（心筋エネルギー代謝サポート）', q: 'CoQ10 ユビキノール 心臓 エネルギー サプリ' },
        { kind: 'supplement', label: 'マグネシウム（不整脈・心臓リズム）', q: 'マグネシウム 心臓 不整脈 サプリ' }
      ]
    },
    gout: {
      title: '📚 痛風管理に役立つリソース',
      items: [
        { kind: 'book', label: '『痛風・高尿酸血症 — 発作を防ぐ食事と薬の使い方』', q: '痛風 高尿酸血症 食事 発作 本' },
        { kind: 'device', label: '携帯用尿酸測定器（自宅で尿酸値チェック）', q: '尿酸測定器 携帯 家庭用 尿酸値 チェック' },
        { kind: 'supplement', label: 'ビタミンC（尿酸排泄促進）', q: 'ビタミンC 尿酸 排泄 サプリ 1000mg' },
        { kind: 'supplement', label: 'チェリー（アントシアニン・抗炎症・尿酸低下）', q: 'チェリー サプリ アントシアニン 痛風 抗炎症' },
        { kind: 'supplement', label: 'フォラート（高プリン食代替・細胞保護）', q: '葉酸 フォラート サプリ 細胞 尿酸' }
      ]
    },
    osteoporosis: {
      title: '📚 骨粗鬆症管理に役立つリソース',
      items: [
        { kind: 'book', label: '『骨粗鬆症 — 骨折を防ぐ最新治療と生活習慣』', q: '骨粗鬆症 骨折 予防 治療 本' },
        { kind: 'device', label: '家庭用握力計（転倒・サルコペニアリスク評価）', q: '握力計 デジタル 家庭用 筋力測定' },
        { kind: 'supplement', label: 'カルシウム＋ビタミンD3（骨密度維持）', q: 'カルシウム ビタミンD3 サプリ 骨密度 骨粗鬆症' },
        { kind: 'supplement', label: 'ビタミンK2（骨へのカルシウム誘導）', q: 'ビタミンK2 MK-7 サプリ 骨 カルシウム' },
        { kind: 'device', label: '転倒予防プロテクターヒッププロテクター', q: 'ヒッププロテクター 転倒 骨折予防 高齢者' }
      ]
    },
    menopause: {
      title: '📚 更年期障害に役立つリソース',
      items: [
        { kind: 'book', label: '『更年期 — HRTと漢方で乗り越える女性ホルモンの変化』', q: '更年期 HRT 漢方 ホルモン 本 女性' },
        { kind: 'supplement', label: 'エクオール（大豆イソフラボン代謝産物・ほてり軽減）', q: 'エクオール サプリ 更年期 ほてり イソフラボン' },
        { kind: 'supplement', label: '大豆イソフラボン（エストロゲン様作用・骨密度維持）', q: '大豆イソフラボン サプリ 更年期 骨密度' },
        { kind: 'supplement', label: 'マグネシウム（睡眠・筋肉・神経サポート）', q: 'マグネシウム サプリ 睡眠 更年期 女性' },
        { kind: 'device', label: '冷感タオル・冷却グッズ（ホットフラッシュ対策）', q: '冷感タオル ホットフラッシュ 更年期 冷却グッズ' }
      ]
    },
    schizophrenia: {
      title: '📚 統合失調症の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『統合失調症 — 当事者・家族のための完全ガイド』', q: '統合失調症 ガイド 家族 当事者 本' },
        { kind: 'book', label: '『リカバリー — 精神疾患からの回復と地域生活』', q: 'リカバリー 精神疾患 回復 地域生活 本' },
        { kind: 'supplement', label: 'オメガ3脂肪酸（EPAが陰性症状・認知機能に有効な可能性）', q: 'オメガ3 EPA DHA サプリ 精神 認知機能' },
        { kind: 'device', label: '服薬管理ピルケース（週次・アラーム付き）', q: '服薬管理 ピルケース アラーム 週次 薬' },
        { kind: 'device', label: 'スマートウォッチ（活動・睡眠リズム記録）', q: 'スマートウォッチ 活動 睡眠 記録 ヘルス' }
      ]
    },
    alzheimers: {
      title: '📚 アルツハイマー病の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『認知症の人と家族のための記録ブック』', q: '認知症 記録 家族 ガイド 本' },
        { kind: 'device', label: 'GPS見守りデバイス（徘徊・行方不明予防）', q: 'GPS 見守り 認知症 徘徊 追跡デバイス' },
        { kind: 'device', label: '服薬管理ディスペンサー（アラーム付き自動排出）', q: '服薬管理 ディスペンサー アラーム 自動 高齢者' },
        { kind: 'supplement', label: 'ホスファチジルセリン（認知機能維持サプリ）', q: 'ホスファチジルセリン サプリ 認知 記憶 高齢者' },
        { kind: 'book', label: '『家族のための認知症ケア入門 — BPSD対応と介護負担軽減』', q: '認知症 ケア BPSD 介護 家族 本' }
      ]
    },
    sad: {
      title: '📚 社会不安障害に役立つリソース',
      items: [
        { kind: 'book', label: '『社会不安障害のための認知行動療法ワークブック』', q: '社会不安障害 認知行動療法 ワークブック CBT 本' },
        { kind: 'book', label: '『人前で話すのが怖い — 社交不安症を克服する方法』', q: '社会不安 人前 スピーチ 克服 本 自助' },
        { kind: 'supplement', label: 'アシュワガンダ（コルチゾール低下・不安軽減に有効な可能性）', q: 'アシュワガンダ サプリ 不安 ストレス 緩和' },
        { kind: 'supplement', label: 'テアニン（緑茶成分・リラックス・緊張緩和）', q: 'テアニン サプリ リラックス 緊張 不安' },
        { kind: 'device', label: 'バイオフィードバックデバイス（心拍変動・自律神経訓練）', q: 'バイオフィードバック 心拍 HRV 自律神経 デバイス' }
      ]
    },
    anorexia: {
      title: '📚 摂食障害の回復に役立つリソース',
      items: [
        { kind: 'book', label: '『摂食障害 — 回復への道 当事者と家族のガイド』', q: '摂食障害 回復 当事者 家族 本 ガイド' },
        { kind: 'book', label: '『過食症のためのCBT自助ワークブック』', q: '過食症 CBT ワークブック 自助 本 認知行動療法' },
        { kind: 'supplement', label: '亜鉛（味覚・食欲改善・拒食症の補助療法）', q: '亜鉛 サプリ 亜鉛不足 食欲 味覚 回復' },
        { kind: 'supplement', label: 'マルチビタミン・ミネラル（回復期の栄養補充）', q: 'マルチビタミン ミネラル 栄養補充 摂食障害 回復' },
        { kind: 'book', label: '『家族のための摂食障害サポートガイド — Maudsleyアプローチ』', q: '摂食障害 家族 サポート Maudsley アプローチ 本' }
      ]
    },
    thyroid_cancer: {
      title: '📚 甲状腺がん術後管理に役立つリソース',
      items: [
        { kind: 'book', label: '『甲状腺がんの術後生活ガイド — チラーヂン・経過観察・再発予防』', q: '甲状腺がん 術後 チラーヂン 経過観察 本' },
        { kind: 'supplement', label: 'カルシウム＋ビタミンD3（TSH抑制による骨密度低下対策）', q: 'カルシウム ビタミンD3 骨密度 甲状腺 術後' },
        { kind: 'device', label: '手首式血圧計（TSH抑制による動悸・高血圧のモニタリング）', q: '血圧計 手首 家庭用 デジタル 動悸 心拍' },
        { kind: 'device', label: '活動量計・心拍モニター（TSH過剰投与による頻脈チェック）', q: '活動量計 心拍 モニター 着用 健康管理' },
        { kind: 'book', label: '『ホルモン補充療法の全知識 — 甲状腺・副腎・更年期』', q: 'ホルモン補充療法 甲状腺 副腎 本 知識' }
      ]
    },
    sleep_apnea: {
      title: '📚 睡眠時無呼吸症候群の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『睡眠時無呼吸症候群 — CPAPで改善する眠りと健康』', q: '睡眠時無呼吸 CPAP 本 眠り 改善' },
        { kind: 'device', label: 'CPAP用加湿チャンバー・フィルター交換品（快適使用継続）', q: 'CPAP 加湿器 チャンバー フィルター 交換 消耗品' },
        { kind: 'device', label: '睡眠トラッキングデバイス（いびき・無呼吸の自宅モニター）', q: '睡眠 いびき 無呼吸 モニター トラッカー 記録' },
        { kind: 'supplement', label: 'マグネシウム（睡眠の質改善・筋肉リラックス）', q: 'マグネシウム サプリ 睡眠 改善 リラックス 夜' },
        { kind: 'device', label: '側臥位枕（体位療法・仰向け防止）', q: '横向き 枕 いびき 防止 側臥位 睡眠' }
      ]
    },
    liver_disease: {
      title: '📚 慢性肝疾患の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『肝炎・肝硬変・肝がん — 最新治療と生活管理ガイド』', q: '肝炎 肝硬変 肝がん 治療 本 ガイド' },
        { kind: 'supplement', label: 'UDCA（ウルソデオキシコール酸・肝臓保護）', q: 'ウルソデオキシコール酸 UDCA サプリ 肝臓 肝機能' },
        { kind: 'supplement', label: 'シリマリン（マリアアザミ・肝細胞保護・抗酸化）', q: 'シリマリン マリアアザミ サプリ 肝臓 肝機能 保護' },
        { kind: 'device', label: '体組成計（体重・腹水・筋肉量のモニタリング）', q: '体組成計 体重 体脂肪 筋肉量 内臓脂肪 デジタル' },
        { kind: 'book', label: '『非アルコール性脂肪肝・MASHのための食事と運動』', q: '脂肪肝 NASH MASH 食事 運動 本' }
      ]
    },
    cancer_fatigue: {
      title: '📚 がん治療中の副作用管理に役立つリソース',
      items: [
        { kind: 'book', label: '『がん治療中の副作用ケア — 倦怠感・悪心・末梢神経障害』', q: 'がん治療 副作用 倦怠感 悪心 本 ケア 患者' },
        { kind: 'supplement', label: 'αリポ酸（CIPN・末梢神経保護に有効な可能性）', q: 'αリポ酸 アルファリポ酸 サプリ 末梢神経 CIPN 神経障害' },
        { kind: 'supplement', label: 'グルタミン（口内炎・腸管保護・筋肉保持）', q: 'グルタミン サプリ 口内炎 腸 筋肉 化学療法 保護' },
        { kind: 'device', label: '冷却グローブ・冷却靴下（末梢神経障害・爪障害予防）', q: '冷却グローブ 冷却 手袋 靴下 化学療法 末梢神経 爪' },
        { kind: 'book', label: '『がんサバイバーの疲労マネジメント — 回復と活力を取り戻す』', q: 'がん サバイバー 疲労 倦怠感 回復 本' }
      ]
    },
    copd: {
      title: '📚 COPDの管理に役立つリソース',
      items: [
        { kind: 'book', label: '『COPD — 息切れと上手につきあう完全ガイド』', q: 'COPD 息切れ 吸入 肺 本 ガイド' },
        { kind: 'device', label: 'パルスオキシメーター（SpO2・心拍数自宅モニタリング）', q: 'パルスオキシメーター SpO2 血中酸素 家庭用 指先' },
        { kind: 'device', label: 'ピークフローメーター（最大呼気流量の自宅測定）', q: 'ピークフローメーター 肺機能 呼吸 測定 COPD 喘息' },
        { kind: 'supplement', label: 'NAC（N-アセチルシステイン・去痰・抗酸化）', q: 'NAC N-アセチルシステイン サプリ 去痰 抗酸化 肺' },
        { kind: 'book', label: '『禁煙成功の秘訣 — ニコチン依存から自由になる』', q: '禁煙 ニコチン 依存 成功 本 COPD' }
      ]
    },
    hypertension: {
      title: '📚 高血圧の管理に役立つリソース',
      items: [
        { kind: 'device', label: '上腕式血圧計（家庭血圧測定・医療機器認定品）', q: '上腕式 血圧計 家庭用 医療機器 自動 正確' },
        { kind: 'book', label: '『高血圧の完全管理ガイド — 家庭血圧・降圧薬・減塩食』', q: '高血圧 管理 家庭血圧 降圧薬 減塩 本 ガイド' },
        { kind: 'supplement', label: 'カリウム補給（減塩・血圧降下に有効）', q: 'カリウム サプリ 血圧 減塩 補給 ミネラル' },
        { kind: 'book', label: '『減塩・DASH食レシピ — 血圧を下げる毎日の食事』', q: '減塩 DASH食 レシピ 血圧 食事 本 高血圧' },
        { kind: 'device', label: '活動量計（歩数・有酸素運動の記録で血圧管理）', q: '活動量計 万歩計 歩数計 運動 血圧 管理' }
      ]
    },
    hyperlipidemia: {
      title: '📚 脂質異常症の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『脂質異常症の教科書 — LDL・スタチン・食事療法』', q: '脂質異常症 高コレステロール LDL スタチン 本 食事' },
        { kind: 'supplement', label: 'EPA・DHA（青魚由来オメガ3・TG低下効果）', q: 'EPA DHA オメガ3 魚油 中性脂肪 サプリ 脂質' },
        { kind: 'supplement', label: '植物ステロール（LDLコレステロールの吸収抑制）', q: '植物ステロール フィトステロール LDL コレステロール サプリ' },
        { kind: 'book', label: '『コレステロールを下げる食事術 — 飽和脂肪酸・食物繊維・青魚』', q: 'コレステロール 下げる 食事 飽和脂肪 食物繊維 本' },
        { kind: 'device', label: '体重・体組成計（内臓脂肪・BMI管理でTG改善）', q: '体組成計 体重計 内臓脂肪 BMI スマート 連携' }
      ]
    },
    anemia: {
      title: '📚 貧血の管理に役立つリソース',
      items: [
        { kind: 'supplement', label: 'ヘム鉄サプリ（吸収率の高い動物性鉄・胃腸に優しい）', q: 'ヘム鉄 鉄 サプリ 貧血 吸収率 胃腸' },
        { kind: 'supplement', label: 'ビタミンC（非ヘム鉄の吸収率を2〜3倍に高める）', q: 'ビタミンC サプリ 鉄 吸収 貧血 天然' },
        { kind: 'book', label: '『鉄欠乏性貧血の完全ガイド — 食事・鉄剤・フェリチン管理』', q: '鉄欠乏性貧血 フェリチン 鉄剤 食事 本 ガイド' },
        { kind: 'supplement', label: '葉酸・B12複合サプリ（巨赤芽球性貧血・妊婦の貧血予防）', q: '葉酸 ビタミンB12 貧血 サプリ 妊婦 複合' },
        { kind: 'device', label: 'パルスオキシメーター（Hb低下時の末梢循環モニタリング）', q: 'パルスオキシメーター SpO2 血中酸素 貧血 家庭用' }
      ]
    },
    allergic_rhinitis: {
      title: '📚 アレルギー性鼻炎の管理に役立つリソース',
      items: [
        { kind: 'device', label: '空気清浄機（花粉・ハウスダスト除去・HEPAフィルター）', q: '空気清浄機 花粉 ハウスダスト HEPA フィルター 花粉症' },
        { kind: 'book', label: '『花粉症・アレルギー性鼻炎を根本から治す — 舌下免疫療法・食事・生活習慣』', q: '花粉症 アレルギー性鼻炎 舌下免疫療法 治す 本' },
        { kind: 'device', label: '医療用マスク（花粉シーズンの吸入量を70〜80%カット）', q: '花粉症 マスク 医療用 不織布 花粉 カット' },
        { kind: 'supplement', label: 'プロバイオティクス（腸内細菌叢とアレルギー反応調節）', q: 'プロバイオティクス 乳酸菌 アレルギー 花粉症 腸内 サプリ' },
        { kind: 'device', label: '布団クリーナー（ハウスダスト・ダニアレルゲン除去）', q: '布団クリーナー ダニ ハウスダスト アレルギー 除去' }
      ]
    },
    psoriasis: {
      title: '📚 乾癬の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『乾癬の完全ガイド — 生物学的製剤・外用療法・生活習慣』', q: '乾癬 生物学的製剤 外用療法 本 ガイド 尋常性' },
        { kind: 'supplement', label: '魚油・EPA（炎症抑制・乾癬のPASIスコア改善可能性）', q: 'EPA 魚油 オメガ3 乾癬 炎症 サプリ' },
        { kind: 'device', label: '家庭用ナローバンドUVBライト（皮疹の光線療法・医師相談の上で）', q: 'UVBライト 紫外線 皮膚 乾癬 光線療法 家庭用' },
        { kind: 'supplement', label: 'ビタミンD3（免疫調節・乾癬の炎症軽減の可能性）', q: 'ビタミンD3 サプリ 乾癬 免疫 炎症 皮膚' },
        { kind: 'book', label: '『自己免疫疾患と食事 — 乾癬・RAを食事療法でコントロール』', q: '自己免疫疾患 食事療法 乾癬 炎症 本' }
      ]
    },
    chronic_urticaria: {
      title: '📚 慢性蕁麻疹の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『慢性蕁麻疹の完全ガイド — 原因・治療・日常生活』', q: '慢性蕁麻疹 蕁麻疹 治療 本 ガイド' },
        { kind: 'supplement', label: 'クエルセチン（マスト細胞安定化・抗ヒスタミン作用）', q: 'クエルセチン サプリ マスト細胞 蕁麻疹 アレルギー' },
        { kind: 'supplement', label: 'プロバイオティクス（腸内細菌叢とアレルギー反応調節）', q: 'プロバイオティクス 乳酸菌 蕁麻疹 アレルギー 腸内' },
        { kind: 'device', label: '冷却スプレー・保冷グッズ（かゆみ・膨疹の一時的な緩和）', q: '冷却スプレー 保冷 かゆみ 蕁麻疹 肌 冷やす' },
        { kind: 'book', label: '『皮膚のかゆみ完全対策 — 蕁麻疹・アトピー・乾燥肌』', q: 'かゆみ 皮膚 蕁麻疹 アトピー 乾燥肌 本 対策' }
      ]
    },
    pms_pmdd: {
      title: '📚 PMS・PMDDの管理に役立つリソース',
      items: [
        { kind: 'book', label: '『PMS・PMDDを乗り越える完全ガイド — 月経前症候群のセルフケア』', q: 'PMS PMDD 月経前症候群 セルフケア 本 ガイド' },
        { kind: 'supplement', label: 'マグネシウム（PMS症状改善・むくみ・気分変動に効果的）', q: 'マグネシウム サプリ PMS 月経前 気分 むくみ' },
        { kind: 'supplement', label: 'ビタミンB6（黄体期の症状緩和・セロトニン合成補助）', q: 'ビタミンB6 サプリ PMS 月経 症状 セロトニン' },
        { kind: 'device', label: '基礎体温計（排卵日特定・月経周期トラッキング）', q: '基礎体温計 排卵 月経 周期 婦人科 デジタル' },
        { kind: 'book', label: '『女性のうつ・不安と月経 — ホルモン変動と心のコントロール』', q: 'PMS うつ 不安 月経 ホルモン 女性 本 心' }
      ]
    },
    overactive_bladder: {
      title: '📚 過活動膀胱の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『過活動膀胱・頻尿の完全ガイド — セルフケアと治療法』', q: '過活動膀胱 頻尿 OAB 治療 本 ガイド セルフケア' },
        { kind: 'device', label: '骨盤底筋トレーニング器具（ケーゲル体操補助デバイス）', q: '骨盤底筋 トレーニング 器具 ケーゲル 頻尿 尿漏れ' },
        { kind: 'supplement', label: 'カボチャ種子エキス（骨盤底筋・膀胱機能のサポートに研究あり）', q: 'カボチャ種子 エキス サプリ 頻尿 膀胱 骨盤底筋' },
        { kind: 'device', label: '尿漏れパッド（外出時の安心・薄型・目立たない設計）', q: '尿漏れ パッド 薄型 頻尿 尿失禁 女性 目立たない' },
        { kind: 'book', label: '『夜間頻尿 完全克服 — 睡眠と排尿コントロール』', q: '夜間頻尿 睡眠 排尿 克服 本 トイレ 夜中' }
      ]
    },
    tinnitus: {
      title: '📚 耳鳴りの管理に役立つリソース',
      items: [
        { kind: 'book', label: '『耳鳴り完全克服ガイド — TRT・CBT・サウンドセラピー』', q: '耳鳴り TRT CBT サウンドセラピー 本 ガイド' },
        { kind: 'device', label: 'ホワイトノイズマシン（就寝時・耳鳴りマスキング・睡眠改善）', q: 'ホワイトノイズ マシン 耳鳴り 睡眠 マスキング' },
        { kind: 'supplement', label: 'メコバラミン（末梢神経・聴覚神経保護・ビタミンB12活性型）', q: 'メコバラミン ビタミンB12 耳鳴り 難聴 神経 サプリ' },
        { kind: 'book', label: '『マインドフルネスで耳鳴りと向き合う — ACT・認知行動療法』', q: 'マインドフルネス 耳鳴り 認知行動療法 ACT 本' },
        { kind: 'device', label: '耳栓・防音イヤーマフ（騒音性難聴予防・耳鳴り悪化防止）', q: '耳栓 防音 イヤーマフ 騒音 難聴 耳鳴り 予防' }
      ]
    },
    vertigo: {
      title: '📚 めまいの管理に役立つリソース',
      items: [
        { kind: 'book', label: '『めまい完全ガイド — BPPV・メニエール病・前庭リハビリ』', q: 'めまい BPPV メニエール 前庭 リハビリ 本 ガイド' },
        { kind: 'supplement', label: 'ビタミンD3（BPPV再発予防・耳石再発リスク低下の研究あり）', q: 'ビタミンD3 サプリ めまい BPPV 耳石 再発 予防' },
        { kind: 'device', label: '転倒防止グッズ（めまい時の安全確保・手すり・滑り止め）', q: '転倒 防止 手すり 滑り止め めまい 安全 家庭' },
        { kind: 'book', label: '『メニエール病の減塩・食事療法完全ガイド』', q: 'メニエール病 減塩 食事 療法 本 ガイド 内リンパ' },
        { kind: 'supplement', label: 'マグネシウム（内耳血行・めまい・耳鳴り軽減の可能性）', q: 'マグネシウム サプリ めまい 耳鳴り 内耳 血行' }
      ]
    },
    dry_eye: {
      title: '📚 ドライアイの管理に役立つリソース',
      items: [
        { kind: 'book', label: '『ドライアイ完全ガイド — 点眼薬・温罨法・VDT対策』', q: 'ドライアイ 点眼 温罨法 VDT 治療 本 ガイド 眼科' },
        { kind: 'device', label: 'ホットアイマスク・蒸気アイマスク（マイボーム腺温罨法・毎日の習慣に）', q: 'ホットアイマスク 蒸気 ドライアイ マイボーム 温罨法' },
        { kind: 'device', label: '加湿器（オフィス・寝室・目の乾燥予防・湿度50〜60%維持）', q: '加湿器 卓上 オフィス 寝室 ドライアイ 乾燥 湿度' },
        { kind: 'device', label: 'PCメガネ・ブルーライトカット眼鏡（VDT眼精疲労軽減）', q: 'PCメガネ ブルーライト カット 眼鏡 眼精疲労 ドライアイ' },
        { kind: 'supplement', label: 'オメガ3（EPA/DHA・涙液脂質層改善・ドライアイ研究あり）', q: 'オメガ3 EPA DHA ドライアイ 涙 脂質 サプリ 目' }
      ]
    },
    chronic_prostatitis: {
      title: '📚 慢性前立腺炎の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『慢性前立腺炎・骨盤痛ガイド — CP/CPPSのセルフケアと治療』', q: '慢性前立腺炎 CP CPPS 骨盤痛 治療 本 ガイド セルフケア' },
        { kind: 'device', label: '座椅子・エルゴノミクスクッション（会陰部圧迫軽減・長時間座位対策）', q: 'クッション 座椅子 エルゴノミクス 前立腺 会陰 圧迫 軽減' },
        { kind: 'device', label: '温熱パッド・遠赤外線ヒーター（骨盤温熱療法・疼痛緩和）', q: '温熱 パッド 遠赤外線 骨盤 疼痛 温める 前立腺' },
        { kind: 'supplement', label: 'セレン・亜鉛（前立腺機能・酸化ストレス軽減のエビデンスあり）', q: 'セレン 亜鉛 前立腺 サプリ 酸化 ストレス 機能' },
        { kind: 'book', label: '『慢性疼痛の認知行動療法 — CBT・マインドフルネス実践』', q: '慢性疼痛 認知行動療法 CBT マインドフルネス 本 疼痛 管理' }
      ]
    },
    ulcerative_colitis: {
      title: '📚 潰瘍性大腸炎の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『潰瘍性大腸炎・クローン病 完全ガイド — 生物学的製剤と食事療法』', q: '潰瘍性大腸炎 クローン病 生物学的製剤 食事 療法 本 ガイド' },
        { kind: 'supplement', label: 'プロバイオティクス（腸内細菌叢改善・UC補助的管理の研究あり）', q: 'プロバイオティクス 腸内細菌 サプリ UC 潰瘍性大腸炎 腸内環境' },
        { kind: 'book', label: '『炎症性腸疾患（IBD）の食事療法 — 再燃期・寛解期の献立』', q: 'IBD 炎症性腸疾患 食事 療法 献立 本 再燃 寛解' },
        { kind: 'supplement', label: 'ビタミンD3（免疫調節・IBD炎症抑制のエビデンスあり）', q: 'ビタミンD3 サプリ 免疫 IBD 潰瘍性大腸炎 炎症 腸' },
        { kind: 'device', label: '携帯ウォシュレット（外出時の肌ケア・頻回排便時の肛門保護）', q: '携帯 ウォシュレット シャワートイレ 肛門 下痢 頻回排便 衛生' }
      ]
    },
    panic: {
      title: '📚 パニック障害の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『パニック障害 克服ワークブック — CBT・曝露療法・自分でできる認知行動療法』', q: 'パニック障害 克服 認知行動療法 CBT 曝露 ワークブック 本' },
        { kind: 'book', label: '『自律神経を整える呼吸法 — 腹式呼吸・迷走神経刺激・4-7-8呼吸』', q: '腹式呼吸 自律神経 迷走神経 呼吸法 本 パニック 不安' },
        { kind: 'device', label: '生体フィードバック機器（心拍変動HRV・呼吸訓練・自律神経モニタリング）', q: 'バイオフィードバック HRV 心拍 変動 自律神経 呼吸 訓練 デバイス' },
        { kind: 'supplement', label: 'マグネシウム L-スレオン酸塩（不安軽減・神経系サポートの研究あり）', q: 'マグネシウム L-スレオン酸 サプリ 不安 神経 パニック 睡眠' },
        { kind: 'book', label: '『マインドフルネスストレス低減法（MBSR） — パニック・不安に効く瞑想実践』', q: 'マインドフルネス MBSR ストレス 低減 本 不安 瞑想 パニック' }
      ]
    },
    ankylosing_spondylitis: {
      title: '📚 強直性脊椎炎の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『強直性脊椎炎（体軸性脊椎関節炎）完全ガイド — BASDAIと生物学的製剤』', q: '強直性脊椎炎 体軸性 脊椎関節炎 axSpA BASDAI 生物学的製剤 本' },
        { kind: 'device', label: '水中ウォーキング・水泳グッズ（脊椎の負荷を最小化しながら柔軟性維持）', q: '水中ウォーキング 水泳 グッズ 脊椎 関節 柔軟性 維持 浮輪' },
        { kind: 'device', label: 'エルゴノミクス枕・姿勢サポートクッション（脊椎の正常な湾曲を保持）', q: 'エルゴノミクス 枕 姿勢 サポート クッション 脊椎 腰痛 首 関節' },
        { kind: 'supplement', label: 'オメガ3（EPA/DHA・抗炎症・脊椎関節炎の炎症管理補助）', q: 'オメガ3 EPA DHA サプリ 抗炎症 関節 炎症 骨 強直性脊椎炎' },
        { kind: 'book', label: '『慢性炎症性疾患の運動療法 — リウマチ・脊椎疾患のリハビリ』', q: '慢性炎症 運動療法 リウマチ 脊椎 リハビリ 本 関節 疾患' }
      ]
    },
    hyperthyroidism: {
      title: '📚 甲状腺機能亢進症の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『バセドウ病・甲状腺機能亢進症 完全ガイド — チアマゾールと生活習慣』', q: 'バセドウ病 甲状腺 機能亢進症 チアマゾール 治療 本 ガイド' },
        { kind: 'device', label: '手首式血圧計・心拍数モニタリング（脈拍の日次管理・頻脈モニタリング）', q: '手首 血圧計 心拍 モニタリング 脈拍 頻脈 管理 デジタル' },
        { kind: 'supplement', label: 'セレン（Se・甲状腺自己免疫抑制・TRAb低下のエビデンスあり）', q: 'セレン サプリ 甲状腺 自己免疫 バセドウ TRAb 抗体' },
        { kind: 'device', label: 'UV保護サングラス（バセドウ眼症・眼球突出時の紫外線保護・ドライアイ対策）', q: 'UVサングラス 紫外線 保護 バセドウ眼症 眼球突出 目 防護' },
        { kind: 'book', label: '『甲状腺の病気 女性の健康 — バセドウ病・橋本病・甲状腺がん完全解説』', q: '甲状腺 女性 バセドウ病 橋本病 がん 完全解説 本 内分泌' }
      ]
    },
    narcolepsy: {
      title: '📚 ナルコレプシーの管理に役立つリソース',
      items: [
        { kind: 'book', label: '『ナルコレプシー・過眠症完全ガイド — 治療・職場・学校での対処法』', q: 'ナルコレプシー 過眠症 完全ガイド 治療 職場 学校 本' },
        { kind: 'device', label: 'アイマスク・遮光カーテン（計画仮眠の質向上・光環境整備）', q: 'アイマスク 遮光カーテン 仮眠 睡眠 質 向上 遮光 遮音' },
        { kind: 'device', label: '光目覚まし時計（光療法・起床補助・概日リズム調整）', q: '光 目覚まし 時計 光療法 起床 概日リズム 睡眠 過眠' },
        { kind: 'book', label: '『睡眠の科学 — ナルコレプシー・過眠・オレキシンと覚醒系』', q: '睡眠 科学 ナルコレプシー オレキシン 覚醒 本 睡眠医学' },
        { kind: 'supplement', label: 'カフェイン・L-チロシン（軽度過眠の補助・日中覚醒サポート）', q: 'カフェイン L-チロシン サプリ 覚醒 過眠 日中 眠気' }
      ]
    },
    osteoarthritis: {
      title: '📚 変形性関節症の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『変形性膝関節症 完全ガイド — 痛みのコントロールと運動療法』', q: '変形性膝関節症 完全ガイド 痛み コントロール 運動療法 本 OA' },
        { kind: 'device', label: '膝サポーター・関節サポート（日常活動・運動時の安定性向上）', q: '膝 サポーター 関節 サポート 変形性 膝関節症 OA 歩行' },
        { kind: 'supplement', label: 'グルコサミン・コンドロイチン（軟骨サポート・日本で広く使用）', q: 'グルコサミン コンドロイチン サプリ 軟骨 膝関節 OA 変形性' },
        { kind: 'device', label: '水中運動グッズ・ウォーターエクササイズ用品（関節への負荷最小・OAに推奨）', q: '水中 運動 グッズ ウォーター エクササイズ 膝 関節 負荷' },
        { kind: 'device', label: '歩数計・活動量計（歩行距離と疼痛の相関・体重管理の動機づけ）', q: '歩数計 活動量計 万歩計 歩行 運動 体重 管理 変形性 膝' }
      ]
    },
    sjogrens: {
      title: '📚 シェーグレン症候群の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『シェーグレン症候群 患者のためのガイド — 乾燥症状・疲労・リンパ腫リスク管理』', q: 'シェーグレン症候群 患者 ガイド 乾燥 疲労 本' },
        { kind: 'device', label: '人工唾液スプレー・口腔保湿ジェル（口腔乾燥・飲み込みにくさに対応）', q: '人工唾液 スプレー 口腔 保湿 ジェル ドライマウス シェーグレン' },
        { kind: 'device', label: 'ヒアルロン酸点眼液・ドライアイ専用目薬（眼乾燥・眼精疲労）', q: 'ヒアルロン酸 点眼 ドライアイ 目薬 乾燥 シェーグレン' },
        { kind: 'supplement', label: 'オメガ3系脂肪酸（EPA/DHA）サプリ（涙液の質改善・炎症抑制のエビデンス）', q: 'オメガ3 EPA DHA サプリ ドライアイ 涙液 炎症 シェーグレン' },
        { kind: 'device', label: '加湿器・デスクサイズ卓上加湿器（室内環境湿度50〜60%維持で乾燥症状緩和）', q: '加湿器 卓上 デスク 超音波 シェーグレン ドライアイ 乾燥 室内 湿度' }
      ]
    },
    atrial_fibrillation: {
      title: '📚 心房細動の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『心房細動 完全ガイド — DOAC・アブレーション・脳梗塞予防』', q: '心房細動 DOAC アブレーション 脳梗塞 予防 本 ガイド' },
        { kind: 'device', label: '家庭用心電図モニター・ポータブルECG（Kardia・心拍不整脈記録）', q: '家庭用 心電図 モニター ポータブル ECG 不整脈 心房細動 記録' },
        { kind: 'device', label: '血圧計・上腕式自動血圧計（心房細動患者の血圧管理は必須）', q: '血圧計 上腕式 自動 オムロン テルモ 心房細動 血圧 管理' },
        { kind: 'book', label: '『抗凝固療法の正しい使い方 — DOAC・ワーファリン患者向け解説』', q: '抗凝固薬 DOAC ワーファリン 患者 解説 本 心房細動' },
        { kind: 'device', label: 'スマートウォッチ・Apple Watch互換ECG対応ウェアラブル（日常的な心拍モニタリング）', q: 'スマートウォッチ ECG 心電図 心拍 モニタリング 不整脈 ウェアラブル' }
      ]
    },
    myasthenia: {
      title: '📚 重症筋無力症の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『重症筋無力症 患者ガイド — クリーゼ予防・服薬管理・日常生活の注意点』', q: '重症筋無力症 患者 ガイド 管理 本 神経内科' },
        { kind: 'device', label: '眼瞼下垂防止メガネ用特殊フレーム・眼瞼保持具（眼筋型MGの視機能補助）', q: '眼瞼下垂 メガネ フレーム 補助 重症筋無力症 眼筋型' },
        { kind: 'supplement', label: 'ビタミンD3サプリ（長期ステロイド使用による骨粗鬆症予防）', q: 'ビタミンD3 サプリ 骨粗鬆症 予防 ステロイド 長期 服用' },
        { kind: 'device', label: '嚥下補助食品・とろみ剤（嚥下障害・誤嚥リスク管理に）', q: '嚥下 補助 とろみ剤 誤嚥 予防 嚥下障害 食品' },
        { kind: 'book', label: '『筋無力症と上手に生きる — 体調記録と就労継続のヒント集』', q: '重症筋無力症 生活 就労 体調 記録 本 患者' }
      ]
    },
    pcos: {
      title: '📚 多嚢胞性卵巣症候群（PCOS）の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『PCOS 完全ガイド — インスリン抵抗性・排卵回復・不妊治療の最新情報』', q: 'PCOS 多嚢胞性卵巣症候群 完全ガイド インスリン 排卵 不妊 本' },
        { kind: 'device', label: '基礎体温計・スマート体温計（排卵周期の把握・不妊治療サポート）', q: '基礎体温計 スマート 体温計 排卵 周期 PCOS 不妊' },
        { kind: 'supplement', label: 'イノシトール（ミオイノシトール）サプリ（インスリン感受性改善・排卵回復のエビデンスあり）', q: 'イノシトール ミオイノシトール サプリ PCOS 排卵 インスリン 抵抗性' },
        { kind: 'device', label: '排卵検査薬（LHサージ検出・排卵タイミングの把握）', q: '排卵検査薬 LH PCOS 排卵 タイミング 不妊 検査' },
        { kind: 'book', label: '『低GI食実践レシピ — 血糖コントロールと体重管理の食事法（PCOS・糖尿病対応）』', q: '低GI 食事 レシピ 血糖 コントロール PCOS 糖尿病 体重 管理' }
      ]
    },
    als: {
      title: '📚 ALS（筋萎縮性側索硬化症）の療養・支援に役立つリソース',
      items: [
        { kind: 'book', label: '『ALSと生きる — 患者と家族のための完全ガイド』', q: 'ALS 筋萎縮性側索硬化症 患者 家族 ガイド 本' },
        { kind: 'device', label: 'AAC（拡大・代替コミュニケーション）入門デバイス', q: 'AAC コミュニケーション 視線入力 スイッチ 意思疎通 ALS' },
        { kind: 'device', label: 'とろみ剤・嚥下補助食品（嚥下障害・誤嚥予防）', q: '嚥下 補助 とろみ剤 誤嚥 予防 嚥下障害 食品' },
        { kind: 'supplement', label: '抗酸化サプリ（ビタミンE・CoQ10・クレアチン）', q: 'ビタミンE CoQ10 クレアチン 抗酸化 ALS サプリ' },
        { kind: 'book', label: '『難病支援制度の使い方 — 医療費助成・介護保険・障害者支援』', q: '難病 指定難病 医療費助成 介護保険 障害者支援 手続き 本' }
      ]
    },
    gerd: {
      title: '📚 逆流性食道炎（GERD）の改善に役立つリソース',
      items: [
        { kind: 'book', label: '『逆流性食道炎を治す本 — 食事・生活改善で症状を根本から改善』', q: '逆流性食道炎 治す 食事 生活改善 本' },
        { kind: 'device', label: '高さ調節可能まくら（頭部挙上・夜間逆流予防）', q: '枕 高さ調整 傾斜 逆流性食道炎 夜間 逆流' },
        { kind: 'supplement', label: 'プロバイオティクス（腸内環境改善・胃腸症状緩和）', q: 'プロバイオティクス 乳酸菌 胃腸 症状 緩和' },
        { kind: 'book', label: '『消化器疾患対応レシピ — 胃に優しい食事法』', q: '逆流性食道炎 レシピ 胃に優しい 食事法 消化器' }
      ]
    },
    nafld: {
      title: '📚 非アルコール性脂肪肝（NAFLD/MASLD）の改善に役立つリソース',
      items: [
        { kind: 'book', label: '『脂肪肝を改善する食事とライフスタイル — 地中海食実践ガイド』', q: '脂肪肝 改善 食事 ライフスタイル 地中海食 本' },
        { kind: 'supplement', label: 'ビタミンE（α-トコフェロール 400IU）— NASH改善エビデンスあり', q: 'ビタミンE 400IU トコフェロール サプリ 肝臓 NASH' },
        { kind: 'supplement', label: 'オメガ3脂肪酸（EPA/DHA 2000mg以上）— 中性脂肪低下', q: 'EPA DHA オメガ3 フィッシュオイル 中性脂肪 肝臓 サプリ' },
        { kind: 'book', label: '『肝臓がんを防ぐ — 脂肪肝・NASH・肝硬変の最新治療』', q: '脂肪肝 NASH 肝硬変 肝臓がん 予防 最新 治療 本' }
      ]
    },
    thyroid_hypo: {
      title: '📚 甲状腺機能低下症（橋本病）の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『甲状腺の病気がよくわかる本 — 橋本病・バセドウ病・甲状腺がん』', q: '甲状腺 橋本病 バセドウ病 わかる 本 患者' },
        { kind: 'supplement', label: 'セレン（セレノメチオニン 200μg）— 橋本病のTPO抗体低下に', q: 'セレン サプリ セレノメチオニン 甲状腺 橋本病 200' },
        { kind: 'supplement', label: '鉄・亜鉛・ビタミンD（甲状腺機能低下症で欠乏しやすい）', q: '鉄 亜鉛 ビタミンD 甲状腺 橋本病 サプリ 欠乏' },
        { kind: 'device', label: '体重計（BMI・体脂肪率管理、体重増加モニタリング）', q: '体重計 体脂肪 BMI スマート スケール' },
        { kind: 'book', label: '『グルテンフリー実践入門 — 橋本病・セリアック病合併対策』', q: 'グルテンフリー 橋本病 セリアック病 食事 本' }
      ]
    },
    celiac: {
      title: '📚 セリアック病・グルテン不耐症の食事管理に役立つリソース',
      items: [
        { kind: 'book', label: '『グルテンフリーの食事療法 — セリアック病・グルテン過敏症 完全ガイド』', q: 'グルテンフリー セリアック病 食事 完全ガイド 本' },
        { kind: 'book', label: '『グルテンフリーレシピ大全 — 米粉・そば粉・タピオカ粉で作る』', q: 'グルテンフリー レシピ 米粉 そば粉 タピオカ 料理本' },
        { kind: 'supplement', label: 'ビタミンD・カルシウム（グルテンフリー食で不足しがちな栄養素）', q: 'ビタミンD カルシウム サプリ グルテンフリー セリアック 栄養' },
        { kind: 'supplement', label: '鉄・葉酸・B12（腸絨毛萎縮による吸収不良を補う）', q: '鉄 葉酸 B12 ビタミン サプリ 吸収 補助' }
      ]
    },
    cancer_survivor: {
      title: '📚 がんサバイバーの体調回復に役立つリソース',
      items: [
        { kind: 'book', label: '『がん後を生きる — サバイバーシップケアの実践』', q: 'がんサバイバー 体調回復 術後 生活 本 患者 がん後' },
        { kind: 'book', label: '『がん治療中・治療後の食事とレシピ — 免疫力を高める抗がん食』', q: 'がん 治療後 食事 レシピ 免疫 抗がん 栄養 本' },
        { kind: 'supplement', label: 'プロテイン（たんぱく質補給・筋力維持）', q: 'プロテイン タンパク質 サプリ 高齢者 がん後 筋力' },
        { kind: 'device', label: '血中酸素・心拍モニタリング（セルフモニタリング）', q: 'パルスオキシメーター 心拍 モニター スマートウォッチ 健康管理' },
        { kind: 'book', label: '『がんのリハビリテーション — 治療後の体力回復と運動療法』', q: 'がん リハビリ 体力回復 運動 療法 術後 本' }
      ]
    },
    polymyalgia: {
      title: '📚 リウマチ性多発筋痛症（PMR）の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『リウマチ性多発筋痛症・巨細胞性動脈炎 — 診断と治療の実際』', q: 'リウマチ 多発筋痛症 PMR 巨細胞性動脈炎 診断 治療 本' },
        { kind: 'supplement', label: 'ビタミンD3＋K2（ステロイド長期使用時の骨保護）', q: 'ビタミンD3 K2 MK-7 サプリ 骨粗鬆症 予防 ステロイド' },
        { kind: 'supplement', label: 'カルシウム＋マグネシウム（骨密度維持）', q: 'カルシウム マグネシウム サプリ 骨密度 骨粗鬆症 高齢者' },
        { kind: 'device', label: '血圧計（ステロイド副作用のモニタリング）', q: '血圧計 上腕式 オムロン A&D ステロイド 高血圧' }
      ]
    },
    sibo: {
      title: '📚 SIBO（小腸内細菌増殖症）の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『SIBO――小腸内細菌増殖症 完全ガイド』', q: 'SIBO 小腸 細菌 増殖 腸内環境 腸活 本 ガイド' },
        { kind: 'supplement', label: 'プロバイオティクス（特定菌株 Lactobacillus/Bifidobacterium）', q: 'プロバイオティクス 乳酸菌 ビフィズス菌 SIBO 腸内フローラ サプリ' },
        { kind: 'supplement', label: 'プレバイオティクス・腸活サプリ（低FODMAP対応）', q: '腸活 サプリ FODMAP 消化 腸内環境 プレバイオティクス' },
        { kind: 'book', label: '『低FODMAP食レシピ — 過敏性腸症候群・SIBO 対応』', q: '低FODMAP 食事 レシピ IBS SIBO 過敏性腸症候群 本' }
      ]
    },
    dysautonomia: {
      title: '📚 自律神経障害の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『自律神経を整える — 副交感神経を高める生活習慣』', q: '自律神経 整える 副交感神経 本 生活習慣 乱れ' },
        { kind: 'device', label: 'HRVモニター（心拍変動で自律神経スコアを把握）', q: 'HRV 心拍変動 スマートウォッチ 自律神経 モニター ガーミン' },
        { kind: 'supplement', label: 'マグネシウム（神経過敏・筋緊張の緩和）', q: 'マグネシウム サプリ 神経 筋肉 緊張 緩和 グリシン酸' },
        { kind: 'device', label: '塩分補給サポート（起立性低血圧対策）', q: '経口補水液 塩分 タブレット 低血圧 起立性 POTS 対策' }
      ]
    },
    metabolic_syndrome: {
      title: '📚 メタボリックシンドロームの管理に役立つリソース',
      items: [
        { kind: 'book', label: '『メタボ解消 — 内臓脂肪を落とす食事と運動の科学』', q: 'メタボ 内臓脂肪 食事 運動 解消 本 ダイエット 科学' },
        { kind: 'device', label: '体組成計（内臓脂肪レベル・体脂肪率の継続測定）', q: '体組成計 内臓脂肪 体脂肪 タニタ オムロン スマート体重計' },
        { kind: 'supplement', label: 'ベルベリン（血糖・脂質代謝サポート）', q: 'ベルベリン サプリ 血糖値 コレステロール 中性脂肪 代謝' },
        { kind: 'book', label: '『糖質制限・低GI食の実践 — 血糖値スパイクを防ぐ』', q: '糖質制限 低GI 血糖値 スパイク 食事 レシピ ダイエット 本' },
        { kind: 'device', label: '血糖測定器（食後血糖の自己管理）', q: '血糖測定器 血糖計 家庭用 自己血糖 CGM 連続血糖' }
      ]
    },
    chemo_side: {
      title: '📚 化学療法副作用の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『がん患者の副作用対策 — 吐き気・疲労・口内炎の乗り越え方』', q: 'がん 抗がん剤 副作用 吐き気 口内炎 疲労 本 患者' },
        { kind: 'supplement', label: '生姜（ジンジャー）サプリ（抗CINV・抗炎症）', q: 'ジンジャー 生姜 サプリ 吐き気 CINV 抗炎症' },
        { kind: 'device', label: 'パルスオキシメーター（SpO2・心拍の自己管理）', q: 'パルスオキシメーター SpO2 酸素飽和度 心拍 家庭用' },
        { kind: 'book', label: '『がん治療中の食事レシピ — 食べられる日も食べられない日も』', q: 'がん 治療中 食事 レシピ 吐き気 口内炎 栄養 本' },
        { kind: 'supplement', label: 'グルタミン（腸粘膜・口腔粘膜保護）', q: 'グルタミン サプリ 腸 粘膜 口内炎 がん 治療' }
      ]
    },
    pulmonary_fibrosis: {
      title: '📚 肺線維症・間質性肺疾患の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『肺線維症・間質性肺炎 — 患者・家族のための完全ガイド』', q: '肺線維症 間質性肺炎 IPF 患者 家族 ガイド 本' },
        { kind: 'device', label: 'パルスオキシメーター（SpO2の毎日のモニタリング）', q: 'パルスオキシメーター SpO2 酸素 在宅 肺疾患 連続測定' },
        { kind: 'device', label: '携帯酸素ボンベ用バッグ（外出・旅行用）', q: '携帯酸素 酸素ボンベ バッグ 外出 HOT 在宅酸素' },
        { kind: 'book', label: '『呼吸リハビリテーション — COPD・間質性肺炎のための運動療法』', q: '呼吸リハビリ COPD 間質性肺炎 運動療法 本 肺 リハビリ' }
      ]
    },
    dissociative: {
      title: '📚 解離性障害の理解と回復に役立つリソース',
      items: [
        { kind: 'book', label: '『身体はトラウマを記録する』ベッセル・ヴァン・デア・コーク', q: '身体はトラウマを記録する ヴァン デア コーク' },
        { kind: 'book', label: '『解離性同一性障害（DID）をもつ人への支援』', q: 'DID 解離性同一性障害 支援 本 複数人格' },
        { kind: 'book', label: '『内的家族システム（IFS）— トラウマを癒すセラピー』', q: 'IFS 内的家族システム トラウマ セラピー 本 解離' },
        { kind: 'supplement', label: 'マグネシウム（神経緊張・睡眠サポート）', q: 'マグネシウム グリシン酸 サプリ 神経 睡眠 緊張' }
      ]
    },
    raynauds: {
      title: '📚 レイノー症候群の管理に役立つリソース',
      items: [
        { kind: 'book', label: '『レイノー現象・強皮症 — 専門家による診療と生活ガイド』', q: 'レイノー 強皮症 症状 治療 生活 本' },
        { kind: 'device', label: '防寒手袋（防水・防風・保温素材）', q: '防寒手袋 防水 防風 保温 ウィンター グローブ 指先 血行' },
        { kind: 'device', label: 'USB ヒーター手袋・ハンドウォーマー', q: 'USB ヒーター 手袋 ハンドウォーマー 電熱 指先 保温' },
        { kind: 'supplement', label: 'オメガ3 EPA（血流改善・抗炎症）', q: 'オメガ3 EPA DHA 血流 改善 抗炎症 サプリ フィッシュオイル' }
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
