// Cloudflare Pages Function — POST /api/council
//
// Contract (canon 02/04): POST { system, messages[] } → { text } | { error }.
//
// BYOK (operator decision): each founder brings their own key. It rides in as
// the `x-council-key` header, is forwarded to Anthropic, and is immediately
// forgotten — never stored, never logged. This supersedes the 2026-07-05 "one
// server-side key" decision; the model is still constrained server-side to an
// allowlist (no arbitrary/expensive model from the browser) and the founder's
// explicit choice is honored, so "no silent model swap" still holds.
//
// Guards: JSON shape, a 400 KB message-size cap, upstream 502 passthrough.
// Zero request-body logging — a design choice, not an oversight.

const ALLOWED_MODELS = new Set([
  'claude-fable-5', // default
  'claude-opus-4-8',
  'claude-sonnet-5',
  'claude-haiku-4-5-20251001',
])
const DEFAULT_MODEL = 'claude-fable-5'
const MAX_BYTES = 400 * 1024

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })

export async function onRequestPost(context) {
  const { request, env } = context

  // 1 · parse + shape guard
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad-json' }, 400)
  }
  const { system, messages } = body || {}
  if (typeof system !== 'string' || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'bad-shape' }, 400)
  }

  // 2 · size cap on the messages payload
  const size = new TextEncoder().encode(JSON.stringify(messages)).length
  if (size > MAX_BYTES) return json({ error: 'too-large' }, 413)

  // 3 · BYOK key — header first, optional server fallback for a shared deploy
  const key = request.headers.get('x-council-key') || (env && env.ANTHROPIC_API_KEY)
  if (!key) return json({ error: 'council-unconfigured' }, 400)

  // 4 · model — allowlist-validated; default Fable 5. No arbitrary model from the browser.
  const requested =
    typeof body.model === 'string' && body.model ? body.model : (env && env.COUNCIL_MODEL) || DEFAULT_MODEL
  if (!ALLOWED_MODELS.has(requested)) return json({ error: 'model-not-allowed' }, 400)

  // 5 · call Anthropic. max_tokens 1000 enforces the one-page discipline (canon 04).
  let upstream
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: requested, max_tokens: 1000, system, messages }),
    })
  } catch {
    return json({ error: 'council-unreachable' }, 502)
  }

  if (!upstream.ok) {
    // 502 passthrough — surface the class of failure without leaking key or body.
    let detail = ''
    try {
      detail = (await upstream.json())?.error?.type || ''
    } catch {
      /* ignore */
    }
    return json({ error: 'council-upstream', status: upstream.status, detail }, 502)
  }

  let data
  try {
    data = await upstream.json()
  } catch {
    return json({ error: 'bad-upstream' }, 502)
  }
  const text = Array.isArray(data.content) ? data.content.map((c) => c.text || '').join('').trim() : ''
  return json({ text })
}
