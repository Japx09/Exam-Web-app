'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Clock, Bot } from 'lucide-react'
import { essayQuestion } from '@/data/questions'
import { midtermCombinedEssayPromptForAI } from '@/data/midtermQuestions'

export default function ResultPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [examType, setExamType] = useState<'PRELIM' | 'MIDTERM'>('PRELIM')
  const [score, setScore] = useState(0)
  const [part1Score, setPart1Score] = useState(0)
  const [part2Score, setPart2Score] = useState(0)
  const [aiScoreState, setAiScoreState] = useState<number | null>(null)
  const [aiFeedbackState, setAiFeedbackState] = useState<string | null>(null)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (submittedRef.current) return
    submittedRef.current = true

    const rawName = sessionStorage.getItem('exam_student_name')
    const section = sessionStorage.getItem('exam_section')
    const storedType = (sessionStorage.getItem('exam_type') as 'PRELIM' | 'MIDTERM') || 'PRELIM'
    const mcqScore = parseInt(sessionStorage.getItem('exam_score') || '0', 10)
    const p1Score = parseInt(sessionStorage.getItem('exam_part1_score') || '0', 10)
    const p2Score = parseInt(sessionStorage.getItem('exam_part2_score') || '0', 10)
    let essayAnswer = sessionStorage.getItem('exam_essay_answer') || ''
    const isEssayPasted = sessionStorage.getItem('exam_is_essay_pasted') === 'true'
    const violationCount = parseInt(sessionStorage.getItem('exam_violation_count') || '0', 10)

    if (!rawName || !section) {
      router.push('/')
      return
    }

    const studentName = rawName.trim().toUpperCase()
    setExamType(storedType)
    setScore(mcqScore)
    setPart1Score(p1Score)
    setPart2Score(p2Score)

    // Ensure Midterm records always carry the [EXAM:MIDTERM] metadata prefix
    if (storedType === 'MIDTERM' && !essayAnswer.startsWith('[EXAM:MIDTERM')) {
      essayAnswer = `[EXAM:MIDTERM|P1:${p1Score}/30|P2:${p2Score}/10]\n${essayAnswer}`
    }

    const hasActualEssayContent =
      storedType === 'MIDTERM'
        ? essayAnswer.replace(/^\[EXAM:MIDTERM[^\]]*\]\s*/, '').trim().length > 0
        : essayAnswer.trim().length > 0

    const submitExam = async () => {
      try {
        let aiScore: number | null = 0
        let aiFeedback: string | null = 'No essay submitted.'

        if (hasActualEssayContent && !isEssayPasted) {
          try {
            const res = await fetch('/api/evaluate-essay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                essay: essayAnswer,
                prompt: storedType === 'MIDTERM' ? midtermCombinedEssayPromptForAI : essayQuestion.prompt
              })
            })
            const data = await res.json()
            aiScore = data.score ?? 0
            aiFeedback = data.feedback ?? 'Evaluation failed.'
          } catch (e) {
            console.error('AI check failed', e)
            aiScore = 0
            aiFeedback = 'Error connecting to AI.'
          }
        } else if (isEssayPasted) {
          aiScore = 0
          aiFeedback = 'Flagged: Essay was copy-pasted.'
        }

        setAiScoreState(aiScore)
        setAiFeedbackState(aiFeedback)

        const payload: any = {
          student_name: studentName,
          section: section,
          mcq_score: mcqScore,
          essay_answer: essayAnswer,
          is_essay_pasted: isEssayPasted,
          violation_count: violationCount,
          ai_score: aiScore,
          ai_feedback: aiFeedback
        }

        const { error } = await supabase.from('exams').insert(payload)

        if (error) {
          console.error('Error submitting exam:', error)
          alert(`Database Error: ${error.message}. Please show this to the admin.`)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        }
      }
    }

    submitExam()
  }, [router])

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="flex items-center space-x-2 text-neutral-500">
          <Clock className="w-5 h-5 animate-spin" />
          <span>Evaluating and recording your {examType.toLowerCase()} exam...</span>
        </div>
      </main>
    )
  }

  const totalScore = score + (aiScoreState || 0)

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 flex flex-col items-center space-y-6 text-center">
        <div className="h-16 w-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mb-1 text-green-600">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
            {examType} EXAMINATION
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 pt-1">Exam Submitted</h1>
          <p className="text-sm text-neutral-500">Your responses have been successfully recorded.</p>
        </div>

        <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-5 flex flex-col space-y-3 text-left">
          {examType === 'MIDTERM' ? (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">Part I: Situational MCQ</span>
                <span className="font-semibold text-neutral-900">{part1Score} / 30</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500">Part II: Wireframe Placement</span>
                <span className="font-semibold text-neutral-900">{part2Score} / 10</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">MCQ Score</span>
              <span className="font-semibold text-neutral-900">{score} / 40</span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm pt-2 border-t border-neutral-200">
            <span className="text-neutral-500 flex items-center gap-1">
              <Bot className="w-4 h-4 text-indigo-500" />
              <span>{examType === 'MIDTERM' ? 'Part III: Essays (AI)' : 'Essay Score (AI)'}</span>
            </span>
            <span className="font-semibold text-neutral-900">
              {aiScoreState !== null ? `${aiScoreState} / 10` : 'Pending'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
            <span className="text-sm font-bold text-neutral-900">Total Score</span>
            <span className="text-lg font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-lg">
              {totalScore} / 50
            </span>
          </div>
        </div>

        {aiFeedbackState && (
          <div className="w-full text-left text-xs text-neutral-600 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 leading-relaxed">
            <strong className="text-indigo-900 block mb-1">AI Feedback:</strong>
            {aiFeedbackState}
          </div>
        )}

        <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={() => {
              sessionStorage.clear()
              router.push('/view-score')
            }}
            className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors"
          >
            View Scoreboard
          </button>
          <button
            onClick={() => {
              sessionStorage.clear()
              router.push('/')
            }}
            className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </main>
  )
}
