/**
 * Cloudflare Worker — Research Auto-Updater
 * #7 + #16: PubMed 最新研究を自動取得、Claude で要約、KV に保存。
 * anthropic-proxy Worker が KV から読んでプロンプトに注入。
 *
 * Cron: 毎週日曜 03:00 UTC (日本時間 月曜 12:00)
 * wrangler.research-updater.toml で [triggers] crons を設定
 *
 * env:
 *   RESEARCH_KV    — KV namespace binding (shared with anthropic-proxy)
 *   ANTHROPIC_API_KEY — Claude API key for synthesis
 */

const DISEASE_QUERIES = {
  mecfs: 'ME/CFS OR "chronic fatigue syndrome" OR "myalgic encephalomyelitis"',
  long_covid: '"long COVID" OR "post-COVID" OR "PASC"',
  fibromyalgia: 'fibromyalgia',
  depression: '"major depressive disorder" OR "treatment-resistant depression"',
  pots: '"postural orthostatic tachycardia" OR POTS',
  bipolar: '"bipolar disorder"',
  ptsd: 'PTSD OR "post-traumatic stress"',
  adhd: 'ADHD OR "attention deficit"',
  diabetes_t2: '"type 2 diabetes" OR "GLP-1" OR "SGLT2"',
  autoimmune: '"systemic lupus" OR "rheumatoid arthritis" OR "Sjogren"',
  ibs: '"irritable bowel syndrome" OR IBS',
  thyroid: '"Hashimoto" OR "hypothyroidism" OR "Graves disease"',
  insomnia: '"insomnia" OR "sleep disorder"',
};

async function searchPubMed(query, days = 30, max = 10) {
  const term = encodeURIComponent(query + ` AND ("last ${days} days"[dp])`);
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmax=${max}&sort=relevance&retmode=json`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return [];
  const searchData = await searchRes.json();
  const ids = searchData?.esearchresult?.idlist || [];
  if (ids.length === 0) return [];

  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const summaryRes = await fetch(summaryUrl);
  if (!summaryRes.ok) return [];
  const summaryData = await summaryRes.json();

  return ids.map(id => {
    const a = summaryData?.result?.[id];
    if (!a) return null;
    return {
      pmid: id,
      title: a.title || '',
      authors: (a.authors || []).slice(0, 3).map(au => au.name).join(', '),
      journal: a.source || '',
      date: a.pubdate || '',
    };
  }).filter(Boolean);
}

async function synthesizeResearch(articles, diseaseId, apiKey) {
  if (!articles.length) return null;
  const articlesText = articles.map((a, i) =>
    `${i + 1}. ${a.title} (${a.authors}, ${a.journal}, ${a.date}) PMID:${a.pmid}`
  ).join('\n');

  const prompt = `以下は ${diseaseId} に関する最新の PubMed 論文リストです。
これらを日本語で簡潔に要約し、臨床的に重要な発見を箇条書きで整理してください。
各項目は50文字以内で。最大10項目。

論文リスト:
${articlesText}

JSON形式で出力（前後の説明なし）:
{ "highlights": ["発見1", "発見2", ...], "updatedAt": "${new Date().toISOString().split('T')[0]}" }`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.content?.[0]?.text || '';
  try {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

export default {
  async scheduled(event, env, ctx) {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey || !env.RESEARCH_KV) {
      console.warn('[research-updater] missing ANTHROPIC_API_KEY or RESEARCH_KV binding');
      return;
    }

    console.log('[research-updater] starting weekly update');
    const results = {};

    for (const [diseaseId, query] of Object.entries(DISEASE_QUERIES)) {
      try {
        const articles = await searchPubMed(query, 30, 10);
        if (articles.length === 0) continue;

        const summary = await synthesizeResearch(articles, diseaseId, apiKey);
        if (summary) {
          summary.articleCount = articles.length;
          summary.articles = articles.slice(0, 5);
          results[diseaseId] = summary;
          await env.RESEARCH_KV.put(`research:${diseaseId}`, JSON.stringify(summary));
        }

        // Rate limit: 1 request per 2 seconds
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.warn(`[research-updater] ${diseaseId} failed:`, e.message);
      }
    }

    // Store metadata
    await env.RESEARCH_KV.put('research:_meta', JSON.stringify({
      lastRun: new Date().toISOString(),
      diseasesUpdated: Object.keys(results).length,
      totalArticles: Object.values(results).reduce((s, r) => s + (r.articleCount || 0), 0),
    }));

    console.log('[research-updater] completed:', Object.keys(results).length, 'diseases updated');
  },

  // HTTP endpoint to manually trigger or check status
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/status') {
      const meta = await env.RESEARCH_KV?.get('research:_meta');
      return new Response(meta || '{"lastRun": null}', {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/trigger' && request.method === 'POST') {
      await this.scheduled(null, env, null);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Research Updater Worker', { status: 200 });
  },
};
