'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { ShieldAlert, CheckCircle2, Clock, Trash2, Bot, RefreshCw } from 'lucide-react'
import { essayQuestion } from '@/data/questions'

type ExamRow = Database['public']['Tables']['exams']['Row']

export default function AdminDashboard() {
  const [exams, setExams] = useState<ExamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)

  const handleReevaluate = async (exam: ExamRow) => {
    if (!exam.essay_answer) {
      alert("No essay answer saved for this student.")
      return
    }

    setEvaluatingId(exam.id)
    try {
      const res = await fetch('/api/evaluate-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essay: exam.essay_answer, prompt: essayQuestion.prompt })
      })
      const data = await res.json()
      
      const newScore = data.score ?? 0
      const newFeedback = data.feedback ?? "Evaluation failed."

      const { error } = await supabase
        .from('exams')
        .update({ ai_score: newScore, ai_feedback: newFeedback })
        .eq('id', exam.id)

      if (error) throw error

      setExams(current => current.map(e => 
        e.id === exam.id ? { ...e, ai_score: newScore, ai_feedback: newFeedback } : e
      ))
    } catch (e) {
      console.error("Re-evaluation failed", e)
      alert("Failed to re-evaluate the essay.")
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
      setExams(current => current.filter(exam => exam.id !== id))
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

    // Optionally set up real-time
    const channel = supabase
      .channel('public:exams')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exams' }, (payload) => {
        setExams(current => [payload.new as ExamRow, ...current])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

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
              e.preventDefault();
              if (password === 'nechama2026') {
                setIsAuthenticated(true);
                sessionStorage.setItem('admin_auth', 'true');
                setAuthError('');
              } else {
                setAuthError('Incorrect password');
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
        
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Admin Dashboard</h1>
            <p className="text-sm text-neutral-500">Monitor student examination records and detect anomalies.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2 text-sm text-neutral-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live Monitoring Active</span>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-neutral-500">
            <Clock className="w-5 h-5 animate-spin mr-2" />
            <span>Loading records...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {['BSIT 2-A', 'BSIT 2-B'].map((section) => {
              const sectionExams = exams.filter(e => e.section === section);
              return (
                <div key={section} className="flex flex-col space-y-3">
                  <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">{section}</h2>
                  <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                          <tr>
                            <th className="px-6 py-4">Student Name</th>
                            <th className="px-6 py-4">MCQ Score</th>
                            <th className="px-6 py-4">Violations (Alt-Tab)</th>
                            <th className="px-6 py-4">Essay Status & AI</th>
                            <th className="px-6 py-4 whitespace-nowrap">Submitted At</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {sectionExams.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                                No examination records found for {section}.
                              </td>
                            </tr>
                          ) : (
                            sectionExams.map((exam) => (
                              <tr key={exam.id} className="hover:bg-neutral-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-neutral-900">{exam.student_name}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-md font-medium
                                    ${exam.mcq_score >= 20 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                                  `}>
                                    {exam.mcq_score} / 40
                                  </span>
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
                                      <div className="flex flex-col space-y-1 mt-2">
                                        <div className="flex items-center space-x-2">
                                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium text-xs border border-indigo-100 w-fit">
                                            <Bot className="w-3.5 h-3.5" />
                                            <span>AI Score: {exam.ai_score}/10</span>
                                          </span>
                                          {exam.ai_feedback?.includes("Error") && !exam.is_essay_pasted && (
                                            <button 
                                              onClick={() => handleReevaluate(exam)}
                                              disabled={evaluatingId === exam.id}
                                              className="text-xs flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                                              title="Retry AI Evaluation"
                                            >
                                              <RefreshCw className={`w-3 h-3 ${evaluatingId === exam.id ? 'animate-spin' : ''}`} />
                                              <span>Retry</span>
                                            </button>
                                          )}
                                        </div>
                                        <p className="text-xs text-neutral-500 max-w-xs" title={exam.ai_feedback || ''}>
                                          {exam.ai_feedback}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
