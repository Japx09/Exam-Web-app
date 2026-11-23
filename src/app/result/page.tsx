'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Clock, Bot } from 'lucide-react'
import { essayQuestion } from '@/data/questions'
import { midtermCombinedEssayPromptForAI } from '@/data/midtermQuestions'
import { prefinalCombinedEssayPromptForAI } from '@/data/prefinalQuestions'
import { ExamType } from '@/lib/examUtils'
import type { Database } from '@/types/database'

type ExamInsert = Database['public']['Tables']['exams']['Insert']

export default function ResultPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [examType, setExamType] = useState<ExamType>('PREFINAL')
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
    const storedType = (sessionStorage.getItem('exam_type') as ExamType) || 'PREFINAL'
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
    const studentEmail = sessionStorage.getItem('exam_student_email') || ''
    const emailTag = studentEmail ? `|EMAIL:${studentEmail.trim().toLowerCase()}` : ''

    if (storedType === 'PREFINAL' && !essayAnswer.startsWith('[EXAM:PREFINAL')) {
      essayAnswer = `[EXAM:PREFINAL${emailTag}|P1:${p1Score}/30|P2:${p2Score}/10]\n${essayAnswer}`
    } else if (storedType === 'MIDTERM' && !essayAnswer.startsWith('[EXAM:MIDTERM')) {
      essayAnswer = `[EXAM:MIDTERM${emailTag}|P1:${p1Score}/30|P2:${p2Score}/10]\n${essayAnswer}`
    } else if (storedType === 'PRELIM' && emailTag && !essayAnswer.startsWith('[EXAM:PRELIM')) {
      essayAnswer = `[EXAM:PRELIM${emailTag}]\n${essayAnswer}`
    }

    const hasActualEssayContent =
      storedType === 'PREFINAL' || storedType === 'MIDTERM'
        ? essayAnswer.replace(/^\[EXAM:(?:PREFINAL|MIDTERM)[^\]]*\]\s*/, '').trim().length > 0
        : essayAnswer.trim().length > 0

    const essayPromptForAI =
      storedType === 'PREFINAL'
        ? prefinalCombinedEssayPromptForAI
        : storedType === 'MIDTERM'
        ? midtermCombinedEssayPromptForAI
        : essayQuestion.prompt

    const submitExam = async () => {
      setExamType(storedType)
      setScore(mcqScore)
      setPart1Score(p1Score)
      setPart2Score(p2Score)

      try {
        let aiScore: number | null = 0
        let aiFeedback: string | null = 'No essay submitted.'

        if (hasActualEssayContent) {
          try {
            const res = await fetch('/api/evaluate-essay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                essay: essayAnswer,
                prompt: essayPromptForAI
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
        }

        setAiScoreState(aiScore)
        setAiFeedbackState(aiFeedback)

        const payload: ExamInsert = {
          student_name: studentName,
          section,
          mcq_score: mcqScore,
          essay_answer: essayAnswer,
          is_essay_pasted: isEssayPasted,
          violation_count: violationCount,
          ai_score: aiScore,
          ai_feedback: aiFeedback
        }

        const { error } = await supabase.from('exams').insert(payload as never)

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
        <div className="liquid-glass rounded-2xl px-6 py-4 flex items-center space-x-2.5 text-[#515154] text-sm">
          <Clock className="w-4 h-4 animate-spin text-[#0071e3]" />
          <span>
            Evaluating and recording your {examType === 'PREFINAL' ? 'pre-final' : examType.toLowerCase()}{' '}
            exam...
          </span>
        </div>
      </main>
    )
  }

  const totalScore = score + (aiScoreState || 0)

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md liquid-glass rounded-3xl p-8 flex flex-col items-center space-y-6 text-center animate-liquid-enter">
        <div className="h-14 w-14 bg-emerald-500/12 border border-emerald-500/25 rounded-full flex items-center justify-center text-emerald-700">
          <CheckCircle className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-black/[0.05] text-[#515154]">
            {examType === 'PREFINAL' ? 'Pre-Final' : examType === 'MIDTERM' ? 'Midterm' : 'Prelim'}{' '}
            Examination
          </span>
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[#1d1d1f] pt-1">
            Exam Submitted
          </h1>
          <p className="text-sm text-[#515154]">Your responses have been recorded.</p>
        </div>

        <div className="w-full bg-white/75 border border-black/[0.08] rounded-2xl p-5 flex flex-col space-y-3 text-left">
          {examType === 'MIDTERM' || examType === 'PREFINAL' ? (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#515154]">Part I · Situational MCQ</span>
                <span className="font-semibold text-[#1d1d1f] tabular-nums">{part1Score} / 30</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#515154]">
                  {examType === 'PREFINAL' ? 'Part II · UX & Design Audit' : 'Part II · Wireframe Placement'}
                </span>
                <span className="font-semibold text-[#1d1d1f] tabular-nums">{part2Score} / 10</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#515154]">MCQ Score</span>
              <span className="font-semibold text-[#1d1d1f] tabular-nums">{score} / 40</span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm pt-2 border-t border-black/[0.06]">
            <span className="text-[#515154] flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-[#0071e3]" />
              <span>{examType === 'PRELIM' ? 'Essay Score (AI)' : 'Part III · Essays (AI)'}</span>
            </span>
            <span className="font-semibold text-[#1d1d1f] tabular-nums">
              {aiScoreState !== null ? `${aiScoreState} / 10` : 'Pending'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-black/[0.06]">
            <span className="text-sm font-semibold text-[#1d1d1f]">Total Score</span>
            <span className="text-lg font-semibold text-[#1d1d1f] bg-black/[0.05] px-3 py-0.5 rounded-lg tabular-nums">
              {totalScore} / 50
            </span>
          </div>
        </div>

        {aiFeedbackState && (
          <div className="w-full text-left text-xs text-[#515154] bg-white/70 border border-black/[0.07] rounded-2xl p-4 leading-relaxed">
            <strong className="text-[#1d1d1f] block mb-1 font-semibold">Evaluation Feedback</strong>
            {aiFeedbackState}
          </div>
        )}

        <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              sessionStorage.clear()
              router.push('/view-score')
            }}
            className="flex-1 px-4 py-2.5 bg-[#0071e3] text-white rounded-xl text-sm font-semibold hover:bg-[#0077ed] active:scale-[0.985] liquid-transition"
          >
            View Scoreboard
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.clear()
              router.push('/')
            }}
            className="flex-1 px-4 py-2.5 bg-white/80 border border-black/[0.08] text-[#1d1d1f] rounded-xl text-sm font-medium hover:bg-white liquid-transition"
          >
            Return Home
          </button>
        </div>
      </div>
    </main>
  )
}
