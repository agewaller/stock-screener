#!/usr/bin/env node
/**
 * 疾患別 OG 画像（SVG）を一括生成する
 *
 * Usage: node scripts/gen-og-images.mjs
 *
 * - og/ ディレクトリに disease-specific SVG を生成
 * - 各 *.html の og:image を正しい SVG に書き換え
 * - 既存の og/*.svg は上書きしない（--force で上書き）
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const FORCE = process.argv.includes('--force');

// disease id → { name, icd, japan, world, japanLabel, worldLabel }
const DISEASE_INFO = {
  adhd:                { name: 'ADHD', icd: '6A05', japanLabel: '約 320 万人', worldLabel: '約 3.6 億人' },
  allergic_rhinitis:   { name: 'アレルギー性鼻炎・花粉症', icd: 'CA08', japanLabel: '約 4,200 万人', worldLabel: '約 10 億人' },
  alzheimers:          { name: 'アルツハイマー病', icd: '8A20', japanLabel: '約 700 万人', worldLabel: '約 5,500 万人' },
  anemia:              { name: '鉄欠乏性貧血', icd: 'D50', japanLabel: '約 1,500 万人', worldLabel: '約 20 億人' },
  ankylosing_spondylitis: { name: '強直性脊椎炎', icd: 'FA92', japanLabel: '約 10 万人', worldLabel: '約 2,400 万人' },
  anorexia:            { name: '摂食障害', icd: '6B8', japanLabel: '約 30 万人', worldLabel: '約 7,000 万人' },
  asd:                 { name: '自閉スペクトラム症', icd: '6A02', japanLabel: '約 100 万人', worldLabel: '約 7,700 万人' },
  asthma:              { name: '気管支喘息', icd: 'CA23', japanLabel: '約 1,000 万人', worldLabel: '約 2.6 億人' },
  atopy:               { name: 'アトピー性皮膚炎', icd: 'EA80', japanLabel: '約 250 万人', worldLabel: '約 2.3 億人' },
  atrial_fibrillation: { name: '心房細動', icd: 'I48', japanLabel: '約 100〜170 万人', worldLabel: '約 5,250 万人' },
  bipolar:             { name: '双極性障害', icd: '6A60', japanLabel: '約 50〜100 万人', worldLabel: '約 3,700 万人' },
  burnout:             { name: 'バーンアウト', icd: 'QD85', japanLabel: '推計 数百万人', worldLabel: '世界的拡大中' },
  cancer_fatigue:      { name: 'がん関連疲労', icd: 'MG22', japanLabel: '約 100 万人以上', worldLabel: '全がん患者の 70-80%' },
  chronic_pain:        { name: '慢性疼痛症候群', icd: 'MG30', japanLabel: '約 2,200 万人', worldLabel: '約 15 億人' },
  chronic_prostatitis: { name: '慢性前立腺炎', icd: 'N41.1', japanLabel: '約 80 万人（推計）', worldLabel: '成人男性の 8-16%' },
  chronic_urticaria:   { name: '慢性蕁麻疹', icd: 'L50.1', japanLabel: '約 150 万人', worldLabel: '約 7,500 万人' },
  ckd:                 { name: '慢性腎臓病', icd: 'GB61', japanLabel: '約 1,330 万人', worldLabel: '約 8 億人' },
  copd:                { name: 'COPD', icd: 'CA22', japanLabel: '約 530 万人', worldLabel: '約 3.9 億人' },
  crohns:              { name: 'クローン病', icd: 'DD70', japanLabel: '約 7 万人', worldLabel: '約 700 万人' },
  depression:          { name: 'うつ病', icd: '6A70', japanLabel: '約 500 万人', worldLabel: '約 2.8 億人' },
  diabetes:            { name: '2型糖尿病', icd: '5A11', japanLabel: '約 1,000 万人', worldLabel: '約 5.4 億人' },
  dry_eye:             { name: 'ドライアイ', icd: 'H04.1', japanLabel: '約 2,200 万人', worldLabel: '約 3.4 億人' },
  endometriosis:       { name: '子宮内膜症', icd: 'GA10', japanLabel: '約 100 万人', worldLabel: '約 1.9 億人' },
  epilepsy:            { name: 'てんかん', icd: '8A6', japanLabel: '約 100 万人', worldLabel: '約 5,000 万人' },
  gad:                 { name: '全般性不安障害', icd: '6B00', japanLabel: '約 200 万人', worldLabel: '約 2.6 億人' },
  gout:                { name: '痛風・高尿酸血症', icd: 'FA25', japanLabel: '約 125 万人', worldLabel: '約 4,100 万人' },
  hashimoto:           { name: '橋本病', icd: '5A00.1', japanLabel: '約 600 万人', worldLabel: '約 2 億人' },
  heart_failure:       { name: '心不全', icd: 'BD10', japanLabel: '約 120 万人', worldLabel: '約 6,400 万人' },
  hyperlipidemia:      { name: '脂質異常症', icd: 'E78', japanLabel: '約 2,200 万人', worldLabel: '約 11 億人' },
  hypertension:        { name: '高血圧症', icd: 'BA00', japanLabel: '約 4,300 万人', worldLabel: '約 12.8 億人' },
  hyperthyroidism:     { name: '甲状腺機能亢進症', icd: '5A02', japanLabel: '約 200 万人', worldLabel: '約 2 億人' },
  ibs:                 { name: '過敏性腸症候群', icd: 'DD91', japanLabel: '約 1,200 万人', worldLabel: '約 4 億人' },
  insomnia:            { name: '不眠障害', icd: '7A00', japanLabel: '約 2,000 万人', worldLabel: '約 9 億 7,000 万人' },
  liver_disease:       { name: '慢性肝疾患・肝硬変', icd: 'DB92', japanLabel: '約 300 万人（推計）', worldLabel: '約 15 億人' },
  menopause:           { name: '更年期障害', icd: 'GA31', japanLabel: '約 1,400 万人', worldLabel: '約 10 億人' },
  migraine:            { name: '片頭痛', icd: '8A80', japanLabel: '約 840 万人', worldLabel: '約 10 億人' },
  ms:                  { name: '多発性硬化症', icd: '8A40', japanLabel: '約 1.8 万人', worldLabel: '約 280 万人' },
  myasthenia:          { name: '重症筋無力症', icd: '8C60', japanLabel: '約 2.4 万人', worldLabel: '約 70 万人' },
  narcolepsy:          { name: 'ナルコレプシー', icd: 'G47.4', japanLabel: '約 2 万人', worldLabel: '約 300 万人' },
  ocd:                 { name: '強迫性障害', icd: '6B20', japanLabel: '約 200 万人', worldLabel: '約 1 億人' },
  osteoarthritis:      { name: '変形性関節症', icd: 'M15', japanLabel: '約 2,500 万人', worldLabel: '約 5.3 億人' },
  osteoporosis:        { name: '骨粗鬆症', icd: 'FB83', japanLabel: '約 1,280 万人', worldLabel: '約 2 億人' },
  overactive_bladder:  { name: '過活動膀胱', icd: 'MF44', japanLabel: '約 1,080 万人', worldLabel: '約 5 億人' },
  panic:               { name: 'パニック障害', icd: 'F41.0', japanLabel: '約 200 万人', worldLabel: '約 2 億人' },
  parkinsons:          { name: 'パーキンソン病', icd: '8A00', japanLabel: '約 20 万人', worldLabel: '約 850 万人' },
  pcos:                { name: '多嚢胞性卵巣症候群', icd: 'GA30', japanLabel: '約 200 万人', worldLabel: '約 1.3 億人' },
  pms_pmdd:            { name: 'PMS・PMDD', icd: 'GA34', japanLabel: '約 2,200 万人', worldLabel: '月経女性の 70-80%' },
  psoriasis:           { name: '乾癬', icd: 'EA90', japanLabel: '約 43〜50 万人', worldLabel: '約 1.25 億人' },
  ptsd:                { name: 'PTSD', icd: '6B40', japanLabel: '約 100 万人', worldLabel: '約 3 億人' },
  ra:                  { name: '関節リウマチ', icd: 'FA20', japanLabel: '約 70 万人', worldLabel: '約 1,790 万人' },
  sad:                 { name: '社会不安障害', icd: '6B04', japanLabel: '約 200 万人', worldLabel: '約 4 億人' },
  schizophrenia:       { name: '統合失調症', icd: '6A20', japanLabel: '約 80 万人', worldLabel: '約 2,400 万人' },
  sjogrens:            { name: 'シェーグレン症候群', icd: '4A42', japanLabel: '約 68 万人', worldLabel: '約 460 万人' },
  sle:                 { name: '全身性エリテマトーデス', icd: '4A40', japanLabel: '約 6 万人', worldLabel: '約 500 万人' },
  sleep_apnea:         { name: '睡眠時無呼吸症候群', icd: '7A40', japanLabel: '約 900 万人', worldLabel: '約 9 億人' },
  thyroid_cancer:      { name: '甲状腺がん', icd: '02', japanLabel: '年間約 2 万人', worldLabel: '約 70 万人（年間）' },
  tinnitus:            { name: '耳鳴り・難聴', icd: 'H93.1', japanLabel: '約 300 万人', worldLabel: '約 7.5 億人' },
  ulcerative_colitis:  { name: '潰瘍性大腸炎', icd: 'K51', japanLabel: '約 22 万人', worldLabel: '約 500 万人' },
  vertigo:             { name: 'めまい・メニエール病', icd: 'H81', japanLabel: '約 150 万人', worldLabel: '約 1.5 億人' },
};

function generateSVG(id, info) {
  const { name, icd, japanLabel, worldLabel } = info;
  const url = `cares.advisers.jp/${id}.html`;
  // Use a slightly different accent color per disease based on hash
  const colors = ['#6366f1', '#3b82f6', '#0891b2', '#0d9488', '#16a34a', '#7c3aed', '#9333ea', '#c026d3'];
  const colorIdx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const accent = colors[colorIdx];

  // Truncate name for display
  const displayName = name.length > 12 ? name.substring(0, 12) + '…' : name;
  const fontSize = name.length <= 8 ? 84 : name.length <= 12 ? 66 : 52;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eef2ff"/>
      <stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>
  <g transform="translate(80,90)">
    <text x="0" y="0" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="22" font-weight="700" fill="${accent}" letter-spacing="2">健康日記  HEALTH DIARY</text>
    <text x="0" y="100" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="${fontSize}" font-weight="900" fill="#1e1b4b">${name}</text>
    <text x="0" y="${100 + fontSize + 10}" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="22" font-weight="600" fill="#64748b">症状記録・経過管理・AI 分析</text>
  </g>
  <g transform="translate(80,380)">
    <rect x="0" y="0" width="520" height="80" rx="12" fill="#fff" opacity="0.85"/>
    <text x="20" y="36" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="16" fill="#64748b">患者数</text>
    <text x="20" y="64" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="20" font-weight="700" fill="#1e1b4b">日本 ${japanLabel} / 世界 ${worldLabel}</text>
    <rect x="540" y="0" width="280" height="80" rx="12" fill="#fff" opacity="0.85"/>
    <text x="560" y="36" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="16" fill="#64748b">分類</text>
    <text x="560" y="64" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="22" font-weight="700" fill="#1e1b4b">ICD  ${icd}</text>
  </g>
  <g transform="translate(80,510)">
    <text x="0" y="28" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="22" font-weight="700" fill="#1e1b4b">📝  完全無料  ・  広告なし  ・  AI 分析</text>
    <text x="0" y="62" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="20" font-weight="600" fill="${accent}">${url}</text>
  </g>
</svg>`;
}

let generated = 0;
let skipped = 0;
const htmlUpdates = [];

for (const [id, info] of Object.entries(DISEASE_INFO)) {
  const svgPath = resolve(ROOT, 'og', `${id}.svg`);
  const htmlPath = resolve(ROOT, `${id}.html`);

  // Generate SVG
  if (!existsSync(svgPath) || FORCE) {
    writeFileSync(svgPath, generateSVG(id, info), 'utf8');
    generated++;
    console.log(`Generated: og/${id}.svg`);
  } else {
    skipped++;
  }

  // Update HTML og:image if it uses depression.svg
  if (existsSync(htmlPath)) {
    let html = readFileSync(htmlPath, 'utf8');
    if (html.includes('og/depression.svg') || (id !== 'me-cfs' && id !== 'long-covid' && html.includes(`og/${id}.svg`))) {
      const ogImgOld = /(<meta property="og:image" content="https:\/\/cares\.advisers\.jp\/og\/)([^"]+)(")/;
      if (ogImgOld.test(html)) {
        const newHtml = html.replace(ogImgOld, `$1${id}.svg$3`);
        if (newHtml !== html) {
          writeFileSync(htmlPath, newHtml, 'utf8');
          htmlUpdates.push(id);
          console.log(`Updated: ${id}.html → og/${id}.svg`);
        }
      }
    }
  }
}

console.log(`\nDone: ${generated} SVGs generated, ${skipped} skipped, ${htmlUpdates.length} HTML files updated.`);
