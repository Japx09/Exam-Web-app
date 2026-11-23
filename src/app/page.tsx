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
import { ExamType, getExamType } from '@/lib/examUtils'
import { SkyCloudBackdrop } from '@/components/SkyCloudBackdrop'
import { LiquidSegmentedControl, handleSpecularMove } from '@/components/LiquidSegmentedControl'

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
  const [stepDir, setStepDir] = useState<1 | -1>(1)
  const [studentMode, setStudentMode] = useState<'existing' | 'new'>('existing')
  const [section, setSection] = useState('BSIT 2-A')

  const goToStep = (next: 1 | 2 | 3) => {
    setStepDir(next >= step ? 1 : -1)
    setStep(next)
  }

  // Step 2 state
  const [selectedExistingName, setSelectedExistingName] = useState('')
  const [existingFilter, setExistingFilter] = useState('')
  const [newName, setNewName] = useState('')
  const [schoolEmail, setSchoolEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const [otpSent, setOtpSent] = useState(false)
  const [showManualOtp, setShowManualOtp] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [otpHint, setOtpHint] = useState('')

  // Step 3 state (Prelim & Midterm globally locked; Pre-Final active)
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('PREFINAL')

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
        hasPrefinal: boolean
        prefinalScore: number | null
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
        midtermScore: null,
        hasPrefinal: false,
        prefinalScore: null
      }

      const total = (row.mcq_score || 0) + (row.ai_score || 0)
      const period = getExamType(row)
      if (period === 'PREFINAL') {
        current.hasPrefinal = true
        current.prefinalScore = total
      } else if (period === 'MIDTERM') {
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
        hasPrefinal: false,
        prefinalScore: null,
        registeredEmail: null as string | null
      }
    }

    let hasPrelim = false
    let prelimScore: number | null = null
    let hasMidterm = false
    let midtermScore: number | null = null
    let hasPrefinal = false
    let prefinalScore: number | null = null
    let registeredEmail: string | null = null

    for (const row of allRecords) {
      if (row.student_name.trim().toUpperCase() === activeStudentName) {
        const total = (row.mcq_score || 0) + (row.ai_score || 0)
        const emailMatch = row.essay_answer?.match(/\|EMAIL:([^|\]]+)/i)
        if (emailMatch) {
          registeredEmail = emailMatch[1].toLowerCase()
        }

        const period = getExamType(row)
        if (period === 'PREFINAL') {
          hasPrefinal = true
          prefinalScore = total
        } else if (period === 'MIDTERM') {
          hasMidterm = true
          midtermScore = total
        } else {
          hasPrelim = true
          prelimScore = total
        }
      }
    }

    return {
      hasPrelim,
      prelimScore,
      hasMidterm,
      midtermScore,
      hasPrefinal,
      prefinalScore,
      registeredEmail
    }
  }, [allRecords, activeStudentName])

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
        if (res.status === 503) setShowManualOtp(true)
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
        goToStep(3)
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

  const handleStartExam = () => {
    setErrorMsg('')

    if (!activeStudentName || !isEmailVerified) {
      setErrorMsg('Please complete verification first.')
      return
    }

    if (selectedExamType !== 'PREFINAL') {
      setErrorMsg('Prelim and Midterm exams are closed. Please take the Pre-Final exam.')
      setSelectedExamType('PREFINAL')
      return
    }

    if (studentStatus.hasPrefinal) {
      setErrorMsg('You have already submitted the Pre-Final examination.')
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
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch (err) {
      console.warn('Fullscreen request failed', err)
    }

    router.push('/exam')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
      <SkyCloudBackdrop />

      {/* Fixed Floating Glass Scoreboard Pill */}
      <Link
        href="/view-score"
        className="fixed top-5 right-5 z-50 liquid-glass-bar flex items-center space-x-2 text-xs sm:text-sm font-medium text-[#515154] hover:text-[#1d1d1f] px-4 py-2 rounded-full liquid-press"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Check Score</span>
      </Link>

      {/* Compact Liquid Glass Wizard Card */}
      <div
        className={`relative z-10 w-full ${
          step === 3 ? 'max-w-xl' : 'max-w-md'
        } liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-[max-width] duration-300 ease-[var(--ease-liquid)]`}
      >
        {/* Card Header */}
        <div className="flex flex-col items-center text-center space-y-1.5 mb-6">
          <div className="h-11 w-11 bg-black/[0.04] border border-black/[0.07] rounded-2xl flex items-center justify-center mb-1.5">
            <ShieldCheck className="w-5 h-5 text-[#1d1d1f]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.025em] text-[#1d1d1f]">
            Online Examination
          </h1>
          <p className="text-xs sm:text-[13px] text-[#515154]">
            {step === 1 && 'Select your student profile type and section.'}
            {step === 2 && 'Verify your name and school email (.edu.ph).'}
            {step === 3 && 'Choose your examination period to begin.'}
          </p>
        </div>

        {/* STEP 1: STUDENT TYPE & SECTION */}
        {step === 1 && (
          <div
            key="step-1"
            className={`flex flex-col space-y-4 ${
              stepDir < 0 ? 'animate-liquid-back' : 'animate-liquid-settle'
            }`}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#515154]">Student Status</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onPointerMove={handleSpecularMove}
                  onClick={() => {
                    setStudentMode('existing')
                    setErrorMsg('')
                  }}
                  className={`p-3.5 rounded-2xl border text-left liquid-specular liquid-press ${
                    studentMode === 'existing'
                      ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white shadow-sm'
                      : 'liquid-glass-tile text-[#1d1d1f]'
                  }`}
                >
                  <div className="text-sm font-semibold">Existing Student</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      studentMode === 'existing' ? 'text-white/70' : 'text-[#6e6e73]'
                    }`}
                  >
                    Took a previous exam
                  </div>
                </button>

                <button
                  type="button"
                  onPointerMove={handleSpecularMove}
                  onClick={() => {
                    setStudentMode('new')
                    setErrorMsg('')
                  }}
                  className={`p-3.5 rounded-2xl border text-left liquid-specular liquid-press ${
                    studentMode === 'new'
                      ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white shadow-sm'
                      : 'liquid-glass-tile text-[#1d1d1f]'
                  }`}
                >
                  <div className="text-sm font-semibold">New Student</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      studentMode === 'new' ? 'text-white/70' : 'text-[#6e6e73]'
                    }`}
                  >
                    First time user
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#515154]">Section</label>
              <LiquidSegmentedControl
                fullWidth
                size="md"
                ariaLabel="Section"
                value={section}
                onChange={(sec) => {
                  setSection(sec)
                  setSelectedExistingName('')
                }}
                options={[
                  { value: 'BSIT 2-A', label: 'BSIT 2-A' },
                  { value: 'BSIT 2-B', label: 'BSIT 2-B' }
                ]}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setErrorMsg('')
                goToStep(2)
              }}
              className="mt-1 w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-[#0071e3] text-white rounded-xl text-sm font-medium hover:bg-[#0077ed] liquid-press shadow-xs"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: NAME & SCHOOL EMAIL OTP */}
        {step === 2 && (
          <div
            key="step-2"
            className={`flex flex-col space-y-4 ${
              stepDir > 0 ? 'animate-liquid-forward' : 'animate-liquid-back'
            }`}
          >
            {studentMode === 'existing' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#515154]">
                    Select Your Name ({section})
                  </label>
                  <span className="text-[11px] text-[#6e6e73] tabular-nums">
                    {sectionStudents.length} listed
                  </span>
                </div>
                <input
                  type="text"
                  value={existingFilter}
                  onChange={(e) => setExistingFilter(e.target.value.toUpperCase())}
                  placeholder="Search name"
                  className="w-full px-3.5 py-2 border border-black/[0.1] rounded-xl text-xs uppercase bg-white/75 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 focus:border-[#0071e3] liquid-transition"
                />
                <div className="max-h-36 overflow-y-auto border border-black/[0.08] bg-white/60 rounded-xl divide-y divide-black/[0.05]">
                  {loadingRecords ? (
                    <div className="p-3 text-center text-xs text-[#6e6e73]">Loading students...</div>
                  ) : filteredExistingStudents.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#6e6e73]">
                      No matching student found.
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
                            setOtpSent(false)
                            setIsEmailVerified(false)
                            setErrorMsg('')
                          }}
                          className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between liquid-transition ${
                            isSelected
                              ? 'bg-[#0071e3] text-white font-semibold'
                              : 'hover:bg-white text-[#1d1d1f]'
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
                <label className="text-xs font-medium text-[#515154]">Full Name (CAPSLOCK)</label>
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
                  className="w-full px-3.5 py-2.5 border border-black/[0.1] bg-white/80 rounded-xl text-sm font-semibold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 focus:border-[#0071e3] liquid-transition"
                />
              </div>
            )}

            {/* School Email + OTP */}
            <div className="space-y-2 pt-2 border-t border-black/[0.06]">
              <label className="text-xs font-medium text-[#515154] block">
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
                  className="flex-1 px-3.5 py-2 border border-black/[0.1] bg-white/80 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 focus:border-[#0071e3] liquid-transition"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !activeStudentName || !cleanLowerEmail}
                  className="px-3.5 py-2 bg-[#1d1d1f] text-white rounded-xl text-xs font-medium hover:bg-black/80 disabled:bg-black/10 disabled:text-[#6e6e73] liquid-transition whitespace-nowrap flex items-center space-x-1"
                >
                  {sendingOtp && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{otpSent ? 'Resend' : 'Send Code'}</span>
                </button>
              </div>

              {otpHint && <p className="text-[11px] text-[#515154]">{otpHint}</p>}

              {!otpSent && !showManualOtp && (
                <button
                  type="button"
                  onClick={() => setShowManualOtp(true)}
                  className="text-[11px] font-medium text-[#515154] hover:text-[#1d1d1f] underline underline-offset-2"
                >
                  Already have a 6-digit instructor code?
                </button>
              )}

              <div className="liquid-disclosure" data-open={otpSent || showManualOtp}>
                <div>
                  <div className="pt-1">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit code"
                      className="w-full px-3 py-2 border border-black/[0.12] bg-white/90 rounded-xl text-xs font-mono tracking-widest text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 focus:border-[#0071e3] liquid-transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('')
                  goToStep(1)
                }}
                className="px-3.5 py-2.5 border border-black/[0.08] bg-white/75 rounded-xl text-xs font-medium text-[#515154] hover:bg-white hover:text-[#1d1d1f] flex items-center space-x-1 liquid-press"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleVerifyOtpAndContinue}
                disabled={otpCode.length < 6 || verifyingOtp}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-[#0071e3] text-white rounded-xl text-xs font-semibold hover:bg-[#0077ed] disabled:bg-black/10 disabled:text-[#6e6e73] liquid-press shadow-xs"
              >
                <span>{verifyingOtp ? 'Verifying...' : 'Verify & Continue'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EXAM SELECTION CARDS (PRELIM, MIDTERM LOCKED; PREFINAL ACTIVE) */}
        {step === 3 && (
          <div key="step-3" className="flex flex-col space-y-4 animate-liquid-forward">
            <div className="px-3.5 py-2.5 bg-white/65 border border-black/[0.07] rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1d1d1f] truncate">{activeStudentName}</span>
              <span className="text-[#515154] shrink-0 ml-2">{section}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Prelim Card (Globally Locked) */}
              <button
                type="button"
                disabled
                className="p-4 rounded-2xl border border-black/[0.06] bg-white/40 text-[#6e6e73] cursor-not-allowed text-left flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span>Prelim</span>
                    <Lock className="w-3 h-3" />
                  </div>
                  <div className="text-sm font-semibold text-[#515154] leading-snug">
                    Multimedia Systems
                  </div>
                  <div className="text-[11px]">40 MCQ · 10 Essay</div>
                </div>

                <div className="mt-4 pt-2 border-t border-black/[0.06] text-[11px] font-medium tabular-nums">
                  {studentStatus.hasPrelim ? `Done (${studentStatus.prelimScore}/50)` : 'Closed'}
                </div>
              </button>

              {/* Midterm Card (Globally Locked) */}
              <button
                type="button"
                disabled
                className="p-4 rounded-2xl border border-black/[0.06] bg-white/40 text-[#6e6e73] cursor-not-allowed text-left flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span>Midterm</span>
                    <Lock className="w-3 h-3" />
                  </div>
                  <div className="text-sm font-semibold text-[#515154] leading-snug">
                    UX & AI Workflows
                  </div>
                  <div className="text-[11px]">30 MCQ · 10 UI · 10 Essay</div>
                </div>

                <div className="mt-4 pt-2 border-t border-black/[0.06] text-[11px] font-medium tabular-nums">
                  {studentStatus.hasMidterm ? `Done (${studentStatus.midtermScore}/50)` : 'Closed'}
                </div>
              </button>

              {/* Pre-Final Card */}
              <button
                type="button"
                disabled={studentStatus.hasPrefinal}
                onPointerMove={handleSpecularMove}
                onClick={() => setSelectedExamType('PREFINAL')}
                className={`p-4 rounded-2xl border text-left liquid-specular liquid-press flex flex-col justify-between ${
                  studentStatus.hasPrefinal
                    ? 'border-black/[0.06] bg-white/40 text-[#6e6e73] cursor-not-allowed'
                    : selectedExamType === 'PREFINAL'
                    ? 'border-[#0071e3] bg-[#0071e3] text-white shadow-[0_12px_28px_-10px_rgba(15,23,42,0.24)]'
                    : 'liquid-glass-tile text-[#1d1d1f]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium opacity-85">
                    <span>Pre-Final</span>
                    {studentStatus.hasPrefinal && <Lock className="w-3 h-3" />}
                  </div>
                  <div className="text-sm font-semibold leading-snug">Multimedia, UX & AI</div>
                  <div className="text-[11px] opacity-80">30 MCQ · 10 Audit · 10 Essay</div>
                </div>

                <div className="mt-4 pt-2 border-t border-current/15 text-[11px] font-medium tabular-nums">
                  {studentStatus.hasPrefinal
                    ? `Done (${studentStatus.prefinalScore}/50)`
                    : selectedExamType === 'PREFINAL'
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
                  goToStep(2)
                }}
                className="px-3.5 py-2.5 border border-black/[0.08] bg-white/75 rounded-xl text-xs font-medium text-[#515154] hover:bg-white hover:text-[#1d1d1f] flex items-center space-x-1 liquid-press"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStartExam}
                disabled={selectedExamType !== 'PREFINAL' || studentStatus.hasPrefinal}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-[#1d1d1f] text-white rounded-xl text-xs font-semibold hover:bg-black/85 disabled:bg-black/10 disabled:text-[#6e6e73] liquid-press shadow-xs"
              >
                <span>Start Pre-Final Exam</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Smooth Error Disclosure */}
        <div className="liquid-disclosure" data-open={Boolean(errorMsg)}>
          <div>
            {errorMsg && (
              <p className="text-red-700 text-xs font-medium text-center mt-3 bg-red-500/10 border border-red-500/20 rounded-xl py-2 px-3">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* Step Dot Indicators */}
        <div className="pt-5 mt-6 border-t border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 mx-auto">
            {[1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`h-1.5 rounded-full transition-all duration-300 ease-[var(--ease-liquid)] ${
                  step === dot ? 'w-6 bg-[#1d1d1f]' : 'w-1.5 bg-black/15'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
