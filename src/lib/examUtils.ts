export type ExamType = 'PRELIM' | 'MIDTERM' | 'PREFINAL'

export interface ActiveQuestion {
  id: number
  topic?: string
  question: string
  options: string[]
  answer: string
}

export interface DraggableUIElement {
  id: string
  code: string
  uiType: 'badge' | 'textbox' | 'button' | 'card'
  label: string
  subtext?: string
  placeholder?: string
}

export interface WireframeDropZone {
  slotId: string
  slotNumber: number
  slotLabel: string
  correctElementId: string
  points: number
}

export interface WireframeDndChallenge {
  id: string
  title: string
  scenario: string
  points: number
  draggableElements: DraggableUIElement[]
  dropZones: WireframeDropZone[]
}

export interface ExamEssayPrompt {
  id: string
  title: string
  points: number
  scenario: string
  instructions: string[]
  rubric: string[]
}

/** Fisher-Yates shuffle returning a new array without mutating the input. */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Score placed draggable UI elements against challenge drop zones. */
export function scoreChallenges(
  challenges: WireframeDndChallenge[],
  placements: Record<string, string>,
  interchangeableSlotPairs: Array<[string, string, string, string]> = []
): number {
  let score = 0
  for (const challenge of challenges) {
    for (const zone of challenge.dropZones) {
      const placedId = placements[zone.slotId]
      if (!placedId) continue
      if (placedId === zone.correctElementId) {
        score += zone.points
        continue
      }
      const isSwappedMatch = interchangeableSlotPairs.some(
        ([slotA, slotB, elA, elB]) =>
          (zone.slotId === slotA && placedId === elB && placements[slotB] === elA) ||
          (zone.slotId === slotB && placedId === elA && placements[slotA] === elB)
      )
      if (isSwappedMatch) {
        score += zone.points
      }
    }
  }
  return score
}

export function isDraftRecord(exam: { essay_answer?: string | null }): boolean {
  return Boolean(exam?.essay_answer?.startsWith('[DRAFT:'))
}

export function getExamType(exam: { essay_answer?: string | null; section?: string | null }): ExamType {
  if (!exam) return 'PRELIM'
  const essay = exam.essay_answer || ''
  if (essay.startsWith('[EXAM:PREFINAL') || essay.startsWith('[DRAFT:PREFINAL')) return 'PREFINAL'
  if (
    essay.startsWith('[EXAM:MIDTERM') ||
    essay.startsWith('[DRAFT:MIDTERM') ||
    exam.section?.toUpperCase().includes('MIDTERM')
  ) {
    return 'MIDTERM'
  }
  return 'PRELIM'
}

export function isMidtermRecord(exam: { essay_answer?: string | null; section?: string | null }): boolean {
  return getExamType(exam) === 'MIDTERM'
}

export function isPrefinalRecord(exam: { essay_answer?: string | null; section?: string | null }): boolean {
  return getExamType(exam) === 'PREFINAL'
}

export function parseExamDetails(exam: {
  mcq_score: number
  ai_score: number | null
  essay_answer?: string | null
  section?: string | null
}) {
  const examType = getExamType(exam)
  let displayEssay = exam.essay_answer || ''
  let studentEmail: string | null = null

  const emailMatch = displayEssay.match(/\|EMAIL:([^|\]]+)/i)
  if (emailMatch) {
    studentEmail = emailMatch[1].toLowerCase()
  }

  let part1Mcq: number | null = null
  let part2Dnd: number | null = null

  if (examType !== 'PRELIM') {
    const p1Match = displayEssay.match(/\|P1:(\d+)\/\d+/)
    const p2Match = displayEssay.match(/\|P2:(\d+)\/\d+/)
    if (p1Match) part1Mcq = parseInt(p1Match[1], 10)
    if (p2Match) part2Dnd = parseInt(p2Match[1], 10)
  }

  displayEssay = displayEssay.replace(/^\[EXAM:(?:PRELIM|MIDTERM|PREFINAL)[^\]]*\]\n*/, '')

  return {
    examType,
    studentEmail,
    part1Mcq: examType === 'PRELIM' ? exam.mcq_score : part1Mcq,
    part2Dnd,
    objectiveScore: exam.mcq_score,
    essayScore: exam.ai_score,
    totalScore: (exam.mcq_score || 0) + (exam.ai_score || 0),
    displayEssay
  }
}

export function formatMultiPartEssayAnswer(
  examType: 'MIDTERM' | 'PREFINAL',
  part1McqScore: number,
  part2DndScore: number,
  essay1: string,
  essay2: string,
  email?: string,
  headings: [string, string] = ['ESSAY 1', 'ESSAY 2']
): string {
  const emailTag = email ? `|EMAIL:${email.trim().toLowerCase()}` : ''
  return `[EXAM:${examType}${emailTag}|P1:${part1McqScore}/30|P2:${part2DndScore}/10]\n\n=== ${headings[0]} ===\n${essay1.trim()}\n\n=== ${headings[1]} ===\n${essay2.trim()}`
}
