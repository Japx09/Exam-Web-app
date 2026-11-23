'use client'

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react'
import {
  prefinalAuditSpecimens,
  prefinalVisualPrinciples,
  scorePrefinalDesignAudit,
  UxAuditCategory
} from '@/data/prefinalQuestions'
import { shuffleArray } from '@/lib/examUtils'
import { AuditSpecimenVisual, PrincipleSpecimenVisual } from '@/components/DesignSpecimenPreview'
import {
  LiquidSegmentedControl,
  handleSpecularMove
} from '@/components/LiquidSegmentedControl'
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

interface DragMetrics {
  specimenId: string
  startX: number
  startY: number
  x: number
  y: number
  prevX: number
  smoothVx: number
  offsetX: number
  offsetY: number
  width: number
  isDragging: boolean
}

type ScreenId = '1' | '2'

export function PrefinalDesignAuditStudio({
  studentName,
  violationCount,
  onScoreChange,
  onComplete
}: Props) {
  const [screen, setScreen] = useState<ScreenId>('1')
  const [screenDir, setScreenDir] = useState<1 | -1>(1)
  const [classifications, setClassifications] = useState<Record<string, UxAuditCategory>>({})
  const [principleAnswers, setPrincipleAnswers] = useState<Record<string, string>>({})

  // Drag React state only changes on drag start/end or bucket entry (never per pixel!)
  const [pointerActive, setPointerActive] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [hoveredBucket, setHoveredBucket] = useState<UxAuditCategory | 'QUEUE' | null>(null)

  const dragRef = useRef<DragMetrics | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const hoveredBucketRef = useRef<UxAuditCategory | 'QUEUE' | null>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const pendingFlipRef = useRef<{ id: string; rect: DOMRect } | null>(null)

  const shuffledSpecimens = useMemo(() => shuffleArray(prefinalAuditSpecimens), [])
  const shuffledPrincipleOptions = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const vp of prefinalVisualPrinciples) {
      map[vp.id] = shuffleArray(vp.options)
    }
    return map
  }, [])

  useEffect(() => {
    onScoreChange(scorePrefinalDesignAudit(classifications, principleAnswers))
  }, [classifications, principleAnswers, onScoreChange])

  const switchScreen = useCallback(
    (next: ScreenId) => {
      if (next === screen) return
      setScreenDir(next === '2' ? 1 : -1)
      setScreen(next)
    },
    [screen]
  )

  const assignCategory = useCallback(
    (specimenId: string, category: UxAuditCategory | null, sourceRect?: DOMRect | null) => {
      const originRect = sourceRect ?? cardRefs.current.get(specimenId)?.getBoundingClientRect()
      if (originRect) {
        pendingFlipRef.current = { id: specimenId, rect: originRect }
      }
      setClassifications((prev) => {
        const next = { ...prev }
        if (category === null) {
          delete next[specimenId]
        } else {
          next[specimenId] = category
        }
        return next
      })
    },
    []
  )

  // Zero-dependency FLIP glide whenever a specimen moves into/between buckets
  useLayoutEffect(() => {
    const pending = pendingFlipRef.current
    if (!pending) return
    pendingFlipRef.current = null

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const destEl = cardRefs.current.get(pending.id)
    if (!destEl) return

    const destRect = destEl.getBoundingClientRect()
    const dx = pending.rect.left - destRect.left
    const dy = pending.rect.top - destRect.top
    if (Math.hypot(dx, dy) < 4) return

    const sx = Math.max(0.85, Math.min(1.15, pending.rect.width / Math.max(destRect.width, 1)))
    const sy = Math.max(0.85, Math.min(1.15, pending.rect.height / Math.max(destRect.height, 1)))

    destEl.animate(
      [
        {
          transformOrigin: 'top left',
          transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
          opacity: 0.92
        },
        {
          transformOrigin: 'top left',
          transform: 'translate3d(0, 0, 0) scale(1, 1)',
          opacity: 1
        }
      ],
      { duration: 280, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    )
  }, [classifications])

  // Position floating preview immediately upon drag activation
  useLayoutEffect(() => {
    if (!activeDragId || !previewRef.current || !dragRef.current) return
    const d = dragRef.current
    previewRef.current.style.width = `${d.width}px`
    previewRef.current.style.transform = `translate3d(${d.x - d.offsetX}px, ${d.y - d.offsetY}px, 0) scale(1.035)`
  }, [activeDragId])

  // 120fps ref-driven pointer listeners bound once per drag session
  useEffect(() => {
    if (!pointerActive) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const flushPreviewTransform = () => {
      rafRef.current = null
      const d = dragRef.current
      const el = previewRef.current
      if (!d || !el || !d.isDragging) return

      const tilt = reducedMotion ? 0 : Math.max(-4.5, Math.min(4.5, d.smoothVx * 0.28))
      const px = d.x - d.offsetX
      const py = d.y - d.offsetY
      el.style.transform = `translate3d(${px}px, ${py}px, 0) rotate(${tilt.toFixed(2)}deg) scale(1.035)`
      el.style.setProperty('--mx', `${Math.max(10, Math.min(90, 50 + d.smoothVx * 1.4))}%`)
    }

    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return

      const dx = e.clientX - d.prevX
      d.prevX = e.clientX
      d.x = e.clientX
      d.y = e.clientY
      d.smoothVx = d.smoothVx * 0.72 + dx * 0.28

      if (!d.isDragging && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 5) {
        d.isDragging = true
        setActiveDragId(d.specimenId)
      }

      if (!d.isDragging) return

      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(flushPreviewTransform)
      }

      const stack = document.elementsFromPoint(e.clientX, e.clientY)
      let found: UxAuditCategory | 'QUEUE' | null = null
      for (const node of stack) {
        const attr = node.getAttribute('data-audit-bucket')
        if (attr === 'GOOD_UX' || attr === 'AI_SLOP' || attr === 'QUEUE') {
          found = attr
          break
        }
      }
      if (found !== hoveredBucketRef.current) {
        hoveredBucketRef.current = found
        setHoveredBucket(found)
      }
    }

    const handleUp = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      const d = dragRef.current
      const dropTarget = hoveredBucketRef.current
      const previewRect = previewRef.current?.getBoundingClientRect() || null

      if (d?.isDragging && dropTarget) {
        assignCategory(
          d.specimenId,
          dropTarget === 'QUEUE' ? null : dropTarget,
          previewRect
        )
      }

      dragRef.current = null
      hoveredBucketRef.current = null
      setPointerActive(false)
      setActiveDragId(null)
      setHoveredBucket(null)
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [pointerActive, assignCategory])

  const startDrag = (e: React.PointerEvent<HTMLElement>, specimenId: string) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    if ((e.target as HTMLElement).closest('button')) return

    const rect = e.currentTarget.getBoundingClientRect()
    dragRef.current = {
      specimenId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      prevX: e.clientX,
      smoothVx: 0,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: Math.min(rect.width, 380),
      isDragging: false
    }
    setPointerActive(true)
  }

  const registerCardRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el)
    else cardRefs.current.delete(id)
  }

  const auditDoneCount = Object.keys(classifications).length
  const principlesDoneCount = Object.keys(principleAnswers).length
  const allAuditDone = auditDoneCount === shuffledSpecimens.length
  const allPrinciplesDone = principlesDoneCount === prefinalVisualPrinciples.length

  const unassignedSpecimens = shuffledSpecimens.filter((s) => !classifications[s.id])
  const goodUxSpecimens = shuffledSpecimens.filter((s) => classifications[s.id] === 'GOOD_UX')
  const aiSlopSpecimens = shuffledSpecimens.filter((s) => classifications[s.id] === 'AI_SLOP')

  const draggedSpecimen = activeDragId
    ? shuffledSpecimens.find((s) => s.id === activeDragId) || null
    : null

  const screenOptions = useMemo(
    () => [
      {
        value: '1' as const,
        label: (
          <span className="flex items-center space-x-1.5">
            <span>1 · Good UX vs AI Slop</span>
            {allAuditDone && <Check className="w-3 h-3 text-[#0071e3]" />}
          </span>
        )
      },
      {
        value: '2' as const,
        label: (
          <span className="flex items-center space-x-1.5">
            <span>2 · Design Principles</span>
            {allPrinciplesDone && <Check className="w-3 h-3 text-[#0071e3]" />}
          </span>
        )
      }
    ],
    [allAuditDone, allPrinciplesDone]
  )

  const screenMotionClass = screenDir > 0 ? 'animate-liquid-forward' : 'animate-liquid-back'

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-5 sm:py-7">
      <div className="w-full max-w-6xl flex flex-col space-y-4">
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
            <LiquidSegmentedControl
              size="xs"
              options={screenOptions}
              value={screen}
              onChange={switchScreen}
              ariaLabel="Part II section switcher"
            />

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
        {screen === '1' && (
          <section
            key="screen-1"
            className={`liquid-glass rounded-3xl p-5 sm:p-7 flex flex-col space-y-6 ${screenMotionClass}`}
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
                  Inspect each UI card on the left and drag it smoothly to the matching bucket on the
                  right, or tap a label to classify Good UX Craft versus AI Slop UI.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setClassifications({})}
                className="text-xs font-medium text-[#515154] hover:text-[#1d1d1f] flex items-center space-x-1 px-2.5 py-1.5 rounded-lg hover:bg-black/[0.05] liquid-press self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Side-by-Side Split Studio: Left Specimens -> Right Drop Buckets */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* LEFT: Unassigned Specimens Deck */}
              <div
                data-audit-bucket="QUEUE"
                className={`md:col-span-6 rounded-2xl p-4 border liquid-transition space-y-3 ${
                  hoveredBucket === 'QUEUE'
                    ? 'bg-white/85 border-black/25 shadow-[inset_0_2px_10px_rgba(15,23,42,0.06)]'
                    : 'bg-white/45 border-black/[0.07]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1d1d1f]">UI Specimens (Drag Left → Right)</span>
                  <span className="text-[#515154] tabular-nums">
                    {unassignedSpecimens.length} remaining
                  </span>
                </div>

                {unassignedSpecimens.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#515154]">
                    All 5 UI specimens classified. Drag cards between buckets on the right to
                    revise or continue to Design Principles.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {unassignedSpecimens.map((spec) => {
                      const isPicked = activeDragId === spec.id
                      return (
                        <div
                          key={spec.id}
                          ref={registerCardRef(spec.id)}
                          onPointerDown={(e) => startDrag(e, spec.id)}
                          onPointerMove={handleSpecularMove}
                          className={`rounded-2xl p-3.5 touch-none liquid-press flex flex-col justify-between space-y-3 ${
                            isPicked
                              ? 'opacity-30 scale-[0.98] border border-dashed border-black/25 bg-white/40'
                              : 'liquid-glass-tile liquid-specular hover:-translate-y-[1px] cursor-grab active:cursor-grabbing'
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
                              className="py-1.5 px-2.5 rounded-xl text-xs font-medium border border-[#0071e3]/30 bg-[#0071e3]/[0.07] text-[#0071e3] hover:bg-[#0071e3] hover:text-white liquid-press"
                            >
                              Good UX
                            </button>
                            <button
                              type="button"
                              onClick={() => assignCategory(spec.id, 'AI_SLOP')}
                              className="py-1.5 px-2.5 rounded-xl text-xs font-medium border border-black/[0.12] bg-black/[0.045] text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white liquid-press"
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

              {/* RIGHT: Sticky Drop Buckets (Good UX vs AI Slop UI) */}
              <div className="md:col-span-6 md:sticky md:top-5 md:max-h-[calc(100vh-2.5rem)] md:overflow-y-auto space-y-4">
                {/* Good UX Bucket */}
                <div
                  data-audit-bucket="GOOD_UX"
                  className={`rounded-2xl p-4 border-2 min-h-[175px] backdrop-blur-xl liquid-transition flex flex-col space-y-3 ${
                    hoveredBucket === 'GOOD_UX'
                      ? 'border-[#0071e3] bg-white/85 shadow-[inset_0_2px_14px_rgba(0,113,227,0.1)]'
                      : 'border-dashed border-[#0071e3]/35 bg-white/55'
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
                    <div className="flex-1 flex items-center justify-center text-xs text-[#6e6e73] py-6">
                      {hoveredBucket === 'GOOD_UX'
                        ? 'Release to place in Good UX'
                        : 'Drop Good UX specimens here'}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {goodUxSpecimens.map((spec) => {
                        const isPicked = activeDragId === spec.id
                        return (
                          <div
                            key={spec.id}
                            ref={registerCardRef(spec.id)}
                            onPointerDown={(e) => startDrag(e, spec.id)}
                            onPointerMove={handleSpecularMove}
                            className={`rounded-2xl p-3 bg-white/92 border border-[#0071e3]/25 shadow-2xs space-y-2 cursor-grab active:cursor-grabbing touch-none liquid-specular liquid-transition ${
                              isPicked ? 'opacity-30 scale-[0.98]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#1d1d1f]">
                                {spec.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => assignCategory(spec.id, null)}
                                className="w-5 h-5 rounded-full bg-black/[0.05] hover:bg-black/10 text-[#515154] flex items-center justify-center liquid-press"
                                aria-label={`Remove ${spec.title}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <AuditSpecimenVisual visualKey={spec.visualKey} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* AI Slop Bucket */}
                <div
                  data-audit-bucket="AI_SLOP"
                  className={`rounded-2xl p-4 border-2 min-h-[175px] backdrop-blur-xl liquid-transition flex flex-col space-y-3 ${
                    hoveredBucket === 'AI_SLOP'
                      ? 'border-[#1d1d1f] bg-white/85 shadow-[inset_0_2px_14px_rgba(15,23,42,0.08)]'
                      : 'border-dashed border-black/20 bg-white/55'
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
                    <div className="flex-1 flex items-center justify-center text-xs text-[#6e6e73] py-6">
                      {hoveredBucket === 'AI_SLOP'
                        ? 'Release to place in AI Slop UI'
                        : 'Drop AI Slop UI specimens here'}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {aiSlopSpecimens.map((spec) => {
                        const isPicked = activeDragId === spec.id
                        return (
                          <div
                            key={spec.id}
                            ref={registerCardRef(spec.id)}
                            onPointerDown={(e) => startDrag(e, spec.id)}
                            onPointerMove={handleSpecularMove}
                            className={`rounded-2xl p-3 bg-white/92 border border-black/[0.15] shadow-2xs space-y-2 cursor-grab active:cursor-grabbing touch-none liquid-specular liquid-transition ${
                              isPicked ? 'opacity-30 scale-[0.98]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#1d1d1f]">
                                {spec.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => assignCategory(spec.id, null)}
                                className="w-5 h-5 rounded-full bg-black/[0.05] hover:bg-black/10 text-[#515154] flex items-center justify-center liquid-press"
                                aria-label={`Remove ${spec.title}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <AuditSpecimenVisual visualKey={spec.visualKey} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => switchScreen('2')}
                disabled={!allAuditDone}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] disabled:bg-black/10 disabled:text-[#6e6e73] disabled:cursor-not-allowed liquid-press shadow-xs"
              >
                <span>Next: Design Principles</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 2: VISUAL DESIGN PRINCIPLES */}
        {screen === '2' && (
          <section
            key="screen-2"
            className={`liquid-glass rounded-3xl p-5 sm:p-7 flex flex-col space-y-6 ${screenMotionClass}`}
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
                    className="rounded-2xl p-4 sm:p-5 bg-white/55 border border-black/[0.07] space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1d1d1f]">
                        Item {idx + 1} of {prefinalVisualPrinciples.length}
                      </span>
                      <span className="text-[#515154] tabular-nums">1 point</span>
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
                            onPointerMove={handleSpecularMove}
                            onClick={() =>
                              setPrincipleAnswers((prev) => ({ ...prev, [vp.id]: opt }))
                            }
                            className={`flex items-center text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm liquid-specular liquid-press ${
                              isSelected
                                ? 'border-[#0071e3] bg-[#0071e3]/[0.08] backdrop-blur-xl text-[#1d1d1f] font-medium shadow-[0_10px_24px_-12px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]'
                                : 'liquid-glass-tile text-[#1d1d1f] hover:-translate-y-[1px]'
                            }`}
                          >
                            <span
                              className={`mr-3 w-5 h-5 rounded-md text-[11px] font-semibold flex items-center justify-center shrink-0 liquid-transition ${
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
                onClick={() => switchScreen('1')}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 bg-white/80 text-[#1d1d1f] hover:bg-white liquid-press"
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
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] disabled:bg-black/10 disabled:text-[#6e6e73] disabled:cursor-not-allowed liquid-press shadow-xs"
              >
                <span>Proceed to Part III: Essays</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}
      </div>

      {/* 120fps Ref-Driven Velocity-Tilted Liquid Glass Drag Lens */}
      {activeDragId && draggedSpecimen && (
        <div
          ref={previewRef}
          className="fixed top-0 left-0 z-50 pointer-events-none will-change-transform"
        >
          <div className="liquid-glass rounded-2xl p-3 space-y-2 shadow-[0_28px_60px_-14px_rgba(15,23,42,0.28)] ring-1 ring-[#0071e3]/30">
            <div className="text-xs font-semibold text-[#1d1d1f]">{draggedSpecimen.title}</div>
            <AuditSpecimenVisual visualKey={draggedSpecimen.visualKey} />
          </div>
        </div>
      )}
    </main>
  )
}
