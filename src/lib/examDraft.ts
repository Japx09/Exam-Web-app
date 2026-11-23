import type { ExamType } from '@/lib/examUtils'
import type { UxAuditCategory } from '@/data/prefinalQuestions'

export type ExamStage = '/exam' | '/exam/wireframe' | '/exam/essay'

export interface ExamDraftState {
  version: 1
  studentName: string
  email: string
  section: string
  examType: ExamType
  stage: ExamStage
  updatedAt: number
  part1Score: number
  part2Score: number
  violationCount: number
  // Part I MCQ progress
  part1QuestionIds?: number[]
  part1Index?: number
  part1SelectedOption?: string | null
  part1TimeLeft?: number
  // Part II Design Audit / Wireframe progress
  part2Screen?: '1' | '2'
  classifications?: Record<string, UxAuditCategory>
  principleAnswers?: Record<string, string>
  wireframeChallengeIndex?: number
  wireframePlacements?: Record<string, string>
  // Part III Essay progress
  essay?: string
  essay1?: string
  essay2?: string
  isEssayPasted?: boolean
  cloudDraftId?: string
}

const LOCAL_DRAFT_KEY = 'exam_draft_v1'
const DRAFT_PREFIX_RE = /^\[DRAFT:[^\]]*\]\n?/

const STAGE_ORDER: Record<ExamStage, number> = {
  '/exam': 1,
  '/exam/wireframe': 2,
  '/exam/essay': 3
}

let cloudSyncTimer: number | null = null

export function serializeCloudDraft(draft: ExamDraftState): string {
  const email = (draft.email || '').trim().toLowerCase()
  const emailTag = email ? `|EMAIL:${email}` : ''
  const header = `[DRAFT:${draft.examType}${emailTag}|STAGE:${draft.stage}|P1:${draft.part1Score || 0}/30|P2:${draft.part2Score || 0}/10]`
  return `${header}\n${JSON.stringify(draft)}`
}

export function parseCloudDraft(row: {
  id?: string
  student_name: string
  section: string
  essay_answer?: string | null
}): ExamDraftState | null {
  const raw = row?.essay_answer || ''
  if (!raw.startsWith('[DRAFT:')) return null
  const jsonPart = raw.replace(DRAFT_PREFIX_RE, '').trim()
  if (!jsonPart) return null

  try {
    const parsed = JSON.parse(jsonPart) as Partial<ExamDraftState>
    if (!parsed.stage || !(parsed.stage in STAGE_ORDER)) return null
    return {
      version: 1,
      studentName: (parsed.studentName || row.student_name).trim().toUpperCase(),
      email: (parsed.email || '').trim().toLowerCase(),
      section: parsed.section || row.section,
      examType: parsed.examType || 'PREFINAL',
      stage: parsed.stage,
      updatedAt: parsed.updatedAt || Date.now(),
      part1Score: parsed.part1Score || 0,
      part2Score: parsed.part2Score || 0,
      violationCount: parsed.violationCount || 0,
      part1QuestionIds: parsed.part1QuestionIds,
      part1Index: parsed.part1Index,
      part1SelectedOption: parsed.part1SelectedOption,
      part1TimeLeft: parsed.part1TimeLeft,
      part2Screen: parsed.part2Screen,
      classifications: parsed.classifications,
      principleAnswers: parsed.principleAnswers,
      wireframeChallengeIndex: parsed.wireframeChallengeIndex,
      wireframePlacements: parsed.wireframePlacements,
      essay: parsed.essay,
      essay1: parsed.essay1,
      essay2: parsed.essay2,
      isEssayPasted: parsed.isEssayPasted,
      cloudDraftId: row.id || parsed.cloudDraftId
    }
  } catch {
    return null
  }
}

export function loadLocalDraft(): ExamDraftState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ExamDraftState
    if (parsed?.version !== 1 || !parsed.studentName || !parsed.stage) return null
    return parsed
  } catch {
    return null
  }
}

export function syncSessionKeysFromDraft(draft: ExamDraftState): void {
  if (typeof window === 'undefined') return
  const combined = (draft.part1Score || 0) + (draft.part2Score || 0)
  sessionStorage.setItem('exam_student_name', draft.studentName)
  if (draft.email) sessionStorage.setItem('exam_student_email', draft.email)
  sessionStorage.setItem('exam_section', draft.section)
  sessionStorage.setItem('exam_type', draft.examType)
  sessionStorage.setItem('exam_part1_score', (draft.part1Score || 0).toString())
  sessionStorage.setItem('exam_part2_score', (draft.part2Score || 0).toString())
  sessionStorage.setItem('exam_score', combined.toString())
  sessionStorage.setItem('exam_violation_count', (draft.violationCount || 0).toString())
  if (draft.isEssayPasted !== undefined) {
    sessionStorage.setItem('exam_is_essay_pasted', Boolean(draft.isEssayPasted).toString())
  }
}

export function saveLocalDraft(patch: Partial<ExamDraftState>): ExamDraftState | null {
  if (typeof window === 'undefined') return null
  const existing = loadLocalDraft()
  const sessionName = (sessionStorage.getItem('exam_student_name') || '').trim().toUpperCase()
  const sessionEmail = (sessionStorage.getItem('exam_student_email') || '').trim().toLowerCase()
  const sessionSection = sessionStorage.getItem('exam_section') || ''
  const sessionType = (sessionStorage.getItem('exam_type') as ExamType) || 'PREFINAL'

  const targetName = (patch.studentName || sessionName || existing?.studentName || '')
    .trim()
    .toUpperCase()
  if (!targetName) return null

  const targetType = patch.examType || sessionType || existing?.examType || 'PREFINAL'
  const matchesExisting =
    existing && existing.studentName === targetName && existing.examType === targetType

  const base: ExamDraftState = matchesExisting
    ? existing
    : {
        version: 1,
        studentName: targetName,
        email: sessionEmail,
        section: sessionSection || 'BSIT 2-A',
        examType: targetType,
        stage: '/exam',
        updatedAt: Date.now(),
        part1Score: 0,
        part2Score: 0,
        violationCount: 0
      }

  const next: ExamDraftState = {
    ...base,
    ...patch,
    studentName: targetName,
    email: (patch.email ?? base.email ?? sessionEmail).trim().toLowerCase(),
    section: patch.section ?? base.section ?? sessionSection,
    examType: targetType,
    updatedAt: Date.now()
  }

  try {
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(next))
  } catch (err) {
    console.warn('Could not write local exam draft:', err)
  }
  return next
}

export function hydrateSessionFromLocalDraft(): ExamDraftState | null {
  if (typeof window === 'undefined') return null
  const local = loadLocalDraft()
  const activeName = (sessionStorage.getItem('exam_student_name') || '').trim().toUpperCase()

  if (activeName) {
    if (local && local.studentName === activeName) {
      return local
    }
    return null
  }

  if (!local) return null
  syncSessionKeysFromDraft(local)
  return local
}

export function pickNewestDraft(
  localDraft: ExamDraftState | null,
  cloudDraft: ExamDraftState | null,
  studentName: string,
  examType: ExamType
): ExamDraftState | null {
  const cleanName = studentName.trim().toUpperCase()
  const validLocal =
    localDraft && localDraft.studentName === cleanName && localDraft.examType === examType
      ? localDraft
      : null
  const validCloud =
    cloudDraft && cloudDraft.studentName === cleanName && cloudDraft.examType === examType
      ? cloudDraft
      : null

  if (!validLocal) return validCloud
  if (!validCloud) return validLocal

  const localRank = STAGE_ORDER[validLocal.stage] || 0
  const cloudRank = STAGE_ORDER[validCloud.stage] || 0
  const winner =
    cloudRank > localRank
      ? validCloud
      : localRank > cloudRank
      ? validLocal
      : validCloud.updatedAt > validLocal.updatedAt
      ? validCloud
      : validLocal

  return {
    ...winner,
    cloudDraftId: validCloud.cloudDraftId || validLocal.cloudDraftId
  }
}

export async function syncDraftToCloud(
  draft: ExamDraftState | null,
  options?: { keepalive?: boolean }
): Promise<void> {
  if (typeof window === 'undefined' || !draft || !draft.studentName) return
  try {
    const res = await fetch('/api/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft }),
      keepalive: Boolean(options?.keepalive)
    })
    if (!res.ok || options?.keepalive) return
    const data = (await res.json()) as { id?: string | null }
    if (data?.id && data.id !== draft.cloudDraftId) {
      const latest = loadLocalDraft()
      if (latest && latest.studentName === draft.studentName && latest.examType === draft.examType) {
        try {
          localStorage.setItem(
            LOCAL_DRAFT_KEY,
            JSON.stringify({ ...latest, cloudDraftId: data.id })
          )
        } catch {
          // Ignore quota error on non-critical id cache
        }
      }
    }
  } catch (err) {
    console.warn('Cloud draft sync skipped:', err)
  }
}

export function scheduleCloudDraftSync(getDraft: () => ExamDraftState | null, delayMs = 1100): void {
  if (typeof window === 'undefined') return
  if (cloudSyncTimer) window.clearTimeout(cloudSyncTimer)
  cloudSyncTimer = window.setTimeout(() => {
    cloudSyncTimer = null
    const draft = getDraft()
    if (draft) void syncDraftToCloud(draft)
  }, delayMs)
}

export function cancelScheduledCloudDraftSync(): void {
  if (typeof window === 'undefined' || !cloudSyncTimer) return
  window.clearTimeout(cloudSyncTimer)
  cloudSyncTimer = null
}

export function clearExamDraft(): void {
  cancelScheduledCloudDraftSync()
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LOCAL_DRAFT_KEY)
  } catch {
    // Ignore storage removal errors
  }
}

export function formatDraftSummary(draft: ExamDraftState): string {
  if (draft.stage === '/exam') {
    const total = draft.part1QuestionIds?.length || 30
    const qNum = Math.min((draft.part1Index ?? 0) + 1, total)
    return `Part I · Q${qNum}/${total} (${draft.part1Score || 0} pts saved)`
  }
  if (draft.stage === '/exam/wireframe') {
    if (draft.examType === 'PREFINAL') {
      const doneAudit = Object.keys(draft.classifications || {}).length
      const donePrinciples = Object.keys(draft.principleAnswers || {}).length
      return `Part II · Screen ${draft.part2Screen || '1'} (${doneAudit + donePrinciples}/10 saved)`
    }
    return `Part II · Challenge ${(draft.wireframeChallengeIndex ?? 0) + 1}`
  }
  return `Part III · Essay Draft (${(draft.part1Score || 0) + (draft.part2Score || 0)}/40 objective saved)`
}
