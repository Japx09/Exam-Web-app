'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Search, X, CheckCircle2, Bot } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Onboarding() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [section, setSection] = useState('BSIT 2-A')
  const [errorMsg, setErrorMsg] = useState('')

  // Score Lookup State
  const [showLookup, setShowLookup] = useState(false)
  const [lookupName, setLookupName] = useState('')
  const [lookupSection, setLookupSection] = useState('BSIT 2-A')
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookupName.trim()) return

    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)

    try {
      const { data, error } = await supabase
        .from('exams')
        .select('mcq_score, ai_score, ai_feedback, is_essay_pasted, violation_count')
        .ilike('student_name', lookupName.trim())
        .eq('section', lookupSection)
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setLookupResult(data[0])
      } else {
        setLookupError('No exam record found for this name and section.')
      }
    } catch (err) {
      setLookupError('Error fetching record. Please try again.')
      console.error(err)
    } finally {
      setLookupLoading(false)
    }
  }

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    setErrorMsg('')

    try {
      const { data } = await supabase
        .from('exams')
        .select('id')
        .ilike('student_name', name.trim())
        .limit(1)

      if (data && data.length > 0) {
        setErrorMsg('You have already submitted an exam with this name.')
        return
      }
    } catch (err) {
      console.error(err)
    }

    // Save to session storage
    sessionStorage.setItem('exam_student_name', name.trim())
    sessionStorage.setItem('exam_section', section)
    sessionStorage.setItem('exam_score', '0')
    sessionStorage.setItem('exam_violation_count', '0')

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
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
      <button 
        onClick={() => setShowLookup(true)}
        className="absolute top-6 right-6 flex items-center space-x-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-sm"
      >
        <Search className="w-4 h-4" />
        <span>Check Score</span>
      </button>

      {showLookup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 w-full max-w-md p-6 flex flex-col relative">
            <button 
              onClick={() => {
                setShowLookup(false)
                setLookupResult(null)
                setLookupError('')
                setLookupName('')
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">Check Your Score</h2>
            <p className="text-sm text-neutral-500 mb-6">Enter your details to view your exam results.</p>
            
            {!lookupResult ? (
              <form onSubmit={handleLookup} className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={lookupName}
                    onChange={(e) => setLookupName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">Section</label>
                  <select
                    value={lookupSection}
                    onChange={(e) => setLookupSection(e.target.value)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="BSIT 2-A">BSIT 2-A</option>
                    <option value="BSIT 2-B">BSIT 2-B</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="mt-2 w-full flex items-center justify-center px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                >
                  {lookupLoading ? 'Checking...' : 'Check Score'}
                </button>
                {lookupError && <p className="text-red-600 text-sm font-medium text-center">{lookupError}</p>}
              </form>
            ) : (
              <div className="flex flex-col space-y-6">
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-neutral-600">MCQ Score</span>
                    <span className="text-lg font-bold text-neutral-900">{lookupResult.mcq_score} / 40</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
                    <span className="text-sm font-medium text-neutral-600 flex items-center">
                      <Bot className="w-4 h-4 mr-1.5" /> AI Essay Score
                    </span>
                    {lookupResult.ai_score !== null ? (
                      <span className="text-lg font-bold text-neutral-900">{lookupResult.ai_score} / 10</span>
                    ) : (
                      <span className="text-sm text-neutral-500">Not available</span>
                    )}
                  </div>
                </div>

                {lookupResult.ai_feedback && (
                  <div className="text-sm text-neutral-700 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                    <span className="font-semibold block mb-1">Feedback:</span>
                    {lookupResult.ai_feedback}
                  </div>
                )}
                
                {lookupResult.is_essay_pasted && (
                  <p className="text-red-600 text-sm font-medium text-center bg-red-50 p-2 rounded-md">
                    Note: Your essay was flagged for pasting.
                  </p>
                )}

                <button
                  onClick={() => setLookupResult(null)}
                  className="w-full px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
                >
                  Search Another
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-sm p-8 flex flex-col space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-12 w-12 bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6 text-neutral-700" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Online Examination</h1>
          <p className="text-sm text-neutral-500">Secure testing portal. Please enter your details to begin.</p>
        </div>

        <form onSubmit={handleStart} className="flex flex-col space-y-5">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-neutral-700">Full Name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Dela Cruz"
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="section" className="text-sm font-medium text-neutral-700">Section</label>
            <select
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
            >
              <option value="BSIT 2-A">BSIT 2-A</option>
              <option value="BSIT 2-B">BSIT 2-B</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 w-full flex items-center justify-center px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
          >
            Start Examination
          </button>
          {errorMsg && (
            <p className="text-red-600 text-sm font-medium text-center mt-2">{errorMsg}</p>
          )}
        </form>
        
        <div className="text-xs text-neutral-400 text-center mt-4 flex flex-col space-y-1">
          <p>By starting, you agree to fullscreen mode.</p>
          <p>Tab switching is strictly monitored.</p>
        </div>
      </div>
    </main>
  )
}
