'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { AlertCircle, FileText, Send, CheckCircle2 } from 'lucide-react'
import { essayQuestion } from '@/data/questions'
import { midtermEssays, formatMidtermEssayAnswer } from '@/data/midtermQuestions'

export default function EssayPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [examType, setExamType] = useState<'PRELIM' | 'MIDTERM'>('PRELIM')

  // Prelim single essay state
  const [essay, setEssay] = useState('')
  // Midterm two essays state
  const [essay1, setEssay1] = useState('')
  const [essay2, setEssay2] = useState('')

  const [isPasted, setIsPasted] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const buildFinalEssayString = () => {
    const email = sessionStorage.getItem('exam_student_email') || undefined
    if (examType === 'MIDTERM') {
      const p1 = parseInt(sessionStorage.getItem('exam_part1_score') || '0', 10)
      const p2 = parseInt(sessionStorage.getItem('exam_part2_score') || '0', 10)
      return formatMidtermEssayAnswer(p1, p2, essay1, essay2, email)
    }
    return email ? `[EXAM:PRELIM|EMAIL:${email}]\n${essay}` : essay
  }

  const handleAutoSubmit = () => {
    sessionStorage.setItem('exam_forced_submit', 'true')
    sessionStorage.setItem('exam_essay_answer', buildFinalEssayString())
    sessionStorage.setItem('exam_is_essay_pasted', isPasted.toString())
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
  }, [router])

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setIsPasted(true)
    setEssay('')
    setEssay1('')
    setEssay2('')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const canSubmit =
    isPasted ||
    (examType === 'MIDTERM' ? Boolean(essay1.trim() && essay2.trim()) : Boolean(essay.trim()))

  const handleSubmit = () => {
    if (!canSubmit) {
      alert('Please write your essay response(s) before submitting.')
      return
    }

    sessionStorage.setItem('exam_essay_answer', buildFinalEssayString())
    sessionStorage.setItem('exam_is_essay_pasted', isPasted.toString())
    sessionStorage.setItem('exam_violation_count', violationCount.toString())
    router.push('/result')
  }

  if (!name) return null

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 z-50">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">AI / Copy-Paste detected. Essay marked 0.</span>
        </div>
      )}

      <div className="w-full max-w-3xl bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
              <FileText className="w-3.5 h-3.5" />
              <span>
                {examType === 'MIDTERM'
                  ? 'Part III: Situational Design & Workflow Essays (10 Points)'
                  : essayQuestion.title}
              </span>
            </span>
            {violationCount > 0 && (
              <span className="inline-flex items-center space-x-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                <AlertCircle className="w-3 h-3" />
                <span>Violations: {violationCount}/3</span>
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase">{name}</span>
        </div>

        {examType === 'PRELIM' ? (
          /* PRELIM SINGLE ESSAY */
          <>
            <div className="py-2">
              <h2 className="text-lg sm:text-xl font-medium text-neutral-900 leading-relaxed">
                {essayQuestion.prompt}
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                Write your answer below. Copy-pasting is strictly prohibited and will result in a score of 0 for this section.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                onPaste={handlePaste}
                placeholder="Type your essay here..."
                className={`w-full h-64 p-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all resize-none ${
                  isPasted ? 'border-red-300 bg-red-50 text-red-900' : 'border-neutral-300 bg-white text-neutral-900'
                }`}
              />
              {isPasted && (
                <p className="text-xs text-red-600 font-medium">Your essay has been flagged for copy-pasting.</p>
              )}
            </div>
          </>
        ) : (
          /* MIDTERM TWO SITUATIONAL ESSAYS (5 PTS EACH = 10 PTS) */
          <div className="space-y-8">
            <p className="text-xs sm:text-sm text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-xl p-3.5">
              Answer both situational essays below (<strong>5 points each = 10 points total</strong>). Copy-pasting from external sources is strictly prohibited and automatically flags the essay as 0.
            </p>

            {/* Essay 1 */}
            <div className="space-y-3 border border-neutral-200 rounded-xl p-4 sm:p-5 bg-neutral-50/40">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-900">{midtermEssays[0].title}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-900 text-white">5 Points</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 font-medium">{midtermEssays[0].scenario}</p>
              <div className="bg-white border border-neutral-200 rounded-lg p-3 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Required 4-Step Pitch Structure:
                </span>
                <ul className="text-xs text-neutral-600 space-y-1 pl-1">
                  {midtermEssays[0].instructions.map((inst, idx) => (
                    <li key={idx}>{inst}</li>
                  ))}
                </ul>
              </div>
              <textarea
                value={essay1}
                onChange={(e) => setEssay1(e.target.value)}
                onPaste={handlePaste}
                placeholder="1. Our user needs...&#10;2. We changed... because...&#10;3. When tested, we observed...&#10;4. Our next improvement is..."
                className={`w-full h-44 p-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all resize-none ${
                  isPasted ? 'border-red-300 bg-red-50 text-red-900' : 'border-neutral-300 bg-white text-neutral-900'
                }`}
              />
            </div>

            {/* Essay 2 */}
            <div className="space-y-3 border border-neutral-200 rounded-xl p-4 sm:p-5 bg-neutral-50/40">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-900">{midtermEssays[1].title}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-900 text-white">5 Points</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 font-medium">{midtermEssays[1].scenario}</p>
              <div className="bg-white border border-neutral-200 rounded-lg p-3 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Answer Both Parts:
                </span>
                <ul className="text-xs text-neutral-600 space-y-1 pl-1">
                  {midtermEssays[1].instructions.map((inst, idx) => (
                    <li key={idx}>{inst}</li>
                  ))}
                </ul>
              </div>
              <textarea
                value={essay2}
                onChange={(e) => setEssay2(e.target.value)}
                onPaste={handlePaste}
                placeholder="Part 1 (Rewritten AI Prompt - Goal, Context, Constraints, Format):&#10;...&#10;&#10;Part 2 (Why confident doesn't mean correct & Google Workspace Workflow):&#10;..."
                className={`w-full h-44 p-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all resize-none ${
                  isPasted ? 'border-red-300 bg-red-50 text-red-900' : 'border-neutral-300 bg-white text-neutral-900'
                }`}
              />
            </div>

            {isPasted && (
              <p className="text-xs text-red-600 font-medium">Your essay has been flagged for copy-pasting.</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 flex justify-end border-t border-neutral-100">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              !canSubmit
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-xs'
            }`}
          >
            <span>Submit {examType === 'MIDTERM' ? 'Midterm' : 'Prelim'} Exam</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  )
}
