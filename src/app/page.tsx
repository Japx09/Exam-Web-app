'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Onboarding() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [section, setSection] = useState('BSIT 2-A')
  const [errorMsg, setErrorMsg] = useState('')

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
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
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
