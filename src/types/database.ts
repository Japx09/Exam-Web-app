export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      exams: {
        Row: {
          id: string
          student_name: string
          section: string
          mcq_score: number
          essay_answer: string | null
          is_essay_pasted: boolean
          violation_count: number
          created_at: string
          ai_feedback: string | null
          ai_score: number | null
        }
        Insert: {
          id?: string
          student_name: string
          section: string
          mcq_score?: number
          essay_answer?: string | null
          is_essay_pasted?: boolean
          violation_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          student_name?: string
          section?: string
          mcq_score?: number
          essay_answer?: string | null
          is_essay_pasted?: boolean
          violation_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
