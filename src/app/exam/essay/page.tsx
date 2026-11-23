'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { AlertCircle, FileText, Send } from 'lucide-react'
import { essayQuestion } from '@/data/questions'
import { midtermEssays, formatMidtermEssayAnswer } from '@/data/midtermQuestions'
import { prefinalEssays, formatPrefinalEssayAnswer } from '@/data/prefinalQuestions'
import { ExamType } from '@/lib/examUtils'
import {
  cancelScheduledCloudDraftSync,
  hydrateSessionFromLocalDraft,
  loadLocalDraft,
  saveLocalDraft,
  scheduleCloudDraftSync,
  syncDraftToCloud
} from '@/lib/examDraft'

export default function EssayPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [examType, setExamType] = useState<ExamType>('PREFINAL')

  const [essay, setEssay] = useState('')
  const [essay1, setEssay1] = useState('')
  const [essay2, setEssay2] = useState('')

  const [isPasted, setIsPasted] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [draftReady, setDraftReady] = useState(false)

  const isMultiPart = examType === 'MIDTERM' || examType === 'PREFINAL'
  const activeEssays = examType === 'PREFINAL' ? prefinalEssays : midtermEssays

  const buildFinalEssayString = useCallback(() => {
    const email = sessionStorage.getItem('exam_student_email') || undefined
    if (examType === 'PREFINAL') {
      const p1 = parseInt(sessionStorage.getItem('exam_part1_score') || '0', 10)
      const p2 = parseInt(sessionStorage.getItem('exam_part2_score') || '0', 10)
      return formatPrefinalEssayAnswer(p1, p2, essay1, essay2, email)
    }
    if (examType === 'MIDTERM') {
      const p1 = parseInt(sessionStorage.getItem('exam_part1_score') || '0', 10)
      const p2 = parseInt(sessionStorage.getItem('exam_part2_score') || '0', 10)
      return formatMidtermEssayAnswer(p1, p2, essay1, essay2, email)
    }
    return email ? `[EXAM:PRELIM|EMAIL:${email}]\n${essay}` : essay
  }, [essay, essay1, essay2, examType])

  const handleAutoSubmit = useCallback(() => {
    cancelScheduledCloudDraftSync()
    sessionStorage.setItem('exam_forced_submit', 'true')
    sessionStorage.setItem('exam_essay_answer', buildFinalEssayString())
    sessionStorage.setItem('exam_is_essay_pasted', isPasted.toString())
    const saved = saveLocalDraft({
      stage: '/exam/essay',
      essay,
      essay1,
      essay2,
      isEssayPasted: isPasted
    })
    void syncDraftToCloud(saved, { keepalive: true })
    router.push('/result')
  }, [buildFinalEssayString, essay, essay1, essay2, isPasted, router])

  const { violationCount } = useAntiCheat(3, handleAutoSubmit)

  useEffect(() => {
    const draft = hydrateSessionFromLocalDraft()
    const studentName = sessionStorage.getItem('exam_student_name')
    if (!studentName) {
      router.push('/')
      return
    }
    const storedType = (sessionStorage.getItem('exam_type') as ExamType) || 'PREFINAL'
    const restoredEssay = draft?.examType === storedType ? draft.essay || '' : ''
    const restoredEssay1 = draft?.examType === storedType ? draft.essay1 || '' : ''
    const restoredEssay2 = draft?.examType === storedType ? draft.essay2 || '' : ''
    const restoredPasted =
      draft?.examType === storedType ? Boolean(draft.isEssayPasted) : false

    const synced = saveLocalDraft({ stage: '/exam/essay', examType: storedType })
    void syncDraftToCloud(synced)

    Promise.resolve().then(() => {
      setName(studentName)
      setExamType(storedType)
      setEssay(restoredEssay)
      setEssay1(restoredEssay1)
      setEssay2(restoredEssay2)
      setIsPasted(restoredPasted)
      setDraftReady(true)
    })
  }, [router])

  useEffect(() => {
    if (!draftReady || !name) return
    saveLocalDraft({
      stage: '/exam/essay',
      essay,
      essay1,
      essay2,
      isEssayPasted: isPasted,
      violationCount
    })
    scheduleCloudDraftSync(() => loadLocalDraft(), 1200)
  }, [draftReady, name, essay, essay1, essay2, isPasted, violationCount])

  useEffect(() => {
    if (!name) return
    const flushCloud = () => {
      void syncDraftToCloud(loadLocalDraft(), { keepalive: true })
    }
    window.addEventListener('pagehide', flushCloud)
    window.addEventListener('beforeunload', flushCloud)
    return () => {
      window.removeEventListener('pagehide', flushCloud)
      window.removeEventListener('beforeunload', flushCloud)
    }
  }, [name])

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
    isPasted || (isMultiPart ? Boolean(essay1.trim() && essay2.trim()) : Boolean(essay.trim()))

  const handleSubmit = () => {
    if (!canSubmit) return
    cancelScheduledCloudDraftSync()
    sessionStorage.setItem('exam_essay_answer', buildFinalEssayString())
    sessionStorage.setItem('exam_is_essay_pasted', isPasted.toString())
    sessionStorage.setItem('exam_violation_count', violationCount.toString())
    saveLocalDraft({
      stage: '/exam/essay',
      essay,
      essay1,
      essay2,
      isEssayPasted: isPasted,
      violationCount
    })
    router.push('/result')
  }

  if (!name) return null

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-6 left-1/2 -translate-x-1/2 bg-red-600/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-lg flex items-center space-x-2 z-50 liquid-transition ${
          showToast
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2.5 scale-95 pointer-events-none'
        }`}
      >
        <AlertCircle className="w-4 h-4" />
        <span className="font-medium text-xs sm:text-sm">
          Copy-paste detected. Essay marked 0.
        </span>
      </div>

      <div className="w-full max-w-3xl flex flex-col space-y-3.5 my-6">
        <header className="liquid-glass-bar rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-[#0071e3]" />
            <span className="font-semibold text-[#1d1d1f]">
              {examType === 'PREFINAL'
                ? 'Part III · Pre-Final Situational Essays (10 points)'
                : examType === 'MIDTERM'
                ? 'Part III · Situational Design & Workflow Essays (10 points)'
                : essayQuestion.title}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-medium text-[#515154] hidden sm:inline">
              Auto-saved
            </span>
            {violationCount > 0 && (
              <span className="inline-flex items-center space-x-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs font-medium text-red-700 tabular-nums">
                <AlertCircle className="w-3 h-3" />
                <span>{violationCount}/3</span>
              </span>
            )}
            <span className="font-medium text-[#515154] truncate max-w-[160px]">{name}</span>
          </div>
        </header>

        <section className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col space-y-6 animate-liquid-enter">
          {examType === 'PRELIM' ? (
            <>
              <div className="space-y-2 max-w-[68ch]">
                <h2 className="text-lg sm:text-xl font-medium text-[#1d1d1f] leading-relaxed">
                  {essayQuestion.prompt}
                </h2>
                <p className="text-xs sm:text-sm text-[#515154]">
                  Write your response below. Copy-pasting from external sources flags the essay as 0.
                </p>
              </div>

              <div className="flex flex-col space-y-2">
                <textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Write your essay response"
                  className={`w-full h-64 p-4 rounded-2xl border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 focus:border-[#0071e3] liquid-transition resize-none ${
                    isPasted
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-black/[0.1] bg-white/85 focus:bg-white text-[#1d1d1f]'
                  }`}
                />
                {isPasted && (
                  <p className="text-xs text-red-600 font-medium">
                    Your essay has been flagged for copy-pasting.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <p className="text-xs sm:text-sm text-[#515154] leading-relaxed max-w-[68ch]">
                Answer both situational essays below (5 points each, 10 points total). Copy-pasting
                from external sources flags the essay as 0.
              </p>

              {/* Essay 1 */}
              <div className="space-y-3 rounded-2xl p-4 sm:p-5 liquid-glass-tile">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-[#1d1d1f]">{activeEssays[0].title}</h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1d1d1f] text-white shrink-0">
                    5 points
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#515154] leading-relaxed max-w-[68ch]">
                  {activeEssays[0].scenario}
                </p>
                <div className="bg-white/90 border border-black/[0.07] rounded-xl p-3.5 space-y-1.5">
                  <span className="text-xs font-semibold text-[#1d1d1f]">
                    {examType === 'PREFINAL' ? 'Answer both parts' : 'Required 4-step pitch structure'}
                  </span>
                  <ul className="text-xs text-[#515154] space-y-1 leading-relaxed max-w-[68ch]">
                    {activeEssays[0].instructions.map((inst: string, idx: number) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ul>
                </div>
                <textarea
                  value={essay1}
                  onChange={(e) => setEssay1(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={
                    examType === 'PREFINAL'
                      ? 'Part 1 (3 AI Slop tells in the generated page & why they hurt users):\n...\n\nPart 2 (Concrete craft fixes: palette, typography, whitespace, accessibility & microcopy):\n...'
                      : '1. Our user needs...\n2. We changed... because...\n3. When tested, we observed...\n4. Our next improvement is...'
                  }
                  className={`w-full h-44 p-3.5 rounded-xl border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 focus:border-[#0071e3] liquid-transition resize-none ${
                    isPasted
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-black/[0.1] bg-white/90 focus:bg-white text-[#1d1d1f]'
                  }`}
                />
              </div>

              {/* Essay 2 */}
              <div className="space-y-3 rounded-2xl p-4 sm:p-5 liquid-glass-tile">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-[#1d1d1f]">{activeEssays[1].title}</h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1d1d1f] text-white shrink-0">
                    5 points
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#515154] leading-relaxed max-w-[68ch]">
                  {activeEssays[1].scenario}
                </p>
                <div className="bg-white/90 border border-black/[0.07] rounded-xl p-3.5 space-y-1.5">
                  <span className="text-xs font-semibold text-[#1d1d1f]">Answer both parts</span>
                  <ul className="text-xs text-[#515154] space-y-1 leading-relaxed max-w-[68ch]">
                    {activeEssays[1].instructions.map((inst: string, idx: number) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ul>
                </div>
                <textarea
                  value={essay2}
                  onChange={(e) => setEssay2(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={
                    examType === 'PREFINAL'
                      ? 'Part 1 (Step-by-step workflow: Discovery & Flow -> Wireframe -> AI Brief/Skills -> Critique & Testing):\n...\n\nPart 2 (Why skipping wireframes/human verification causes AI slop):\n...'
                      : 'Part 1 (Rewritten AI Prompt - Goal, Context, Constraints, Format):\n...\n\nPart 2 (Why confident doesn\'t mean correct & Google Workspace Workflow):\n...'
                  }
                  className={`w-full h-44 p-3.5 rounded-xl border text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 focus:border-[#0071e3] liquid-transition resize-none ${
                    isPasted
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-black/[0.1] bg-white/90 focus:bg-white text-[#1d1d1f]'
                  }`}
                />
              </div>

              {isPasted && (
                <p className="text-xs text-red-600 font-medium">
                  Your essay has been flagged for copy-pasting.
                </p>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end border-t border-black/[0.06]">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] active:scale-[0.985] disabled:bg-black/10 disabled:text-[#6e6e73] disabled:cursor-not-allowed liquid-transition shadow-xs"
            >
              <span>
                Submit{' '}
                {examType === 'PREFINAL' ? 'Pre-Final' : examType === 'MIDTERM' ? 'Midterm' : 'Prelim'}{' '}
                Exam
              </span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
