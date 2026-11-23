import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { serializeCloudDraft, type ExamDraftState } from '@/lib/examDraft'

export const dynamic = 'force-dynamic'

type ExamInsert = Database['public']['Tables']['exams']['Insert']

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { draft?: ExamDraftState }
    const draft = body?.draft
    if (!draft || !draft.studentName || !draft.examType || !draft.section) {
      return NextResponse.json({ error: 'Invalid draft payload.' }, { status: 400 })
    }

    const cleanName = draft.studentName.trim().toUpperCase()
    const examType = draft.examType
    const essayAnswer = serializeCloudDraft(draft)
    const objectiveScore = (draft.part1Score || 0) + (draft.part2Score || 0)

    const fields = {
      section: draft.section,
      mcq_score: objectiveScore,
      essay_answer: essayAnswer,
      is_essay_pasted: Boolean(draft.isEssayPasted),
      violation_count: draft.violationCount || 0
    }

    // 1. Update matching [DRAFT:%] row by cached id first so finalized [EXAM:%] rows are untouchable
    if (draft.cloudDraftId) {
      const { data: updatedById } = await supabase
        .from('exams')
        .update(fields as never)
        .eq('id', draft.cloudDraftId)
        .like('essay_answer', '[DRAFT:%')
        .select('id')

      if (updatedById && updatedById.length > 0) {
        return NextResponse.json({ id: (updatedById[0] as { id: string }).id })
      }
    }

    // 2. Look up existing records for this student to prevent duplicates or drafting over finalized exams
    const { data: studentRows } = await supabase
      .from('exams')
      .select('id, essay_answer')
      .eq('student_name', cleanName)

    const typedRows = (studentRows || []) as Array<{ id: string; essay_answer: string | null }>

    const alreadySubmitted = typedRows.some((r) => {
      const text = r.essay_answer || ''
      if (text.startsWith('[DRAFT:')) return false
      if (examType === 'PREFINAL') return text.startsWith('[EXAM:PREFINAL')
      if (examType === 'MIDTERM') return text.startsWith('[EXAM:MIDTERM')
      return !text.startsWith('[EXAM:MIDTERM') && !text.startsWith('[EXAM:PREFINAL')
    })

    if (alreadySubmitted) {
      return NextResponse.json({ skipped: true })
    }

    const existingDraft = typedRows.find((r) =>
      (r.essay_answer || '').startsWith(`[DRAFT:${examType}`)
    )

    if (existingDraft) {
      await supabase
        .from('exams')
        .update(fields as never)
        .eq('id', existingDraft.id)
        .like('essay_answer', '[DRAFT:%')
      return NextResponse.json({ id: existingDraft.id })
    }

    // 3. Insert fresh draft row
    const payload: ExamInsert = {
      student_name: cleanName,
      ...fields,
      ai_score: 0,
      ai_feedback: null
    }

    const { data: inserted, error } = await supabase
      .from('exams')
      .insert(payload as never)
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: (inserted as { id: string } | null)?.id ?? null })
  } catch (err) {
    console.error('Draft sync failed:', err)
    return NextResponse.json({ error: 'Draft sync error.' }, { status: 500 })
  }
}
