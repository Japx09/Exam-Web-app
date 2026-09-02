'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { AlertCircle, FileText, Send } from 'lucide-react'
import { essayQuestion } from '@/data/questions'

export default function EssayPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [essay, setEssay] = useState('')
  const [isPasted, setIsPasted] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleAutoSubmit = () => {
    sessionStorage.setItem('exam_forced_submit', 'true')
    sessionStorage.setItem('exam_essay_answer', essay)
    sessionStorage.setItem('exam_is_essay_pasted', isPasted.toString())
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
  }, [router])

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setIsPasted(true)
    setEssay('')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleSubmit = () => {
    sessionStorage.setItem('exam_essay_answer', essay)
    sessionStorage.setItem('exam_is_essay_pasted', isPasted.toString())
    sessionStorage.setItem('exam_violation_count', violationCount.toString())
    router.push('/result')
  }

  if (!name) return null

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 z-50">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">AI / Copy-Paste detected. Essay marked 0.</span>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-xl shadow-sm p-8 flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-500/10">
              <FileText className="w-3 h-3" />
              <span>{essayQuestion.title}</span>
            </span>
            {violationCount > 0 && (
              <span className="inline-flex items-center space-x-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                <AlertCircle className="w-3 h-3" />
                <span>Violations: {violationCount}/3</span>
              </span>
            )}
          </div>
        </div>

        {/* Question */}
        <div className="py-2">
          <h2 className="text-xl font-medium text-neutral-900 leading-relaxed">
            {essayQuestion.prompt}
          </h2>
          <p className="text-sm text-neutral-500 mt-2">
            Write your answer below. Copy-pasting is strictly prohibited and will result in a score of 0 for this section.
          </p>
        </div>

        {/* Textarea */}
        <div className="flex flex-col space-y-3">
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            onPaste={handlePaste}
            placeholder="Type your essay here..."
            className={`w-full h-64 p-4 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all resize-none
              ${isPasted ? 'border-red-300 bg-red-50 text-red-900' : 'border-neutral-300 bg-white text-neutral-900'}
            `}
          />
          {isPasted && (
            <p className="text-xs text-red-600 font-medium">Your essay has been flagged for copy-pasting.</p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 flex justify-end border-t border-neutral-100">
          <button
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            <span>Submit Exam</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  )
}
