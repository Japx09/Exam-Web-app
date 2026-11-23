'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { questions as prelimQuestions } from '@/data/questions'
import { midtermMCQs } from '@/data/midtermQuestions'
import { prefinalMCQs } from '@/data/prefinalQuestions'
import { ActiveQuestion, ExamType, shuffleArray } from '@/lib/examUtils'
import {
  hydrateSessionFromLocalDraft,
  loadLocalDraft,
  saveLocalDraft,
  syncDraftToCloud
} from '@/lib/examDraft'
import { handleSpecularMove } from '@/components/LiquidSegmentedControl'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { AlertCircle, Clock, ChevronRight } from 'lucide-react'

export default function ExamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [examType, setExamType] = useState<ExamType>('PREFINAL')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [shuffledQuestions, setShuffledQuestions] = useState<ActiveQuestion[]>([])

  const handleAutoSubmit = useCallback(() => {
    sessionStorage.setItem('exam_score', score.toString())
    sessionStorage.setItem('exam_part1_score', score.toString())
    sessionStorage.setItem('exam_forced_submit', 'true')
    const draft = saveLocalDraft({ part1Score: score, part1Index: currentIndex })
    void syncDraftToCloud(draft, { keepalive: true })
    router.push('/result')
  }, [currentIndex, router, score])

  const { violationCount } = useAntiCheat(3, handleAutoSubmit)

  useEffect(() => {
    const draft = hydrateSessionFromLocalDraft()
    const studentName = sessionStorage.getItem('exam_student_name')
    if (!studentName) {
      router.push('/')
      return
    }
    const storedType = (sessionStorage.getItem('exam_type') as ExamType) || 'PREFINAL'
    const sourceQuestions: ActiveQuestion[] =
      storedType === 'PREFINAL'
        ? prefinalMCQs
        : storedType === 'MIDTERM'
        ? midtermMCQs
        : prelimQuestions

    let orderedQuestions: ActiveQuestion[]
    const savedIds = draft?.examType === storedType ? draft.part1QuestionIds : undefined
    if (savedIds && savedIds.length > 0) {
      const byId = new Map(sourceQuestions.map((q) => [q.id, q]))
      const seen = new Set<number>()
      const restored: ActiveQuestion[] = []
      for (const id of savedIds) {
        const match = byId.get(id)
        if (match && !seen.has(id)) {
          seen.add(id)
          restored.push({ ...match, options: shuffleArray(match.options) })
        }
      }
      for (const q of sourceQuestions) {
        if (!seen.has(q.id)) {
          restored.push({ ...q, options: shuffleArray(q.options) })
        }
      }
      orderedQuestions = restored
    } else {
      orderedQuestions = shuffleArray(sourceQuestions).map((q) => ({
        ...q,
        options: shuffleArray(q.options)
      }))
    }

    const savedScore =
      draft?.examType === storedType
        ? draft.part1Score
        : parseInt(sessionStorage.getItem('exam_part1_score') || sessionStorage.getItem('exam_score') || '0', 10)
    const resumeIdx =
      draft?.examType === storedType && typeof draft.part1Index === 'number'
        ? Math.min(Math.max(draft.part1Index, 0), Math.max(orderedQuestions.length - 1, 0))
        : 0
    const resumeSelected = draft?.examType === storedType ? draft.part1SelectedOption ?? null : null
    const resumeTimeLeft =
      draft?.examType === storedType && typeof draft.part1TimeLeft === 'number' && draft.part1TimeLeft > 0
        ? Math.max(10, Math.min(60, draft.part1TimeLeft))
        : 60

    if (!savedIds || savedIds.length === 0) {
      const initial = saveLocalDraft({
        stage: '/exam',
        examType: storedType,
        part1QuestionIds: orderedQuestions.map((q) => q.id),
        part1Index: resumeIdx,
        part1Score: savedScore,
        part1SelectedOption: resumeSelected,
        part1TimeLeft: resumeTimeLeft
      })
      void syncDraftToCloud(initial)
    }

    Promise.resolve().then(() => {
      setName(studentName)
      setExamType(storedType)
      setShuffledQuestions(orderedQuestions)
      setScore(savedScore)
      setCurrentIndex(resumeIdx)
      setSelectedOption(resumeSelected)
      setTimeLeft(resumeTimeLeft)
    })
  }, [router])

  useEffect(() => {
    if (!name || shuffledQuestions.length === 0) return
    const flushCloud = () => {
      void syncDraftToCloud(loadLocalDraft(), { keepalive: true })
    }
    window.addEventListener('pagehide', flushCloud)
    window.addEventListener('beforeunload', flushCloud)
    return () => {
      window.removeEventListener('pagehide', flushCloud)
      window.removeEventListener('beforeunload', flushCloud)
    }
  }, [name, shuffledQuestions.length])

  useEffect(() => {
    if (!name || shuffledQuestions.length === 0) return
    saveLocalDraft({
      stage: '/exam',
      part1Index: currentIndex,
      part1Score: score,
      part1SelectedOption: selectedOption,
      part1TimeLeft: timeLeft,
      violationCount
    })
  }, [name, shuffledQuestions.length, currentIndex, score, selectedOption, violationCount, timeLeft])

  const handleNext = useCallback(() => {
    if (!selectedOption && timeLeft > 0) return
    const currentQ = shuffledQuestions[currentIndex]
    if (!currentQ) return

    let newScore = score
    if (selectedOption === currentQ.answer) {
      newScore += 1
      setScore(newScore)
      sessionStorage.setItem('exam_score', newScore.toString())
      sessionStorage.setItem('exam_part1_score', newScore.toString())
    }

    if (currentIndex < shuffledQuestions.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setSelectedOption(null)
      setTimeLeft(60)
      const saved = saveLocalDraft({
        stage: '/exam',
        part1Index: nextIndex,
        part1Score: newScore,
        part1SelectedOption: null,
        part1TimeLeft: 60,
        violationCount
      })
      void syncDraftToCloud(saved)
    } else {
      sessionStorage.setItem('exam_violation_count', violationCount.toString())
      const nextRoute =
        examType === 'MIDTERM' || examType === 'PREFINAL' ? '/exam/wireframe' : '/exam/essay'
      const completedPart1Draft = saveLocalDraft({
        stage: nextRoute,
        part1Index: shuffledQuestions.length,
        part1Score: newScore,
        part1SelectedOption: null,
        part1TimeLeft: 60,
        violationCount
      })
      void syncDraftToCloud(completedPart1Draft, { keepalive: true })
      router.push(nextRoute)
    }
  }, [currentIndex, examType, router, score, selectedOption, shuffledQuestions, timeLeft, violationCount])

  useEffect(() => {
    if (!name || shuffledQuestions.length === 0) return

    if (timeLeft <= 0) {
      Promise.resolve().then(() => handleNext())
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, name, shuffledQuestions.length, handleNext])

  if (!name || shuffledQuestions.length === 0) return null

  const currentQ = shuffledQuestions[currentIndex]
  const examLabel =
    examType === 'PREFINAL' ? 'Pre-Final Exam' : examType === 'MIDTERM' ? 'Midterm Exam' : 'Prelim Exam'

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl flex flex-col space-y-3.5">
        {/* Top Floating Glass Bar */}
        <header className="liquid-glass-bar rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="font-semibold text-[#1d1d1f]">{examLabel}</span>
            <span className="text-[#6e6e73]">·</span>
            <span className="font-medium text-[#515154] truncate">{name}</span>
          </div>
          <span className="text-[#515154] shrink-0">Part I · Multiple Choice</span>
        </header>

        {/* Main Liquid Glass Card */}
        <section className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-lg bg-black/[0.05] px-2.5 py-1 text-xs font-semibold text-[#1d1d1f] tabular-nums">
                Question {currentIndex + 1} of {shuffledQuestions.length}
              </span>
              {currentQ.topic && (
                <span className="inline-flex items-center rounded-lg bg-white/80 border border-black/[0.07] px-2.5 py-1 text-xs font-medium text-[#515154]">
                  {currentQ.topic}
                </span>
              )}
              {violationCount > 0 && (
                <span className="inline-flex items-center space-x-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-medium text-red-700 tabular-nums">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{violationCount}/3</span>
                </span>
              )}
            </div>

            <div
              className={`flex items-center space-x-1.5 text-sm font-semibold font-mono tabular-nums px-2.5 py-1 rounded-xl border liquid-transition ${
                timeLeft <= 10
                  ? 'bg-red-500/12 border-red-500/25 text-red-700'
                  : 'bg-black/[0.05] border-transparent text-[#1d1d1f]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* GPU-Composited Liquid Glass Capsule Progress Bar */}
          <div className="w-full h-2 bg-black/[0.06] rounded-full p-0.5 overflow-hidden">
            <div
              className="w-full h-full origin-left bg-[#0071e3] rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-transform duration-300 ease-[var(--ease-liquid)]"
              style={{ transform: `scaleX(${(currentIndex + 1) / shuffledQuestions.length})` }}
            />
          </div>

          {/* Directional Liquid Question Stage */}
          <div key={currentQ.id} className="space-y-5 animate-liquid-forward">
            <h2 className="text-lg sm:text-[19px] font-medium text-[#1d1d1f] leading-relaxed max-w-[65ch]">
              {currentQ.question}
            </h2>

            <div className="flex flex-col space-y-2.5">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedOption === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onPointerMove={handleSpecularMove}
                    onClick={() => setSelectedOption(opt)}
                    className={`flex items-center text-left px-4 py-3.5 rounded-2xl border text-sm liquid-specular liquid-press ${
                      isSelected
                        ? 'border-[#0071e3] bg-[#0071e3]/[0.08] backdrop-blur-xl text-[#1d1d1f] shadow-[0_10px_24px_-12px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]'
                        : 'liquid-glass-tile text-[#1d1d1f] hover:-translate-y-[1px]'
                    }`}
                  >
                    <span
                      className={`mr-3.5 w-6 h-6 rounded-lg text-xs font-semibold flex items-center justify-center shrink-0 liquid-transition ${
                        isSelected
                          ? 'bg-[#0071e3] text-white'
                          : 'bg-black/[0.05] text-[#515154]'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-black/[0.06]">
            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedOption && timeLeft > 0}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] active:scale-[0.985] disabled:bg-black/10 disabled:text-[#6e6e73] disabled:cursor-not-allowed liquid-transition shadow-xs"
            >
              <span>
                {currentIndex === shuffledQuestions.length - 1
                  ? examType === 'PREFINAL'
                    ? 'Proceed to Part II: UX & Design Audit'
                    : examType === 'MIDTERM'
                    ? 'Proceed to Part II: Wireframe Placement'
                    : 'Proceed to Essay'
                  : 'Next Question'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
