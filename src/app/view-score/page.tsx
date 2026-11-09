'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  ChevronLeft,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { parseExamDetails } from '@/data/midtermQuestions'
import Link from 'next/link'

interface ExamRecord {
  id: string
  student_name: string
  section: string
  mcq_score: number
  ai_score: number | null
  ai_feedback: string | null
  essay_answer: string | null
  is_essay_pasted: boolean
  violation_count: number
  created_at: string
}

export default function ViewScore() {
  const [exams, setExams] = useState<ExamRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'BSIT 2-A' | 'BSIT 2-B' | 'ALL'>('BSIT 2-A')
  const [examPeriodFilter, setExamPeriodFilter] = useState<'ALL' | 'PRELIM' | 'MIDTERM'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'score-desc' | 'score-asc'>('name-asc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    fetchScores()

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

  const filteredAndSortedExams = useMemo(() => {
    return exams
      .filter((exam) => {
        const details = parseExamDetails(exam)
        const matchesTab = activeTab === 'ALL' || exam.section === activeTab
        const matchesPeriod = examPeriodFilter === 'ALL' || details.examType === examPeriodFilter
        const matchesSearch = exam.student_name
          .toUpperCase()
          .includes(searchQuery.toUpperCase().trim())
        return matchesTab && matchesPeriod && matchesSearch
      })
      .sort((a, b) => {
        const totalA = (a.mcq_score || 0) + (a.ai_score || 0)
        const totalB = (b.mcq_score || 0) + (b.ai_score || 0)
        const nameA = a.student_name.toUpperCase()
        const nameB = b.student_name.toUpperCase()

        switch (sortBy) {
          case 'name-desc':
            return nameB.localeCompare(nameA)
          case 'score-desc':
            return totalB - totalA || nameA.localeCompare(nameB)
          case 'score-asc':
            return totalA - totalB || nameA.localeCompare(nameB)
          case 'name-asc':
          default:
            return nameA.localeCompare(nameB)
        }
      })
  }, [exams, activeTab, examPeriodFilter, searchQuery, sortBy])

  const countSectionA = useMemo(
    () =>
      exams.filter(
        (e) =>
          e.section === 'BSIT 2-A' &&
          (examPeriodFilter === 'ALL' || parseExamDetails(e).examType === examPeriodFilter)
      ).length,
    [exams, examPeriodFilter]
  )
  const countSectionB = useMemo(
    () =>
      exams.filter(
        (e) =>
          e.section === 'BSIT 2-B' &&
          (examPeriodFilter === 'ALL' || parseExamDetails(e).examType === examPeriodFilter)
      ).length,
    [exams, examPeriodFilter]
  )

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-16">
      {/* Fixed/Sticky Top Header & Filter Controls */}
      <div className="border-b border-neutral-200 bg-white/95 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-lg">
              {(['ALL', 'PRELIM', 'MIDTERM'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setExamPeriodFilter(period)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    examPeriodFilter === period
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {period === 'ALL' ? 'All' : period === 'PRELIM' ? 'Prelim' : 'Midterm'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Section Tabs */}
            <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('BSIT 2-A')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
                  activeTab === 'BSIT 2-A'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>BSIT 2-A</span>
                <span className="text-[11px] text-neutral-400">({countSectionA})</span>
              </button>

              <button
                onClick={() => setActiveTab('BSIT 2-B')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
                  activeTab === 'BSIT 2-B'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>BSIT 2-B</span>
                <span className="text-[11px] text-neutral-400">({countSectionB})</span>
              </button>

              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 ${
                  activeTab === 'ALL'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>All</span>
                <span className="text-[11px] text-neutral-400">({countSectionA + countSectionB})</span>
              </button>
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="SEARCH NAME..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  className="w-full sm:w-52 pl-8 pr-3 py-1.5 text-xs uppercase bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="relative flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="pl-8 pr-7 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 appearance-none text-neutral-700 font-medium cursor-pointer"
                >
                  <option value="name-asc">A – Z</option>
                  <option value="name-desc">Z – A</option>
                  <option value="score-desc">Highest</option>
                  <option value="score-asc">Lowest</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center space-x-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-neutral-400">Loading scores...</div>
          ) : filteredAndSortedExams.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-400">No matching records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium text-xs">
                    <th className="py-3 px-4 w-10 text-center">#</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Period</th>
                    {activeTab === 'ALL' && <th className="py-3 px-4">Section</th>}
                    <th className="py-3 px-4 text-center">Objective (/40)</th>
                    <th className="py-3 px-4 text-center">Essay (/10)</th>
                    <th className="py-3 px-4 text-center">Total (/50)</th>
                    <th className="py-3 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredAndSortedExams.map((exam, index) => {
                    const details = parseExamDetails(exam)
                    const totalScore = details.totalScore
                    const isExpanded = expandedRow === exam.id

                    return (
                      <React.Fragment key={exam.id}>
                        <tr
                          onClick={() => toggleRow(exam.id)}
                          className="hover:bg-neutral-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 text-center text-neutral-400 font-mono text-xs">
                            {index + 1}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-neutral-900 uppercase text-xs sm:text-sm">
                            {exam.student_name.toUpperCase()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-600">
                              {details.examType}
                            </span>
                          </td>
                          {activeTab === 'ALL' && (
                            <td className="py-3.5 px-4 text-xs text-neutral-500">{exam.section}</td>
                          )}
                          <td className="py-3.5 px-4 text-center text-neutral-700 text-xs sm:text-sm">
                            {exam.mcq_score}
                          </td>
                          <td className="py-3.5 px-4 text-center text-neutral-700 text-xs sm:text-sm">
                            {exam.ai_score !== null ? exam.ai_score : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                                totalScore >= 25
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {totalScore} / 50
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-neutral-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-neutral-50/60">
                            <td colSpan={activeTab === 'ALL' ? 8 : 7} className="px-5 py-3.5">
                              <div className="text-xs text-neutral-600 space-y-1.5">
                                {details.examType === 'MIDTERM' && details.part1Mcq !== null && (
                                  <div className="text-neutral-500 font-medium">
                                    Part I MCQ: {details.part1Mcq}/30 • Part II Wireframe: {details.part2Dnd}/10 • Part III Essay: {exam.ai_score ?? 0}/10
                                  </div>
                                )}
                                <div>
                                  <span className="font-semibold text-neutral-800 mr-1.5">Feedback:</span>
                                  <span>{exam.ai_feedback || 'No feedback available.'}</span>
                                </div>
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
