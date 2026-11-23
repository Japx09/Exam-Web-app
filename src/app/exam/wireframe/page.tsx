'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  midtermWireframeChallenges,
  scoreWireframePlacements
} from '@/data/midtermQuestions'
import { PrefinalDesignAuditStudio } from '@/components/PrefinalDesignAuditStudio'
import { DraggableUIElement, ExamType, shuffleArray } from '@/lib/examUtils'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import {
  AlertCircle,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  Check
} from 'lucide-react'

interface PointerDragState {
  elementId: string
  fromSlotId: string | null
  startX: number
  startY: number
  x: number
  y: number
  offsetX: number
  offsetY: number
  width: number
  isDragging: boolean
}

export default function WireframeExamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [examType, setExamType] = useState<ExamType>('PREFINAL')
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<PointerDragState | null>(null)
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null)
  const [hoveredDock, setHoveredDock] = useState(false)
  const [lastSnappedSlotId, setLastSnappedSlotId] = useState<string | null>(null)

  const snapTimerRef = useRef<number | null>(null)
  const prefinalScoreRef = useRef(0)

  const challenges = midtermWireframeChallenges

  const handleAutoSubmit = useCallback(() => {
    const part1Score = parseInt(sessionStorage.getItem('exam_part1_score') || '0', 10)
    const part2Score =
      examType === 'PREFINAL'
        ? prefinalScoreRef.current
        : scoreWireframePlacements(placements)
    const combinedScore = part1Score + part2Score
    sessionStorage.setItem('exam_part2_score', part2Score.toString())
    sessionStorage.setItem('exam_score', combinedScore.toString())
    sessionStorage.setItem('exam_forced_submit', 'true')
    router.push('/result')
  }, [examType, placements, router])

  const { violationCount } = useAntiCheat(3, handleAutoSubmit)

  useEffect(() => {
    const studentName = sessionStorage.getItem('exam_student_name')
    if (!studentName) {
      router.push('/')
      return
    }
    const storedType = (sessionStorage.getItem('exam_type') as ExamType) || 'PREFINAL'
    Promise.resolve().then(() => {
      setName(studentName)
      setExamType(storedType)
    })
  }, [router])

  const shuffledPalettes = useMemo(() => {
    const map: Record<string, DraggableUIElement[]> = {}
    for (const ch of challenges) {
      map[ch.id] = shuffleArray(ch.draggableElements)
    }
    return map
  }, [challenges])

  const currentChallenge = challenges[challengeIndex]
  const paletteItems =
    (currentChallenge && shuffledPalettes[currentChallenge.id]) ||
    currentChallenge?.draggableElements ||
    []

  const triggerSnapFeedback = useCallback((slotId: string) => {
    setLastSnappedSlotId(slotId)
    if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current)
    snapTimerRef.current = window.setTimeout(() => setLastSnappedSlotId(null), 260)
  }, [])

  const placeElementInSlot = useCallback(
    (slotId: string, elementId: string) => {
      if (!currentChallenge) return
      setPlacements((prev) => {
        const next = { ...prev }
        for (const zone of currentChallenge.dropZones) {
          if (next[zone.slotId] === elementId) {
            delete next[zone.slotId]
          }
        }
        next[slotId] = elementId
        return next
      })
      setSelectedElementId(null)
      triggerSnapFeedback(slotId)
    },
    [currentChallenge, triggerSnapFeedback]
  )

  const swapOrMoveSlot = useCallback(
    (fromSlotId: string, toSlotId: string, elementId: string) => {
      if (fromSlotId === toSlotId) return
      setPlacements((prev) => {
        const next = { ...prev }
        const displacedId = next[toSlotId]
        next[toSlotId] = elementId
        if (displacedId) {
          next[fromSlotId] = displacedId
        } else {
          delete next[fromSlotId]
        }
        return next
      })
      setSelectedElementId(null)
      triggerSnapFeedback(toSlotId)
    },
    [triggerSnapFeedback]
  )

  const removeElementFromSlot = useCallback((slotId: string) => {
    setPlacements((prev) => {
      const next = { ...prev }
      delete next[slotId]
      return next
    })
  }, [])

  // Pointer-based real-time drag tracking with slot-to-slot swapping and dock return
  useEffect(() => {
    if (!dragState) return

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startX
      const dy = e.clientY - dragState.startY
      const movedEnough = dragState.isDragging || Math.hypot(dx, dy) > 5

      setDragState((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY, isDragging: movedEnough } : null
      )

      if (!movedEnough) return

      const stack = document.elementsFromPoint(e.clientX, e.clientY)
      let foundSlot: string | null = null
      let foundDock = false
      for (const el of stack) {
        const slotAttr = el.getAttribute('data-drop-slot')
        if (slotAttr) {
          foundSlot = slotAttr
          break
        }
        if (el.hasAttribute('data-dock-zone')) {
          foundDock = true
        }
      }
      setHoveredSlotId(foundSlot)
      setHoveredDock(foundDock)
    }

    const handlePointerUp = () => {
      if (dragState.isDragging) {
        if (hoveredSlotId) {
          if (dragState.fromSlotId) {
            swapOrMoveSlot(dragState.fromSlotId, hoveredSlotId, dragState.elementId)
          } else {
            placeElementInSlot(hoveredSlotId, dragState.elementId)
          }
        } else if (hoveredDock && dragState.fromSlotId) {
          removeElementFromSlot(dragState.fromSlotId)
        }
      } else {
        // Regular click/tap
        if (dragState.fromSlotId === null) {
          setSelectedElementId((prev) => (prev === dragState.elementId ? null : dragState.elementId))
        } else if (selectedElementId) {
          placeElementInSlot(dragState.fromSlotId, selectedElementId)
        }
      }

      setDragState(null)
      setHoveredSlotId(null)
      setHoveredDock(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [
    dragState,
    hoveredSlotId,
    hoveredDock,
    selectedElementId,
    placeElementInSlot,
    swapOrMoveSlot,
    removeElementFromSlot
  ])

  if (!name) return null

  if (examType === 'PREFINAL') {
    return (
      <PrefinalDesignAuditStudio
        studentName={name}
        violationCount={violationCount}
        onScoreChange={(s) => {
          prefinalScoreRef.current = s
        }}
        onComplete={(part2Score) => {
          const part1Score = parseInt(sessionStorage.getItem('exam_part1_score') || '0', 10)
          const combinedObjectiveScore = part1Score + part2Score
          sessionStorage.setItem('exam_part2_score', part2Score.toString())
          sessionStorage.setItem('exam_score', combinedObjectiveScore.toString())
          sessionStorage.setItem('exam_violation_count', violationCount.toString())
          router.push('/exam/essay')
        }}
      />
    )
  }

  if (!currentChallenge) return null

  const startPointerDrag = (
    e: React.PointerEvent<HTMLElement>,
    elementId: string,
    fromSlotId: string | null
  ) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    if ((e.target as HTMLElement).closest('button[data-eject-btn]')) return

    const rect = e.currentTarget.getBoundingClientRect()
    setDragState({
      elementId,
      fromSlotId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: Math.min(rect.width, 360),
      isDragging: false
    })
  }

  const slotNumberByElementId = new Map<string, number>()
  for (const zone of currentChallenge.dropZones) {
    const placedId = placements[zone.slotId]
    if (placedId) slotNumberByElementId.set(placedId, zone.slotNumber)
  }

  const resetCurrentChallenge = () => {
    setPlacements((prev) => {
      const next = { ...prev }
      for (const z of currentChallenge.dropZones) {
        delete next[z.slotId]
      }
      return next
    })
    setSelectedElementId(null)
  }

  const allCurrentSlotsFilled = currentChallenge.dropZones.every((z) =>
    Boolean(placements[z.slotId])
  )
  const totalSlotsAll = challenges.reduce((sum, ch) => sum + ch.dropZones.length, 0)
  const filledSlotsAll = challenges.reduce(
    (sum, ch) => sum + ch.dropZones.filter((z) => Boolean(placements[z.slotId])).length,
    0
  )

  const handleNextChallenge = () => {
    if (!allCurrentSlotsFilled) return

    if (challengeIndex < challenges.length - 1) {
      setChallengeIndex((prev) => prev + 1)
      setSelectedElementId(null)
    } else {
      const part1Score = parseInt(sessionStorage.getItem('exam_part1_score') || '0', 10)
      const part2Score = scoreWireframePlacements(placements)
      const combinedObjectiveScore = part1Score + part2Score

      sessionStorage.setItem('exam_part2_score', part2Score.toString())
      sessionStorage.setItem('exam_score', combinedObjectiveScore.toString())
      sessionStorage.setItem('exam_violation_count', violationCount.toString())

      router.push('/exam/essay')
    }
  }

  const renderWireframeBlock = (el: DraggableUIElement) => {
    switch (el.uiType) {
      case 'badge':
        return (
          <div className="w-full rounded-xl bg-black/[0.04] border border-black/[0.08] px-3 py-2.5 flex items-center justify-between text-[#1d1d1f]">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#515154]">
                {el.subtext || 'Status Banner'}
              </span>
              <span className="text-xs sm:text-[13px] font-semibold leading-snug mt-0.5">
                {el.label}
              </span>
            </div>
          </div>
        )
      case 'textbox':
        return (
          <div className="w-full rounded-xl bg-white border border-black/[0.09] p-2.5 flex flex-col space-y-1.5">
            <span className="text-[11px] font-semibold text-[#1d1d1f] leading-snug">
              {el.label}
            </span>
            <div className="w-full px-2.5 py-1.5 rounded-lg bg-[#f5f5f7] border border-black/[0.07] text-[11px] text-[#6e6e73]">
              {el.placeholder || 'Text input field'}
            </div>
          </div>
        )
      case 'button':
        return (
          <div className="w-full rounded-xl bg-[#1d1d1f] text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs">
            <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-center flex-1">
              {el.label}
            </span>
            <ChevronRight className="w-4 h-4 text-white/60 shrink-0 ml-2" />
          </div>
        )
      case 'card':
      default:
        return (
          <div className="w-full rounded-xl bg-white border border-black/[0.09] px-3 py-2.5 flex flex-col space-y-0.5 text-[#1d1d1f]">
            <span className="text-[11px] font-medium text-[#515154]">
              {el.subtext || 'Content Card'}
            </span>
            <span className="text-xs sm:text-[13px] font-semibold leading-snug">{el.label}</span>
          </div>
        )
    }
  }

  const draggedElement = dragState
    ? currentChallenge.draggableElements.find((e) => e.id === dragState.elementId) || null
    : null

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-5 sm:py-7">
      <div className="w-full max-w-5xl flex flex-col space-y-4">
        {/* Top Floating Glass Bar */}
        <header className="liquid-glass-bar rounded-2xl px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 text-xs">
            <span className="font-semibold text-[#1d1d1f]">Midterm Exam</span>
            <span className="text-[#6e6e73]">·</span>
            <span className="font-medium text-[#515154] truncate max-w-[180px] sm:max-w-xs">
              {name}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Screen Progress Stepper */}
            <div className="flex items-center bg-black/[0.04] p-1 rounded-xl border border-black/[0.05]">
              {challenges.map((ch, idx) => {
                const isDone = ch.dropZones.every((z) => Boolean(placements[z.slotId]))
                const isActive = idx === challengeIndex
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setChallengeIndex(idx)
                      setSelectedElementId(null)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium liquid-transition flex items-center space-x-1 ${
                      isActive
                        ? 'bg-white text-[#1d1d1f] shadow-xs'
                        : 'text-[#515154] hover:text-[#1d1d1f]'
                    }`}
                  >
                    <span>Screen {idx + 1}</span>
                    {isDone && <Check className="w-3 h-3 text-[#0071e3]" />}
                  </button>
                )
              })}
            </div>

            <span className="text-xs font-medium text-[#515154] tabular-nums hidden sm:inline">
              {filledSlotsAll}/{totalSlotsAll} slots
            </span>

            {violationCount > 0 && (
              <span className="inline-flex items-center space-x-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-medium text-red-700 tabular-nums">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{violationCount}/3</span>
              </span>
            )}
          </div>
        </header>

        {/* Main Frosted Glass Studio Shell */}
        <section
          key={currentChallenge.id}
          className="liquid-glass rounded-3xl p-5 sm:p-7 flex flex-col space-y-6 animate-liquid-enter"
        >
          {/* Challenge Prompt */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-black/[0.06] pb-4">
            <div className="space-y-1.5 max-w-[68ch]">
              <div className="flex items-center space-x-2 text-xs text-[#515154]">
                <span className="font-semibold text-[#0071e3]">Part II · Wireframe Placement</span>
                <span>·</span>
                <span className="tabular-nums">{currentChallenge.points} points</span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                {currentChallenge.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#515154] leading-relaxed">
                {currentChallenge.scenario}
              </p>
            </div>
          </div>

          {/* Two-Column Studio: Left Component Dock + Right Hardware Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Component Dock */}
            <div
              data-dock-zone="true"
              className={`lg:col-span-6 rounded-2xl p-4 border liquid-transition flex flex-col space-y-3 ${
                hoveredDock && dragState?.fromSlotId
                  ? 'bg-[#0071e3]/[0.05] border-[#0071e3]/40'
                  : 'bg-white/55 border-black/[0.07]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#1d1d1f]">Component Dock</h2>
                  <p className="text-xs text-[#515154] mt-0.5">
                    {dragState?.fromSlotId
                      ? 'Release here to return component to dock'
                      : 'Drag into a wireframe slot or tap to place. Leave distractors unused.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetCurrentChallenge}
                  className="text-xs font-medium text-[#515154] hover:text-[#1d1d1f] flex items-center space-x-1 px-2.5 py-1.5 rounded-lg hover:bg-black/[0.05] liquid-transition shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {paletteItems.map((el) => {
                  const placedSlotNum = slotNumberByElementId.get(el.id)
                  const isPlaced = placedSlotNum !== undefined
                  const isSelected = selectedElementId === el.id
                  const isPickedUp =
                    Boolean(dragState?.isDragging) &&
                    dragState?.elementId === el.id &&
                    dragState?.fromSlotId === null

                  return (
                    <div
                      key={el.id}
                      role="button"
                      tabIndex={isPlaced ? -1 : 0}
                      aria-label={el.label}
                      onPointerDown={isPlaced ? undefined : (e) => startPointerDrag(e, el.id, null)}
                      onKeyDown={(e) => {
                        if (isPlaced) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedElementId((prev) => (prev === el.id ? null : el.id))
                        }
                      }}
                      className={`group relative rounded-2xl p-2 liquid-transition touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 ${
                        isPickedUp
                          ? 'opacity-30 scale-[0.98] border border-dashed border-black/20 bg-black/[0.02]'
                          : isPlaced
                          ? 'opacity-55 bg-white/40 border border-black/[0.06] cursor-default'
                          : isSelected
                          ? 'bg-[#0071e3]/[0.07] border border-[#0071e3] shadow-[0_6px_18px_-6px_rgba(0,113,227,0.3)] cursor-pointer'
                          : 'bg-white/95 border border-black/[0.08] shadow-2xs hover:border-black/20 hover:shadow-sm cursor-grab active:cursor-grabbing active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="text-[#6e6e73] group-hover:text-[#1d1d1f] pl-1 shrink-0">
                          {isPlaced ? (
                            <Check className="w-4 h-4 text-[#0071e3]" />
                          ) : (
                            <GripVertical className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">{renderWireframeBlock(el)}</div>
                        {isPlaced && (
                          <span className="text-[11px] font-medium text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md tabular-nums shrink-0 mr-1">
                            Slot {placedSlotNum}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Apple Titanium Hardware Wireframe Canvas */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="w-full max-w-[420px] bg-[#1d1d1f] rounded-[2.6rem] p-3 shadow-[0_32px_68px_-16px_rgba(15,23,42,0.34)] ring-1 ring-white/15">
                {/* Screen Viewport */}
                <div className="wireframe-dot-grid rounded-[2rem] p-4 sm:p-5 min-h-[470px] flex flex-col justify-between space-y-4">
                  {/* iOS Status Bar + Dynamic Island */}
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-[11px] font-semibold text-[#1d1d1f] tabular-nums">
                      9:41
                    </span>
                    <div className="w-24 h-5 bg-[#1d1d1f] rounded-full flex items-center justify-end px-2">
                      <div className="w-2 h-2 rounded-full bg-white/15" />
                    </div>
                    <div className="flex items-center space-x-1.5 text-[#1d1d1f]">
                      <div className="flex items-end space-x-0.5 h-2.5">
                        <span className="w-0.5 h-1 bg-[#1d1d1f] rounded-full" />
                        <span className="w-0.5 h-1.5 bg-[#1d1d1f] rounded-full" />
                        <span className="w-0.5 h-2 bg-[#1d1d1f] rounded-full" />
                        <span className="w-0.5 h-2.5 bg-[#1d1d1f] rounded-full" />
                      </div>
                      <div className="w-4 h-2.5 rounded-[3px] border border-[#1d1d1f] p-[1.5px] flex items-center">
                        <div className="w-full h-full bg-[#1d1d1f] rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  {/* Screen Subheader */}
                  <div className="flex items-center justify-between border-b border-black/[0.08] pb-2 text-xs">
                    <span className="font-semibold text-[#1d1d1f]">Wireframe Canvas</span>
                    <span className="font-medium text-[#515154] tabular-nums">
                      {currentChallenge.dropZones.filter((z) => Boolean(placements[z.slotId])).length}{' '}
                      of {currentChallenge.dropZones.length} placed
                    </span>
                  </div>

                  {/* Drop Zones */}
                  <div className="flex flex-col space-y-3 flex-1 justify-center">
                    {currentChallenge.dropZones.map((zone) => {
                      const placedId = placements[zone.slotId]
                      const placedElement = currentChallenge.draggableElements.find(
                        (e) => e.id === placedId
                      )
                      const isDropHovered =
                        Boolean(dragState?.isDragging) && hoveredSlotId === zone.slotId
                      const isBeingDraggedOut =
                        Boolean(dragState?.isDragging) && dragState?.fromSlotId === zone.slotId
                      const isJustSnapped = lastSnappedSlotId === zone.slotId

                      return (
                        <div
                          key={zone.slotId}
                          data-drop-slot={zone.slotId}
                          role="button"
                          tabIndex={0}
                          onPointerDown={
                            placedElement
                              ? (e) => startPointerDrag(e, placedElement.id, zone.slotId)
                              : undefined
                          }
                          onClick={() => {
                            if (!placedElement && selectedElementId) {
                              placeElementInSlot(zone.slotId, selectedElementId)
                            }
                          }}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && selectedElementId) {
                              e.preventDefault()
                              placeElementInSlot(zone.slotId, selectedElementId)
                            }
                          }}
                          className={`group rounded-2xl p-2.5 liquid-transition touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 ${
                            isJustSnapped ? 'animate-slot-snap ' : ''
                          }${
                            isDropHovered
                              ? 'border-2 border-[#0071e3] bg-[#0071e3]/[0.07] scale-[1.015] shadow-[0_8px_20px_-6px_rgba(0,113,227,0.22)]'
                              : isBeingDraggedOut
                              ? 'border border-dashed border-black/25 bg-black/[0.03] opacity-40'
                              : placedElement
                              ? 'border border-black/[0.12] bg-white/95 shadow-xs cursor-grab active:cursor-grabbing hover:border-black/25'
                              : selectedElementId
                              ? 'border border-dashed border-[#0071e3]/70 bg-[#0071e3]/[0.04] cursor-pointer hover:bg-[#0071e3]/[0.08]'
                              : 'border border-dashed border-black/15 bg-white/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5 px-0.5">
                            <span className="text-[11px] font-medium text-[#515154]">
                              {zone.slotLabel}
                            </span>
                            {placedElement ? (
                              <button
                                type="button"
                                data-eject-btn="true"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeElementFromSlot(zone.slotId)
                                }}
                                aria-label={`Remove from ${zone.slotLabel}`}
                                className="w-5 h-5 rounded-full bg-black/[0.05] hover:bg-red-500/15 text-[#515154] hover:text-red-600 flex items-center justify-center liquid-transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            ) : isDropHovered ? (
                              <span className="text-[11px] font-medium text-[#0071e3]">
                                Release to snap
                              </span>
                            ) : null}
                          </div>

                          {placedElement ? (
                            <div>{renderWireframeBlock(placedElement)}</div>
                          ) : (
                            <div className="py-4 text-center text-xs text-[#6e6e73]">
                              {selectedElementId
                                ? 'Tap here to snap selected component'
                                : 'Drop component here'}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Home Indicator */}
                  <div className="pt-1 flex justify-center">
                    <div className="w-28 h-1 bg-[#1d1d1f]/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="pt-4 flex items-center justify-between border-t border-black/[0.06]">
            <button
              type="button"
              disabled={challengeIndex === 0}
              onClick={() => {
                setChallengeIndex((prev) => Math.max(0, prev - 1))
                setSelectedElementId(null)
              }}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 bg-white/80 text-[#1d1d1f] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed liquid-transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Screen</span>
            </button>

            <button
              type="button"
              onClick={handleNextChallenge}
              disabled={!allCurrentSlotsFilled}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] active:scale-[0.985] disabled:bg-black/10 disabled:text-[#6e6e73] disabled:cursor-not-allowed liquid-transition shadow-xs"
            >
              <span>
                {challengeIndex < challenges.length - 1
                  ? 'Next Screen'
                  : 'Proceed to Part III: Essays'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* Real-Time Floating Liquid Glass Drag Preview */}
      {dragState?.isDragging && draggedElement && (
        <div
          className="fixed top-0 left-0 z-50 pointer-events-none"
          style={{
            width: dragState.width,
            transform: `translate3d(${dragState.x - dragState.offsetX}px, ${
              dragState.y - dragState.offsetY
            }px, 0) scale(1.03)`
          }}
        >
          <div className="rounded-2xl p-2 bg-white/90 backdrop-blur-xl border border-[#0071e3]/40 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.28)]">
            {renderWireframeBlock(draggedElement)}
          </div>
        </div>
      )}
    </main>
  )
}
