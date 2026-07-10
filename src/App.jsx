import React, { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════
   Founder's Quest v3 — the static instrument. Single default export.
   Stage B: data model · storage ladder · migration.
   Stage C: computed metrics · buildJournalMd (single serializer) · Brief.
   ═══════════════════════════════════════════════════════════════════════ */

/* ═══ content canon (question bank v3, verbatim from canon 03) ════════════
   Format mirrors 03: id · type · verbatim text · hint (written in code per
   law 3; 03 omits hints for budget). Untagged in 03 → type 'prose'. */
const STAGES = [
  { id: 's1', n: 1, name: 'The Problem', myth: 'The Call to Adventure', symbol: 'Swirling Nebula', act: 1 },
  { id: 's2', n: 2, name: 'Research', myth: 'Meeting the Mentor', symbol: 'The Raven', act: 1 },
  { id: 's3', n: 3, name: 'Prototyping', myth: 'The Approach', symbol: 'The Phoenix', act: 2 },
  { id: 's4', n: 4, name: 'Testing', myth: 'Crossing the Threshold', symbol: 'The Labyrinth', act: 2 },
  { id: 's5', n: 5, name: 'Feedback', myth: 'Tests, Allies & Enemies', symbol: 'The Mirror', act: 2 },
  { id: 's6', n: 6, name: 'Refinement', myth: 'The Ordeal', symbol: 'The Sculptor', act: 3 },
  { id: 's7', n: 7, name: 'Implementation', myth: 'The Road Back', symbol: 'The Bridge', act: 3 },
  { id: 's8', n: 8, name: 'Launch', myth: 'Return with the Elixir', symbol: 'The Rocket', act: 3 },
]

// Field-rules banners shown atop a stage (canon 03).
const STAGE_BANNERS = {
  s2: 'Talk about their life, not your idea. Past specifics, not future hypotheticals. Compliments are not data.',
}

// Section headers that group questions inside a stage (canon 03).
const SECTIONS = {
  's2-p1': 'The Fellowship — People Over Idea (PIE: People 5× / Idea 2× / Enchantment 1.5×)',
  's6-u1': 'The Unseen — Ethical Impact',
}

// Every question, in stage order. type === 'prose' is the default free-text input.
const QUESTIONS = [
  // ── Stage 1 · The Problem ──────────────────────────────────────────────
  { id: 's1-th', stageId: 's1', type: 'story', text: 'Tell the last time you watched someone hit this problem. Who were they — name them — where were they, and what did they do next?', hint: 'A story — one real moment. Who, where, and what they did next.' },
  { id: 's1-l1', stageId: 's1', type: 'names', text: "Who exactly has this problem? Three real people or organizations. No personas, no 'busy professionals.'", hint: 'Three names — real people or organizations.' },
  { id: 's1-l2', stageId: 's1', type: 'fivewhys', text: 'Why is that a problem for them?', hint: 'Five whys, each digging under the last, to a root you can see.' },
  { id: 's1-l3', stageId: 's1', type: 'number', text: 'What does one occurrence cost — in minutes, dollars, or dignity? How often does it happen?', hint: 'A number — minutes, dollars, or dignity — and how often.' },
  { id: 's1-l4', stageId: 's1', type: 'list', text: 'What do they do about it today? The workaround is your first competitor.', hint: 'A list — the workarounds they use today.' },
  { id: 's1-l5', stageId: 's1', type: 'story', text: 'Why you? What have you lived, seen, or built that makes this problem yours to carry?', hint: 'A story — what makes this yours to carry.' },
  { id: 's1-fp', stageId: 's1', type: 'quickadd', text: 'Strip it bare. List only what you know from direct observation — not reports, not belief. Everything else goes to the Assumption Registry.', hint: 'Only what you saw directly. An "This only works if ___" line becomes a guardian.' },
  { id: 's1-fx', stageId: 's1', type: 'falsify', text: "If this problem weren't worth solving, what would the world look like? Do you see any of that?", hint: 'Describe that world — then say honestly if you see any of it.' },

  // ── Stage 2 · Research ─────────────────────────────────────────────────
  { id: 's2-th', stageId: 's2', type: 'verbatim', text: 'Ask five people living this problem about the last time it happened — not whether they would use your idea. Paste what they said, word for word.', hint: 'Their words, verbatim — the last time it happened, not a hypothetical.' },
  { id: 's2-l1', stageId: 's2', type: 'prose', text: "What's their current 'good enough' — the spreadsheet, the cousin, the doing-nothing? What does keeping it cost them?", hint: "Their 'good enough' today, and what it costs them." },
  { id: 's2-l2', stageId: 's2', type: 'prose', text: "What did you hear that you didn't want to hear? Log that first.", hint: "The thing you didn't want to hear. Log it first." },
  { id: 's2-l3', stageId: 's2', type: 'names', text: 'Who profits from this problem existing? Who loses if it is solved?', hint: 'Names — who profits, who loses.' },
  { id: 's2-l4', stageId: 's2', type: 'prose', text: 'Name the one external shift — a rule, a platform policy, a price, a technology — that could make this venture pointless or impossible within two years. How likely is it?', hint: 'One external shift that could end this — and how likely.' },
  { id: 's2-l5', stageId: 's2', type: 'prose', text: "Who has walked this exact terrain? What's the one question you'd ask them — and have you sent it?", hint: 'Experience over expertise — a veteran of the current workaround counts. Have you sent it?' },
  { id: 's2-p1', stageId: 's2', type: 'story', text: 'When did you last change your mind because someone pushed back? What did it cost you?', hint: 'A story — the last time you changed your mind, and its cost.' },
  { id: 's2-p2', stageId: 's2', type: 'story', text: "What's the disagreement you and your cofounder keep not having? Have it — then write what each of you actually said. (Solo? Argue with the voice that disagrees, and transcribe.)", hint: 'What each of you actually said.' },
  { id: 's2-p3', stageId: 's2', type: 'names', text: 'Who — besides you — is illogically enchanted by this? Name them. If no one, log that in the ledger too.', hint: 'Names — who else is enchanted. None? Log that.' },
  { id: 's2-p4', stageId: 's2', type: 'list', text: 'What are you bringing that helps everyone else succeed — before anyone helps you?', hint: 'A list — what you bring that helps others first.' },
  { id: 's2-fx', stageId: 's2', type: 'falsify', text: 'What pattern across your five conversations would tell you this problem is real but not urgent? Do you see it?', hint: 'The pattern that means real-but-not-urgent — and whether you see it.' },

  // ── Stage 3 · Prototyping (the Vault unseals) ──────────────────────────
  { id: 's3-th', stageId: 's3', type: 'prose', text: "Write your customer's sentence in their words from your ledger: 'When I [situation], I want to [motivation], so I can [outcome].'", hint: 'One sentence in their words: When I…, I want to…, so I can…' },
  { id: 's3-l1', stageId: 's3', type: 'vault', text: 'Open the Vault. Which captured idea attacks the root cause from your Five Whys — not a symptom of it?', hint: 'Pick the captured idea that hits the root, not a symptom.' },
  { id: 's3-l2', stageId: 's3', type: 'ifthen', text: 'State the logic before you build: IF ___ / THEN when [named segment] meets [prototype], we will observe [behavior] / WITHIN [days].', hint: 'IF … / THEN when [segment] meets [prototype] we will observe [behavior] / WITHIN [days].' },
  { id: 's3-l3', stageId: 's3', type: 'prose', text: "What's the smallest thing you can put in front of a real customer in 7 days that lets them answer with behavior — a sketch, a fake door, a concierge run you do by hand?", hint: 'The smallest thing a real customer can react to in 7 days.' },
  { id: 's3-l4', stageId: 's3', type: 'list', text: "Which features are for the customer, and which are for your ego? Write the second list — that's what goes into the flames.", hint: 'A list — the features that serve your ego.' },
  { id: 's3-l5', stageId: 's3', type: 'prose', text: 'Am I building to learn, or building to be admired?', hint: 'Answer honestly — learn, or be admired?' },
  { id: 's3-joy', stageId: 's3', type: 'prose', text: 'Beyond killing the pain — what one moment could make them smile and tell a friend? Name the moment. Design it on purpose.', hint: 'Name one moment worth telling a friend about. Design it.', badge: 'The Spark of Joy' },

  // ── Stage 4 · Testing ──────────────────────────────────────────────────
  { id: 's4-th', stageId: 's4', type: 'seal', text: "Before anything runs: write the result that makes you stop or pivot. Seal it. This is Ariadne's Thread.", hint: 'The result that makes you stop or pivot — sealed and timestamped before the test runs.' },
  { id: 's4-l1', stageId: 's4', type: 'prose', text: 'What behavior are you measuring — not opinions you are collecting? Clicks, sign-ups, prepayments, returns, time-on-task.', hint: 'A behavior you can measure — not an opinion you collect.' },
  { id: 's4-l2', stageId: 's4', type: 'prose', text: 'What does a costly yes look like — money, a deposit, a calendar hold, an intro to their boss? Compliments are not currency.', hint: 'What a costly yes looks like — money, a deposit, a calendar hold.' },
  { id: 's4-l3', stageId: 's4', type: 'story', text: 'Where did testers get lost — and what did they do in the ten seconds before quitting?', hint: 'A story — where they got lost, and the ten seconds before quitting.' },
  { id: 's4-l4', stageId: 's4', type: 'falsify', text: "If the test 'succeeds', what's the strongest boring explanation — novelty, politeness, the wrong crowd? How do you rule it out?", hint: 'The most boring explanation for success — and how you rule it out.' },
  { id: 's4-l5', stageId: 's4', type: 'prose', text: "What's the smallest step you can take today?", hint: 'The smallest step you can take today.' },

  // ── Stage 5 · Feedback ─────────────────────────────────────────────────
  { id: 's5-th', stageId: 's5', type: 'verdict', text: "Open the seal. Did Ariadne's Thread trigger — yes or no? Answer before you interpret anything else.", hint: 'Yes or no — did the sealed result trigger? Answer before interpreting.' },
  { id: 's5-l1', stageId: 's5', type: 'prose', text: 'What uncomfortable truths is the mirror showing me?', hint: 'What the mirror is showing you.' },
  { id: 's5-l2', stageId: 's5', type: 'prose', text: 'Am I listening to the market, or protecting my own ego?', hint: 'Listening to the market, or protecting your ego?' },
  { id: 's5-l3', stageId: 's5', type: 'prose', text: 'What is the gap between my intention and their perception?', hint: 'The gap between your intention and their perception.' },
  { id: 's5-l4', stageId: 's5', type: 'prose', text: 'Take the most inconvenient entry in your ledger and argue its case like you are its lawyer. What if it is right?', hint: "Argue the most inconvenient entry's case, as its lawyer." },
  { id: 's5-l5', stageId: 's5', type: 'registry', text: 'Which Stage-1 belief is now dead? Hold the funeral: mark it invalidated in the Registry — and take the XP.', hint: 'Mark the dead belief invalidated in the Registry — take the XP.' },
  { id: 's5-dec', stageId: 's5', type: 'decision', text: 'Pivot, or persevere? Cite the evidence that decides it.', hint: 'Pivot or persevere — locked until cited to at least one ledger entry.' },

  // ── Stage 6 · Refinement ───────────────────────────────────────────────
  { id: 's6-th', stageId: 's6', type: 'prose', text: 'What do users actually do with it, versus what you built it for? Cut everything serving only the second.', hint: 'What users actually do vs. what you built for. Cut the rest.' },
  { id: 's6-l1', stageId: 's6', type: 'number', text: 'What one action must a new user complete to feel the value? Count the steps, seconds, and decisions standing in the way.', hint: 'The one activation action — count its steps, seconds, decisions.' },
  { id: 's6-l2', stageId: 's6', type: 'prose', text: 'If you fix one thing this week, what does the evidence — not your taste — say it is?', hint: 'The one fix the evidence points to.' },
  { id: 's6-u1', stageId: 's6', type: 'names', text: 'Who is affected but not in the room? Name them. What would they say if they read your plan?', hint: "Names — who's affected but not in the room, and what they'd say." },
  { id: 's6-u2', stageId: 's6', type: 'prose', text: 'How would a bad actor use this exactly as designed? What is the cheapest guardrail, built now while it is cheap?', hint: "A bad actor's use, and the cheapest guardrail now." },
  { id: 's6-u3', stageId: 's6', type: 'prose', text: 'What behavior does your revenue model reward at scale? Are you at peace with what it optimizes?', hint: 'What your revenue model rewards at scale.' },
  { id: 's6-u4', stageId: 's6', type: 'prose', text: 'Whose data do you touch — and what is the least of it you can hold?', hint: 'The least data you can hold.' },

  // ── Stage 7 · Implementation ───────────────────────────────────────────
  { id: 's7-th', stageId: 's7', type: 'number', text: 'Walk one customer across the bridge — one month, real figures. What do they pay, what does serving them cost, what remains? Any number you do not know is an assumption: register it.', hint: 'Real figures — one customer, one month: pay, cost, remainder. Unknowns become guardians.' },
  { id: 's7-l1', stageId: 's7', type: 'prose', text: 'Has anyone paid, pre-paid, or given up something costly — time, data, a deposit, an introduction? What is the closest thing to money you have collected?', hint: "The closest thing to money you've actually collected." },
  { id: 's7-l2', stageId: 's7', type: 'prose', text: 'Which single plank — a person, a platform, a supplier, an API — drops the whole bridge if it snaps? What is your 30-day plan if it snaps tomorrow?', hint: 'The single plank that drops the bridge — and your 30-day plan.' },
  { id: 's7-l3', stageId: 's7', type: 'names', text: 'Who is crossing with you — and what commitment has each actually made, out loud?', hint: "Names — who's crossing, and the commitment each made out loud." },
  { id: 's7-l4', stageId: 's7', type: 'list', text: 'If revenue halves for two quarters, what goes first, second, third? Decide while you are calm.', hint: 'A list — what goes first, second, third if revenue halves.' },
  { id: 's7-l5', stageId: 's7', type: 'list', text: 'What are you deliberately not doing? Strategy is sacrifice — name three.', hint: "Three things you're deliberately not doing." },

  // ── Stage 8 · Launch ───────────────────────────────────────────────────
  { id: 's8-th', stageId: 's8', type: 'spine', text: "The elixir is the story. Tell it with your customer as the hero and you as the guide: 'Once there was [named customer]. Every day, [struggle]. Until one day, [your work]. Because of that, [observed outcome]. Until finally, [transformation].' Every beat cites evidence, or it does not cast.", hint: 'Five beats, each cited to evidence, or the spine renders unproven.' },
  { id: 's8-l1', stageId: 's8', type: 'number', text: "One number tells you it is flying. Which one, why that one, and what is this month's honest target?", hint: "The one number, why it, and this month's honest target." },
  { id: 's8-l2', stageId: 's8', type: 'story', text: 'What did this journey disprove that you believed at the start? Write it for the next founder — that is the wisdom you return with.', hint: 'What the journey disproved — the wisdom for the next founder.' },
  { id: 's8-l3', stageId: 's8', type: 'prose', text: 'How will I celebrate crossing the final threshold?', hint: "How you'll celebrate crossing the threshold.", badge: 'Joy — survives every rewrite' },
  { id: 's8-l4', stageId: 's8', type: 'prose', text: 'Are you ready to let go and let it fly?', hint: 'Answer honestly — ready to let it fly?' },
]

// Milestones per stage (canon 03, verbatim). Action = checked / total; self-reported.
const MILESTONES = {
  s1: ['story with a named person', 'three real people named', 'Five-Whys root reached'],
  s2: ['five E2+ conversations', 'one E3/E4 entry', 'riskiest guardian with kill criterion'],
  s3: ['JTBD in their words', 'IF-THEN stated before building', '7-day artifact chosen'],
  s4: ['thread sealed before testing', 'behavior metric defined', 'test run with real users'],
  s5: ['verdict recorded', 'one funeral held', 'decision cited to evidence'],
  s6: ['cuts from observed use', 'time-to-value counted', 'one guardrail named'],
  s7: ['unit walk-through written', 'SPOF + 30-day plan', 'three deliberate nots'],
  s8: ['spine cast from cited evidence', 'one honest number and target', 'wisdom for the next founder'],
}
const MILESTONE_TOTAL = Object.values(MILESTONES).reduce((n, arr) => n + arr.length, 0)

// The Vault trigger-word list — operator-approved. Case-insensitive, word-boundary;
// active only in Act I (Stages 1–2), sealed until Stage 3.
const VAULT_TRIGGERS = [
  'app', 'platform', 'feature', 'ai', 'build', 'tool', 'saas', 'software',
  'product', 'dashboard', 'algorithm', 'automate', 'automation', 'api',
  'chatbot', 'plugin', 'mvp', 'prototype', 'website', 'mobile app', 'machine learning',
]
const VAULT_RE = new RegExp(
  '\\b(' + VAULT_TRIGGERS.map((w) => w.replace(/ /g, '\\s+')).join('|') + ')\\b',
  'i',
)

/* ── data model ───────────────────────────────────────────────────────── */
const DATA_KEY = 'founders-quest:v3'
const LEGACY_KEY = 'founders-quest:v2'

// The full founders-quest:v3 shape (canon 02). New keys default in via
// { ...EMPTY_DATA, ...loaded } so older saves gain fields without a migration.
const EMPTY_DATA = {
  milestones: {}, //            { [id]: bool }              — Action bar; self-reported
  answers: {}, //               { [stageId]: { [qid]: {...} } }
  fieldNotes: {}, //            { [stageId]: string }       — v2 reflections land here
  assumptions: [], //           [{ id, statement, originStageId, importance, status, killCriterion, createdAt, resolvedAt }]
  evidence: [], //              [{ id, tier, text, source, linkedAssumptionIds, stageId, date }]
  vault: [], //                 [{ id, text, date }]
  vaultUnlocked: false,
  trail: [], //                 [{ type, name, fromId?, toId?, learning?, critique?, date }]
  gates: {}, //                 { act1|act2|act3: { status, reason?, date } }
  lastLoop: null,
  council: [], //               [{ id, date, reading, commitment?, followups, journal, source }]
  councilConsent: false,
  weather: [], //               [{ id, date, value:1-5 }]
  sideQuests: {}, //            { [id]: { text, startedAt, completedAt } }
  dinnerCard: null, //          { text, updatedAt }         — the founder's own card (Brief only)
  dinnerSession: null, //       { date, cards, timer } | null — EXCLUDED from all serialization
  dinnerLog: [], //             [{ date, cards, spoke, matches }] — EXCLUDED from all serialization
}

/* ── storage ladder ──────────────────────────────────────────────────────
   localStorage (probed in try/catch) → in-memory fallback + honest banner.
   This is the ONLY place localStorage is touched (canon 02). */
function makeStore() {
  let ls = null
  try {
    const probe = '__fq_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    ls = window.localStorage
  } catch {
    ls = null // Safari private mode, blocked storage, SSR, etc.
  }
  const mem = new Map()
  return {
    persistent: !!ls,
    get(key) {
      try {
        return ls ? ls.getItem(key) : mem.has(key) ? mem.get(key) : null
      } catch {
        return mem.has(key) ? mem.get(key) : null
      }
    },
    set(key, val) {
      try {
        if (ls) ls.setItem(key, val)
        else mem.set(key, val)
      } catch {
        mem.set(key, val) // quota / eviction → don't lose the session
      }
    },
    remove(key) {
      try {
        if (ls) ls.removeItem(key)
        else mem.delete(key)
      } catch {
        mem.delete(key)
      }
    },
  }
}

/* ── migration: legacy v2 → v3 (v2 read-only) ────────────────────────────
   Greenfield build: the exact v2 shape lives in the claude.ai artifact, not
   here, so this is a documented best-effort (Phase-0 recon):
     • v2 reflections → v3 fieldNotes (per-stage strings only)
     • v2 milestone CHECKS are deliberately NOT carried — a check moved onto
       changed criteria is a fabricated fact (decision log 2026-07-05). */
function migrateLegacy(store) {
  const raw = store.get(LEGACY_KEY)
  if (!raw) return null
  let v2
  try {
    v2 = JSON.parse(raw)
  } catch {
    return null
  }
  const fieldNotes = {}
  const sources = [v2?.reflections, v2?.fieldNotes, v2?.notes].filter(
    (o) => o && typeof o === 'object',
  )
  for (const src of sources) {
    for (const [stageId, val] of Object.entries(src)) {
      if (typeof val === 'string' && val.trim()) fieldNotes[stageId] = val
    }
  }
  return Object.keys(fieldNotes).length ? { fieldNotes } : null
}

function loadData(store) {
  const rawV3 = store.get(DATA_KEY)
  let loaded = {}
  if (rawV3) {
    try {
      loaded = JSON.parse(rawV3) || {}
    } catch {
      loaded = {}
    }
  } else {
    const migrated = migrateLegacy(store)
    if (migrated) loaded = migrated
  }
  return { ...EMPTY_DATA, ...loaded }
}

/* ═══ Stage C: computed metrics (exact, canon 02) ═════════════════════════
   Falsificationist Truth: only E2+ evidence moves it; no hunch of any
   provenance ever does. Guardian tiers are DERIVED, never stored. */
const WEIGHT = { dies: 3, wobbles: 2, shrugs: 1 }
const TIER_NAME = ['Hunch', 'Heard', 'Said', 'Seen', 'Paid'] // E0–E4; codes never translate
const WEATHER_NAME = ['', 'Storm', 'Rain', 'Grey', 'Breaks', 'Clear']

// Derived tier = max tier of evidence linked to this assumption, else 0.
function tierOf(assumptionId, evidence) {
  let max = 0
  for (const e of evidence) {
    if (e.linkedAssumptionIds && e.linkedAssumptionIds.includes(assumptionId) && e.tier > max) {
      max = e.tier
    }
  }
  return max
}

const isResolved = (a) => a.status === 'validated' || a.status === 'invalidated'

// Truth = Σ weight(resolved with tier≥2) / Σ weight; null when no assumptions.
function computeTruth(data) {
  const A = data.assumptions
  if (!A.length) return null
  let num = 0
  let den = 0
  for (const a of A) {
    const w = WEIGHT[a.importance] || 0
    den += w
    if (isResolved(a) && tierOf(a.id, data.evidence) >= 2) num += w
  }
  return den ? num / den : null
}

// XP: per assumption with tier≥2 — invalidated +15, validated +10 (1.5×);
// plus +5 per completed Side Quest.
function computeXP(data) {
  let xp = 0
  for (const a of data.assumptions) {
    if (tierOf(a.id, data.evidence) >= 2) {
      if (a.status === 'invalidated') xp += 15
      else if (a.status === 'validated') xp += 10
    }
  }
  for (const id of Object.keys(data.sideQuests)) {
    if (data.sideQuests[id] && data.sideQuests[id].completedAt) xp += 5
  }
  return xp
}

// Riskiest guardian = max weight × (4 − tier) among untested/testing.
function riskiestGuardian(data) {
  let best = null
  let bestScore = -1
  for (const a of data.assumptions) {
    if (a.status !== 'untested' && a.status !== 'testing') continue
    const score = (WEIGHT[a.importance] || 0) * (4 - tierOf(a.id, data.evidence))
    if (score > bestScore) {
      bestScore = score
      best = a
    }
  }
  return best
}

// Trough = mean of last ≤3 weather values ≤ 2. Suppresses the Shadow.
function inTrough(data) {
  const w = data.weather
  if (!w.length) return false
  const last = [...w].sort((x, y) => String(x.date).localeCompare(String(y.date))).slice(-3)
  const mean = last.reduce((s, x) => s + (x.value || 0), 0) / last.length
  return mean <= 2
}

/* ═══ Stage C: serialization ══════════════════════════════════════════════
   buildJournalMd is the SINGLE serializer for the Journal download and the
   Council's input. Family Dinner (dinnerCard/dinnerSession/dinnerLog) is
   structurally absent here — the one documented mode divergence is the
   Council Readings section (compact = last 3, truncated to 600 chars). */
const fmtPct = (x) => (x == null ? '—' : Math.round(x * 100) + '%')
const d10 = (s) => (s || '').slice(0, 10)

function serializeAnswer(a) {
  const parts = []
  if (a.text) parts.push(a.text)
  if (a.whys && a.whys.length) parts.push('Five Whys: ' + a.whys.filter(Boolean).join(' → '))
  if (a.ifPart || a.thenPart) {
    parts.push(
      `IF ${a.ifPart || '___'} / THEN ${a.thenPart || '___'}` +
        (a.withinDays ? ` / WITHIN ${a.withinDays} days` : ''),
    )
  }
  if (a.sealedAt) parts.push(`(sealed ${d10(a.sealedAt)})`)
  if (a.verdict) parts.push(`Verdict: ${a.verdict}`)
  if (a.decision) parts.push(`Decision: ${a.decision}`)
  if (a.citedEvidenceIds && a.citedEvidenceIds.length) parts.push(`Cited: ${a.citedEvidenceIds.join(', ')}`)
  return parts.join(' ')
}

function buildJournalMd(data, mode = 'full') {
  const L = []
  const truth = computeTruth(data)
  const milestonesDone = Object.values(data.milestones).filter(Boolean).length

  L.push("# Founder's Quest — Journal", '')
  L.push(
    `**Truth:** ${fmtPct(truth)} · **Action:** ${milestonesDone} milestones completed (self-reported) · **XP:** ${computeXP(data)}`,
    '',
  )

  if (data.assumptions.length) {
    L.push('## Assumptions (guardians)')
    for (const a of data.assumptions) {
      const tier = tierOf(a.id, data.evidence)
      L.push(
        `- [${a.status} · E${tier} · ${a.importance}] ${a.statement}` +
          (a.killCriterion ? ` — kill: ${a.killCriterion}` : '') +
          (a.resolvedAt ? ` (resolved ${d10(a.resolvedAt)})` : ''),
      )
    }
    L.push('')
  }

  if (data.evidence.length) {
    L.push('## Evidence ledger (E0–E4)')
    for (const e of data.evidence) {
      L.push(
        `- E${e.tier} ${TIER_NAME[e.tier] || ''} — ${e.text}` +
          (e.source ? ` (source: ${e.source})` : '') +
          (e.date ? ` [${d10(e.date)}]` : '') +
          (e.linkedAssumptionIds && e.linkedAssumptionIds.length
            ? ` → guardians: ${e.linkedAssumptionIds.join(', ')}`
            : ''),
      )
    }
    L.push('')
  }

  const answered = STAGES.filter((s) => data.answers[s.id] || data.fieldNotes[s.id])
  if (answered.length) {
    L.push('## The record')
    for (const s of answered) {
      L.push(`### Stage ${s.n} · ${s.name} — ${s.myth}`)
      const qa = data.answers[s.id] || {}
      for (const qid of Object.keys(qa)) {
        const line = serializeAnswer(qa[qid])
        if (line) L.push(`- **${qid}** ${line}`)
      }
      if (data.fieldNotes[s.id]) L.push(`- *Field notes:* ${data.fieldNotes[s.id]}`)
      L.push('')
    }
  }

  const gateKeys = Object.keys(data.gates)
  if (gateKeys.length) {
    L.push('## Gates')
    for (const k of gateKeys) {
      const g = data.gates[k]
      L.push(
        `- ${k}: ${g.status}` +
          (g.reason ? ` — override reason: ${g.reason}` : '') +
          (g.date ? ` [${d10(g.date)}]` : ''),
      )
    }
    L.push('')
  }

  if (data.trail.length) {
    L.push('## Trail')
    for (const t of data.trail) {
      L.push(
        `- ${t.type}: ${t.name || ''}` +
          (t.learning ? ` — learning: ${t.learning}` : '') +
          (t.critique ? ` — critique: ${t.critique}` : '') +
          (t.date ? ` [${d10(t.date)}]` : ''),
      )
    }
    L.push('')
  }

  if (data.weather.length) {
    L.push('## Weather trail')
    L.push(data.weather.map((w) => `${d10(w.date)}:${w.value} ${WEATHER_NAME[w.value] || ''}`.trim()).join(' · '))
    if (inTrough(data)) L.push('*(in the trough — last-3 mean ≤ 2)*')
    L.push('')
  }

  const sqIds = Object.keys(data.sideQuests)
  if (sqIds.length) {
    L.push('## Side quests')
    for (const id of sqIds) {
      const sq = data.sideQuests[id]
      L.push(`- ${id}: ${sq.completedAt ? 'completed' : 'in progress'}${sq.text ? ` — ${sq.text}` : ''}`)
    }
    L.push('')
  }

  if (data.council.length) {
    L.push('## Council Readings')
    const readings = mode === 'compact' ? data.council.slice(-3) : data.council
    for (const r of readings) {
      L.push(`### ${d10(r.date)} (${r.source || 'live'})`)
      if (mode === 'compact') {
        L.push((r.reading || '').slice(0, 600))
      } else {
        L.push(r.reading || '')
        if (r.commitment) L.push(`**Commitment:** ${r.commitment}`)
        if (r.followups && r.followups.length) {
          L.push('**Follow-ups:**')
          for (const f of r.followups) L.push(`- ${f.q} → ${f.a}`)
        }
      }
      L.push('')
    }
  }

  // dinnerCard / dinnerSession / dinnerLog are deliberately absent — Family
  // Dinner is structurally excluded from this serializer (canon 02/05).
  return L.join('\n').trim() + '\n'
}

// The Quest Brief — a separate, short export. It leads with the founder's own
// "going wrong right now" card (canon 02). The confidential Family Dinner
// session/log stay excluded.
function buildBriefMd(data) {
  const L = ["# Founder's Quest — Quest Brief", '']
  if (data.dinnerCard && data.dinnerCard.text) {
    L.push(`**Going wrong right now:** ${data.dinnerCard.text}`, '')
  }
  L.push(
    `**Truth:** ${fmtPct(computeTruth(data))} · **Action:** ${Object.values(data.milestones).filter(Boolean).length} milestones · **XP:** ${computeXP(data)}`,
  )
  const risk = riskiestGuardian(data)
  if (risk) L.push(`**Riskiest guardian:** ${risk.statement}${risk.killCriterion ? ` — kill: ${risk.killCriterion}` : ''}`)
  L.push('')
  const open = data.assumptions.filter((a) => a.status === 'untested' || a.status === 'testing')
  if (open.length) {
    L.push('## Open guardians')
    for (const a of open) L.push(`- [E${tierOf(a.id, data.evidence)} · ${a.importance}] ${a.statement}`)
    L.push('')
  }
  const last = data.council[data.council.length - 1]
  if (last && last.commitment) L.push(`**Last commitment:** ${last.commitment}`)
  return L.join('\n').trim() + '\n'
}

/* ── React binding: load once, persist on change ─────────────────────── */
function useQuestData() {
  const storeRef = useRef(null)
  if (!storeRef.current) storeRef.current = makeStore()
  const store = storeRef.current
  const [data, setData] = useState(() => loadData(store))
  useEffect(() => {
    store.set(DATA_KEY, JSON.stringify(data))
  }, [data, store])
  return { data, setData, store, persistent: store.persistent }
}

/* ── injected styles Tailwind core doesn't cover (canon 02) ──────────── */
function QuestStyles() {
  return (
    <style>{`
      .text-2xs { font-size: 11px; line-height: 1.35; }
      .z-vault { z-index: 40; }
      .z-modal { z-index: 50; }
      .z-toast { z-index: 60; }
      .vault-blur { filter: blur(6px); user-select: none; pointer-events: none; }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
          scroll-behavior: auto !important;
        }
      }
    `}</style>
  )
}

// Honest banner when storage is unavailable — says what happened + what to do.
function StorageBanner() {
  return (
    <div
      role="status"
      className="z-toast bg-amber-950 text-amber-100 text-sm px-4 py-2 text-center border-b border-amber-800"
    >
      This browser blocked local storage, so this session lives in memory only —
      it won't survive a refresh. Export your Journal before you leave to keep it.
    </div>
  )
}

/* ═══ Stage D1: the instrument shell ═════════════════════════════════════
   Stage navigation (gates warn, never block — every stage is reachable),
   typed question inputs, field notes, self-reported milestones, and the
   Act-I Vault capture-nudge. Registry/Ledger/Gates/Vault-seal/Thread and
   the Council layer on in D2–D4 / E–F. */
const uid = (p) => p + Math.random().toString(36).slice(2, 9)
const nowISO = () => new Date().toISOString()

const PLACEHOLDER = {
  prose: 'Write plainly.',
  story: 'Tell it as it happened…',
  names: 'One per line — real names, no personas.',
  number: 'A number — and how often.',
  list: 'One per line.',
  verbatim: 'Paste their exact words…',
  falsify: 'Be honest about what you actually see.',
}

// Special types still awaiting their mechanic (arrive in D3). Text is saved now.
const PENDING_MECHANIC = {
  seal: "Ariadne's Thread",
  verdict: 'the verdict seal',
  vault: 'the Vault picker',
  spine: 'the evidence-locked Story Forge',
}

function useInstrument() {
  const q = useQuestData()
  const { setData } = q
  const patchAnswer = (stageId, qid, patch) =>
    setData((d) => ({
      ...d,
      answers: {
        ...d.answers,
        [stageId]: {
          ...(d.answers[stageId] || {}),
          [qid]: { ...((d.answers[stageId] || {})[qid] || {}), ...patch },
        },
      },
    }))
  const setFieldNote = (stageId, text) =>
    setData((d) => ({ ...d, fieldNotes: { ...d.fieldNotes, [stageId]: text } }))
  const toggleMilestone = (id) =>
    setData((d) => ({ ...d, milestones: { ...d.milestones, [id]: !d.milestones[id] } }))
  const captureVault = (text) =>
    setData((d) => ({
      ...d,
      vault: [...d.vault, { id: uid('v'), text, date: nowISO() }],
    }))
  // ── Registry (guardians) — tiers are DERIVED, never set here ──
  const addGuardian = (g) =>
    setData((d) => ({
      ...d,
      assumptions: [
        ...d.assumptions,
        {
          id: uid('a'),
          statement: (g.statement || '').trim(),
          originStageId: g.originStageId || null,
          importance: g.importance || 'wobbles',
          status: 'untested',
          killCriterion: g.killCriterion || '',
          createdAt: nowISO(),
          resolvedAt: null,
        },
      ],
    }))
  const updateGuardian = (id, patch) =>
    setData((d) => ({
      ...d,
      assumptions: d.assumptions.map((a) => {
        if (a.id !== id) return a
        const next = { ...a, ...patch }
        const resolved = next.status === 'validated' || next.status === 'invalidated'
        next.resolvedAt = resolved ? a.resolvedAt || nowISO() : null
        return next
      }),
    }))
  const removeGuardian = (id) =>
    setData((d) => ({
      ...d,
      assumptions: d.assumptions.filter((a) => a.id !== id),
      evidence: d.evidence.map((e) => ({
        ...e,
        linkedAssumptionIds: (e.linkedAssumptionIds || []).filter((x) => x !== id),
      })),
    }))
  // ── Ledger (evidence) — the tier lives here; guardians inherit the max ──
  const addEvidence = (ev) =>
    setData((d) => ({
      ...d,
      evidence: [
        ...d.evidence,
        {
          id: uid('e'),
          tier: Number(ev.tier) || 0,
          text: (ev.text || '').trim(),
          source: ev.source || '',
          linkedAssumptionIds: ev.linkedAssumptionIds || [],
          stageId: ev.stageId || null,
          date: nowISO(),
        },
      ],
    }))
  const updateEvidence = (id, patch) =>
    setData((d) => ({ ...d, evidence: d.evidence.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const removeEvidence = (id) =>
    setData((d) => ({ ...d, evidence: d.evidence.filter((e) => e.id !== id) }))
  const toggleEvidenceLink = (evId, aId) =>
    setData((d) => ({
      ...d,
      evidence: d.evidence.map((e) => {
        if (e.id !== evId) return e
        const has = (e.linkedAssumptionIds || []).includes(aId)
        return {
          ...e,
          linkedAssumptionIds: has
            ? e.linkedAssumptionIds.filter((x) => x !== aId)
            : [...(e.linkedAssumptionIds || []), aId],
        }
      }),
    }))
  return {
    ...q,
    patchAnswer,
    setFieldNote,
    toggleMilestone,
    captureVault,
    addGuardian,
    updateGuardian,
    removeGuardian,
    addEvidence,
    updateEvidence,
    removeEvidence,
    toggleEvidenceLink,
  }
}

function Bar({ label, pct, sub }) {
  return (
    <div className="flex-1 min-w-[110px]">
      <div className="flex justify-between text-2xs uppercase tracking-wider text-neutral-400">
        <span>{label}</span>
        <span>{sub}</span>
      </div>
      <div className="mt-1 h-1.5 rounded bg-neutral-800 overflow-hidden">
        <div className="h-full bg-neutral-300 transition-all" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  )
}

function ProgressHeader({ data }) {
  const truth = computeTruth(data)
  const done = Object.values(data.milestones).filter(Boolean).length
  return (
    <header className="sticky top-0 z-modal bg-neutral-950/90 backdrop-blur border-b border-neutral-800 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center gap-4">
        <div className="text-sm font-semibold tracking-tight whitespace-nowrap">Founder's Quest</div>
        <Bar label="Truth" pct={truth == null ? 0 : truth * 100} sub={fmtPct(truth)} />
        <Bar label="Action" pct={MILESTONE_TOTAL ? (done / MILESTONE_TOTAL) * 100 : 0} sub={`${done}/${MILESTONE_TOTAL}`} />
        <div className="text-2xs uppercase tracking-wider text-neutral-400 whitespace-nowrap">XP {computeXP(data)}</div>
      </div>
    </header>
  )
}

function StageRail({ current, setCurrent, data }) {
  return (
    <nav className="max-w-3xl mx-auto px-4 py-3 flex gap-1 overflow-x-auto">
      {STAGES.map((s) => {
        const answered = data.answers[s.id] && Object.keys(data.answers[s.id]).length
        const active = s.id === current
        return (
          <button
            key={s.id}
            onClick={() => setCurrent(s.id)}
            className={
              'shrink-0 rounded px-2.5 py-1.5 text-left transition ' +
              (active ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800')
            }
          >
            <div className="text-2xs uppercase tracking-wider opacity-70">Stage {s.n}{answered ? ' ·' : ''}</div>
            <div className="text-xs font-medium whitespace-nowrap">{s.name}</div>
          </button>
        )
      })}
    </nav>
  )
}

function ProseInput({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full mt-2 rounded bg-neutral-900 border border-neutral-800 focus:border-neutral-600 outline-none p-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 resize-y"
    />
  )
}

function FiveWhysInput({ whys, onChange }) {
  const arr = whys && whys.length ? whys : ['']
  const set = (i, v) => {
    const next = [...arr]
    next[i] = v
    onChange(next)
  }
  return (
    <div className="mt-2 space-y-2">
      {arr.map((w, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-2xs text-neutral-500 mt-2 w-12 shrink-0">why {i + 1}</span>
          <input
            value={w}
            onChange={(e) => set(i, e.target.value)}
            placeholder={i === 0 ? 'Because…' : 'And why is that?'}
            className="flex-1 rounded bg-neutral-900 border border-neutral-800 focus:border-neutral-600 outline-none p-2 text-sm"
          />
        </div>
      ))}
      {arr.length < 5 && (
        <button onClick={() => onChange([...arr, ''])} className="text-xs text-neutral-400 hover:text-neutral-200">
          + dig one why deeper
        </button>
      )}
    </div>
  )
}

function IfThenInput({ answer, onPatch }) {
  const field = 'w-full mt-1 rounded bg-neutral-900 border border-neutral-800 focus:border-neutral-600 outline-none p-2 text-sm'
  return (
    <div className="mt-2 space-y-2">
      <label className="block">
        <span className="text-2xs uppercase tracking-wider text-neutral-500">IF</span>
        <input value={answer.ifPart || ''} onChange={(e) => onPatch({ ifPart: e.target.value })} placeholder="the condition you're betting on" className={field} />
      </label>
      <label className="block">
        <span className="text-2xs uppercase tracking-wider text-neutral-500">THEN when [segment] meets [prototype], we will observe</span>
        <input value={answer.thenPart || ''} onChange={(e) => onPatch({ thenPart: e.target.value })} placeholder="the behavior you'll see" className={field} />
      </label>
      <label className="block w-40">
        <span className="text-2xs uppercase tracking-wider text-neutral-500">WITHIN (days)</span>
        <input type="number" min="1" value={answer.withinDays || ''} onChange={(e) => onPatch({ withinDays: e.target.value })} className={field} />
      </label>
    </div>
  )
}

// Gentle nudge in Act I: solution language → capture to the Vault, return to the problem.
function VaultNudge({ text, onCapture }) {
  const [captured, setCaptured] = useState(false)
  const m = text && text.match(VAULT_RE)
  if (captured) return <p className="mt-1.5 text-2xs text-emerald-400">Captured to the Vault. Now — back to the problem.</p>
  if (!m) return null
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-2xs text-amber-300">
      <span>That sounds like a solution ("{m[0]}"). This stage is about the problem — seal the idea for later.</span>
      <button
        onClick={() => { onCapture(text); setCaptured(true) }}
        className="rounded bg-amber-900/60 px-2 py-0.5 text-amber-100 hover:bg-amber-900"
      >
        Capture to Vault
      </button>
    </div>
  )
}

function QuestionCard({ q, answer, onPatch, isActI, onCaptureVault, data, mut }) {
  const text = answer.text || ''
  const registersGuardian = q.type === 'quickadd' || q.id === 's3-l2' || q.id === 's7-th'
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      {q.badge && <div className="text-2xs uppercase tracking-widest text-amber-300 mb-1">✦ {q.badge}</div>}
      <p className="text-sm text-neutral-100">{q.text}</p>
      <p className="text-2xs text-neutral-500 mt-1">{q.hint}</p>

      {q.type === 'fivewhys' ? (
        <FiveWhysInput whys={answer.whys} onChange={(whys) => onPatch({ whys })} />
      ) : q.type === 'ifthen' ? (
        <IfThenInput answer={answer} onPatch={onPatch} />
      ) : q.type === 'registry' ? (
        <>
          <ProseInput value={text} onChange={(v) => onPatch({ text: v })} placeholder="Name the belief you're burying." rows={2} />
          <FuneralPicker data={data} mut={mut} />
        </>
      ) : q.type === 'decision' ? (
        <DecisionInput answer={answer} onPatch={onPatch} data={data} />
      ) : (
        <>
          <ProseInput value={text} onChange={(v) => onPatch({ text: v })} placeholder={PLACEHOLDER[q.type] || 'Write plainly.'} />
          {isActI && <VaultNudge text={text} onCapture={onCaptureVault} />}
          {PENDING_MECHANIC[q.type] && (
            <p className="mt-1.5 text-2xs text-neutral-500 italic">
              Full {PENDING_MECHANIC[q.type]} lands in the next slice — your words are saved.
            </p>
          )}
        </>
      )}

      {registersGuardian && (
        <QuickAddGuardianInline
          onAdd={mut.addGuardian}
          originStageId={q.stageId}
          placeholder={q.type === 'quickadd' ? 'This only works if…' : q.id === 's3-l2' ? 'Register the IF as a guardian…' : "Any figure you don't know — register it…"}
        />
      )}
    </div>
  )
}

function StageView({ stageId, data, mut }) {
  const stage = STAGES.find((s) => s.id === stageId)
  const qs = QUESTIONS.filter((q) => q.stageId === stageId)
  const answers = data.answers[stageId] || {}
  const isActI = stage.act === 1
  return (
    <section className="max-w-3xl mx-auto px-4 pb-24">
      <div className="pt-4 pb-3">
        <div className="text-2xs uppercase tracking-[0.2em] text-neutral-500">
          Stage {stage.n} · {stage.myth} · {stage.symbol}
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">{stage.name}</h2>
      </div>

      {STAGE_BANNERS[stageId] && (
        <div className="mb-4 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-300">
          {STAGE_BANNERS[stageId]}
        </div>
      )}

      <div className="space-y-3">
        {qs.map((q) => (
          <React.Fragment key={q.id}>
            {SECTIONS[q.id] && (
              <h3 className="pt-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">{SECTIONS[q.id]}</h3>
            )}
            <QuestionCard
              q={q}
              answer={answers[q.id] || {}}
              onPatch={(patch) => mut.patchAnswer(stageId, q.id, patch)}
              isActI={isActI}
              onCaptureVault={mut.captureVault}
              data={data}
              mut={mut}
            />
          </React.Fragment>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Field notes</h3>
        <ProseInput
          value={data.fieldNotes[stageId] || ''}
          onChange={(v) => mut.setFieldNote(stageId, v)}
          placeholder="Anything else worth recording for this stage."
        />
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Milestones <span className="text-neutral-600">· self-reported</span>
        </h3>
        <div className="mt-2 space-y-1.5">
          {(MILESTONES[stageId] || []).map((label, i) => {
            const id = `${stageId}-m${i}`
            const on = !!data.milestones[id]
            return (
              <button key={id} onClick={() => mut.toggleMilestone(id)} className="flex items-center gap-2 text-sm text-left">
                <span className={'flex h-4 w-4 items-center justify-center rounded border ' + (on ? 'bg-neutral-100 border-neutral-100 text-neutral-900' : 'border-neutral-600')}>
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
                <span className={on ? 'text-neutral-200' : 'text-neutral-400'}>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ═══ Stage D2: Assumption Registry + Evidence Ledger ════════════════════ */
const IMPORTANCE_OPTS = [
  { v: 'dies', label: 'dies · kills the venture (3)' },
  { v: 'wobbles', label: 'wobbles · shakes it (2)' },
  { v: 'shrugs', label: 'shrugs · minor (1)' },
]
const STATUS_OPTS = ['untested', 'testing', 'validated', 'invalidated']
const TIERS = [
  { v: 0, name: 'Hunch' },
  { v: 1, name: 'Heard' },
  { v: 2, name: 'Said' },
  { v: 3, name: 'Seen' },
  { v: 4, name: 'Paid' },
]
const selectCls = 'rounded bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 px-2 py-1 outline-none focus:border-neutral-600'
const fieldCls = 'w-full rounded bg-neutral-900 border border-neutral-800 focus:border-neutral-600 outline-none p-2 text-sm text-neutral-100 placeholder:text-neutral-600'
const primaryBtn = 'rounded bg-neutral-100 text-neutral-900 text-sm font-medium px-3 py-1.5 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed'

function TierPill({ tier }) {
  const color =
    tier >= 4
      ? 'bg-amber-900/50 text-amber-200 border-amber-700'
      : tier === 3
        ? 'bg-emerald-900/50 text-emerald-200 border-emerald-700'
        : tier === 2
          ? 'bg-sky-900/50 text-sky-200 border-sky-700'
          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
  return (
    <span className={'inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-2xs font-medium ' + color}>
      E{tier} · {TIERS[tier].name}
    </span>
  )
}

function AddGuardianForm({ onAdd, originStageId = null }) {
  const [statement, setStatement] = useState('')
  const [importance, setImportance] = useState('wobbles')
  const [kill, setKill] = useState('')
  const submit = () => {
    if (!statement.trim()) return
    onAdd({ statement, importance, killCriterion: kill, originStageId })
    setStatement('')
    setKill('')
    setImportance('wobbles')
  }
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 space-y-2">
      <textarea value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="The assumption that could kill this — stated plainly." rows={2} className={fieldCls} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs uppercase tracking-wider text-neutral-500">Importance</span>
        <select value={importance} onChange={(e) => setImportance(e.target.value)} className={selectCls}>
          {IMPORTANCE_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>
      </div>
      <input value={kill} onChange={(e) => setKill(e.target.value)} placeholder="Kill criterion — the result that would prove it false." className={fieldCls} />
      <button onClick={submit} disabled={!statement.trim()} className={primaryBtn}>Add guardian</button>
    </div>
  )
}

function GuardianCard({ a, data, mut, riskiest }) {
  const tier = tierOf(a.id, data.evidence)
  const linkedCount = data.evidence.filter((e) => (e.linkedAssumptionIds || []).includes(a.id)).length
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-neutral-100">{a.statement}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {riskiest && <span className="rounded border border-rose-700 bg-rose-900/50 px-1.5 py-0.5 text-2xs text-rose-200">Riskiest</span>}
          <TierPill tier={tier} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <select value={a.importance} onChange={(e) => mut.updateGuardian(a.id, { importance: e.target.value })} className={selectCls}>
          {IMPORTANCE_OPTS.map((o) => <option key={o.v} value={o.v}>{o.v}</option>)}
        </select>
        <select value={a.status} onChange={(e) => mut.updateGuardian(a.id, { status: e.target.value })} className={selectCls}>
          {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-2xs text-neutral-500">{linkedCount} linked</span>
        <button onClick={() => mut.removeGuardian(a.id)} className="ml-auto text-2xs text-neutral-500 hover:text-rose-400">remove</button>
      </div>
      <input value={a.killCriterion || ''} onChange={(e) => mut.updateGuardian(a.id, { killCriterion: e.target.value })} placeholder="Kill criterion — what would prove it false?" className={fieldCls + ' mt-2 text-xs'} />
    </div>
  )
}

function RegistryView({ data, mut }) {
  const risk = riskiestGuardian(data)
  return (
    <section className="max-w-3xl mx-auto px-4 pt-4 pb-24">
      <h2 className="text-xl font-semibold tracking-tight">Assumption Registry</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Guardians are the assumptions that could kill the venture. Their evidence tier is <em>derived</em> from the ledger — a founder never grades their own proof.
      </p>
      <div className="mt-4"><AddGuardianForm onAdd={mut.addGuardian} /></div>
      <div className="mt-4 space-y-2">
        {data.assumptions.length === 0 && (
          <p className="text-sm italic text-neutral-500">No guardians yet. The first ones usually come from Stage 1 — "this only works if…".</p>
        )}
        {data.assumptions.map((a) => (
          <GuardianCard key={a.id} a={a} data={data} mut={mut} riskiest={risk && risk.id === a.id} />
        ))}
      </div>
    </section>
  )
}

function AddEvidenceForm({ data, onAdd }) {
  const [tier, setTier] = useState(2)
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [links, setLinks] = useState([])
  const submit = () => {
    if (!text.trim()) return
    onAdd({ tier, text, source, linkedAssumptionIds: links })
    setText('')
    setSource('')
    setLinks([])
    setTier(2)
  }
  const toggle = (id) => setLinks((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs uppercase tracking-wider text-neutral-500">Tier</span>
        <select value={tier} onChange={(e) => setTier(Number(e.target.value))} className={selectCls}>
          {TIERS.map((t) => <option key={t.v} value={t.v}>E{t.v} · {t.name}</option>)}
        </select>
        {tier < 2 && <span className="text-2xs text-amber-300">E0–E1 won't move Truth — decoration until tested.</span>}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened — a quote, a behavior, a payment." rows={2} className={fieldCls} />
      <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source — who, where." className={fieldCls} />
      {data.assumptions.length > 0 && (
        <div>
          <div className="mb-1 text-2xs uppercase tracking-wider text-neutral-500">Link to guardians</div>
          <div className="flex flex-wrap gap-1.5">
            {data.assumptions.map((a) => (
              <button key={a.id} onClick={() => toggle(a.id)} className={'rounded border px-2 py-0.5 text-2xs ' + (links.includes(a.id) ? 'border-neutral-100 bg-neutral-100 text-neutral-900' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500')}>
                {a.statement.slice(0, 32)}{a.statement.length > 32 ? '…' : ''}
              </button>
            ))}
          </div>
        </div>
      )}
      <button onClick={submit} disabled={!text.trim()} className={primaryBtn}>Log evidence</button>
    </div>
  )
}

function EvidenceCard({ e, data, mut }) {
  const linked = data.assumptions.filter((a) => (e.linkedAssumptionIds || []).includes(a.id))
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-neutral-100">{e.text}</p>
        <TierPill tier={e.tier} />
      </div>
      {e.source && <p className="mt-1 text-2xs text-neutral-500">— {e.source}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {linked.map((a) => (
          <span key={a.id} className="rounded bg-neutral-800 px-1.5 py-0.5 text-2xs text-neutral-300">→ {a.statement.slice(0, 28)}{a.statement.length > 28 ? '…' : ''}</span>
        ))}
        <button onClick={() => mut.removeEvidence(e.id)} className="ml-auto text-2xs text-neutral-500 hover:text-rose-400">remove</button>
      </div>
    </div>
  )
}

function LedgerView({ data, mut }) {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-4 pb-24">
      <h2 className="text-xl font-semibold tracking-tight">Evidence Ledger</h2>
      <p className="mt-1 text-sm text-neutral-400">
        E0 Hunch · E1 Heard · E2 Said · E3 Seen · E4 Paid. Only <strong>E2+</strong> moves Truth; invalidating an assumption pays 1.5× validating one.
      </p>
      <div className="mt-4"><AddEvidenceForm data={data} onAdd={mut.addEvidence} /></div>
      <div className="mt-4 space-y-2">
        {data.evidence.length === 0 && (
          <p className="text-sm italic text-neutral-500">No evidence yet. A quote you heard is E2; a behavior you saw is E3; a payment is E4.</p>
        )}
        {data.evidence.map((e) => <EvidenceCard key={e.id} e={e} data={data} mut={mut} />)}
      </div>
    </section>
  )
}

function ViewTabs({ view, setView, tabs }) {
  return (
    <nav className="max-w-3xl mx-auto flex gap-1 px-4 pt-3">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setView(t.id)}
          className={'rounded-t px-3 py-1.5 text-xs font-medium ' + (view === t.id ? 'bg-neutral-900 text-neutral-100 border-b-2 border-neutral-100' : 'text-neutral-400 hover:text-neutral-200')}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}

// In-question mechanics wired to the Registry/Ledger (Stage D2).
function QuickAddGuardianInline({ onAdd, originStageId, placeholder }) {
  const [text, setText] = useState('')
  const [importance, setImportance] = useState('wobbles')
  const submit = () => {
    if (!text.trim()) return
    onAdd({ statement: text, importance, originStageId })
    setText('')
    setImportance('wobbles')
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-neutral-800 pt-2">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className={fieldCls + ' flex-1 min-w-[200px]'} />
      <select value={importance} onChange={(e) => setImportance(e.target.value)} className={selectCls}>
        {IMPORTANCE_OPTS.map((o) => <option key={o.v} value={o.v}>{o.v}</option>)}
      </select>
      <button onClick={submit} disabled={!text.trim()} className="rounded bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-100 hover:bg-neutral-700 disabled:opacity-40">
        + guardian
      </button>
    </div>
  )
}

// s5-l5 · the funeral — mark a live belief invalidated (XP follows the tier≥2 rule).
function FuneralPicker({ data, mut }) {
  const open = data.assumptions.filter((a) => a.status === 'untested' || a.status === 'testing')
  if (!open.length) {
    return <p className="mt-2 text-2xs italic text-neutral-500">No open guardians to bury yet. Register your Stage-1 beliefs first, then return here.</p>
  }
  return (
    <div className="mt-2 space-y-1.5">
      {open.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-2 rounded border border-neutral-800 bg-neutral-900/40 px-2.5 py-1.5">
          <span className="text-xs text-neutral-200">
            {a.statement}
            {a.originStageId === 's1' && <span className="ml-1.5 text-2xs text-neutral-500">· Stage 1</span>}
          </span>
          <button onClick={() => mut.updateGuardian(a.id, { status: 'invalidated' })} className="shrink-0 rounded border border-rose-700 bg-rose-900/50 px-2 py-0.5 text-2xs text-rose-200 hover:bg-rose-900">
            Hold the funeral
          </button>
        </div>
      ))}
    </div>
  )
}

// s5-dec · pivot/persevere, locked until cited to ≥1 ledger entry.
function DecisionInput({ answer, onPatch, data }) {
  const cited = answer.citedEvidenceIds || []
  const decision = answer.decision || ''
  const locked = cited.length === 0
  const toggleCite = (id) =>
    onPatch({ citedEvidenceIds: cited.includes(id) ? cited.filter((x) => x !== id) : [...cited, id] })
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2">
        {['pivot', 'persevere'].map((d) => (
          <button
            key={d}
            onClick={() => !locked && onPatch({ decision: d })}
            disabled={locked}
            className={
              'rounded border px-3 py-1.5 text-sm capitalize ' +
              (decision === d ? 'border-neutral-100 bg-neutral-100 text-neutral-900' : 'border-neutral-700 text-neutral-300') +
              (locked ? ' cursor-not-allowed opacity-40' : '')
            }
          >
            {d}
          </button>
        ))}
      </div>
      <div>
        <div className="mb-1 text-2xs uppercase tracking-wider text-neutral-500">
          Cite the evidence that decides it {locked && <span className="text-amber-300">· required to unlock</span>}
        </div>
        {data.evidence.length === 0 ? (
          <p className="text-2xs italic text-neutral-500">No ledger entries yet — the decision stays locked until at least one citation.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {data.evidence.map((e) => (
              <button key={e.id} onClick={() => toggleCite(e.id)} className={'rounded border px-2 py-0.5 text-2xs ' + (cited.includes(e.id) ? 'border-neutral-100 bg-neutral-100 text-neutral-900' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500')}>
                E{e.tier} · {e.text.slice(0, 24)}{e.text.length > 24 ? '…' : ''}
              </button>
            ))}
          </div>
        )}
      </div>
      {!locked && decision && (
        <p className="text-2xs text-emerald-400">Decision recorded: {decision}, cited to {cited.length} entr{cited.length === 1 ? 'y' : 'ies'}.</p>
      )}
    </div>
  )
}

/* ── app root ─────────────────────────────────────────────────────────── */
const VIEW_TABS = [
  { id: 'quest', label: 'Quest' },
  { id: 'registry', label: 'Registry' },
  { id: 'ledger', label: 'Ledger' },
]

export default function App() {
  const mut = useInstrument()
  const { data, persistent } = mut
  const [view, setView] = useState('quest')
  const [current, setCurrent] = useState('s1')
  return (
    <>
      <QuestStyles />
      {!persistent && <StorageBanner />}
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <ProgressHeader data={data} />
        <ViewTabs view={view} setView={setView} tabs={VIEW_TABS} />
        {view === 'quest' && (
          <>
            <StageRail current={current} setCurrent={setCurrent} data={data} />
            <StageView stageId={current} data={data} mut={mut} />
          </>
        )}
        {view === 'registry' && <RegistryView data={data} mut={mut} />}
        {view === 'ledger' && <LedgerView data={data} mut={mut} />}
      </div>
    </>
  )
}
