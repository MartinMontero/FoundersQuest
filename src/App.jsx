import React, { useState, useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════════════
   Founder's Quest v3 — the static instrument. Single default export.
   Stage B: data model · storage ladder · legacy migration.
   ═══════════════════════════════════════════════════════════════════════ */

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
  dinnerCard: null, //          { text, updatedAt }         — excluded from all serialization
  dinnerSession: null, //       { date, cards, timer } | null
  dinnerLog: [], //             [{ date, cards, spoke, matches }]
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
  // milestones intentionally omitted — see note above.
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

/* ── app root (Stage B: data layer wired; the instrument arrives in D) ── */
export default function App() {
  const { data, persistent } = useQuestData()
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
            {data.assumptions.length} guardians · {data.evidence.length} ledger entries
          </p>
        </div>
      </main>
    </>
  )
}
