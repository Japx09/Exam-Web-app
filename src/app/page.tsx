'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Search,
  UserCheck,
  UserPlus,
  CheckCircle2,
  BookOpen,
  Layers,
  ChevronRight,
  Lock,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { isMidtermRecord } from '@/data/midtermQuestions'

interface StudentExamRecord {
  id: string
  student_name: string
  section: string
  mcq_score: number
  ai_score: number | null
  essay_answer: string | null
}

export default function Onboarding() {
  const router = useRouter()

  const [studentMode, setStudentMode] = useState<'existing' | 'new'>('existing')
  const [section, setSection] = useState('BSIT 2-A')
  const [selectedExistingName, setSelectedExistingName] = useState('')
  const [existingFilter, setExistingFilter] = useState('')
  const [newName, setNewName] = useState('')
  const [selectedExamType, setSelectedExamType] = useState<'PRELIM' | 'MIDTERM'>('MIDTERM')

  const [allRecords, setAllRecords] = useState<StudentExamRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingRecords(true)
        const { data } = await supabase
          .from('exams')
          .select('id, student_name, section, mcq_score, ai_score, essay_answer')
          .order('student_name', { ascending: true })

        if (data) {
          setAllRecords(data)
        }
      } catch (err) {
        console.error('Error loading existing students:', err)
      } finally {
        setLoadingRecords(false)
      }
    }

    fetchStudents()
  }, [])

  // Unique existing students for the chosen section (normalized to UPPERCASE)
  const sectionStudents = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string
        section: string
        hasPrelim: boolean
        prelimScore: number | null
        hasMidterm: boolean
        midtermScore: number | null
      }
    >()

    for (const row of allRecords) {
      if (row.section !== section) continue
      const upperName = row.student_name.trim().toUpperCase()
      const current = map.get(upperName) || {
        name: upperName,
        section: row.section,
        hasPrelim: false,
        prelimScore: null,
        hasMidterm: false,
        midtermScore: null
      }

      const total = (row.mcq_score || 0) + (row.ai_score || 0)
      if (isMidtermRecord(row)) {
        current.hasMidterm = true
        current.midtermScore = total
      } else {
        current.hasPrelim = true
        current.prelimScore = total
      }

      map.set(upperName, current)
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [allRecords, section])

  // Active student name (always UPPERCASE)
  const activeStudentName = useMemo(() => {
    if (studentMode === 'existing') {
      return selectedExistingName.trim().toUpperCase()
    }
    return newName.trim().toUpperCase()
  }, [studentMode, selectedExistingName, newName])

  // Check if active student already has Prelim or Midterm records across the database
  const studentStatus = useMemo(() => {
    if (!activeStudentName) {
      return { hasPrelim: false, prelimScore: null, hasMidterm: false, midtermScore: null }
    }

    let hasPrelim = false
    let prelimScore: number | null = null
    let hasMidterm = false
    let midtermScore: number | null = null

    for (const row of allRecords) {
      if (row.student_name.trim().toUpperCase() === activeStudentName) {
        const total = (row.mcq_score || 0) + (row.ai_score || 0)
        if (isMidtermRecord(row)) {
          hasMidterm = true
          midtermScore = total
        } else {
          hasPrelim = true
          prelimScore = total
        }
      }
    }

    return { hasPrelim, prelimScore, hasMidterm, midtermScore }
  }, [allRecords, activeStudentName])

  // Automatically set exam type based on student status
  useEffect(() => {
    if (studentMode === 'existing') {
      setSelectedExamType('MIDTERM')
    } else if (studentStatus.hasPrelim && !studentStatus.hasMidterm) {
      setSelectedExamType('MIDTERM')
    } else if (!studentStatus.hasPrelim && studentStatus.hasMidterm) {
      setSelectedExamType('PRELIM')
    }
  }, [studentMode, studentStatus.hasPrelim, studentStatus.hasMidterm])

  const filteredExistingStudents = useMemo(() => {
    if (!existingFilter.trim()) return sectionStudents
    const q = existingFilter.trim().toUpperCase()
    return sectionStudents.filter((s) => s.name.includes(q))
  }, [sectionStudents, existingFilter])

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanName = activeStudentName
    if (!cleanName) {
      setErrorMsg('Please select or enter your full name in CAPSLOCK.')
      return
    }

    if (selectedExamType === 'PRELIM' && studentStatus.hasPrelim) {
      setErrorMsg('You have already completed the Prelim Examination. Please take the Midterm Examination.')
      setSelectedExamType('MIDTERM')
      return
    }

    if (selectedExamType === 'MIDTERM' && studentStatus.hasMidterm) {
      setErrorMsg('You have already submitted the Midterm Examination with this name.')
      return
    }

    // Save to session storage (strictly UPPERCASE name)
    sessionStorage.setItem('exam_student_name', cleanName)
    sessionStorage.setItem('exam_section', section)
    sessionStorage.setItem('exam_type', selectedExamType)
    sessionStorage.setItem('exam_score', '0')
    sessionStorage.setItem('exam_part1_score', '0')
    sessionStorage.setItem('exam_part2_score', '0')
    sessionStorage.setItem('exam_violation_count', '0')
    sessionStorage.removeItem('exam_forced_submit')
    sessionStorage.removeItem('exam_essay_answer')
    sessionStorage.removeItem('exam_is_essay_pasted')

    // Try to enter fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen request failed or is not supported', err)
    }

    router.push('/exam')
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-10 relative">
      <Link
        href="/view-score"
        className="absolute top-5 right-5 flex items-center space-x-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors bg-white px-3.5 py-2 rounded-full border border-neutral-200 shadow-xs"
      >
        <Search className="w-4 h-4" />
        <span>Check Scoreboard</span>
      </Link>

      <div className="w-full max-w-xl bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col space-y-6 my-10">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-12 w-12 bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center mb-1">
            <ShieldCheck className="w-6 h-6 text-neutral-800" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Online Examination Portal</h1>
          <p className="text-sm text-neutral-500">
            Select your profile or register as a new student. All names are recorded in <strong>CAPSLOCK</strong>.
          </p>
        </div>

        {/* Mode Switcher: Existing Student vs New Student */}
        <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1.5 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setStudentMode('existing')
              setErrorMsg('')
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              studentMode === 'existing'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Existing Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStudentMode('new')
              setErrorMsg('')
            }}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              studentMode === 'new'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>New Student</span>
          </button>
        </div>

        <form onSubmit={handleStart} className="flex flex-col space-y-5">
          {/* Section Selector */}
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="section" className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              1. Select Your Section
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['BSIT 2-A', 'BSIT 2-B'].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setSection(sec)
                    setSelectedExistingName('')
                    setErrorMsg('')
                  }}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                    section === sec
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Student Identification */}
          {studentMode === 'existing' ? (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  2. Select Your Name ({section})
                </label>
                <span className="text-xs text-neutral-400">{sectionStudents.length} registered</span>
              </div>

              <input
                type="text"
                value={existingFilter}
                onChange={(e) => setExistingFilter(e.target.value.toUpperCase())}
                placeholder="TYPE TO FILTER YOUR NAME..."
                className="px-3.5 py-2 border border-neutral-200 rounded-lg text-xs uppercase bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
              />

              <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-100 bg-white">
                {loadingRecords ? (
                  <div className="p-4 text-center text-xs text-neutral-400">Loading student list...</div>
                ) : filteredExistingStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500">
                    No matching name found in {section}. Switch to <strong>New Student</strong> tab if you haven&apos;t taken an exam yet.
                  </div>
                ) : (
                  filteredExistingStudents.map((stu) => {
                    const isSelected = selectedExistingName === stu.name
                    return (
                      <button
                        key={stu.name}
                        type="button"
                        onClick={() => {
                          setSelectedExistingName(stu.name)
                          setErrorMsg('')
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-semibold'
                            : 'hover:bg-neutral-50 text-neutral-800'
                        }`}
                      >
                        <span className="truncate pr-2">{stu.name}</span>
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {stu.hasPrelim && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                isSelected
                                  ? 'bg-neutral-700 text-neutral-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              Prelim ✓
                            </span>
                          )}
                          {stu.hasMidterm && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                isSelected
                                  ? 'bg-neutral-700 text-neutral-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              Midterm ✓
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  2. Enter Full Name (AUTO-CAPSLOCK)
                </label>
                <span className="text-[11px] font-medium text-neutral-400">UPPERCASE ONLY</span>
              </div>
              <input
                id="name"
                type="text"
                required
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value.toUpperCase())
                  setErrorMsg('')
                }}
                placeholder="JUAN A. DELA CRUZ"
                className="px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm font-semibold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              />
              {studentStatus.hasPrelim && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 mt-1">
                  ✓ Existing Prelim record detected for <strong>{activeStudentName}</strong>. Automatically routed to Midterm Exam.
                </p>
              )}
            </div>
          )}

          {/* Step 3: Exam Period Selection Cards (Prelim vs Midterm) */}
          {activeStudentName && (
            <div className="flex flex-col space-y-2 pt-1 animate-in fade-in duration-200">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                3. Examination to Take
              </label>

              {studentStatus.hasPrelim ? (
                /* Student already has Prelim -> Prelim is locked/done, Midterm is automatically selected */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Prelim Card (Completed) */}
                  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 opacity-75 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Prelim Exam</span>
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed ({studentStatus.prelimScore}/50)</span>
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-neutral-700">Multimedia Systems</h3>
                      <p className="text-xs text-neutral-500">40 MCQ • 10 Essay</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-neutral-200/70 flex items-center text-xs text-neutral-400">
                      <Lock className="w-3.5 h-3.5 mr-1" />
                      <span>Already taken</span>
                    </div>
                  </div>

                  {/* Midterm Card (Auto-selected) */}
                  <div
                    onClick={() => !studentStatus.hasMidterm && setSelectedExamType('MIDTERM')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      studentStatus.hasMidterm
                        ? 'border-neutral-200 bg-neutral-50 opacity-75 cursor-not-allowed'
                        : 'border-neutral-900 bg-neutral-900 text-white shadow-md cursor-pointer'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            studentStatus.hasMidterm ? 'text-neutral-500' : 'text-amber-300'
                          }`}
                        >
                          Midterm Exam
                        </span>
                        {studentStatus.hasMidterm ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed ({studentStatus.midtermScore}/50)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold bg-white/15 text-white px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Auto-Selected</span>
                          </span>
                        )}
                      </div>
                      <h3 className={`text-sm font-bold ${studentStatus.hasMidterm ? 'text-neutral-700' : 'text-white'}`}>
                        UX Design & AI Workflows
                      </h3>
                      <p className={`text-xs ${studentStatus.hasMidterm ? 'text-neutral-500' : 'text-neutral-300'}`}>
                        30 MCQ • 10 Wireframe UI • 10 Essay
                      </p>
                    </div>
                    <div
                      className={`mt-3 pt-2 border-t flex items-center justify-between text-xs font-medium ${
                        studentStatus.hasMidterm
                          ? 'border-neutral-200 text-neutral-400'
                          : 'border-white/15 text-neutral-200'
                      }`}
                    >
                      <span>{studentStatus.hasMidterm ? 'Already submitted' : 'Ready to start (50 Pts)'}</span>
                      {!studentStatus.hasMidterm && <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              ) : (
                /* New student without Prelim -> Can pick either Prelim or Midterm card */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Prelim Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedExamType('PRELIM')}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      selectedExamType === 'PRELIM'
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            selectedExamType === 'PRELIM' ? 'text-neutral-300' : 'text-neutral-500'
                          }`}
                        >
                          Prelim Exam
                        </span>
                        <BookOpen className="w-4 h-4 opacity-70" />
                      </div>
                      <h3 className="text-sm font-bold">Multimedia Systems</h3>
                      <p className={`text-xs ${selectedExamType === 'PRELIM' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        40 MCQ • 10 Essay (50 Pts)
                      </p>
                    </div>
                    <div
                      className={`mt-3 pt-2 border-t text-xs font-semibold flex items-center justify-between ${
                        selectedExamType === 'PRELIM'
                          ? 'border-white/15 text-white'
                          : 'border-neutral-100 text-neutral-500'
                      }`}
                    >
                      <span>{selectedExamType === 'PRELIM' ? 'Selected ✓' : 'Click to select'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* Midterm Card */}
                  <button
                    type="button"
                    disabled={studentStatus.hasMidterm}
                    onClick={() => setSelectedExamType('MIDTERM')}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      studentStatus.hasMidterm
                        ? 'border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed'
                        : selectedExamType === 'MIDTERM'
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            selectedExamType === 'MIDTERM' ? 'text-amber-300' : 'text-indigo-600'
                          }`}
                        >
                          Midterm Exam
                        </span>
                        <Layers className="w-4 h-4 opacity-70" />
                      </div>
                      <h3 className="text-sm font-bold">UX Design & AI Workflows</h3>
                      <p className={`text-xs ${selectedExamType === 'MIDTERM' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        30 MCQ • 10 Wireframe UI • 10 Essay
                      </p>
                    </div>
                    <div
                      className={`mt-3 pt-2 border-t text-xs font-semibold flex items-center justify-between ${
                        selectedExamType === 'MIDTERM'
                          ? 'border-white/15 text-white'
                          : 'border-neutral-100 text-neutral-500'
                      }`}
                    >
                      <span>
                        {studentStatus.hasMidterm
                          ? `Completed (${studentStatus.midtermScore}/50)`
                          : selectedExamType === 'MIDTERM'
                          ? 'Selected ✓'
                          : 'Click to select'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submit / Start Button */}
          <button
            type="submit"
            disabled={
              !activeStudentName ||
              (selectedExamType === 'MIDTERM' && studentStatus.hasMidterm) ||
              (selectedExamType === 'PRELIM' && studentStatus.hasPrelim)
            }
            className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
          >
            <span>
              {activeStudentName
                ? `Start ${selectedExamType === 'MIDTERM' ? 'Midterm' : 'Prelim'} Exam as ${activeStudentName}`
                : 'Select or Enter Your Name to Start'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {errorMsg && (
            <p className="text-red-600 text-xs sm:text-sm font-medium text-center bg-red-50 border border-red-200 rounded-lg p-2.5">
              {errorMsg}
            </p>
          )}
        </form>

        <div className="text-xs text-neutral-400 text-center pt-2 border-t border-neutral-100 flex flex-col space-y-1">
          <p>By starting, you agree to fullscreen mode. Tab switching is strictly monitored (max 3 violations).</p>
        </div>
      </div>
    </main>
  )
}
