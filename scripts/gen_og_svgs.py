#!/usr/bin/env python3
"""
Generate OG SVG images for all disease LPs that currently use the generic
depression.svg placeholder. Also updates the HTML <meta og:image> references.
"""

import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OG_DIR = os.path.join(BASE, 'og')

# (slug, disease_label, stat_text)
DISEASES = [
    ('adhd', 'ADHD', '成人の 2.5-4%'),
    ('allergic_rhinitis', 'アレルギー性鼻炎', '約 4,200 万人'),
    ('alzheimers', 'アルツハイマー病', '日本 約 600 万人'),
    ('anemia', '貧血', '世界で約 20 億人'),
    ('ankylosing_spondylitis', '強直性脊椎炎', '国内 約 5 万人'),
    ('anorexia', '摂食障害', '若い女性の約 1〜3%'),
    ('asd', '自閉スペクトラム症', '日本 約 125 万人'),
    ('asthma', '気管支喘息', '国内 約 850 万人'),
    ('atopy', 'アトピー性皮膚炎', '国内 約 450 万人'),
    ('atrial_fibrillation', '心房細動', '国内 約 100 万人'),
    ('bipolar', '双極性障害', '生涯有病率 2-4%'),
    ('burnout', 'バーンアウト症候群', '就労者の 5〜10%'),
    ('cancer_fatigue', 'がん治療副作用・倦怠感', '患者の 70〜100%'),
    ('chronic_pain', '慢性疼痛症候群', '国内 約 2,300 万人'),
    ('chronic_prostatitis', '慢性前立腺炎', '男性の 5〜10%'),
    ('chronic_urticaria', '慢性蕁麻疹', '国内 約 150 万人'),
    ('ckd', '慢性腎臓病（CKD）', '国内 約 1,330 万人'),
    ('copd', 'COPD', '国内 約 530 万人'),
    ('crohns', 'クローン病', '国内 約 7 万人'),
    ('depression', 'うつ病', '国内 約 172 万人'),
    ('diabetes', '2 型糖尿病', '国内 約 1,000 万人'),
    ('dry_eye', 'ドライアイ', '国内 約 2,200 万人'),
    ('endometriosis', '子宮内膜症', '20〜40 代女性の約 10%'),
    ('epilepsy', 'てんかん', '国内 約 100 万人'),
    ('gad', '全般性不安障害（GAD）', '有病率 3〜6%'),
    ('gout', '痛風・高尿酸血症', '国内 約 100 万人'),
    ('heart_failure', '心不全', '国内 約 120 万人'),
    ('hyperlipidemia', '脂質異常症', '国内 約 2,200 万人'),
    ('hypertension', '高血圧', '国内 約 4,300 万人'),
    ('hyperthyroidism', '甲状腺機能亢進症', '国内 約 60〜100 万人'),
    ('liver_disease', '慢性肝疾患・肝硬変', '国内 約 200 万人'),
    ('menopause', '更年期障害', '45〜55 歳女性の 70〜80%'),
    ('migraine', '片頭痛', '国内 約 840 万人'),
    ('ms', '多発性硬化症（MS）', '国内 約 15〜20 万人'),
    ('myasthenia', '重症筋無力症', '国内 約 2.3 万人'),
    ('ocd', '強迫性障害（OCD）', '国内 約 200 万人'),
    ('osteoarthritis', '変形性関節症', '国内 約 2,530 万人'),
    ('osteoporosis', '骨粗鬆症', '国内 約 1,280 万人'),
    ('overactive_bladder', '過活動膀胱', '国内 約 1,080 万人'),
    ('panic', 'パニック障害', '人口の 1〜2%'),
    ('parkinsons', 'パーキンソン病', '国内 約 15〜20 万人'),
    ('pcos', '多嚢胞性卵巣症候群', '女性の約 10〜15%'),
    ('pms_pmdd', '月経前症候群（PMS）', '月経のある女性の 70〜80%'),
    ('psoriasis', '乾癬', '国内 約 43 万人'),
    ('ptsd', 'PTSD', '生涯有病率 5〜10%'),
    ('ra', '関節リウマチ', '国内 約 70 万人'),
    ('sad', '社会不安障害（SAD）', '生涯有病率 約 13%'),
    ('schizophrenia', '統合失調症', '国内 約 80 万人'),
    ('sjogrens', 'シェーグレン症候群', '国内 約 7 万人'),
    ('sle', '全身性エリテマトーデス', '国内 約 10 万人'),
    ('sleep_apnea', '睡眠時無呼吸症候群', '国内 約 900 万人'),
    ('thyroid_cancer', '甲状腺がん', '年間 約 2 万人新規'),
    ('tinnitus', '耳鳴り', '国内 約 3,000 万人'),
    ('ulcerative_colitis', '潰瘍性大腸炎', '国内 約 23 万人'),
    ('vertigo', 'めまい・BPPV', '受診理由 第 3 位'),
]

SVG_TEMPLATE = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eef2ff"/>
      <stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>
  <g transform="translate(80,90)">
    <text x="0" y="0" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="22" font-weight="700" fill="#6366f1" letter-spacing="2">健康日記  HEALTH DIARY</text>
    <text x="0" y="100" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="{title_size}" font-weight="900" fill="#1e1b4b">{disease}</text>
    <text x="0" y="200" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="24" font-weight="600" fill="#64748b">症状・治療・記録を当事者向けにまとめた完全ガイド</text>
  </g>
  <g transform="translate(80,380)">
    <rect x="0" y="0" width="380" height="80" rx="12" fill="#fff" opacity="0.85"/>
    <text x="20" y="36" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="16" fill="#64748b">患者数</text>
    <text x="20" y="64" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="{stat_size}" font-weight="700" fill="#1e1b4b">{stat}</text>
  </g>
  <g transform="translate(80,510)">
    <text x="0" y="28" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="22" font-weight="700" fill="#1e1b4b">📝  完全無料  ・  広告なし  ・  AI 分析</text>
    <text x="0" y="62" font-family="-apple-system, Hiragino Sans, Noto Sans JP, sans-serif" font-size="20" font-weight="600" fill="#6366f1">cares.advisers.jp/{slug}.html</text>
  </g>
</svg>'''


def xml_escape(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&apos;')


def generate_svg(slug, disease, stat):
    # Adjust font sizes based on length
    title_size = 84 if len(disease) <= 8 else (72 if len(disease) <= 12 else 60)
    stat_size = 22 if len(stat) <= 14 else 18

    svg = SVG_TEMPLATE.format(
        slug=xml_escape(slug),
        disease=xml_escape(disease),
        stat=xml_escape(stat),
        title_size=title_size,
        stat_size=stat_size,
    )
    return svg


def update_html(slug):
    html_path = os.path.join(BASE, f'{slug}.html')
    if not os.path.exists(html_path):
        print(f'  SKIP: {html_path} not found')
        return
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_img_url = f'https://cares.advisers.jp/og/{slug}.svg'
    # Replace og:image and twitter:image pointing to depression.svg
    old_img = 'https://cares.advisers.jp/og/depression.svg'
    if old_img not in content:
        print(f'  SKIP: {slug}.html already updated or uses different image')
        return
    content = content.replace(old_img, new_img_url)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  updated: {slug}.html → og/{slug}.svg')


def main():
    os.makedirs(OG_DIR, exist_ok=True)
    for slug, disease, stat in DISEASES:
        svg = generate_svg(slug, disease, stat)
        out_path = os.path.join(OG_DIR, f'{slug}.svg')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(svg)
        print(f'created: og/{slug}.svg')
        update_html(slug)

    print(f'\nDone: {len(DISEASES)} SVGs generated.')


if __name__ == '__main__':
    main()
