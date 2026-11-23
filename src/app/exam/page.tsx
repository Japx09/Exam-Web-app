'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { questions as prelimQuestions } from '@/data/questions'
import { midtermMCQs } from '@/data/midtermQuestions'
import { prefinalMCQs } from '@/data/prefinalQuestions'
import { ActiveQuestion, ExamType, shuffleArray } from '@/lib/examUtils'
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
    router.push('/result')
  }, [router, score])

  const { violationCount } = useAntiCheat(3, handleAutoSubmit)

  useEffect(() => {
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

    const shuffled = shuffleArray(sourceQuestions).map((q) => ({
      ...q,
      options: shuffleArray(q.options)
    }))
    const savedScore = parseInt(sessionStorage.getItem('exam_score') || '0', 10)

    Promise.resolve().then(() => {
      setName(studentName)
      setExamType(storedType)
      setShuffledQuestions(shuffled)
      setScore(savedScore)
    })
  }, [router])

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
      setCurrentIndex((prev) => prev + 1)
      setSelectedOption(null)
      setTimeLeft(60)
    } else {
      sessionStorage.setItem('exam_violation_count', violationCount.toString())
      if (examType === 'MIDTERM' || examType === 'PREFINAL') {
        router.push('/exam/wireframe')
      } else {
        router.push('/exam/essay')
      }
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
              className={`flex items-center space-x-1.5 text-sm font-semibold font-mono tabular-nums px-2.5 py-1 rounded-xl ${
                timeLeft <= 10
                  ? 'bg-red-500/12 text-red-700 animate-pulse'
                  : 'bg-black/[0.05] text-[#1d1d1f]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Fluid Progress Bar */}
          <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0071e3] rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${((currentIndex + 1) / shuffledQuestions.length) * 100}%` }}
            />
          </div>

          {/* Animated Question Stage */}
          <div key={currentQ.id} className="space-y-5 animate-liquid-enter">
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
                    onClick={() => setSelectedOption(opt)}
                    className={`flex items-center text-left px-4 py-3.5 rounded-2xl border text-sm liquid-transition active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#0071e3] bg-[#0071e3]/[0.07] text-[#1d1d1f] shadow-[0_6px_20px_-8px_rgba(0,113,227,0.35)]'
                        : 'border-black/[0.08] bg-white/80 text-[#1d1d1f] hover:bg-white hover:border-black/20'
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
