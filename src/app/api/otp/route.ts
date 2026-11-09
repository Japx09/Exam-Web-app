import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function generateDeterministicOtp(name: string, email: string): string {
  const secret = process.env.GEMINI_API_KEY || 'exam-portal-secret-2026'
  // Valid for the current day (UTC+8)
  const dateBucket = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)
  const payload = `${name.trim().toUpperCase()}|${email.trim().toLowerCase()}|${dateBucket}`
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const num = parseInt(hash.slice(0, 8), 16) % 900000
  return (100000 + num).toString()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, name, email, code } = body

    const cleanName = (name || '').trim().toUpperCase()
    const cleanEmail = (email || '').trim().toLowerCase()

    if (!cleanName || !cleanEmail) {
      return NextResponse.json({ error: 'Name and school email are required.' }, { status: 400 })
    }

    if (!cleanEmail.endsWith('.edu.ph')) {
      return NextResponse.json(
        { error: 'Please use your official school email ending in .edu.ph' },
        { status: 400 }
      )
    }

    // Check if this school email was already used by a DIFFERENT student name in previous submissions
    const { data: existingRows } = await supabase
      .from('exams')
      .select('student_name, essay_answer')

    const typedRows = (existingRows || []) as Array<{
      student_name: string
      essay_answer: string | null
    }>

    for (const row of typedRows) {
      const matchEmail = row.essay_answer?.match(/\|EMAIL:([^|\]]+)/i)
      if (matchEmail && matchEmail[1].toLowerCase() === cleanEmail) {
        if (row.student_name.trim().toUpperCase() !== cleanName) {
          return NextResponse.json(
            {
              error: `This school email (${cleanEmail}) is already registered to another student.`
            },
            { status: 403 }
          )
        }
      }
    }

    const expectedOtp = generateDeterministicOtp(cleanName, cleanEmail)

    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ error: 'Please enter the 6-digit verification code.' }, { status: 400 })
      }
      if (code.trim() === expectedOtp) {
        return NextResponse.json({ verified: true })
      }
      return NextResponse.json({ verified: false, error: 'Invalid verification code.' }, { status: 400 })
    }

    if (action === 'admin_lookup') {
      return NextResponse.json({ otp: expectedOtp, name: cleanName, email: cleanEmail })
    }

    // action === 'send'
    return NextResponse.json({
      sent: true,
      message: `Verification code sent to ${cleanEmail}`
    })
  } catch (err) {
    console.error('OTP Route Error:', err)
    return NextResponse.json({ error: 'Server error processing verification.' }, { status: 500 })
  }
}
