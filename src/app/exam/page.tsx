'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { questions as prelimQuestions } from '@/data/questions'
import { midtermMCQs } from '@/data/midtermQuestions'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { AlertCircle, Clock, ChevronRight, Layers } from 'lucide-react'

interface ActiveQuestion {
  id: number
  topic?: string
  question: string
  options: string[]
  answer: string
}

export default function ExamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [examType, setExamType] = useState<'PRELIM' | 'MIDTERM'>('PRELIM')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [shuffledQuestions, setShuffledQuestions] = useState<ActiveQuestion[]>([])

  const handleAutoSubmit = () => {
    sessionStorage.setItem('exam_score', score.toString())
    sessionStorage.setItem('exam_part1_score', score.toString())
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

    const storedType = (sessionStorage.getItem('exam_type') as 'PRELIM' | 'MIDTERM') || 'PRELIM'
    setExamType(storedType)

    const sourceQuestions: ActiveQuestion[] =
      storedType === 'MIDTERM' ? midtermMCQs : prelimQuestions

    // Shuffle questions on mount
    const shuffled = [...sourceQuestions].sort(() => Math.random() - 0.5)
    setShuffledQuestions(shuffled)

    const savedScore = parseInt(sessionStorage.getItem('exam_score') || '0', 10)
    setScore(savedScore)
  }, [router])

  useEffect(() => {
    if (!name || shuffledQuestions.length === 0) return

    if (timeLeft <= 0) {
      handleNext()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, name, shuffledQuestions.length])

  const handleNext = () => {
    if (!selectedOption && timeLeft > 0) {
      alert('Please select an answer before proceeding.')
      return
    }

    const currentQ = shuffledQuestions[currentIndex]
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
      if (examType === 'MIDTERM') {
        router.push('/exam/wireframe')
      } else {
        router.push('/exam/essay')
      }
    }
  }

  if (!name || shuffledQuestions.length === 0) return null

  const currentQ = shuffledQuestions[currentIndex]

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col space-y-6">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between text-xs text-neutral-500 border-b border-neutral-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-neutral-900 uppercase">{examType} EXAM</span>
            <span>•</span>
            <span className="font-medium text-neutral-700">{name}</span>
          </div>
          <span className="text-neutral-400">Part I: Multiple Choice</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
              Question {currentIndex + 1} of {shuffledQuestions.length}
            </span>
            {currentQ.topic && (
              <span className="inline-flex items-center space-x-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                <span>{currentQ.topic}</span>
              </span>
            )}
            {violationCount > 0 && (
              <span className="inline-flex items-center space-x-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                <AlertCircle className="w-3 h-3" />
                <span>Violations: {violationCount}/3</span>
              </span>
            )}
          </div>

          <div
            className={`flex items-center space-x-1.5 text-sm font-bold font-mono px-2.5 py-1 rounded-lg ${
              timeLeft <= 10 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-neutral-100 text-neutral-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>00:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-neutral-900 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / shuffledQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="py-2">
          <h2 className="text-lg sm:text-xl font-medium text-neutral-900 leading-relaxed">{currentQ.question}</h2>
        </div>

        {/* Options */}
        <div className="flex flex-col space-y-3">
          {currentQ.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedOption(opt)}
              className={`flex items-start justify-start text-left px-4 py-3.5 rounded-xl border text-sm transition-all ${
                selectedOption === opt
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
              }`}
            >
              <span className="mr-3 font-bold opacity-60 mt-0.5">{String.fromCharCode(65 + i)}.</span>
              <span className="leading-snug">{opt}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 flex justify-end border-t border-neutral-100">
          <button
            type="button"
            onClick={handleNext}
            disabled={!selectedOption && timeLeft > 0}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              !selectedOption && timeLeft > 0
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 text-white hover:bg-neutral-800'
            }`}
          >
            <span>
              {currentIndex === shuffledQuestions.length - 1
                ? examType === 'MIDTERM'
                  ? 'Proceed to Part II: Wireframe Placement'
                  : 'Proceed to Essay'
                : 'Next Question'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  )
}
