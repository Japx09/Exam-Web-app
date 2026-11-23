'use client'

import { useEffect, useState, useRef } from 'react'
import { saveLocalDraft } from '@/lib/examDraft'

export function useAntiCheat(maxViolations: number, onAutoSubmit: () => void) {
  const [violationCount, setViolationCount] = useState(0)
  const isHandlingViolation = useRef(false)
  const autoSubmittedRef = useRef(false)

  useEffect(() => {
    const saved = parseInt(sessionStorage.getItem('exam_violation_count') || '0', 10)
    if (saved > 0 && saved < maxViolations) {
      Promise.resolve().then(() => setViolationCount(saved))
    }
  }, [maxViolations])

  useEffect(() => {
    if (violationCount > 0) {
      sessionStorage.setItem('exam_violation_count', violationCount.toString())
      saveLocalDraft({ violationCount })
    }
    if (violationCount >= maxViolations && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      onAutoSubmit()
    }
  }, [violationCount, maxViolations, onAutoSubmit])

  useEffect(() => {
    if (violationCount >= maxViolations) return

    const handleVisibilityChange = () => {
      if (document.hidden && !isHandlingViolation.current) {
        isHandlingViolation.current = true

        setViolationCount((prev) => {
          const newCount = prev + 1
          if (newCount < maxViolations) {
            alert(
              `Warning: You have left the exam tab. This is violation ${newCount}/${maxViolations}. Your exam will be auto-submitted at ${maxViolations} violations.`
            )
          }
          return newCount
        })

        setTimeout(() => {
          isHandlingViolation.current = false
        }, 1000) // Prevent rapid double counting
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [violationCount, maxViolations])

  return { violationCount, setViolationCount }
}
