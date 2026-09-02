'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { questions } from '@/data/questions'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { AlertCircle, Clock, ChevronRight } from 'lucide-react'

export default function ExamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  
  const handleAutoSubmit = () => {
    // Save current score
    sessionStorage.setItem('exam_score', score.toString())
    // Mark as auto-submitted due to violation
    sessionStorage.setItem('exam_forced_submit', 'true')
    // We skip essay and go to results
    router.push('/result')
  }

  const { violationCount, setViolationCount } = useAntiCheat(3, handleAutoSubmit)

  useEffect(() => {
    const studentName = sessionStorage.getItem('exam_student_name')
    if (!studentName) {
      router.push('/')
      return
    }
    setName(studentName)
    
    // We use a local state to ensure it doesn't get overwritten on re-renders,
    // though the final score is only what matters.
    const savedScore = parseInt(sessionStorage.getItem('exam_score') || '0', 10)
    setScore(savedScore)
  }, [router])

  useEffect(() => {
    if (!name) return

    if (timeLeft <= 0) {
      handleNext()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, name])

  const handleNext = () => {
    // Check answer
    const currentQ = questions[currentIndex]
    let newScore = score
    if (selectedOption === currentQ.answer) {
      newScore += 1
      setScore(newScore)
      sessionStorage.setItem('exam_score', newScore.toString())
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setTimeLeft(60)
    } else {
      // Go to essay section
      sessionStorage.setItem('exam_violation_count', violationCount.toString())
      router.push('/exam/essay')
    }
  }

  if (!name) return null // loading or redirecting

  const currentQ = questions[currentIndex]

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-xl shadow-sm p-8 flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-500/10">
              Question {currentIndex + 1} of {questions.length}
            </span>
            {violationCount > 0 && (
              <span className="inline-flex items-center space-x-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                <AlertCircle className="w-3 h-3" />
                <span>Violations: {violationCount}/3</span>
              </span>
            )}
          </div>
          
          <div className={`flex items-center space-x-2 text-sm font-semibold ${timeLeft <= 10 ? 'text-red-600' : 'text-neutral-900'}`}>
            <Clock className="w-4 h-4" />
            <span>00:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Question */}
        <div className="py-4">
          <h2 className="text-xl font-medium text-neutral-900 leading-relaxed">
            {currentQ.question}
          </h2>
        </div>

        {/* Options */}
        <div className="flex flex-col space-y-3">
          {currentQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelectedOption(opt)}
              className={`flex items-center justify-start text-left px-4 py-3 rounded-lg border text-sm transition-all
                ${selectedOption === opt 
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-md' 
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                }`}
            >
              <span className="mr-3 font-semibold opacity-50">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 flex justify-end border-t border-neutral-100">
          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            <span>{currentIndex === questions.length - 1 ? 'Proceed to Essay' : 'Next Question'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  )
}
