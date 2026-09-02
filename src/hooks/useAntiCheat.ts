'use client'

import { useEffect, useState, useRef } from 'react'

export function useAntiCheat(maxViolations: number, onAutoSubmit: () => void) {
  const [violationCount, setViolationCount] = useState(0)
  const isHandlingViolation = useRef(false)

  useEffect(() => {
    if (violationCount >= maxViolations) return

    const handleVisibilityChange = () => {
      if (document.hidden && !isHandlingViolation.current) {
        isHandlingViolation.current = true
        
        setViolationCount((prev) => {
          const newCount = prev + 1
          if (newCount >= maxViolations) {
            onAutoSubmit()
          } else {
            alert(`Warning: You have left the exam tab. This is violation ${newCount}/${maxViolations}. Your exam will be auto-submitted at ${maxViolations} violations.`)
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
  }, [violationCount, maxViolations, onAutoSubmit])

  return { violationCount, setViolationCount }
}
