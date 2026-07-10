import React, { useState, useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════════════
   Founder's Quest v3 — the static instrument. Single default export.
   Stage B: data model · storage ladder · migration.
   Stage C: computed metrics · buildJournalMd (single serializer) · Brief.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── content: the stage spine (canon 03 headers) ──────────────────────── */
const STAGES = [
  { id: 's1', n: 1, name: 'The Problem', myth: 'The Call to Adventure', symbol: 'Swirling Nebula' },
  { id: 's2', n: 2, name: 'Research', myth: 'Meeting the Mentor', symbol: 'The Raven' },
  { id: 's3', n: 3, name: 'Prototyping', myth: 'The Approach', symbol: 'The Phoenix' },
  { id: 's4', n: 4, name: 'Testing', myth: 'Crossing the Threshold', symbol: 'The Labyrinth' },
  { id: 's5', n: 5, name: 'Feedback', myth: 'Tests, Allies & Enemies', symbol: 'The Mirror' },
  { id: 's6', n: 6, name: 'Refinement', myth: 'The Ordeal', symbol: 'The Sculptor' },
  { id: 's7', n: 7, name: 'Implementation', myth: 'The Road Back', symbol: 'The Bridge' },
  { id: 's8', n: 8, name: 'Launch', myth: 'Return with the Elixir', symbol: 'The Rocket' },
]

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

/* ── app root (Stages D–G build on this) ─────────────────────────────── */
export default function App() {
  const { data, persistent } = useQuestData()
  const truth = computeTruth(data)
  return (
    <>
      <QuestStyles />
      {!persistent && <StorageBanner />}
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Founder's Quest</h1>
          <p className="mt-3 text-neutral-400">
            Progress is validated learning, not completed checkboxes.
          </p>
          <p className="mt-6 text-2xs uppercase tracking-[0.2em] text-neutral-600">
            Truth {fmtPct(truth)} · {data.assumptions.length} guardians · {data.evidence.length} ledger entries
          </p>
        </div>
      </main>
    </>
  )
}
