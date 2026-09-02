'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, Bot, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ViewScore() {
  const router = useRouter()
  
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

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 sm:p-12 relative">
      <Link 
        href="/"
        className="absolute top-6 left-6 flex items-center space-x-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 w-full max-w-md p-8 flex flex-col">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Check Your Score</h2>
            <p className="text-sm text-neutral-500">View your exam results.</p>
          </div>
        </div>
        
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
              className="mt-4 w-full flex items-center justify-center px-4 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
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
              <div className="text-sm text-neutral-700 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100/50">
                <span className="font-semibold block mb-1.5 text-indigo-900">Feedback:</span>
                {lookupResult.ai_feedback}
              </div>
            )}
            
            {lookupResult.is_essay_pasted && (
              <p className="text-red-600 text-sm font-medium text-center bg-red-50 p-2 rounded-md">
                Note: Your essay was flagged for pasting.
              </p>
            )}

            <button
              onClick={() => {
                setLookupResult(null)
                setLookupName('')
              }}
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors mt-2"
            >
              Search Another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
