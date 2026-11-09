'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  midtermWireframeChallenges,
  scoreWireframePlacements,
  DraggableUIElement
} from '@/data/midtermQuestions'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import {
  AlertCircle,
  Smartphone,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  Layers,
  CheckCircle2,
  MousePointerClick
} from 'lucide-react'

export default function WireframeExamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [challengeIndex, setChallengeIndex] = useState(0)
  // slotId -> elementId
  const [placements, setPlacements] = useState<Record<string, string>>({})
  // Currently selected element from palette for tap-to-place
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null)
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null)

  const handleAutoSubmit = () => {
    const part1Score = parseInt(sessionStorage.getItem('exam_part1_score') || '0', 10)
    const part2Score = scoreWireframePlacements(placements)
    const combinedScore = part1Score + part2Score
    sessionStorage.setItem('exam_part2_score', part2Score.toString())
    sessionStorage.setItem('exam_score', combinedScore.toString())
    sessionStorage.setItem('exam_forced_submit', 'true')
    router.push('/result')
  }

  const { violationCount } = useAntiCheat(3, handleAutoSubmit)

  useEffect(() => {
    const studentName = sessionStorage.getItem('exam_student_name')
    if (!studentName) {
      router.push('/')
      return
    }
    setName(studentName)
  }, [router])

  // Shuffle palette elements once per challenge so order isn't always identical
  const shuffledPalettes = useMemo(() => {
    const map: Record<string, DraggableUIElement[]> = {}
    for (const ch of midtermWireframeChallenges) {
      map[ch.id] = [...ch.draggableElements].sort((a, b) => a.code.localeCompare(b.code))
    }
    return map
  }, [])

  if (!name) return null

  const currentChallenge = midtermWireframeChallenges[challengeIndex]
  const paletteItems = shuffledPalettes[currentChallenge.id] || currentChallenge.draggableElements

  // Which elements are already placed in the current challenge's slots
  const placedElementIdsInCurrentChallenge = new Set(
    currentChallenge.dropZones.map((z) => placements[z.slotId]).filter(Boolean)
  )

  const placeElementInSlot = (slotId: string, elementId: string) => {
    setPlacements((prev) => {
      const next = { ...prev }
      // If this element is already placed in another slot of this challenge, clear that old slot
      for (const zone of currentChallenge.dropZones) {
        if (next[zone.slotId] === elementId) {
          delete next[zone.slotId]
        }
      }
      next[slotId] = elementId
      return next
    })
    setSelectedElementId(null)
    setDraggedElementId(null)
    setDragOverSlotId(null)
  }

  const removeElementFromSlot = (slotId: string) => {
    setPlacements((prev) => {
      const next = { ...prev }
      delete next[slotId]
      return next
    })
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

  const allCurrentSlotsFilled = currentChallenge.dropZones.every((z) => Boolean(placements[z.slotId]))

  const handleNextChallenge = () => {
    if (!allCurrentSlotsFilled) {
      alert('Please place a UI element into every Wireframe Slot before proceeding.')
      return
    }

    if (challengeIndex < midtermWireframeChallenges.length - 1) {
      setChallengeIndex((prev) => prev + 1)
      setSelectedElementId(null)
    } else {
      // Compute Part II score and combine with Part I score
      const part1Score = parseInt(sessionStorage.getItem('exam_part1_score') || '0', 10)
      const part2Score = scoreWireframePlacements(placements)
      const combinedObjectiveScore = part1Score + part2Score

      sessionStorage.setItem('exam_part2_score', part2Score.toString())
      sessionStorage.setItem('exam_score', combinedObjectiveScore.toString())
      sessionStorage.setItem('exam_violation_count', violationCount.toString())

      router.push('/exam/essay')
    }
  }

  // Render an authentic wireframe preview block based on uiType
  const renderWireframeBlock = (el: DraggableUIElement, isCompact = false) => {
    switch (el.uiType) {
      case 'badge':
        return (
          <div className="w-full rounded-lg bg-amber-50/90 border border-amber-300 px-3 py-2 flex items-center justify-between text-amber-950">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {el.code} • Status / Header Banner
              </span>
              <span className="text-xs sm:text-sm font-semibold mt-0.5">{el.label}</span>
            </div>
          </div>
        )
      case 'textbox':
        return (
          <div className="w-full rounded-lg bg-white border border-neutral-300 p-2.5 flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-700">{el.label}</span>
              <span className="text-[10px] font-mono text-neutral-400">{el.code}</span>
            </div>
            <div className="w-full px-2.5 py-1.5 rounded bg-neutral-100 border border-dashed border-neutral-300 text-xs text-neutral-400 italic">
              {el.placeholder || 'Text input field...'}
            </div>
          </div>
        )
      case 'button':
        return (
          <div className="w-full rounded-lg bg-neutral-900 text-white px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-neutral-300">{el.code}</span>
            <span className="text-xs sm:text-sm font-bold tracking-wide text-center flex-1">{el.label}</span>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
        )
      case 'card':
      default:
        return (
          <div className="w-full rounded-lg bg-indigo-50/80 border border-indigo-200 px-3 py-2.5 flex flex-col space-y-1 text-indigo-950">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {el.code} • {el.subtext || 'UI Card'}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-semibold">{el.label}</span>
          </div>
        )
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-white border border-neutral-200 rounded-2xl shadow-sm p-5 sm:p-8 flex flex-col space-y-6">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 border-b border-neutral-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-neutral-900 uppercase">MIDTERM EXAM</span>
            <span>•</span>
            <span className="font-medium text-neutral-700">{name}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center space-x-1 text-indigo-700 font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Part II: Interactive Wireframe Placement (10 Pts)</span>
            </span>
            {violationCount > 0 && (
              <span className="inline-flex items-center space-x-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                <AlertCircle className="w-3 h-3" />
                <span>Violations: {violationCount}/3</span>
              </span>
            )}
          </div>
        </div>

        {/* Challenge Stepper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-900 text-white">
                Wireframe {challengeIndex + 1} of {midtermWireframeChallenges.length}
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                ({currentChallenge.points} Points)
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900">{currentChallenge.title}</h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{currentChallenge.scenario}</p>
          </div>
        </div>

        {/* Main Interactive Drag & Drop Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Draggable UI Component Palette */}
          <div className="lg:col-span-6 flex flex-col space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Component Palette</h3>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                  <MousePointerClick className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Drag into a slot on the right, or tap an item then tap a slot.</span>
                </p>
              </div>
              <button
                type="button"
                onClick={resetCurrentChallenge}
                className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center space-x-1 px-2 py-1 rounded hover:bg-neutral-200/60 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {paletteItems.map((el) => {
                const isPlaced = placedElementIdsInCurrentChallenge.has(el.id)
                const isSelected = selectedElementId === el.id

                return (
                  <div
                    key={el.id}
                    draggable={!isPlaced}
                    onDragStart={(e) => {
                      if (isPlaced) return
                      setDraggedElementId(el.id)
                      setSelectedElementId(el.id)
                      e.dataTransfer.setData('text/plain', el.id)
                    }}
                    onDragEnd={() => {
                      setDraggedElementId(null)
                      setDragOverSlotId(null)
                    }}
                    onClick={() => {
                      if (isPlaced) return
                      setSelectedElementId((prev) => (prev === el.id ? null : el.id))
                    }}
                    className={`group relative rounded-xl p-2 transition-all select-none ${
                      isPlaced
                        ? 'opacity-40 bg-neutral-100 border border-dashed border-neutral-300 cursor-not-allowed'
                        : isSelected
                        ? 'ring-2 ring-indigo-600 bg-indigo-50/40 cursor-pointer shadow-sm'
                        : 'bg-white border border-neutral-200 hover:border-neutral-400 cursor-grab active:cursor-grabbing shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="text-neutral-400 group-hover:text-neutral-600 px-0.5">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex-1">{renderWireframeBlock(el, true)}</div>
                    </div>
                    {isPlaced && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                        <span className="text-xs font-bold text-neutral-700 bg-white px-2.5 py-1 rounded-full border border-neutral-300 shadow-2xs flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Placed on Wireframe</span>
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
              <strong>UX Tip:</strong> Leave unnecessary clutter or confusing distractor components here in the palette! Only place the essential components needed by the user.
            </div>
          </div>

          {/* Right Column: Mobile Phone Wireframe Canvas */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-md bg-neutral-900 rounded-[2.25rem] p-3.5 shadow-lg border-4 border-neutral-800">
              {/* Phone Top Notch / Speaker */}
              <div className="w-28 h-4 bg-neutral-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                <div className="w-10 h-1 bg-neutral-700 rounded-full" />
              </div>

              {/* Phone Inner Screen */}
              <div className="bg-neutral-50 rounded-[1.6rem] p-4 sm:p-5 min-h-[420px] flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5 text-xs text-neutral-500">
                  <span className="font-bold text-neutral-800 flex items-center space-x-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile Wireframe Canvas</span>
                  </span>
                  <span className="font-mono text-[11px]">
                    {currentChallenge.dropZones.filter((z) => Boolean(placements[z.slotId])).length} /{' '}
                    {currentChallenge.dropZones.length} Slots
                  </span>
                </div>

                {/* Vertical Hierarchy Drop Zones */}
                <div className="flex flex-col space-y-3.5 flex-1 justify-center">
                  {currentChallenge.dropZones.map((zone) => {
                    const placedId = placements[zone.slotId]
                    const placedElement = currentChallenge.draggableElements.find((e) => e.id === placedId)
                    const isDragOver = dragOverSlotId === zone.slotId

                    return (
                      <div
                        key={zone.slotId}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setDragOverSlotId(zone.slotId)
                        }}
                        onDragLeave={() => {
                          if (dragOverSlotId === zone.slotId) setDragOverSlotId(null)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const droppedId = e.dataTransfer.getData('text/plain') || draggedElementId
                          if (droppedId) {
                            placeElementInSlot(zone.slotId, droppedId)
                          }
                        }}
                        onClick={() => {
                          if (selectedElementId) {
                            placeElementInSlot(zone.slotId, selectedElementId)
                          }
                        }}
                        className={`rounded-xl p-3 transition-all border-2 ${
                          placedElement
                            ? 'bg-white border-neutral-800 shadow-xs'
                            : isDragOver || selectedElementId
                            ? 'bg-indigo-50/70 border-dashed border-indigo-500 cursor-pointer'
                            : 'bg-neutral-100/80 border-dashed border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                            {zone.slotLabel}
                          </span>
                          {placedElement && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeElementFromSlot(zone.slotId)
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center space-x-0.5 bg-red-50 px-2 py-0.5 rounded-md"
                              title="Remove from slot"
                            >
                              <X className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        {placedElement ? (
                          <div>{renderWireframeBlock(placedElement)}</div>
                        ) : (
                          <div className="py-5 text-center text-xs text-neutral-400 font-medium">
                            {selectedElementId
                              ? 'Tap here to place selected UI element'
                              : 'Drag a UI component here (or tap item on left first)'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Phone Home Indicator Bar */}
                <div className="pt-2 flex justify-center">
                  <div className="w-28 h-1 bg-neutral-300 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="pt-4 flex items-center justify-between border-t border-neutral-100">
          <button
            type="button"
            disabled={challengeIndex === 0}
            onClick={() => {
              setChallengeIndex((prev) => Math.max(0, prev - 1))
              setSelectedElementId(null)
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Wireframe</span>
          </button>

          <button
            type="button"
            onClick={handleNextChallenge}
            disabled={!allCurrentSlotsFilled}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              !allCurrentSlotsFilled
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-xs'
            }`}
          >
            <span>
              {challengeIndex < midtermWireframeChallenges.length - 1
                ? 'Next Wireframe Challenge'
                : 'Proceed to Part III: Essays'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  )
}

