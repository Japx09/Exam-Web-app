'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { ShieldAlert, CheckCircle2, Clock } from 'lucide-react'

type ExamRow = Database['public']['Tables']['exams']['Row']

export default function AdminDashboard() {
  const [exams, setExams] = useState<ExamRow[]>([])
  const [loading, setLoading] = useState(true)

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
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Section</th>
                    <th className="px-6 py-4">MCQ Score</th>
                    <th className="px-6 py-4">Violations (Alt-Tab)</th>
                    <th className="px-6 py-4">Essay Status</th>
                    <th className="px-6 py-4 whitespace-nowrap">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {exams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                        No examination records found.
                      </td>
                    </tr>
                  ) : (
                    exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-neutral-900">{exam.student_name}</td>
                        <td className="px-6 py-4 text-neutral-600">{exam.section}</td>
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
                          {exam.is_essay_pasted ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-red-50 text-red-700 font-medium text-xs border border-red-100">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Flagged (Pasted)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 font-medium text-xs border border-green-100">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Clean</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                          {new Date(exam.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
