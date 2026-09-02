'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Clock } from 'lucide-react'
import { essayQuestion } from '@/data/questions'

export default function ResultPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (submittedRef.current) return
    submittedRef.current = true

    const studentName = sessionStorage.getItem('exam_student_name')
    const section = sessionStorage.getItem('exam_section')
    const mcqScore = parseInt(sessionStorage.getItem('exam_score') || '0', 10)
    const essayAnswer = sessionStorage.getItem('exam_essay_answer') || ''
    const isEssayPasted = sessionStorage.getItem('exam_is_essay_pasted') === 'true'
    const violationCount = parseInt(sessionStorage.getItem('exam_violation_count') || '0', 10)

    if (!studentName || !section) {
      router.push('/')
      return
    }

    setScore(mcqScore)

    const submitExam = async () => {
      try {
        let aiScore = null;
        let aiFeedback = null;

        if (essayAnswer && !isEssayPasted) {
          try {
            const res = await fetch('/api/evaluate-essay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ essay: essayAnswer, prompt: essayQuestion.prompt })
            });
            const data = await res.json();
            aiScore = data.score ?? 0;
            aiFeedback = data.feedback ?? "Evaluation failed.";
          } catch (e) {
            console.error("AI check failed", e);
            aiScore = 0;
            aiFeedback = "AI Evaluation Error";
          }
        } else if (isEssayPasted) {
          aiScore = 0;
          aiFeedback = "Flagged: Essay was copy-pasted.";
        }

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
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
        // Exit fullscreen if still active
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
          <span>Submitting your exam...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-sm p-8 flex flex-col items-center space-y-6 text-center">
        
        <div className="h-16 w-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mb-2 text-green-600">
          <CheckCircle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Exam Submitted</h1>
          <p className="text-sm text-neutral-500">Your responses have been successfully recorded.</p>
        </div>

        <div className="w-full bg-neutral-50 border border-neutral-100 rounded-lg p-6 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-500">MCQ Score</span>
            <span className="text-lg font-semibold text-neutral-900">{score} / 40</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-500">Essay Status</span>
            <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Pending Review</span>
          </div>
        </div>

        <button
          onClick={() => {
            sessionStorage.clear()
            router.push('/')
          }}
          className="mt-4 w-full px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          Return to Home
        </button>

      </div>
    </main>
  )
}
