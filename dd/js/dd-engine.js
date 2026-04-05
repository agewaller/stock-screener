/* ============================================
   DD Engine - AI Analysis Engine (Multi-Model)
   ============================================ */

const DDEngine = {
  _abortController: null,
  _isAnalyzing: false,

  isAnalyzing() { return this._isAnalyzing; },

  abort() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
      this._isAnalyzing = false;
    }
  },

  // Main analysis function
  async analyze(companyName, promptId, options = {}) {
    if (this._isAnalyzing) {
      DDApp.showToast('Analysis already in progress', 'info');
      return null;
    }

    const modelId = options.model || DDStore.get('selectedModel');
    const model = DDConfig.aiModels.find(m => m.id === modelId);
    if (!model) {
      DDApp.showToast('Invalid model selected', 'error');
      return null;
    }

    const apiKey = DDStore.getApiKey(model.provider);
    if (!apiKey) {
      DDApp.showToast(`Please set your ${model.provider} API key in Settings`, 'error');
      DDApp.navigate('settings');
      return null;
    }

    // Get prompt
    const prompt = DDStore.getPrompt(promptId);
    if (!prompt || !prompt.content) {
      DDApp.showToast('Prompt is empty. Please configure it in Admin.', 'error');
      return null;
    }

    // Build the full prompt
    const outputLang = options.outputLang || DDStore.get('outputLang') || 'ja';
    const langInstruction = outputLang !== 'ja'
      ? `\n\nIMPORTANT: Output the entire report in ${this._getLangName(outputLang)}. All text, analysis, and conclusions must be in ${this._getLangName(outputLang)}.`
      : '';

    const now = new Date().toISOString().slice(0, 10);
    let fullPrompt = prompt.content;

    // Replace template variables
    fullPrompt = fullPrompt.replace(/<会社名\/ティッカー\/国\/取引所>/g, companyName);
    fullPrompt = fullPrompt.replace(/<YYYY-MM-DD>/g, now);
    fullPrompt = fullPrompt.replace(/<任意>/g, options.context || '');
    fullPrompt = fullPrompt.replace(/<保有四半期財務データあれば。なければ空>/g, options.financialData || '');
    fullPrompt += langInstruction;

    // Additional info if provided
    if (options.additionalInfo) {
      fullPrompt += `\n\n【追加情報】\n${options.additionalInfo}`;
    }

    this._isAnalyzing = true;
    this._abortController = new AbortController();

    try {
      let result;
      switch (model.provider) {
        case 'anthropic':
          result = await this._callAnthropic(model, apiKey, fullPrompt, options);
          break;
        case 'openai':
        case 'deepseek':
        case 'xai':
          result = await this._callOpenAICompatible(model, apiKey, fullPrompt, options);
          break;
        case 'google':
          result = await this._callGoogle(model, apiKey, fullPrompt, options);
          break;
        default:
          throw new Error('Unsupported provider: ' + model.provider);
      }

      return result;
    } catch (e) {
      if (e.name === 'AbortError') {
        DDApp.showToast('Analysis cancelled', 'info');
        return null;
      }
      console.error('Analysis failed:', e);
      throw e;
    } finally {
      this._isAnalyzing = false;
      this._abortController = null;
    }
  },

  // Follow-up analysis on existing report
  async followUp(reportId, question, additionalInfo) {
    const report = DDStore.getReport(reportId);
    if (!report) return null;

    const modelId = DDStore.get('selectedModel');
    const model = DDConfig.aiModels.find(m => m.id === modelId);
    const apiKey = DDStore.getApiKey(model.provider);

    if (!apiKey) {
      DDApp.showToast(`Please set your ${model.provider} API key in Settings`, 'error');
      return null;
    }

    const outputLang = DDStore.get('outputLang') || 'ja';
    const langInstruction = outputLang !== 'ja'
      ? `\nOutput in ${this._getLangName(outputLang)}.`
      : '\n出力はすべて日本語。';

    const followUpPrompt = `以下は${report.company}の分析レポートです。このレポートに基づいて追加分析を行ってください。${langInstruction}

【既存レポート（要約）】
${report.content.substring(0, 8000)}...

【追加質問/指示】
${question}

${additionalInfo ? '【追加情報】\n' + additionalInfo : ''}

追加分析結果をマークダウン形式で出力してください。`;

    this._isAnalyzing = true;
    this._abortController = new AbortController();

    try {
      let result;
      switch (model.provider) {
        case 'anthropic':
          result = await this._callAnthropic(model, apiKey, followUpPrompt, {});
          break;
        case 'openai':
        case 'deepseek':
        case 'xai':
          result = await this._callOpenAICompatible(model, apiKey, followUpPrompt, {});
          break;
        case 'google':
          result = await this._callGoogle(model, apiKey, followUpPrompt, {});
          break;
      }
      return result;
    } finally {
      this._isAnalyzing = false;
      this._abortController = null;
    }
  },

  // Anthropic API call with streaming
  async _callAnthropic(model, apiKey, prompt, options) {
    const onChunk = options.onChunk || (() => {});

    const response = await fetch(DDConfig.apiEndpoints.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: model.maxTokens || 64000,
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: this._abortController?.signal
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${err.error?.message || response.statusText}`);
    }

    return this._readStream(response, onChunk, 'anthropic');
  },

  // OpenAI-compatible API call (OpenAI, DeepSeek, xAI)
  async _callOpenAICompatible(model, apiKey, prompt, options) {
    const onChunk = options.onChunk || (() => {});
    const endpoint = DDConfig.apiEndpoints[model.provider];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: model.maxTokens || 64000,
        stream: true,
        messages: [
          { role: 'system', content: 'You are a professional due diligence analyst.' },
          { role: 'user', content: prompt }
        ]
      }),
      signal: this._abortController?.signal
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`${model.provider} API error: ${err.error?.message || response.statusText}`);
    }

    return this._readStream(response, onChunk, 'openai');
  },

  // Google AI API call
  async _callGoogle(model, apiKey, prompt, options) {
    const onChunk = options.onChunk || (() => {});
    const endpoint = `${DDConfig.apiEndpoints.google}${model.id}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: model.maxTokens || 65536 }
      }),
      signal: this._abortController?.signal
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Google AI error: ${err.error?.message || response.statusText}`);
    }

    return this._readStream(response, onChunk, 'google');
  },

  // Read SSE stream
  async _readStream(response, onChunk, format) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          let text = '';

          if (format === 'anthropic') {
            if (json.type === 'content_block_delta' && json.delta?.text) {
              text = json.delta.text;
            }
          } else if (format === 'openai') {
            text = json.choices?.[0]?.delta?.content || '';
          } else if (format === 'google') {
            text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }

          if (text) {
            fullText += text;
            onChunk(text, fullText);
          }
        } catch (e) {
          // Skip unparseable chunks
        }
      }
    }

    return fullText;
  },

  _getLangName(code) {
    const langs = { ja: 'Japanese', en: 'English', zh: 'Chinese', ko: 'Korean', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ar: 'Arabic' };
    return langs[code] || 'English';
  }
};
