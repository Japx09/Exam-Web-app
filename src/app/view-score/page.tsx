'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  ChevronLeft,
  ArrowUpDown,
  ChevronDown,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ExamType, isDraftRecord, parseExamDetails } from '@/lib/examUtils'
import { LiquidSegmentedControl } from '@/components/LiquidSegmentedControl'
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

type SortOption = 'name-asc' | 'name-desc' | 'score-desc' | 'score-asc'

export default function ViewScore() {
  const [exams, setExams] = useState<ExamRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'BSIT 2-A' | 'BSIT 2-B' | 'ALL'>('BSIT 2-A')
  const [examPeriodFilter, setExamPeriodFilter] = useState<'ALL' | ExamType>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const fetchScores = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('exams')
        .select('*')
        .order('student_name', { ascending: true })

      if (fetchError) throw fetchError
      setExams(data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load scores. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => fetchScores())

    const channel = supabase
      .channel('public:exams:view-score')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => {
        fetchScores()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchScores])

  const submittedExams = useMemo(() => exams.filter((e) => !isDraftRecord(e)), [exams])

  const filteredAndSortedExams = useMemo(() => {
    return submittedExams
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
  }, [submittedExams, activeTab, examPeriodFilter, searchQuery, sortBy])

  const countSectionA = useMemo(
    () =>
      submittedExams.filter(
        (e) =>
          e.section === 'BSIT 2-A' &&
          (examPeriodFilter === 'ALL' || parseExamDetails(e).examType === examPeriodFilter)
      ).length,
    [submittedExams, examPeriodFilter]
  )

  const countSectionB = useMemo(
    () =>
      submittedExams.filter(
        (e) =>
          e.section === 'BSIT 2-B' &&
          (examPeriodFilter === 'ALL' || parseExamDetails(e).examType === examPeriodFilter)
      ).length,
    [submittedExams, examPeriodFilter]
  )

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen text-[#1d1d1f] pb-16">
      {/* Sticky Liquid Glass Header with Scroll-Linked Depth */}
      <div
        className={`sticky top-0 z-30 border-b liquid-transition backdrop-blur-2xl backdrop-saturate-180 ${
          scrolled
            ? 'bg-white/78 border-black/[0.08] shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)]'
            : 'bg-white/55 border-black/[0.05]'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-[#515154] hover:text-[#1d1d1f] liquid-transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <LiquidSegmentedControl
              ariaLabel="Exam period filter"
              size="xs"
              value={examPeriodFilter}
              onChange={setExamPeriodFilter}
              options={[
                { value: 'ALL', label: 'All' },
                { value: 'PRELIM', label: 'Prelim' },
                { value: 'MIDTERM', label: 'Midterm' },
                { value: 'PREFINAL', label: 'Pre-Final' }
              ]}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Gliding Section Tabs */}
            <LiquidSegmentedControl
              ariaLabel="Section filter"
              size="sm"
              className="w-fit"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                {
                  value: 'BSIT 2-A',
                  label: (
                    <span className="flex items-center space-x-1.5">
                      <span>BSIT 2-A</span>
                      <span className="text-[11px] text-[#6e6e73] tabular-nums">
                        ({countSectionA})
                      </span>
                    </span>
                  )
                },
                {
                  value: 'BSIT 2-B',
                  label: (
                    <span className="flex items-center space-x-1.5">
                      <span>BSIT 2-B</span>
                      <span className="text-[11px] text-[#6e6e73] tabular-nums">
                        ({countSectionB})
                      </span>
                    </span>
                  )
                },
                {
                  value: 'ALL',
                  label: (
                    <span className="flex items-center space-x-1.5">
                      <span>All</span>
                      <span className="text-[11px] text-[#6e6e73] tabular-nums">
                        ({countSectionA + countSectionB})
                      </span>
                    </span>
                  )
                }
              ]}
            />

            {/* Search & Sort */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-[#6e6e73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  className="w-full sm:w-52 pl-8 pr-3 py-1.5 text-xs uppercase bg-white/80 border border-black/[0.09] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 focus:border-[#0071e3] liquid-transition"
                />
              </div>

              <div className="relative flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#6e6e73] absolute left-2.5 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="pl-8 pr-7 py-1.5 text-xs bg-white/80 border border-black/[0.09] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]/35 appearance-none text-[#1d1d1f] font-medium cursor-pointer liquid-transition"
                >
                  <option value="name-asc">A – Z</option>
                  <option value="name-desc">Z – A</option>
                  <option value="score-desc">Highest</option>
                  <option value="score-asc">Lowest</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#6e6e73] absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="liquid-glass rounded-3xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#6e6e73]">Loading scores...</div>
          ) : filteredAndSortedExams.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#6e6e73]">
              No matching records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-black/[0.025] border-b border-black/[0.06] text-[#515154] font-medium text-xs">
                    <th className="py-3.5 px-4 w-10 text-center">#</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Period</th>
                    {activeTab === 'ALL' && <th className="py-3.5 px-4">Section</th>}
                    <th className="py-3.5 px-4 text-center">Objective (/40)</th>
                    <th className="py-3.5 px-4 text-center">Essay (/10)</th>
                    <th className="py-3.5 px-4 text-center">Total (/50)</th>
                    <th className="py-3.5 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {filteredAndSortedExams.map((exam, index) => {
                    const details = parseExamDetails(exam)
                    const totalScore = details.totalScore
                    const isExpanded = expandedRow === exam.id

                    return (
                      <React.Fragment key={exam.id}>
                        <tr
                          onClick={() => toggleRow(exam.id)}
                          className="hover:bg-white/60 liquid-transition cursor-pointer"
                        >
                          <td className="py-3.5 px-4 text-center text-[#6e6e73] font-mono text-xs tabular-nums">
                            {index + 1}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#1d1d1f] uppercase text-xs sm:text-sm">
                            {exam.student_name.toUpperCase()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-black/[0.05] text-[#515154]">
                              {details.examType === 'PREFINAL'
                                ? 'Pre-Final'
                                : details.examType === 'MIDTERM'
                                ? 'Midterm'
                                : 'Prelim'}
                            </span>
                          </td>
                          {activeTab === 'ALL' && (
                            <td className="py-3.5 px-4 text-xs text-[#515154]">{exam.section}</td>
                          )}
                          <td className="py-3.5 px-4 text-center text-[#1d1d1f] text-xs sm:text-sm tabular-nums">
                            {exam.mcq_score}
                          </td>
                          <td className="py-3.5 px-4 text-center text-[#1d1d1f] text-xs sm:text-sm tabular-nums">
                            {exam.ai_score !== null ? exam.ai_score : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold tabular-nums ${
                                totalScore >= 25
                                  ? 'bg-emerald-500/12 text-emerald-700'
                                  : 'bg-red-500/12 text-red-700'
                              }`}
                            >
                              {totalScore} / 50
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-[#6e6e73]">
                            <ChevronDown
                              className={`w-4 h-4 inline-block transition-transform duration-200 ease-[var(--ease-liquid)] ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-white/55 animate-liquid-settle">
                            <td colSpan={activeTab === 'ALL' ? 8 : 7} className="px-5 py-3.5">
                              <div className="text-xs text-[#515154] space-y-1.5">
                                {(details.examType === 'MIDTERM' ||
                                  details.examType === 'PREFINAL') &&
                                  details.part1Mcq !== null && (
                                    <div className="text-[#515154] font-medium tabular-nums">
                                      Part I MCQ: {details.part1Mcq}/30 ·{' '}
                                      {details.examType === 'PREFINAL'
                                        ? 'Part II Design Audit'
                                        : 'Part II Wireframe'}
                                      : {details.part2Dnd}/10 · Part III Essay:{' '}
                                      {exam.ai_score ?? 0}/10
                                    </div>
                                  )}
                                <div>
                                  <span className="font-semibold text-[#1d1d1f] mr-1.5">
                                    Feedback:
                                  </span>
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
