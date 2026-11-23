'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import {
  ShieldAlert,
  Clock,
  Trash2,
  RefreshCw,
  Plus,
  GripVertical
} from 'lucide-react'
import { essayQuestion } from '@/data/questions'
import {
  midtermCombinedEssayPromptForAI,
  midtermWireframeChallenges
} from '@/data/midtermQuestions'
import {
  prefinalCombinedEssayPromptForAI,
  prefinalAuditSpecimens,
  prefinalVisualPrinciples
} from '@/data/prefinalQuestions'
import {
  ExamType,
  getExamType,
  isDraftRecord,
  parseExamDetails,
  WireframeDndChallenge,
  DraggableUIElement
} from '@/lib/examUtils'

type ExamRow = Database['public']['Tables']['exams']['Row']

export default function AdminDashboard() {
  const [exams, setExams] = useState<ExamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [examFilter, setExamFilter] = useState<'ALL' | ExamType>('ALL')
  const [adminView, setAdminView] = useState<'records' | 'builder' | 'otp'>('records')

  // Teacher Mode: Editable Wireframe Builder State (Midterm) + Pre-Final Audit Key
  const [builderPeriod, setBuilderPeriod] = useState<'PREFINAL' | 'MIDTERM'>('PREFINAL')
  const [builderChallenges, setBuilderChallenges] = useState<WireframeDndChallenge[]>(
    midtermWireframeChallenges
  )
  const [activeBuilderIdx, setActiveBuilderIdx] = useState(0)
  const [draggedBuilderElId, setDraggedBuilderElId] = useState<string | null>(null)

  // Admin Backup OTP Lookup State
  const [otpLookupName, setOtpLookupName] = useState('')
  const [otpLookupEmail, setOtpLookupEmail] = useState('')
  const [generatedBackupOtp, setGeneratedBackupOtp] = useState<string | null>(null)

  const handleLookupOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpLookupName.trim() || !otpLookupEmail.trim()) return
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_lookup',
          name: otpLookupName.trim().toUpperCase(),
          email: otpLookupEmail.trim().toLowerCase()
        })
      })
      const data = await res.json()
      if (data.otp) {
        setGeneratedBackupOtp(data.otp)
      } else {
        alert(data.error || 'Could not generate OTP.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReevaluate = async (exam: ExamRow) => {
    if (!exam.essay_answer) {
      alert('No essay answer saved for this student.')
      return
    }

    setEvaluatingId(exam.id)
    try {
      const period = getExamType(exam)
      const prompt =
        period === 'PREFINAL'
          ? prefinalCombinedEssayPromptForAI
          : period === 'MIDTERM'
          ? midtermCombinedEssayPromptForAI
          : essayQuestion.prompt
      const res = await fetch('/api/evaluate-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay: exam.essay_answer,
          prompt
        })
      })
      const data = await res.json()

      const newScore = data.score ?? 0
      const newFeedback = data.feedback ?? 'Evaluation failed.'

      const { error } = await supabase
        .from('exams')
        .update({ ai_score: newScore, ai_feedback: newFeedback } as never)
        .eq('id', exam.id)

      if (error) throw error

      setExams((current) =>
        current.map((e) => (e.id === exam.id ? { ...e, ai_score: newScore, ai_feedback: newFeedback } : e))
      )
    } catch (e) {
      console.error('Re-evaluation failed', e)
      alert('Failed to re-evaluate the essay.')
    } finally {
      setEvaluatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return

    const { error } = await supabase.from('exams').delete().eq('id', id)
    if (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete record.')
    } else {
      setExams((current) => current.filter((exam) => exam.id !== id))
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      Promise.resolve().then(() => setIsAuthenticated(true))
    }
  }, [])

  useEffect(() => {
    const fetchExams = async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching exams:', error)
      } else if (data) {
        setExams(data)
      }
      setLoading(false)
    }

    fetchExams()

    const channel = supabase
      .channel('public:exams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const next = payload.new as ExamRow
          setExams((current) => [next, ...current.filter((item) => item.id !== next.id)])
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as ExamRow
          setExams((current) => {
            const exists = current.some((item) => item.id === updated.id)
            return exists
              ? current.map((item) => (item.id === updated.id ? updated : item))
              : [updated, ...current]
          })
        } else if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id?: string } | null)?.id
          if (oldId) {
            setExams((current) => current.filter((item) => item.id !== oldId))
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const activeChallenge = builderChallenges[activeBuilderIdx]

  const updateElementField = (elId: string, field: keyof DraggableUIElement, value: string) => {
    setBuilderChallenges((prev) =>
      prev.map((ch, idx) =>
        idx !== activeBuilderIdx
          ? ch
          : {
              ...ch,
              draggableElements: ch.draggableElements.map((el) =>
                el.id === elId ? { ...el, [field]: value } : el
              )
            }
      )
    )
  }

  const addDraggableElement = () => {
    const nextCodeLetter = String.fromCharCode(65 + activeChallenge.draggableElements.length)
    const newEl: DraggableUIElement = {
      id: `el_custom_${Date.now()}`,
      code: `Element ${nextCodeLetter}`,
      uiType: 'textbox',
      label: 'New Custom UI Element',
      placeholder: 'Placeholder text...'
    }
    setBuilderChallenges((prev) =>
      prev.map((ch, idx) =>
        idx !== activeBuilderIdx ? ch : { ...ch, draggableElements: [...ch.draggableElements, newEl] }
      )
    )
  }

  const removeDraggableElement = (elId: string) => {
    setBuilderChallenges((prev) =>
      prev.map((ch, idx) =>
        idx !== activeBuilderIdx
          ? ch
          : {
              ...ch,
              draggableElements: ch.draggableElements.filter((el) => el.id !== elId)
            }
      )
    )
  }

  const setAnswerKeyForSlot = (slotId: string, elementId: string) => {
    setBuilderChallenges((prev) =>
      prev.map((ch, idx) =>
        idx !== activeBuilderIdx
          ? ch
          : {
              ...ch,
              dropZones: ch.dropZones.map((z) =>
                z.slotId === slotId ? { ...z, correctElementId: elementId } : z
              )
            }
      )
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm liquid-glass rounded-3xl p-8 flex flex-col items-center space-y-6 animate-liquid-enter">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">
              Admin Access
            </h1>
            <p className="text-sm text-[#515154]">Enter password to view records</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (password === 'nechama2026') {
                setIsAuthenticated(true)
                sessionStorage.setItem('admin_auth', 'true')
                setAuthError('')
              } else {
                setAuthError('Incorrect password')
              }
            }}
            className="w-full space-y-4"
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2.5 border border-black/[0.1] bg-white/80 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 focus:border-[#0071e3] liquid-transition"
              autoFocus
            />
            {authError && <p className="text-red-600 text-xs font-medium text-center">{authError}</p>}
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-[#0071e3] text-white rounded-xl text-sm font-semibold hover:bg-[#0077ed] active:scale-[0.985] liquid-transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Clean Liquid Glass Header */}
        <header className="liquid-glass-bar rounded-2xl px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#515154]">
              Monitor examination records and manage assessments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-black/[0.045] p-1 rounded-xl border border-black/[0.05]">
              <button
                onClick={() => setAdminView('records')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium liquid-transition tabular-nums ${
                  adminView === 'records'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#515154] hover:text-[#1d1d1f]'
                }`}
              >
                Records ({exams.filter((e) => !isDraftRecord(e)).length})
              </button>
              <button
                onClick={() => setAdminView('otp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium liquid-transition ${
                  adminView === 'otp'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#515154] hover:text-[#1d1d1f]'
                }`}
              >
                Student OTP
              </button>
              <button
                onClick={() => setAdminView('builder')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium liquid-transition ${
                  adminView === 'builder'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#515154] hover:text-[#1d1d1f]'
                }`}
              >
                Wireframe Key
              </button>
            </div>
          </div>
        </header>

        {/* VIEW 1: BACKUP OTP GENERATOR */}
        {adminView === 'otp' && (
          <div className="max-w-md liquid-glass rounded-3xl p-6 space-y-4 animate-liquid-enter">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Student Backup OTP</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Generate a student&apos;s 6-digit verification code if their school email delivery is delayed.
              </p>
            </div>
            <form onSubmit={handleLookupOtp} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">Full Name (CAPSLOCK)</label>
                <input
                  type="text"
                  required
                  value={otpLookupName}
                  onChange={(e) => {
                    setOtpLookupName(e.target.value.toUpperCase())
                    setGeneratedBackupOtp(null)
                  }}
                  placeholder="JUAN A. DELA CRUZ"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">School Email (.edu.ph)</label>
                <input
                  type="email"
                  required
                  value={otpLookupEmail}
                  onChange={(e) => {
                    setOtpLookupEmail(e.target.value.toLowerCase())
                    setGeneratedBackupOtp(null)
                  }}
                  placeholder="student@school.edu.ph"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors"
              >
                Generate 6-Digit Code
              </button>
            </form>

            {generatedBackupOtp && (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
                <span className="text-xs text-neutral-500">Verification Code:</span>
                <span className="text-base font-mono font-bold tracking-widest text-neutral-900">
                  {generatedBackupOtp}
                </span>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: TEACHER PART II ANSWER KEY */}
        {adminView === 'builder' && (
          <div className="liquid-glass rounded-3xl p-6 space-y-6 animate-liquid-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#1d1d1f]">
                  {builderPeriod === 'PREFINAL'
                    ? 'Pre-Final Part II Answer Key'
                    : 'Wireframe Placement Answer Key'}
                </h2>
                <p className="text-xs text-[#515154]">
                  {builderPeriod === 'PREFINAL'
                    ? 'Good UX vs AI Slop UI classifications and Visual Design Principle keys.'
                    : 'Edit UI elements and drag blocks into the wireframe slots to configure the answer key.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-black/[0.045] p-1 rounded-xl border border-black/[0.05]">
                  {(['PREFINAL', 'MIDTERM'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setBuilderPeriod(period)
                        setActiveBuilderIdx(0)
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium liquid-transition ${
                        builderPeriod === period
                          ? 'bg-white text-[#1d1d1f] shadow-xs'
                          : 'text-[#515154] hover:text-[#1d1d1f]'
                      }`}
                    >
                      {period === 'PREFINAL' ? 'Pre-Final' : 'Midterm'}
                    </button>
                  ))}
                </div>
                {builderPeriod === 'MIDTERM' && (
                  <div className="flex items-center space-x-1 bg-black/[0.045] p-1 rounded-xl border border-black/[0.05]">
                    {builderChallenges.map((ch, idx) => (
                      <button
                        key={ch.id}
                        onClick={() => setActiveBuilderIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium liquid-transition ${
                          activeBuilderIdx === idx
                            ? 'bg-white text-[#1d1d1f] shadow-xs'
                            : 'text-[#515154] hover:text-[#1d1d1f]'
                        }`}
                      >
                        Challenge {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {builderPeriod === 'PREFINAL' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#515154]">
                    Screen 1 · Good UX vs AI Slop UI (5 pts)
                  </h3>
                  <div className="space-y-2.5">
                    {prefinalAuditSpecimens.map((spec) => (
                      <div
                        key={spec.id}
                        className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.08] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#1d1d1f]">{spec.title}</span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              spec.correctCategory === 'GOOD_UX'
                                ? 'bg-[#0071e3]/10 text-[#0071e3]'
                                : 'bg-black/[0.07] text-[#1d1d1f]'
                            }`}
                          >
                            {spec.correctCategory === 'GOOD_UX' ? 'Good UX' : 'AI Slop UI'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#515154]">{spec.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#515154]">
                    Screen 2 · Visual Design Principles (5 pts)
                  </h3>
                  <div className="space-y-2.5">
                    {prefinalVisualPrinciples.map((vp, idx) => (
                      <div
                        key={vp.id}
                        className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.08] flex items-center justify-between gap-3"
                      >
                        <span className="text-xs font-medium text-[#1d1d1f]">
                          Item {idx + 1} ({vp.visualKey})
                        </span>
                        <span className="text-xs font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-md shrink-0">
                          {vp.answer}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500">Draggable UI Blocks</span>
                  <button
                    type="button"
                    onClick={addDraggableElement}
                    className="inline-flex items-center space-x-1 text-xs font-medium bg-neutral-900 text-white px-2.5 py-1.5 rounded-lg hover:bg-neutral-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Block</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {activeChallenge.draggableElements.map((el) => {
                    const assignedSlot = activeChallenge.dropZones.find((z) => z.correctElementId === el.id)
                    return (
                      <div
                        key={el.id}
                        draggable
                        onDragStart={() => setDraggedBuilderElId(el.id)}
                        className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 flex flex-col space-y-2 cursor-grab"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <GripVertical className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-xs font-semibold text-neutral-700">{el.code}</span>
                            <select
                              value={el.uiType}
                              onChange={(e) => updateElementField(el.id, 'uiType', e.target.value)}
                              className="text-xs bg-white border border-neutral-200 rounded px-2 py-0.5 text-neutral-700"
                            >
                              <option value="badge">Badge</option>
                              <option value="textbox">Textbox</option>
                              <option value="button">Button</option>
                              <option value="card">Card</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-medium text-neutral-500">
                              {assignedSlot ? `Slot #${assignedSlot.slotNumber}` : 'Distractor'}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDraggableElement(el.id)}
                              className="text-neutral-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={el.label}
                          onChange={(e) => updateElementField(el.id, 'label', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3">
                  <div className="text-xs font-semibold text-neutral-700 border-b border-neutral-200 pb-2">
                    Target Wireframe Slots
                  </div>

                  {activeChallenge.dropZones.map((zone) => {
                    const keyEl = activeChallenge.draggableElements.find(
                      (e) => e.id === zone.correctElementId
                    )
                    return (
                      <div
                        key={zone.slotId}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (draggedBuilderElId) {
                            setAnswerKeyForSlot(zone.slotId, draggedBuilderElId)
                            setDraggedBuilderElId(null)
                          }
                        }}
                        className="p-3 rounded-lg bg-white border border-neutral-200 space-y-1"
                      >
                        <div className="text-[11px] font-medium text-neutral-500">{zone.slotLabel}</div>
                        {keyEl ? (
                          <div className="text-xs font-semibold text-neutral-900">
                            [{keyEl.code}] {keyEl.label}
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-400">Unassigned</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* VIEW 3: STUDENT RECORDS */}
        {adminView === 'records' &&
          (loading ? (
            <div className="flex items-center justify-center p-12 text-neutral-500">
              <Clock className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Loading records...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Minimal Period Filter */}
              <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-lg w-fit border border-neutral-200/60">
                {(['ALL', 'PRELIM', 'MIDTERM', 'PREFINAL'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setExamFilter(filter)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      examFilter === filter
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All Exams'
                      : filter === 'PRELIM'
                      ? 'Prelim'
                      : filter === 'MIDTERM'
                      ? 'Midterm'
                      : 'Pre-Final'}
                  </button>
                ))}
              </div>

              {['BSIT 2-A', 'BSIT 2-B'].map((section) => {
                const sectionExams = exams.filter((e) => {
                  if (isDraftRecord(e) || e.section !== section) return false
                  if (examFilter === 'ALL') return true
                  return getExamType(e) === examFilter
                })

                return (
                  <div key={section} className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                      <h2 className="text-base font-semibold text-neutral-900">{section}</h2>
                      <span className="text-xs text-neutral-500">{sectionExams.length} records</span>
                    </div>

                    <div className="liquid-glass rounded-3xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-xs font-medium">
                            <tr>
                              <th className="px-5 py-3.5">Student Name</th>
                              <th className="px-5 py-3.5">Period</th>
                              <th className="px-5 py-3.5">Objective</th>
                              <th className="px-5 py-3.5">Essay (AI)</th>
                              <th className="px-5 py-3.5">Total</th>
                              <th className="px-5 py-3.5">Violations</th>
                              <th className="px-5 py-3.5 whitespace-nowrap">Submitted</th>
                              <th className="px-5 py-3.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {sectionExams.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-neutral-400 text-xs">
                                  No examination records found for {section}.
                                </td>
                              </tr>
                            ) : (
                              sectionExams.map((exam) => {
                                const details = parseExamDetails(exam)
                                return (
                                  <tr key={exam.id} className="hover:bg-neutral-50/80 transition-colors">
                                    <td className="px-5 py-3.5">
                                      <div className="font-medium text-neutral-900 uppercase text-xs sm:text-sm">
                                        {exam.student_name.toUpperCase()}
                                      </div>
                                      {details.studentEmail && (
                                        <div className="text-[11px] text-neutral-400 lowercase">
                                          {details.studentEmail}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700">
                                        {details.examType === 'PREFINAL' ? 'PRE-FINAL' : details.examType}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <div className="font-medium text-neutral-900">{exam.mcq_score} / 40</div>
                                      {(details.examType === 'MIDTERM' || details.examType === 'PREFINAL') &&
                                        details.part1Mcq !== null && (
                                          <div className="text-[11px] text-[#515154] tabular-nums">
                                            {details.part1Mcq} MCQ · {details.part2Dnd}{' '}
                                            {details.examType === 'PREFINAL' ? 'Audit' : 'UI'}
                                          </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <div className="flex flex-col space-y-1 max-w-xs">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-neutral-900">
                                            {exam.ai_score ?? 0} / 10
                                          </span>
                                          {exam.is_essay_pasted ? (
                                            <span className="text-[11px] text-red-600 font-medium">Pasted</span>
                                          ) : (
                                            <button
                                              onClick={() => handleReevaluate(exam)}
                                              disabled={evaluatingId === exam.id}
                                              className="text-[11px] text-neutral-400 hover:text-neutral-900 flex items-center space-x-1 disabled:opacity-50"
                                              title="Re-evaluate Essay"
                                            >
                                              <RefreshCw
                                                className={`w-3 h-3 ${
                                                  evaluatingId === exam.id ? 'animate-spin' : ''
                                                }`}
                                              />
                                            </button>
                                          )}
                                        </div>
                                        {exam.ai_feedback && (
                                          <p
                                            className="text-[11px] text-neutral-500 line-clamp-1"
                                            title={exam.ai_feedback}
                                          >
                                            {exam.ai_feedback}
                                          </p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <span
                                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                                          details.totalScore >= 25
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}
                                      >
                                        {details.totalScore} / 50
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      {exam.violation_count > 0 ? (
                                        <span className="inline-flex items-center space-x-1 text-red-600 text-xs font-medium">
                                          <ShieldAlert className="w-3.5 h-3.5" />
                                          <span>{exam.violation_count}</span>
                                        </span>
                                      ) : (
                                        <span className="text-neutral-400 text-xs">0</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5 text-neutral-400 whitespace-nowrap text-xs">
                                      {new Date(exam.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                      <button
                                        onClick={() => handleDelete(exam.id)}
                                        className="text-[#515154] hover:text-red-700 p-1.5 rounded-lg hover:bg-black/[0.05] liquid-transition"
                                        title="Delete Record"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
      </div>
    </div>
  )
}
