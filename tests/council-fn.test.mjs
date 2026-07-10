// Unit tests for the real Council Pages Function — no browser, no live key.
// Stubs global fetch to stand in for api.anthropic.com and asserts the guards,
// the server-side model allowlist, key forwarding, 502 passthrough, and that
// nothing is written to the console during handling (zero-logging discipline).
import { onRequestPost } from '../functions/api/council.js'

let logs = 0
const realLog = console.log
console.log = console.error = console.warn = console.info = () => {
  logs++
}

let captured = null
const req = (body, headers = {}) =>
  new Request('http://x/api/council', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
const good = { system: 'You are a test.', messages: [{ role: 'user', content: 'hi' }] }

async function run(request, env = {}, upstream = null) {
  captured = null
  globalThis.fetch = async (url, opts) => {
    captured = { url, opts }
    return upstream || new Response(JSON.stringify({ content: [{ text: ' READING ' }] }), { status: 200 })
  }
  const res = await onRequestPost({ request, env })
  return { status: res.status, body: await res.json().catch(() => ({})) }
}

const results = []
const check = (name, cond) => results.push([name, !!cond])

let r
r = await run(req('{ not json', { 'x-council-key': 'k' }))
check('malformed JSON → 400 bad-json', r.status === 400 && r.body.error === 'bad-json')
r = await run(req({ system: 'x' }, { 'x-council-key': 'k' }))
check('missing messages → 400 bad-shape', r.status === 400 && r.body.error === 'bad-shape')
r = await run(req(good))
check('no key → 400 council-unconfigured', r.status === 400 && r.body.error === 'council-unconfigured')
r = await run(req({ system: 'x', messages: [{ role: 'user', content: 'a'.repeat(400 * 1024 + 10) }] }, { 'x-council-key': 'k' }))
check('over 400KB → 413 too-large', r.status === 413 && r.body.error === 'too-large')
r = await run(req({ ...good, model: 'gpt-4o' }, { 'x-council-key': 'k' }))
check('arbitrary model → 400 model-not-allowed', r.status === 400 && r.body.error === 'model-not-allowed')
r = await run(req(good, { 'x-council-key': 'sk-founder' }))
check('valid request → 200 { text }', r.status === 200 && r.body.text === 'READING')
check('key forwarded as x-api-key', captured?.opts?.headers['x-api-key'] === 'sk-founder')
check('default model claude-fable-5', JSON.parse(captured.opts.body).model === 'claude-fable-5')
check('max_tokens 1000', JSON.parse(captured.opts.body).max_tokens === 1000)
check('calls the Anthropic endpoint', captured.url === 'https://api.anthropic.com/v1/messages')
r = await run(req({ ...good, model: 'claude-opus-4-8' }, { 'x-council-key': 'k' }))
check('allowlisted alt model forwarded', JSON.parse(captured.opts.body).model === 'claude-opus-4-8')
r = await run(req(good, { 'x-council-key': 'k' }), {}, new Response(JSON.stringify({ error: { type: 'not_found_error' } }), { status: 404 }))
check('upstream 404 → 502 passthrough', r.status === 502 && r.body.error === 'council-upstream' && r.body.detail === 'not_found_error')
r = await run(req(good), { ANTHROPIC_API_KEY: 'sk-env' })
check('env fallback key works', r.status === 200 && captured?.opts?.headers['x-api-key'] === 'sk-env')

console.log = realLog
const passed = results.filter(([, c]) => c).length
for (const [name, cond] of results) console.log(`  ${cond ? '✓' : '✗ FAIL'} ${name}`)
const zeroLog = logs === 0
console.log(`\n${passed}/${results.length} passed · zero-logging: ${zeroLog ? 'CLEAN' : `FAIL (${logs} console calls)`}`)
process.exit(passed === results.length && zeroLog ? 0 : 1)
