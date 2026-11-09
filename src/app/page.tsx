'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  Lock,
  RefreshCw
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

  // Step 1: Student Type & Section | Step 2: Name & School Email OTP | Step 3: Exam Card Selection
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [studentMode, setStudentMode] = useState<'existing' | 'new'>('existing')
  const [section, setSection] = useState('BSIT 2-A')

  // Step 2 state
  const [selectedExistingName, setSelectedExistingName] = useState('')
  const [existingFilter, setExistingFilter] = useState('')
  const [newName, setNewName] = useState('')
  const [schoolEmail, setSchoolEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [otpHint, setOtpHint] = useState('')

  // Step 3 state
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
        console.error('Error loading records:', err)
      } finally {
        setLoadingRecords(false)
      }
    }

    fetchStudents()
  }, [])

  // Unique existing students for chosen section
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

  const filteredExistingStudents = useMemo(() => {
    if (!existingFilter.trim()) return sectionStudents
    const q = existingFilter.trim().toUpperCase()
    return sectionStudents.filter((s) => s.name.includes(q))
  }, [sectionStudents, existingFilter])

  const activeStudentName = useMemo(() => {
    return (studentMode === 'existing' ? selectedExistingName : newName).trim().toUpperCase()
  }, [studentMode, selectedExistingName, newName])

  const cleanLowerEmail = useMemo(() => schoolEmail.trim().toLowerCase(), [schoolEmail])

  const studentStatus = useMemo(() => {
    if (!activeStudentName) {
      return {
        hasPrelim: false,
        prelimScore: null,
        hasMidterm: false,
        midtermScore: null,
        registeredEmail: null as string | null
      }
    }

    let hasPrelim = false
    let prelimScore: number | null = null
    let hasMidterm = false
    let midtermScore: number | null = null
    let registeredEmail: string | null = null

    for (const row of allRecords) {
      if (row.student_name.trim().toUpperCase() === activeStudentName) {
        const total = (row.mcq_score || 0) + (row.ai_score || 0)
        const emailMatch = row.essay_answer?.match(/\|EMAIL:([^|\]]+)/i)
        if (emailMatch) {
          registeredEmail = emailMatch[1].toLowerCase()
        }

        if (isMidtermRecord(row)) {
          hasMidterm = true
          midtermScore = total
        } else {
          hasPrelim = true
          prelimScore = total
        }
      }
    }

    return { hasPrelim, prelimScore, hasMidterm, midtermScore, registeredEmail }
  }, [allRecords, activeStudentName])

  useEffect(() => {
    if (studentMode === 'existing' || studentStatus.hasPrelim) {
      setSelectedExamType('MIDTERM')
    } else {
      setSelectedExamType('PRELIM')
    }
  }, [studentMode, studentStatus.hasPrelim])

  const handleSendOtp = async () => {
    setErrorMsg('')
    setOtpHint('')

    if (!activeStudentName || activeStudentName.length < 3) {
      setErrorMsg('Please select or enter your full name first.')
      return
    }

    if (!cleanLowerEmail.endsWith('.edu.ph')) {
      setErrorMsg('Please enter your official school email ending in .edu.ph')
      return
    }

    if (studentStatus.registeredEmail && studentStatus.registeredEmail !== cleanLowerEmail) {
      setErrorMsg('This student record is already linked to a different school email.')
      return
    }

    setSendingOtp(true)
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          name: activeStudentName,
          email: cleanLowerEmail
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send verification code.')
        setSendingOtp(false)
        return
      }

      setOtpSent(true)
      setOtpHint(data.message || `6-digit code sent to ${cleanLowerEmail}`)
    } catch (err) {
      console.error(err)
      setErrorMsg('Could not send code. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtpAndContinue = async () => {
    setErrorMsg('')
    const cleanCode = otpCode.trim()
    if (cleanCode.length < 6) {
      setErrorMsg('Enter the 6-digit verification code.')
      return
    }

    setVerifyingOtp(true)
    try {
      // 1. Check server deterministic OTP
      const serverRes = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          name: activeStudentName,
          email: cleanLowerEmail,
          code: cleanCode
        })
      })

      if (serverRes.ok) {
        setIsEmailVerified(true)
        setStep(3)
        setVerifyingOtp(false)
        return
      }

      setErrorMsg('Invalid verification code. Check your email or ask your instructor.')
    } catch (err) {
      console.error(err)
      setErrorMsg('Verification error. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleStartExam = async () => {
    setErrorMsg('')

    if (!activeStudentName || !isEmailVerified) {
      setErrorMsg('Please complete verification first.')
      return
    }

    if (selectedExamType === 'PRELIM' && studentStatus.hasPrelim) {
      setErrorMsg('Prelim already completed. Please take the Midterm exam.')
      setSelectedExamType('MIDTERM')
      return
    }

    if (selectedExamType === 'MIDTERM' && studentStatus.hasMidterm) {
      setErrorMsg('You have already submitted the Midterm examination.')
      return
    }

    sessionStorage.setItem('exam_student_name', activeStudentName)
    sessionStorage.setItem('exam_student_email', cleanLowerEmail)
    sessionStorage.setItem('exam_section', section)
    sessionStorage.setItem('exam_type', selectedExamType)
    sessionStorage.setItem('exam_score', '0')
    sessionStorage.setItem('exam_part1_score', '0')
    sessionStorage.setItem('exam_part2_score', '0')
    sessionStorage.setItem('exam_violation_count', '0')
    sessionStorage.removeItem('exam_forced_submit')
    sessionStorage.removeItem('exam_essay_answer')
    sessionStorage.removeItem('exam_is_essay_pasted')

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen request failed', err)
    }

    router.push('/exam')
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Fixed Check Scoreboard Button */}
      <Link
        href="/view-score"
        className="fixed top-5 right-5 z-50 flex items-center space-x-2 text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-full border border-neutral-200 shadow-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Check Score</span>
      </Link>

      {/* Compact Wizard Card */}
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-xs p-6 sm:p-7 flex flex-col justify-between">
        {/* Card Header */}
        <div className="flex flex-col items-center text-center space-y-1.5 mb-5">
          <div className="h-10 w-10 bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center mb-1">
            <ShieldCheck className="w-5 h-5 text-neutral-700" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Online Examination</h1>
          <p className="text-xs text-neutral-500">
            {step === 1 && 'Select your student profile type and section.'}
            {step === 2 && 'Verify your name and school email (.edu.ph).'}
            {step === 3 && 'Choose your examination period to begin.'}
          </p>
        </div>

        {/* STEP 1: STUDENT TYPE & SECTION */}
        {step === 1 && (
          <div className="flex flex-col space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-600">Student Status</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('existing')
                    setErrorMsg('')
                  }}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    studentMode === 'existing'
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-sm font-semibold">Existing Student</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      studentMode === 'existing' ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    Already took Prelim
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('new')
                    setErrorMsg('')
                  }}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    studentMode === 'new'
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-sm font-semibold">New Student</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      studentMode === 'new' ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    First time user
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-600">Section</label>
              <div className="grid grid-cols-2 gap-2.5">
                {['BSIT 2-A', 'BSIT 2-B'].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setSection(sec)
                      setSelectedExistingName('')
                    }}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      section === sec
                        ? 'border-neutral-900 bg-neutral-100 text-neutral-900'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setErrorMsg('')
                setStep(2)
              }}
              className="mt-1 w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: NAME & SCHOOL EMAIL OTP */}
        {step === 2 && (
          <div className="flex flex-col space-y-4">
            {studentMode === 'existing' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-600">Select Your Name ({section})</label>
                  <span className="text-[11px] text-neutral-400">{sectionStudents.length} listed</span>
                </div>
                <input
                  type="text"
                  value={existingFilter}
                  onChange={(e) => setExistingFilter(e.target.value.toUpperCase())}
                  placeholder="SEARCH NAME..."
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs uppercase bg-neutral-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
                <div className="max-h-32 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                  {loadingRecords ? (
                    <div className="p-3 text-center text-xs text-neutral-400">Loading...</div>
                  ) : filteredExistingStudents.length === 0 ? (
                    <div className="p-3 text-center text-xs text-neutral-400">No matching student found.</div>
                  ) : (
                    filteredExistingStudents.map((stu) => {
                      const isSelected = selectedExistingName === stu.name
                      return (
                        <button
                          key={stu.name}
                          type="button"
                          onClick={() => {
                            setSelectedExistingName(stu.name)
                            setOtpSent(false)
                            setIsEmailVerified(false)
                            setErrorMsg('')
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-neutral-900 text-white font-semibold'
                              : 'hover:bg-neutral-50 text-neutral-800'
                          }`}
                        >
                          <span className="truncate">{stu.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-600">Full Name (CAPSLOCK)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value.toUpperCase())
                    setOtpSent(false)
                    setIsEmailVerified(false)
                    setErrorMsg('')
                  }}
                  placeholder="JUAN A. DELA CRUZ"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            )}

            {/* School Email + OTP */}
            <div className="space-y-2 pt-1 border-t border-neutral-100">
              <label className="text-xs font-medium text-neutral-600 block">
                School Email Verification (.edu.ph)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={schoolEmail}
                  onChange={(e) => {
                    setSchoolEmail(e.target.value.toLowerCase())
                    setOtpSent(false)
                    setIsEmailVerified(false)
                    setErrorMsg('')
                  }}
                  placeholder="name@school.edu.ph"
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !activeStudentName || !cleanLowerEmail}
                  className="px-3 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors whitespace-nowrap flex items-center space-x-1"
                >
                  {sendingOtp && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{otpSent ? 'Resend' : 'Send Code'}</span>
                </button>
              </div>

              {otpHint && <p className="text-[11px] text-neutral-500">{otpHint}</p>}

              {otpSent && (
                <div className="pt-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('')
                  setStep(1)
                }}
                className="px-3.5 py-2.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleVerifyOtpAndContinue}
                disabled={!otpSent || otpCode.length < 6 || verifyingOtp}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
              >
                <span>{verifyingOtp ? 'Verifying...' : 'Verify & Continue'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EXAM SELECTION CARDS (PRELIM VS MIDTERM) */}
        {step === 3 && (
          <div className="flex flex-col space-y-4">
            <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-900 truncate">{activeStudentName}</span>
              <span className="text-neutral-500 shrink-0 ml-2">{section}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Prelim Card */}
              <button
                type="button"
                disabled={studentStatus.hasPrelim}
                onClick={() => setSelectedExamType('PRELIM')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  studentStatus.hasPrelim
                    ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed'
                    : selectedExamType === 'PRELIM'
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium opacity-75">
                    <span>PRELIM</span>
                    {studentStatus.hasPrelim && <Lock className="w-3 h-3" />}
                  </div>
                  <div className="text-sm font-semibold leading-snug">Multimedia Systems</div>
                  <div className="text-[11px] opacity-70">40 MCQ • 10 Essay</div>
                </div>

                <div className="mt-4 pt-2 border-t border-current/10 text-[11px] font-medium">
                  {studentStatus.hasPrelim
                    ? `Done (${studentStatus.prelimScore}/50)`
                    : selectedExamType === 'PRELIM'
                    ? 'Selected'
                    : 'Select'}
                </div>
              </button>

              {/* Midterm Card */}
              <button
                type="button"
                disabled={studentStatus.hasMidterm}
                onClick={() => setSelectedExamType('MIDTERM')}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  studentStatus.hasMidterm
                    ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed'
                    : selectedExamType === 'MIDTERM'
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium opacity-75">
                    <span>MIDTERM</span>
                    {studentStatus.hasMidterm && <Lock className="w-3 h-3" />}
                  </div>
                  <div className="text-sm font-semibold leading-snug">UX & AI Workflows</div>
                  <div className="text-[11px] opacity-70">30 MCQ • 10 UI • 10 Essay</div>
                </div>

                <div className="mt-4 pt-2 border-t border-current/10 text-[11px] font-medium">
                  {studentStatus.hasMidterm
                    ? `Done (${studentStatus.midtermScore}/50)`
                    : selectedExamType === 'MIDTERM'
                    ? 'Selected'
                    : 'Select'}
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('')
                  setStep(2)
                }}
                className="px-3.5 py-2.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStartExam}
                disabled={
                  (selectedExamType === 'MIDTERM' && studentStatus.hasMidterm) ||
                  (selectedExamType === 'PRELIM' && studentStatus.hasPrelim)
                }
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
              >
                <span>Start {selectedExamType === 'MIDTERM' ? 'Midterm' : 'Prelim'} Exam</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <p className="text-red-600 text-xs font-medium text-center mt-3 bg-red-50 border border-red-100 rounded-lg py-2 px-3">
            {errorMsg}
          </p>
        )}

        {/* Step Dot Indicators */}
        <div className="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 mx-auto">
            {[1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === dot ? 'w-5 bg-neutral-900' : 'w-1.5 bg-neutral-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
