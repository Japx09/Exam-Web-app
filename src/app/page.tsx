'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  BookOpen,
  Layers,
  ChevronRight,
  Lock,
  Sparkles,
  Mail,
  KeyRound,
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

  const [section, setSection] = useState('BSIT 2-A')
  const [studentName, setStudentName] = useState('')
  const [schoolEmail, setSchoolEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')

  const [selectedExamType, setSelectedExamType] = useState<'PRELIM' | 'MIDTERM'>('MIDTERM')
  const [allRecords, setAllRecords] = useState<StudentExamRecord[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await supabase
          .from('exams')
          .select('id, student_name, section, mcq_score, ai_score, essay_answer')

        if (data) {
          setAllRecords(data)
        }
      } catch (err) {
        console.error('Error loading records:', err)
      }
    }

    fetchStudents()
  }, [])

  const cleanUpperName = useMemo(() => studentName.trim().toUpperCase(), [studentName])
  const cleanLowerEmail = useMemo(() => schoolEmail.trim().toLowerCase(), [schoolEmail])

  // Check if typed student name already has Prelim or Midterm records
  const studentStatus = useMemo(() => {
    if (!cleanUpperName) {
      return {
        isExistingStudent: false,
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
      if (row.student_name.trim().toUpperCase() === cleanUpperName) {
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

    return {
      isExistingStudent: hasPrelim || hasMidterm,
      hasPrelim,
      prelimScore,
      hasMidterm,
      midtermScore,
      registeredEmail
    }
  }, [allRecords, cleanUpperName])

  // Auto-select Midterm if student already has Prelim
  useEffect(() => {
    if (studentStatus.hasPrelim && !studentStatus.hasMidterm) {
      setSelectedExamType('MIDTERM')
    } else if (!studentStatus.hasPrelim && studentStatus.hasMidterm) {
      setSelectedExamType('PRELIM')
    }
  }, [studentStatus.hasPrelim, studentStatus.hasMidterm])

  const handleSendOtp = async () => {
    setErrorMsg('')
    setOtpMessage('')

    if (!cleanUpperName || cleanUpperName.length < 4) {
      setErrorMsg('Please enter your complete Full Name in CAPSLOCK first.')
      return
    }

    if (!cleanLowerEmail.endsWith('.edu.ph')) {
      setErrorMsg('Please enter a valid school email ending in .edu.ph (e.g., student@school.edu.ph).')
      return
    }

    if (studentStatus.registeredEmail && studentStatus.registeredEmail !== cleanLowerEmail) {
      setErrorMsg('This student name is already linked to a different school email address.')
      return
    }

    setSendingOtp(true)
    try {
      // 1. Validate with server OTP route (checks anti-impersonation)
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          name: cleanUpperName,
          email: cleanLowerEmail
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to validate school email.')
        setSendingOtp(false)
        return
      }

      // 2. Trigger Supabase Auth OTP email
      const { error: supaError } = await supabase.auth.signInWithOtp({
        email: cleanLowerEmail,
        options: {
          shouldCreateUser: true
        }
      })

      if (supaError) {
        console.warn('Supabase Auth OTP warning:', supaError.message)
      }

      setOtpSent(true)
      setOtpMessage(
        `A 6-digit verification code has been sent to ${cleanLowerEmail}. (If delayed by school firewall, ask your instructor for your backup OTP code.)`
      )
    } catch (err) {
      console.error(err)
      setErrorMsg('Network error sending verification code. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    setErrorMsg('')
    const cleanCode = otpCode.trim()
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code.')
      return
    }

    setVerifyingOtp(true)
    try {
      // 1. Try verifying via server deterministic OTP first
      const serverRes = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          name: cleanUpperName,
          email: cleanLowerEmail,
          code: cleanCode
        })
      })

      if (serverRes.ok) {
        setIsEmailVerified(true)
        setOtpMessage('School email verified!')
        setVerifyingOtp(false)
        return
      }

      // 2. Try verifying via Supabase Auth OTP (email or signup token type)
      const { error: emailOtpErr } = await supabase.auth.verifyOtp({
        email: cleanLowerEmail,
        token: cleanCode,
        type: 'email'
      })

      if (!emailOtpErr) {
        setIsEmailVerified(true)
        setOtpMessage('School email verified!')
        setVerifyingOtp(false)
        return
      }

      const { error: signupOtpErr } = await supabase.auth.verifyOtp({
        email: cleanLowerEmail,
        token: cleanCode,
        type: 'signup'
      })

      if (!signupOtpErr) {
        setIsEmailVerified(true)
        setOtpMessage('School email verified!')
        setVerifyingOtp(false)
        return
      }

      setErrorMsg('Invalid or expired 6-digit verification code. Please check your school email or ask your instructor.')
    } catch (err) {
      console.error(err)
      setErrorMsg('Verification failed. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!cleanUpperName) {
      setErrorMsg('Please enter your full name in CAPSLOCK.')
      return
    }

    if (!isEmailVerified) {
      setErrorMsg('Please verify your school email (.edu.ph) with the 6-digit OTP code before starting.')
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

    // Save to session storage (strictly UPPERCASE name + verified email)
    sessionStorage.setItem('exam_student_name', cleanUpperName)
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
            Enter your full name in <strong>CAPSLOCK</strong> and verify your <strong>@edu.ph school email</strong> to unlock your exam.
          </p>
        </div>

        <form onSubmit={handleStart} className="flex flex-col space-y-5">
          {/* 1. Section Selector */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              1. Select Your Section
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['BSIT 2-A', 'BSIT 2-B'].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  disabled={isEmailVerified}
                  onClick={() => {
                    setSection(sec)
                    setErrorMsg('')
                  }}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                    section === sec
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  } ${isEmailVerified ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Student Full Name (Strictly CAPSLOCK, no public list of other students) */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                2. Full Name (AUTO-CAPSLOCK)
              </label>
              <span className="text-[11px] font-medium text-neutral-400">FIRST M.I. LAST NAME</span>
            </div>
            <input
              id="name"
              type="text"
              required
              disabled={isEmailVerified}
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value.toUpperCase())
                setOtpSent(false)
                setIsEmailVerified(false)
                setErrorMsg('')
              }}
              placeholder="E.G. ADRIAN JAMES T. ARRIOLA"
              className="px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent disabled:bg-neutral-100 disabled:text-neutral-600 transition-all"
            />
          </div>

          {/* 3. School Email (@*.edu.ph) + OTP Verification */}
          <div className="flex flex-col space-y-2.5 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="flex items-center justify-between">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <span>3. School Email Verification (.edu.ph)</span>
              </label>
              {isEmailVerified && (
                <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="email"
                type="email"
                required
                disabled={isEmailVerified}
                value={schoolEmail}
                onChange={(e) => {
                  setSchoolEmail(e.target.value.toLowerCase())
                  setOtpSent(false)
                  setIsEmailVerified(false)
                  setErrorMsg('')
                }}
                placeholder="yourname@school.edu.ph"
                className="flex-1 px-3.5 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
              />
              {!isEmailVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !cleanUpperName || !cleanLowerEmail}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors whitespace-nowrap flex items-center justify-center space-x-1.5"
                >
                  {sendingOtp && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{otpSent ? 'Resend Code' : 'Send OTP Code'}</span>
                </button>
              )}
            </div>

            {otpMessage && !isEmailVerified && (
              <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 leading-relaxed">
                {otpMessage}
              </p>
            )}

            {otpSent && !isEmailVerified && (
              <div className="flex flex-col sm:flex-row gap-2 pt-1 animate-in fade-in duration-200">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full pl-9 pr-3.5 py-2 border border-neutral-300 rounded-lg text-sm font-mono tracking-widest bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length < 6}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors whitespace-nowrap"
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            )}
          </div>

          {/* 4. Exam Period Selection Cards (Shown ONLY after Email OTP is verified!) */}
          {isEmailVerified && cleanUpperName && (
            <div className="flex flex-col space-y-2.5 pt-1 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  4. Select Examination
                </label>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  {studentStatus.isExistingStudent
                    ? 'Existing Student Detected — Auto-Routed to Midterm'
                    : 'New Student Profile'}
                </span>
              </div>

              {studentStatus.hasPrelim ? (
                /* Existing student who already took Prelim -> Prelim locked, Midterm auto-selected */
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
                      <span>Already completed</span>
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
              !cleanUpperName ||
              !isEmailVerified ||
              (selectedExamType === 'MIDTERM' && studentStatus.hasMidterm) ||
              (selectedExamType === 'PRELIM' && studentStatus.hasPrelim)
            }
            className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
          >
            <span>
              {!isEmailVerified
                ? 'Verify School Email (.edu.ph) to Unlock Exam'
                : `Start ${selectedExamType === 'MIDTERM' ? 'Midterm' : 'Prelim'} Exam as ${cleanUpperName}`}
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
