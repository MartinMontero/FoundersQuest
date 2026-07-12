// End-to-end tests against the real production build (dist/), served with the
// real security headers and a mocked Council. Covers the load-bearing
// invariants behaviorally, so they test the shipped App.jsx — not a copy.
//
// Browser: Playwright's bundled Chromium by default; set PW_CHROME to an
// executable path to reuse a preinstalled browser.
import { chromium } from 'playwright'
import { readFileSync } from 'fs'
import { startServer } from './serve.mjs'

const { server, base } = await startServer({ dist: 'dist' })
const launchOpts = process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {}
const browser = await chromium.launch(launchOpts)
const page = await browser.newPage({ acceptDownloads: true })

const consoleErrors = []
const cspErrors = []
page.on('console', (m) => {
  if (m.type() !== 'error') return
  const t = m.text()
  if (/content security policy|csp/i.test(t)) cspErrors.push(t)
  else if (!t.includes('favicon')) consoleErrors.push(t)
})
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))

const results = []
const check = (name, cond, extra = '') => results.push([name, !!cond, extra])
const D = () => page.evaluate(() => JSON.parse(localStorage.getItem('founders-quest:v3') || '{}'))
const seed = (patch) =>
  page.evaluate((p) => {
    const d = JSON.parse(localStorage.getItem('founders-quest:v3') || '{}')
    localStorage.setItem('founders-quest:v3', JSON.stringify({ ...d, ...p }))
  }, patch)
const truth = () => page.evaluate(() => (document.querySelector('header').innerText.match(/(—|\d+%)/) || [])[0])
const xp = () => page.evaluate(() => +(document.querySelector('header').innerText.match(/(\d+)\s*XP/) || [])[1])

// ── headers · favicon · CSP ──
const resp = await page.goto(base + '/', { waitUntil: 'networkidle' })
const H = resp.headers()
check('X-Frame-Options: DENY', H['x-frame-options'] === 'DENY')
check('X-Content-Type-Options: nosniff', H['x-content-type-options'] === 'nosniff')
check("CSP connect-src 'self'", /connect-src 'self'/.test(H['content-security-policy'] || ''))
check("CSP frame-ancestors 'none'", /frame-ancestors 'none'/.test(H['content-security-policy'] || ''))
check('favicon.svg 200', (await page.request.get(base + '/favicon.svg')).status() === 200)

// ── metrics: null → E1 no-move → E2 move ──
check('fresh Truth is —', (await truth()) === '—')
await page.getByRole('button', { name: 'Guardians' }).first().click()
await page.locator('textarea').first().fill('Clinics will pay monthly')
await page.locator('select').first().selectOption('dies')
await page.getByRole('button', { name: 'Add guardian' }).click()
await page.waitForTimeout(120)
check('untested guardian → Truth 0%', (await truth()) === '0%')
await page.getByRole('button', { name: 'Ledger' }).first().click()
await page.locator('select').first().selectOption('1')
await page.locator('textarea').first().fill('A manager said it sounds useful')
await page.locator('button', { hasText: 'Clinics will pay' }).click()
await page.getByRole('button', { name: 'Log evidence' }).click()
await page.waitForTimeout(120)
check('E1 evidence does not move Truth', (await truth()) === '0%')
await page.locator('select').first().selectOption('2')
await page.locator('textarea').first().fill('Manager described losing money last week')
await page.locator('button', { hasText: 'Clinics will pay' }).click()
await page.getByRole('button', { name: 'Log evidence' }).click()
await page.waitForTimeout(120)
await page.getByRole('button', { name: 'Guardians' }).first().click()
await page.waitForTimeout(120)
check('E2 derives tier E2·Said', /E2 · Said/.test(await page.evaluate(() => document.body.innerText)))
await page.locator('select').filter({ has: page.locator('option', { hasText: 'invalidated' }) }).selectOption('validated')
await page.waitForTimeout(120)
check('resolve at E2 → Truth 100%', (await truth()) === '100%')
check('validation pays +10 XP', (await xp()) === 10)

// ── invalidation pays 1.5× (a second guardian, invalidated at E2) ──
await page.locator('textarea').first().fill('Front desk holds the budget')
await page.locator('select').first().selectOption('dies')
await page.getByRole('button', { name: 'Add guardian' }).click()
await page.waitForTimeout(120)
await page.getByRole('button', { name: 'Ledger' }).first().click()
await page.locator('select').first().selectOption('3')
await page.locator('textarea').first().fill('Saw the director override the front desk')
await page.locator('button', { hasText: 'Front desk holds' }).click()
await page.getByRole('button', { name: 'Log evidence' }).click()
await page.waitForTimeout(120)
await page.getByRole('button', { name: 'Guardians' }).first().click()
await page.locator('div.rounded-xl', { hasText: 'Front desk holds the budget' }).locator('select').filter({ has: page.locator('option', { hasText: 'invalidated' }) }).selectOption('invalidated')
await page.waitForTimeout(120)
check('invalidation pays +15 (10+15=25)', (await xp()) === 25)

// ── trough windowing: last-3 mean ≤ 2 ──
await seed({ weather: [{ id: 'a', date: '2026-07-06', value: 1 }, { id: 'b', date: '2026-07-08', value: 4 }, { id: 'c', date: '2026-07-09', value: 5 }, { id: 'd', date: '2026-07-10', value: 4 }] })
await page.reload({ waitUntil: 'networkidle' })
check('old storm outside window → no trough', (await page.getByText('the trough, not your failure').count()) === 0)
await seed({ weather: [{ id: 'x', date: '2026-07-08', value: 2 }, { id: 'y', date: '2026-07-09', value: 1 }, { id: 'z', date: '2026-07-10', value: 2 }] })
await page.reload({ waitUntil: 'networkidle' })
check('last-3 mean ≤ 2 → trough banner', (await page.getByText('the trough, not your failure').count()) > 0)

// ── Ariadne's Thread: two-step seal + lock ──
await page.getByRole('button', { name: 'Quest' }).first().click()
await page.locator('nav button', { hasText: 'Testing' }).click()
await page.locator('textarea').first().fill('Fewer than 3 of 10 sign up in the 7-day test')
await page.getByRole('button', { name: 'Seal the Thread' }).click()
check('seal asks for confirmation', (await page.getByText("you can't edit it afterward").count()) > 0)
await page.getByRole('button', { name: /^Seal it$/ }).click()
await page.waitForTimeout(120)
check('thread sealed + timestamped', !!(await D()).answers?.s4?.['s4-th']?.sealedAt)

// ── decision cited-lock ──
await page.locator('nav button', { hasText: 'Feedback' }).click()
await page.waitForTimeout(120)
check('decision locked without citation', await page.getByRole('button', { name: /^pivot$/i }).isDisabled())
await page.locator('button', { hasText: /^E\d · / }).first().click()
await page.waitForTimeout(100)
check('decision unlocks after a citation', !(await page.getByRole('button', { name: /^pivot$/i }).isDisabled()))

// ── exports: dinner exclusion + Brief lead ──
await seed({ dinnerCard: { text: 'DINNER_SECRET_CARD', updatedAt: '2026-07-10' }, dinnerSession: { date: '2026-07-10', cards: [{ id: 'x', name: 'Dana', text: 'DINNER_SECRET_SESSION', bucket: 'Been there', spoke: true }], timer: 5400 } })
await page.reload({ waitUntil: 'networkidle' })
const [jd] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Journal' }).click()])
const journal = readFileSync(await jd.path(), 'utf8')
check('Journal has guardian', journal.includes('Clinics will pay monthly'))
check('Journal excludes dinner card', !journal.includes('DINNER_SECRET_CARD'))
check('Journal excludes dinner session', !journal.includes('DINNER_SECRET_SESSION'))
const [bd] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Brief' }).click()])
const brief = readFileSync(await bd.path(), 'utf8')
check('Brief leads with dinner card', brief.includes('DINNER_SECRET_CARD'))
check('Brief excludes dinner session', !brief.includes('DINNER_SECRET_SESSION'))

// ── Council: consent → convene → commitment gate → follow-up; key never exported ──
await page.locator('nav button', { hasText: 'Council' }).click()
await page.getByRole('button', { name: /I understand/ }).click()
await page.getByPlaceholder('sk-ant-…').fill('sk-ant-secret-key-xyz')
await page.getByRole('button', { name: 'Convene the Council' }).click()
await page.waitForTimeout(200)
check('reading displayed', (await page.getByText('MOCK COUNCIL READING').count()) > 0)
check('follow-up locked before commitment', (await page.getByPlaceholder('Ask the Council a follow-up…').count()) === 0)
await page.getByPlaceholder("The one thing I'll change…").fill('Interview the budget holder')
await page.getByRole('button', { name: 'Commit, then rebut' }).click()
await page.waitForTimeout(120)
check('follow-up opens after commitment', (await page.getByPlaceholder('Ask the Council a follow-up…').count()) > 0)
check('key never in exportable blob', !(await page.evaluate(() => localStorage.getItem('founders-quest:v3').includes('sk-ant-secret-key-xyz'))))

// ── mobile: no horizontal overflow ──
await page.setViewportSize({ width: 375, height: 800 })
for (const tab of ['Quest', 'Guardians', 'Council', 'Trail', 'Dinner']) {
  await page.locator('nav button', { hasText: tab }).click()
  await page.waitForTimeout(100)
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  check(`mobile no overflow: ${tab}`, over <= 1, `overflow=${over}`)
}

check('zero CSP violations', cspErrors.length === 0, cspErrors.join(' | '))
check('zero console errors', consoleErrors.length === 0, consoleErrors.join(' | '))

await browser.close()
server.close()
const passed = results.filter(([, c]) => c).length
for (const [name, cond, extra] of results) console.log(`  ${cond ? '✓' : '✗ FAIL'} ${name}${cond ? '' : '  << ' + extra}`)
console.log(`\n${passed}/${results.length} passed`)
process.exit(passed === results.length ? 0 : 1)
