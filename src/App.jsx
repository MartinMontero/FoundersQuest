import React from 'react'

// Styles Tailwind core doesn't cover — injected once, per canon 02:
// text-2xs = 11px, z-layers, vault blur, reduced-motion.
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

// Stage A scaffold — the boot screen. The instrument (8 stages, registry,
// ledger, gates, vault, thread, council) lands in Stage D onward.
export default function App() {
  return (
    <>
      <QuestStyles />
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Founder's Quest</h1>
          <p className="mt-3 text-neutral-400">
            Progress is validated learning, not completed checkboxes.
          </p>
          <p className="mt-6 text-2xs uppercase tracking-[0.2em] text-neutral-600">
            The crucible
          </p>
        </div>
      </main>
    </>
  )
}
