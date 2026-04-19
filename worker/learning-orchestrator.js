/**
 * Personal Learning Companion — Cloudflare Worker
 *
 * Single responsibility: keep system prompts, AI-mode configuration,
 * and audit logs on the SERVER so the browser never receives them.
 * The browser only ever sends `{ sessionId, mode, userMessage }` and
 * receives `{ assistantText, choices[] }`. Prompt bodies, API keys,
 * and profile-estimate reasoning stay here.
 *
 * Endpoints (all JSON, all CORS-enabled):
 *
 *   GET  /health
 *       Liveness probe. No auth.
 *
 *   GET  /me
 *       Returns the caller's `{ uid, email, isAdmin }` derived from
 *       the Firebase ID token. Used by the frontend to decide whether
 *       to render the admin tabs — but every admin endpoint below
 *       re-checks the token, so a tampered client flag grants nothing.
 *
 *   POST /chat
 *       Body: { sessionId, mode, userMessage }. Appends the user turn,
 *       composes the system prompt entirely on this side, calls
 *       Anthropic, writes the assistant turn, and returns the visible
 *       text plus structured choices. (Phase 3.)
 *
 *   GET  /admin/prompts
 *   POST /admin/prompts
 *   PATCH /admin/prompts/:key
 *   POST /admin/prompts/:key/activate
 *   POST /admin/prompts/:key/deactivate
 *       Admin-only. Every write produces an auditLogs entry. (Phase 7.)
 *
 *   GET  /admin/ai-modes
 *   PATCH /admin/ai-modes/:key
 *       Admin-only AI-mode configuration. (Phase 7.)
 *
 *   GET  /admin/audit-logs
 *       Admin-only. Paginated. (Phase 7.)
 *
 * SECURITY INVARIANTS (do not break without review):
 *   1. Prompt bodies never appear in any response from this Worker.
 *      Only the `key` and metadata (name, description, version) are
 *      exposed to the admin UI; the `content` field is redacted on
 *      list responses and only returned to admins on the edit screen.
 *   2. `isAdmin` is decided from the verified Firebase ID token's
 *      email claim against ADMIN_EMAILS, not from anything the client
 *      sent in the body.
 *   3. ANTHROPIC_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON, and the
 *      composed system prompt are never echoed, logged to the client,
 *      or reflected in error messages.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function notImplemented(phase) {
  return json(
    { error: 'not_implemented', phase, message: 'この機能は準備中です。' },
    501
  );
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (path === '/health' && request.method === 'GET') {
        return json({ ok: true, appName: env.APP_NAME || 'Personal Learning Companion' });
      }

      // Phase 3 onwards — auth-required endpoints.
      if (path === '/me' && request.method === 'GET') {
        return notImplemented('phase-3');
      }
      if (path === '/chat' && request.method === 'POST') {
        return notImplemented('phase-3');
      }
      if (path.startsWith('/admin/')) {
        return notImplemented('phase-7');
      }

      return json({ error: 'not_found', path }, 404);
    } catch (err) {
      // Never leak internal details to the client — only a generic
      // message. The real stack trace is visible in the Cloudflare
      // dashboard logs.
      console.error('[learning-orchestrator] unhandled', err);
      return json({ error: 'internal_error', message: 'しばらくしてから、もう一度だけ試してみてね。' }, 500);
    }
  },
};
