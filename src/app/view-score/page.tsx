'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, ChevronLeft, Bot, Award, ArrowUpDown, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface ExamRecord {
  id: string
  student_name: string
  section: string
  mcq_score: number
  ai_score: number | null
  ai_feedback: string | null
  is_essay_pasted: boolean
  violation_count: number
  created_at: string
}

export default function ViewScore() {
  const [exams, setExams] = useState<ExamRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'BSIT 2-A' | 'BSIT 2-B' | 'ALL'>('BSIT 2-A')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'score-desc' | 'score-asc'>('name-asc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    fetchScores()

    // Realtime updates
    const channel = supabase
      .channel('public:exams:view-score')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => {
        fetchScores()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchScores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('student_name', { ascending: true })

      if (error) throw error
      setExams(data || [])
    } catch (err: any) {
      console.error(err)
      setError('Failed to load scores. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  // Filter & Sort
  const filteredAndSortedExams = useMemo(() => {
    return exams
      .filter((exam) => {
        const matchesTab = activeTab === 'ALL' || exam.section === activeTab
        const matchesSearch = exam.student_name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        return matchesTab && matchesSearch
      })
      .sort((a, b) => {
        const totalA = (a.mcq_score || 0) + (a.ai_score || 0)
        const totalB = (b.mcq_score || 0) + (b.ai_score || 0)

        switch (sortBy) {
          case 'name-desc':
            return b.student_name.localeCompare(a.student_name)
          case 'score-desc':
            return totalB - totalA || a.student_name.localeCompare(b.student_name)
          case 'score-asc':
            return totalA - totalB || a.student_name.localeCompare(b.student_name)
          case 'name-asc':
          default:
            return a.student_name.localeCompare(b.student_name)
        }
      })
  }, [exams, activeTab, searchQuery, sortBy])

  const countSectionA = useMemo(() => exams.filter((e) => e.section === 'BSIT 2-A').length, [exams])
  const countSectionB = useMemo(() => exams.filter((e) => e.section === 'BSIT 2-B').length, [exams])

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-16">
      {/* Top Navbar */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center space-x-2 text-neutral-500 text-xs sm:text-sm">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Multimedia Exam Results</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {/* Page Title Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">Student Scoreboard</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Check your official scores for Multiple Choice (40 pts) and AI Essay Evaluation (10 pts).
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4 mb-6">
          <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('BSIT 2-A')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === 'BSIT 2-A'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span>BSIT 2-A</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'BSIT 2-A' ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {countSectionA}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('BSIT 2-B')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === 'BSIT 2-B'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span>BSIT 2-B</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'BSIT 2-B' ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {countSectionB}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                activeTab === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span>All Sections</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'ALL' ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {exams.length}
              </span>
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all placeholder:text-neutral-400"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all appearance-none text-neutral-700 font-medium cursor-pointer"
              >
                <option value="name-asc">Sort: A to Z</option>
                <option value="name-desc">Sort: Z to A</option>
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scores Table */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-neutral-500 font-medium">Loading scores...</p>
            </div>
          ) : filteredAndSortedExams.length === 0 ? (
            <div className="py-16 text-center text-neutral-500">
              <p className="font-medium text-base text-neutral-700">No records found</p>
              <p className="text-sm mt-1">Try adjusting your search query or section tab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-50/75 border-b border-neutral-200 text-neutral-600 font-medium text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 sm:px-6">Student Name</th>
                    {activeTab === 'ALL' && <th className="py-3.5 px-4 sm:px-6">Section</th>}
                    <th className="py-3.5 px-4 sm:px-6 text-center">MCQ (/40)</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Essay (/10)</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Total (/50)</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredAndSortedExams.map((exam, index) => {
                    const totalScore = (exam.mcq_score || 0) + (exam.ai_score || 0)
                    const isExpanded = expandedRow === exam.id

                    return (
                      <React.Fragment key={exam.id}>
                        <tr
                          onClick={() => toggleRow(exam.id)}
                          className={`hover:bg-neutral-50/80 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-neutral-50/50' : ''
                          }`}
                        >
                          <td className="py-4 px-4 sm:px-6 text-center text-neutral-400 font-mono text-xs">
                            {index + 1}
                          </td>
                          <td className="py-4 px-4 sm:px-6 font-semibold text-neutral-900">
                            <div className="flex items-center space-x-2">
                              <span>{exam.student_name}</span>
                              {exam.is_essay_pasted && (
                                <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                                  Pasted
                                </span>
                              )}
                              {exam.violation_count > 0 && (
                                <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                                  {exam.violation_count} {exam.violation_count === 1 ? 'violation' : 'violations'}
                                </span>
                              )}
                            </div>
                          </td>
                          {activeTab === 'ALL' && (
                            <td className="py-4 px-4 sm:px-6 text-neutral-600">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
                                {exam.section}
                              </span>
                            </td>
                          )}
                          <td className="py-4 px-4 sm:px-6 text-center text-neutral-700 font-medium">
                            {exam.mcq_score}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-center">
                            <span className="inline-flex items-center space-x-1 font-medium text-neutral-700">
                              <Bot className="w-3.5 h-3.5 text-indigo-500 mr-1" />
                              <span>{exam.ai_score !== null ? exam.ai_score : '—'}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-bold text-xs ${
                                totalScore >= 35
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                  : totalScore >= 25
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              {totalScore} / 50
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleRow(exam.id)
                              }}
                              className="text-neutral-400 hover:text-neutral-700 p-1 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Collapsible Feedback Drawer */}
                        {isExpanded && (
                          <tr className="bg-neutral-50/70 border-b border-neutral-100">
                            <td colSpan={activeTab === 'ALL' ? 7 : 6} className="px-6 py-4">
                              <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-2xs space-y-2">
                                <div className="flex items-center space-x-2 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>AI Evaluation & Feedback</span>
                                </div>
                                <p className="text-sm text-neutral-700 leading-relaxed">
                                  {exam.ai_feedback || 'No written feedback available.'}
                                </p>
                                {exam.is_essay_pasted && (
                                  <p className="text-xs text-red-600 font-medium pt-1">
                                    ⚠️ Note: Essay was flagged as copy-pasted from an external source.
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
