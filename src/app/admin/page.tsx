'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  Trash2,
  Bot,
  RefreshCw,
  Layers,
  Smartphone,
  Plus,
  GripVertical
} from 'lucide-react'
import { essayQuestion } from '@/data/questions'
import {
  isMidtermRecord,
  parseExamDetails,
  midtermCombinedEssayPromptForAI,
  midtermWireframeChallenges,
  WireframeDndChallenge,
  DraggableUIElement
} from '@/data/midtermQuestions'

type ExamRow = Database['public']['Tables']['exams']['Row']

export default function AdminDashboard() {
  const [exams, setExams] = useState<ExamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [examFilter, setExamFilter] = useState<'ALL' | 'PRELIM' | 'MIDTERM'>('ALL')
  const [adminView, setAdminView] = useState<'records' | 'builder'>('records')

  // Teacher Mode: Editable Wireframe Builder State
  const [builderChallenges, setBuilderChallenges] = useState<WireframeDndChallenge[]>(midtermWireframeChallenges)
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
      const isMidterm = isMidtermRecord(exam)
      const res = await fetch('/api/evaluate-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay: exam.essay_answer,
          prompt: isMidterm ? midtermCombinedEssayPromptForAI : essayQuestion.prompt
        })
      })
      const data = await res.json()

      const newScore = data.score ?? 0
      const newFeedback = data.feedback ?? 'Evaluation failed.'

      const { error } = await supabase
        .from('exams')
        // @ts-ignore
        .update({ ai_score: newScore, ai_feedback: newFeedback })
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
      setIsAuthenticated(true)
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exams' }, (payload) => {
        setExams((current) => [payload.new as ExamRow, ...current])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Teacher Builder Helpers
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
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-8 flex flex-col items-center space-y-6 shadow-sm">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold text-neutral-900">Admin Access</h1>
            <p className="text-sm text-neutral-500">Enter password to view records</p>
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
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              autoFocus
            />
            {authError && <p className="text-red-500 text-xs font-medium text-center">{authError}</p>}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-200 pb-6 gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Admin Dashboard</h1>
            <p className="text-sm text-neutral-500">
              Monitor Prelim & Midterm student examination records and configure Wireframe challenges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Switch between Student Records and Teacher Wireframe Builder */}
            <div className="flex items-center space-x-1 bg-neutral-200/70 p-1 rounded-xl">
              <button
                onClick={() => setAdminView('records')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  adminView === 'records'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Student Records ({exams.length})
              </button>
              <button
                onClick={() => setAdminView('builder')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  adminView === 'builder'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Wireframe Builder (Teacher Mode)</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs font-medium text-neutral-500 bg-white px-3 py-1.5 rounded-full border border-neutral-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live Monitoring</span>
            </div>
          </div>
        </header>

        {adminView === 'builder' ? (
          /* TEACHER MODE: EDITABLE WIREFRAME DRAG & DROP BUILDER */
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">
                  Interactive Wireframe Question Builder (Teacher Mode)
                </h2>
                <p className="text-xs text-neutral-500">
                  Inline-edit UI elements, change component types, and drag blocks into the Mobile Wireframe Canvas to set the Answer Key.
                </p>
              </div>
              <div className="flex items-center space-x-1.5">
                {builderChallenges.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveBuilderIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeBuilderIdx === idx
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    Challenge {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Editable Palette */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Draggable UI Blocks (Palette & Distractors)
                  </span>
                  <button
                    type="button"
                    onClick={addDraggableElement}
                    className="inline-flex items-center space-x-1 text-xs font-semibold bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add UI Block</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {activeChallenge.draggableElements.map((el) => {
                    const assignedSlot = activeChallenge.dropZones.find((z) => z.correctElementId === el.id)
                    return (
                      <div
                        key={el.id}
                        draggable
                        onDragStart={() => setDraggedBuilderElId(el.id)}
                        className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col space-y-2 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <GripVertical className="w-4 h-4 text-neutral-400" />
                            <span className="text-xs font-bold text-neutral-800">{el.code}</span>
                            <select
                              value={el.uiType}
                              onChange={(e) => updateElementField(el.id, 'uiType', e.target.value)}
                              className="text-xs bg-white border border-neutral-300 rounded px-2 py-0.5 font-medium text-neutral-700"
                            >
                              <option value="badge">Header / Status Badge</option>
                              <option value="textbox">Text Box / Input Field</option>
                              <option value="button">Primary / Action Button</option>
                              <option value="card">Confirmation / Menu Card</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-2">
                            {assignedSlot ? (
                              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                Answer Key: Slot #{assignedSlot.slotNumber}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                Distractor / Clutter
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeDraggableElement(el.id)}
                              className="text-neutral-400 hover:text-red-600 p-1"
                              title="Delete block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={el.label}
                          onChange={(e) => updateElementField(el.id, 'label', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-medium bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Answer Key Wireframe Canvas */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-sm bg-neutral-900 rounded-4xl p-3 border-4 border-neutral-800 shadow-md">
                  <div className="bg-neutral-50 rounded-3xl p-4 space-y-3">
                    <div className="text-xs font-bold text-neutral-700 border-b border-neutral-200 pb-2 flex items-center justify-between">
                      <span>Answer Key Drop Zones</span>
                      <span className="text-[11px] text-neutral-400">Drag block here to set key</span>
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
                          className="p-3 rounded-xl bg-white border-2 border-neutral-300 space-y-1.5"
                        >
                          <div className="text-[11px] font-bold uppercase text-neutral-500">
                            {zone.slotLabel}
                          </div>
                          {keyEl ? (
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-950">
                              [{keyEl.code}] {keyEl.label}
                            </div>
                          ) : (
                            <div className="text-xs text-neutral-400 italic">No answer key assigned</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-12 text-neutral-500">
            <Clock className="w-5 h-5 animate-spin mr-2" />
            <span>Loading records...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Classroom Backup OTP Generator + Exam Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center space-x-2">
                {(['ALL', 'PRELIM', 'MIDTERM'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setExamFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      examFilter === filter
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Exams' : `${filter} Only`}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLookupOtp} className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-neutral-600 mr-1">Backup Student OTP:</span>
                <input
                  type="text"
                  value={otpLookupName}
                  onChange={(e) => {
                    setOtpLookupName(e.target.value.toUpperCase())
                    setGeneratedBackupOtp(null)
                  }}
                  placeholder="STUDENT FULL NAME (CAPSLOCK)"
                  className="px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold uppercase w-48"
                />
                <input
                  type="email"
                  value={otpLookupEmail}
                  onChange={(e) => {
                    setOtpLookupEmail(e.target.value.toLowerCase())
                    setGeneratedBackupOtp(null)
                  }}
                  placeholder="student@school.edu.ph"
                  className="px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs w-48"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
                >
                  Get 6-Digit Code
                </button>
                {generatedBackupOtp && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-mono font-bold tracking-widest">
                    OTP: {generatedBackupOtp}
                  </span>
                )}
              </form>
            </div>

            {['BSIT 2-A', 'BSIT 2-B'].map((section) => {
              const sectionExams = exams.filter((e) => {
                if (e.section !== section) return false
                if (examFilter === 'ALL') return true
                const isMidterm = isMidtermRecord(e)
                return examFilter === 'MIDTERM' ? isMidterm : !isMidterm
              })

              return (
                <div key={section} className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <h2 className="text-lg font-semibold text-neutral-900">{section}</h2>
                    <span className="text-xs font-medium text-neutral-500">{sectionExams.length} records</span>
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                          <tr>
                            <th className="px-6 py-4">Student Name (CAPSLOCK)</th>
                            <th className="px-6 py-4">Exam Type</th>
                            <th className="px-6 py-4">Objective (/40)</th>
                            <th className="px-6 py-4">Violations</th>
                            <th className="px-6 py-4">Essay Status & AI (/10)</th>
                            <th className="px-6 py-4">Total (/50)</th>
                            <th className="px-6 py-4 whitespace-nowrap">Submitted At</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {sectionExams.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-8 text-center text-neutral-500">
                                No examination records found for {section}.
                              </td>
                            </tr>
                          ) : (
                            sectionExams.map((exam) => {
                              const details = parseExamDetails(exam)
                              return (
                                <tr key={exam.id} className="hover:bg-neutral-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-neutral-900 uppercase">
                                      {exam.student_name.toUpperCase()}
                                    </div>
                                    {details.studentEmail && (
                                      <div className="text-xs text-neutral-400 font-normal lowercase">
                                        {details.studentEmail}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                                        details.examType === 'MIDTERM'
                                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                                      }`}
                                    >
                                      {details.examType}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col space-y-1">
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-md font-medium w-fit ${
                                          exam.mcq_score >= 20
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                        }`}
                                      >
                                        {exam.mcq_score} / 40
                                      </span>
                                      {details.examType === 'MIDTERM' && details.part1Mcq !== null && (
                                        <span className="text-[11px] text-neutral-500">
                                          MCQ: {details.part1Mcq}/30 • Wireframe: {details.part2Dnd}/10
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {exam.violation_count > 0 ? (
                                      <span className="inline-flex items-center space-x-1 text-red-600 font-medium">
                                        <ShieldAlert className="w-4 h-4" />
                                        <span>{exam.violation_count}</span>
                                      </span>
                                    ) : (
                                      <span className="text-neutral-400">0</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col space-y-2">
                                      {exam.is_essay_pasted ? (
                                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-red-50 text-red-700 font-medium text-xs border border-red-100 w-fit">
                                          <ShieldAlert className="w-3.5 h-3.5" />
                                          <span>Flagged (Pasted)</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 font-medium text-xs border border-green-100 w-fit">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Clean</span>
                                        </span>
                                      )}

                                      {exam.ai_score !== null && (
                                        <div className="flex flex-col space-y-1 mt-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium text-xs border border-indigo-100 w-fit">
                                              <Bot className="w-3.5 h-3.5" />
                                              <span>AI Score: {exam.ai_score}/10</span>
                                            </span>
                                            {!exam.is_essay_pasted && (
                                              <button
                                                onClick={() => handleReevaluate(exam)}
                                                disabled={evaluatingId === exam.id}
                                                className="text-xs flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                                                title="Re-evaluate Essay with AI"
                                              >
                                                <RefreshCw
                                                  className={`w-3 h-3 ${evaluatingId === exam.id ? 'animate-spin' : ''}`}
                                                />
                                                <span>Re-grade</span>
                                              </button>
                                            )}
                                          </div>
                                          <p
                                            className="text-xs text-neutral-500 max-w-xs line-clamp-2"
                                            title={exam.ai_feedback || ''}
                                          >
                                            {exam.ai_feedback}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-neutral-900">
                                    {details.totalScore} / 50
                                  </td>
                                  <td className="px-6 py-4 text-neutral-500 whitespace-nowrap text-xs">
                                    {new Date(exam.created_at).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => handleDelete(exam.id)}
                                      className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
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
        )}
      </div>
    </div>
  )
}
