'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  prefinalAuditSpecimens,
  prefinalVisualPrinciples,
  scorePrefinalDesignAudit,
  UxAuditCategory
} from '@/data/prefinalQuestions'
import { shuffleArray } from '@/lib/examUtils'
import { AuditSpecimenVisual, PrincipleSpecimenVisual } from '@/components/DesignSpecimenPreview'
import {
  AlertCircle,
  GripVertical,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw
} from 'lucide-react'

interface Props {
  studentName: string
  violationCount: number
  onScoreChange: (score: number) => void
  onComplete: (finalPart2Score: number) => void
}

interface DragAuditState {
  specimenId: string
  startX: number
  startY: number
  x: number
  y: number
  offsetX: number
  offsetY: number
  width: number
  isDragging: boolean
}

export function PrefinalDesignAuditStudio({
  studentName,
  violationCount,
  onScoreChange,
  onComplete
}: Props) {
  const [screen, setScreen] = useState<1 | 2>(1)
  const [classifications, setClassifications] = useState<Record<string, UxAuditCategory>>({})
  const [principleAnswers, setPrincipleAnswers] = useState<Record<string, string>>({})
  const [dragState, setDragState] = useState<DragAuditState | null>(null)
  const [hoveredBucket, setHoveredBucket] = useState<UxAuditCategory | 'QUEUE' | null>(null)

  // Shuffle specimens and principle option orders once on mount
  const shuffledSpecimens = useMemo(() => shuffleArray(prefinalAuditSpecimens), [])
  const shuffledPrincipleOptions = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const vp of prefinalVisualPrinciples) {
      map[vp.id] = shuffleArray(vp.options)
    }
    return map
  }, [])

  // Keep parent score in sync for anti-cheat auto-submit
  useEffect(() => {
    onScoreChange(scorePrefinalDesignAudit(classifications, principleAnswers))
  }, [classifications, principleAnswers, onScoreChange])

  const assignCategory = useCallback((specimenId: string, category: UxAuditCategory | null) => {
    setClassifications((prev) => {
      const next = { ...prev }
      if (category === null) {
        delete next[specimenId]
      } else {
        next[specimenId] = category
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!dragState) return

    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startX
      const dy = e.clientY - dragState.startY
      const moved = dragState.isDragging || Math.hypot(dx, dy) > 5

      setDragState((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY, isDragging: moved } : null
      )

      if (!moved) return

      const stack = document.elementsFromPoint(e.clientX, e.clientY)
      let found: UxAuditCategory | 'QUEUE' | null = null
      for (const el of stack) {
        const attr = el.getAttribute('data-audit-bucket')
        if (attr === 'GOOD_UX' || attr === 'AI_SLOP' || attr === 'QUEUE') {
          found = attr
          break
        }
      }
      setHoveredBucket(found)
    }

    const handleUp = () => {
      if (dragState.isDragging && hoveredBucket) {
        assignCategory(
          dragState.specimenId,
          hoveredBucket === 'QUEUE' ? null : hoveredBucket
        )
      }
      setDragState(null)
      setHoveredBucket(null)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [dragState, hoveredBucket, assignCategory])

  const startDrag = (e: React.PointerEvent<HTMLElement>, specimenId: string) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    if ((e.target as HTMLElement).closest('button')) return

    const rect = e.currentTarget.getBoundingClientRect()
    setDragState({
      specimenId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: Math.min(rect.width, 380),
      isDragging: false
    })
  }

  const auditDoneCount = Object.keys(classifications).length
  const principlesDoneCount = Object.keys(principleAnswers).length
  const allAuditDone = auditDoneCount === shuffledSpecimens.length
  const allPrinciplesDone = principlesDoneCount === prefinalVisualPrinciples.length

  const unassignedSpecimens = shuffledSpecimens.filter((s) => !classifications[s.id])
  const goodUxSpecimens = shuffledSpecimens.filter((s) => classifications[s.id] === 'GOOD_UX')
  const aiSlopSpecimens = shuffledSpecimens.filter((s) => classifications[s.id] === 'AI_SLOP')

  const draggedSpecimen = dragState
    ? shuffledSpecimens.find((s) => s.id === dragState.specimenId) || null
    : null

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-5 sm:py-7">
      <div className="w-full max-w-5xl flex flex-col space-y-4">
        {/* Top Floating Glass Bar */}
        <header className="liquid-glass-bar rounded-2xl px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 text-xs">
            <span className="font-semibold text-[#1d1d1f]">Pre-Final Exam</span>
            <span className="text-[#6e6e73]">·</span>
            <span className="font-medium text-[#515154] truncate max-w-[180px] sm:max-w-xs">
              {studentName}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="flex items-center bg-black/[0.045] p-1 rounded-xl border border-black/[0.05]">
              <button
                type="button"
                onClick={() => setScreen(1)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium liquid-transition flex items-center space-x-1.5 ${
                  screen === 1 ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#515154] hover:text-[#1d1d1f]'
                }`}
              >
                <span>1 · Good UX vs AI Slop</span>
                {allAuditDone && <Check className="w-3 h-3 text-[#0071e3]" />}
              </button>
              <button
                type="button"
                onClick={() => setScreen(2)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium liquid-transition flex items-center space-x-1.5 ${
                  screen === 2 ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#515154] hover:text-[#1d1d1f]'
                }`}
              >
                <span>2 · Design Principles</span>
                {allPrinciplesDone && <Check className="w-3 h-3 text-[#0071e3]" />}
              </button>
            </div>

            <span className="text-xs font-medium text-[#515154] tabular-nums hidden sm:inline">
              {auditDoneCount + principlesDoneCount}/10 answered
            </span>

            {violationCount > 0 && (
              <span className="inline-flex items-center space-x-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-medium text-red-700 tabular-nums">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{violationCount}/3</span>
              </span>
            )}
          </div>
        </header>

        {/* SCREEN 1: GOOD UX VS AI SLOP CLASSIFIER */}
        {screen === 1 && (
          <section
            key="screen-1"
            className="liquid-glass rounded-3xl p-5 sm:p-7 flex flex-col space-y-6 animate-liquid-enter"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-black/[0.06] pb-4">
              <div className="space-y-1.5 max-w-[68ch]">
                <div className="flex items-center space-x-2 text-xs text-[#515154]">
                  <span className="font-semibold text-[#0071e3]">Part II · Visual UI Audit</span>
                  <span>·</span>
                  <span>5 points</span>
                </div>
                <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                  Classify Good UX vs AI Slop UI
                </h1>
                <p className="text-xs sm:text-sm text-[#515154] leading-relaxed">
                  Inspect each UI card below. Drag it into the matching column or click a label to
                  classify whether it demonstrates Good UX Craft or AI Slop UI.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setClassifications({})}
                className="text-xs font-medium text-[#515154] hover:text-[#1d1d1f] flex items-center space-x-1 px-2.5 py-1.5 rounded-lg hover:bg-black/[0.05] liquid-transition self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Unassigned Specimens Deck */}
            <div
              data-audit-bucket="QUEUE"
              className={`rounded-2xl p-4 border liquid-transition space-y-3 ${
                hoveredBucket === 'QUEUE'
                  ? 'bg-white border-black/25'
                  : 'bg-white/50 border-black/[0.07]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1d1d1f]">UI Specimens to Classify</span>
                <span className="text-[#515154] tabular-nums">
                  {unassignedSpecimens.length} remaining
                </span>
              </div>

              {unassignedSpecimens.length === 0 ? (
                <div className="py-5 text-center text-xs text-[#515154]">
                  All 5 UI specimens classified. You may drag cards between buckets to revise or
                  continue to Design Principles.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {unassignedSpecimens.map((spec) => {
                    const isPicked =
                      Boolean(dragState?.isDragging) && dragState?.specimenId === spec.id
                    return (
                      <div
                        key={spec.id}
                        onPointerDown={(e) => startDrag(e, spec.id)}
                        className={`rounded-2xl p-3.5 border bg-white/95 touch-none liquid-transition flex flex-col justify-between space-y-3 ${
                          isPicked
                            ? 'opacity-30 scale-[0.98] border-dashed border-black/25'
                            : 'border-black/[0.08] shadow-2xs hover:border-black/20 hover:shadow-sm cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h2 className="text-xs font-semibold text-[#1d1d1f]">{spec.title}</h2>
                              <p className="text-[11px] text-[#515154]">{spec.context}</p>
                            </div>
                            <GripVertical className="w-4 h-4 text-[#6e6e73] shrink-0" />
                          </div>
                          <AuditSpecimenVisual visualKey={spec.visualKey} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => assignCategory(spec.id, 'GOOD_UX')}
                            className="py-1.5 px-2.5 rounded-xl text-xs font-medium border border-[#0071e3]/30 bg-[#0071e3]/[0.06] text-[#0071e3] hover:bg-[#0071e3] hover:text-white liquid-transition"
                          >
                            Good UX
                          </button>
                          <button
                            type="button"
                            onClick={() => assignCategory(spec.id, 'AI_SLOP')}
                            className="py-1.5 px-2.5 rounded-xl text-xs font-medium border border-black/[0.12] bg-black/[0.04] text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white liquid-transition"
                          >
                            AI Slop UI
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Two Drop Buckets: Good UX vs AI Slop UI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Good UX Bucket */}
              <div
                data-audit-bucket="GOOD_UX"
                className={`rounded-2xl p-4 border-2 min-h-[200px] liquid-transition flex flex-col space-y-3 ${
                  hoveredBucket === 'GOOD_UX'
                    ? 'border-[#0071e3] bg-[#0071e3]/[0.07] scale-[1.01]'
                    : 'border-dashed border-[#0071e3]/35 bg-white/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#1d1d1f]">Good UX / Craft</h2>
                    <p className="text-[11px] text-[#515154]">
                      Clear hierarchy, accessibility, honest copy, recovery
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full tabular-nums">
                    {goodUxSpecimens.length}
                  </span>
                </div>

                {goodUxSpecimens.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-[#6e6e73] py-8">
                    Drop Good UX specimens here
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {goodUxSpecimens.map((spec) => (
                      <div
                        key={spec.id}
                        onPointerDown={(e) => startDrag(e, spec.id)}
                        className="rounded-2xl p-3 bg-white border border-[#0071e3]/25 shadow-2xs space-y-2 cursor-grab active:cursor-grabbing touch-none animate-slot-snap"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#1d1d1f]">{spec.title}</span>
                          <button
                            type="button"
                            onClick={() => assignCategory(spec.id, null)}
                            className="w-5 h-5 rounded-full bg-black/[0.05] hover:bg-black/10 text-[#515154] flex items-center justify-center"
                            aria-label={`Remove ${spec.title}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <AuditSpecimenVisual visualKey={spec.visualKey} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Slop Bucket */}
              <div
                data-audit-bucket="AI_SLOP"
                className={`rounded-2xl p-4 border-2 min-h-[200px] liquid-transition flex flex-col space-y-3 ${
                  hoveredBucket === 'AI_SLOP'
                    ? 'border-[#1d1d1f] bg-black/[0.05] scale-[1.01]'
                    : 'border-dashed border-black/20 bg-white/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#1d1d1f]">AI Slop UI</h2>
                    <p className="text-[11px] text-[#515154]">
                      Gratuitous glows/gradients, hype copy, vague or hidden UX
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#1d1d1f] bg-black/[0.07] px-2.5 py-0.5 rounded-full tabular-nums">
                    {aiSlopSpecimens.length}
                  </span>
                </div>

                {aiSlopSpecimens.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-[#6e6e73] py-8">
                    Drop AI Slop UI specimens here
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {aiSlopSpecimens.map((spec) => (
                      <div
                        key={spec.id}
                        onPointerDown={(e) => startDrag(e, spec.id)}
                        className="rounded-2xl p-3 bg-white border border-black/[0.15] shadow-2xs space-y-2 cursor-grab active:cursor-grabbing touch-none animate-slot-snap"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#1d1d1f]">{spec.title}</span>
                          <button
                            type="button"
                            onClick={() => assignCategory(spec.id, null)}
                            className="w-5 h-5 rounded-full bg-black/[0.05] hover:bg-black/10 text-[#515154] flex items-center justify-center"
                            aria-label={`Remove ${spec.title}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <AuditSpecimenVisual visualKey={spec.visualKey} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setScreen(2)}
                disabled={!allAuditDone}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] active:scale-[0.985] disabled:bg-black/10 disabled:text-[#6e6e73] disabled:cursor-not-allowed liquid-transition shadow-xs"
              >
                <span>Next: Design Principles</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 2: VISUAL DESIGN PRINCIPLES */}
        {screen === 2 && (
          <section
            key="screen-2"
            className="liquid-glass rounded-3xl p-5 sm:p-7 flex flex-col space-y-6 animate-liquid-enter"
          >
            <div className="space-y-1.5 border-b border-black/[0.06] pb-4 max-w-[68ch]">
              <div className="flex items-center space-x-2 text-xs text-[#515154]">
                <span className="font-semibold text-[#0071e3]">Part II · Visual Principles</span>
                <span>·</span>
                <span>5 points</span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                Identify the Design Principle
              </h1>
              <p className="text-xs sm:text-sm text-[#515154] leading-relaxed">
                Inspect each visual UI comparison and choose the design or multimedia principle
                demonstrated.
              </p>
            </div>

            <div className="space-y-5">
              {prefinalVisualPrinciples.map((vp, idx) => {
                const chosen = principleAnswers[vp.id]
                const opts = shuffledPrincipleOptions[vp.id] || vp.options
                return (
                  <div
                    key={vp.id}
                    className="rounded-2xl p-4 sm:p-5 bg-white/60 border border-black/[0.08] space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1d1d1f]">
                        Item {idx + 1} of {prefinalVisualPrinciples.length}
                      </span>
                      <span className="text-[#515154]">1 point</span>
                    </div>

                    <PrincipleSpecimenVisual visualKey={vp.visualKey} />

                    <p className="text-sm font-medium text-[#1d1d1f] max-w-[65ch] leading-snug">
                      {vp.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {opts.map((opt, optIdx) => {
                        const isSelected = chosen === opt
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setPrincipleAnswers((prev) => ({ ...prev, [vp.id]: opt }))
                            }
                            className={`flex items-center text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm liquid-transition active:scale-[0.99] ${
                              isSelected
                                ? 'border-[#0071e3] bg-[#0071e3]/[0.07] text-[#1d1d1f] font-medium shadow-xs'
                                : 'border-black/[0.08] bg-white/85 text-[#1d1d1f] hover:bg-white hover:border-black/20'
                            }`}
                          >
                            <span
                              className={`mr-3 w-5 h-5 rounded-md text-[11px] font-semibold flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#0071e3] text-white'
                                  : 'bg-black/[0.05] text-[#515154]'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setScreen(1)}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 bg-white/80 text-[#1d1d1f] hover:bg-white liquid-transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to UI Audit</span>
              </button>

              <button
                type="button"
                disabled={!allAuditDone || !allPrinciplesDone}
                onClick={() =>
                  onComplete(scorePrefinalDesignAudit(classifications, principleAnswers))
                }
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] active:scale-[0.985] disabled:bg-black/10 disabled:text-[#6e6e73] disabled:cursor-not-allowed liquid-transition shadow-xs"
              >
                <span>Proceed to Part III: Essays</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Real-Time Floating Liquid Glass Drag Preview */}
      {dragState?.isDragging && draggedSpecimen && (
        <div
          className="fixed top-0 left-0 z-50 pointer-events-none"
          style={{
            width: dragState.width,
            transform: `translate3d(${dragState.x - dragState.offsetX}px, ${
              dragState.y - dragState.offsetY
            }px, 0) scale(1.03)`
          }}
        >
          <div className="rounded-2xl p-3 bg-white/90 backdrop-blur-xl border border-[#0071e3]/40 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.28)] space-y-2">
            <div className="text-xs font-semibold text-[#1d1d1f]">{draggedSpecimen.title}</div>
            <AuditSpecimenVisual visualKey={draggedSpecimen.visualKey} />
          </div>
        </div>
      )}
    </main>
  )
}
