/* ============================================
   DD Config - Application Configuration
   ============================================ */

const DDConfig = {
  // Firebase configuration (replace with your project's config)
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  },

  // PayPal configuration
  paypal: {
    clientId: 'sb', // sandbox; replace with live client ID
    planId: 'YOUR_PAYPAL_PLAN_ID', // PayPal subscription plan ID for $50/month
    currency: 'USD',
    monthlyPrice: 50
  },

  // AI Model configurations
  aiModels: [
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'anthropic', maxTokens: 128000, description: 'Most capable, best for deep analysis' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic', maxTokens: 64000, description: 'Fast and capable' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic', maxTokens: 32000, description: 'Fast responses' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', maxTokens: 128000, description: 'OpenAI flagship' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', maxTokens: 16000, description: 'Fast & affordable' },
    { id: 'o3', name: 'o3', provider: 'openai', maxTokens: 128000, description: 'Deep reasoning' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', maxTokens: 65536, description: 'Google flagship' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', maxTokens: 65536, description: 'Fast Google model' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'deepseek', maxTokens: 64000, description: 'Deep reasoning' },
    { id: 'grok-3', name: 'Grok 3', provider: 'xai', maxTokens: 131072, description: 'xAI flagship' }
  ],

  // API endpoints per provider
  apiEndpoints: {
    anthropic: 'https://api.anthropic.com/v1/messages',
    openai: 'https://api.openai.com/v1/chat/completions',
    google: 'https://generativelanguage.googleapis.com/v1beta/models/',
    deepseek: 'https://api.deepseek.com/v1/chat/completions',
    xai: 'https://api.x.ai/v1/chat/completions'
  },

  // Default prompt categories
  promptCategories: [
    { id: 'business', name: 'Business DD', nameJa: 'ビジネスDD', icon: '\u{1F4CA}' },
    { id: 'financial', name: 'Financial DD', nameJa: '財務DD', icon: '\u{1F4B0}' },
    { id: 'legal', name: 'Legal DD', nameJa: '法務DD', icon: '\u{2696}' },
    { id: 'tax', name: 'Tax DD', nameJa: '税務DD', icon: '\u{1F4CB}' },
    { id: 'system', name: 'System/IT DD', nameJa: 'システムDD', icon: '\u{1F4BB}' },
    { id: 'hr', name: 'HR DD', nameJa: '人事DD', icon: '\u{1F465}' },
    { id: 'environmental', name: 'Environmental DD', nameJa: '環境DD', icon: '\u{1F33F}' },
    { id: 'ip', name: 'IP DD', nameJa: '知的財産DD', icon: '\u{1F4DC}' },
    { id: 'market', name: 'Market DD', nameJa: '市場DD', icon: '\u{1F30D}' },
    { id: 'custom', name: 'Custom', nameJa: 'カスタム', icon: '\u{2699}' }
  ],

  // App metadata
  app: {
    name: 'VM Due Diligence',
    version: '1.0.0',
    description: 'Valuation Matrix - Professional Due Diligence System'
  },

  // Admin email(s) - used to grant admin access
  adminEmails: ['admin@example.com']
};
