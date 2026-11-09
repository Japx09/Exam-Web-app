import { NextResponse } from 'next/server'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
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

function doesEmailMatchStudentName(fullName: string, email: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase().replace(/[^a-z]/g, '') || ''
  if (localPart.length < 2) return false

  // Extract words from student's full name (ignore middle initials of length 1)
  const nameParts = fullName
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((part) => part.length >= 3)

  if (nameParts.length === 0) return true

  // Check if at least 3 consecutive characters of any name part appear in the email prefix
  for (const part of nameParts) {
    const prefix3 = part.slice(0, 3)
    if (localPart.includes(prefix3)) {
      return true
    }
  }
  return false
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
      if (matchEmail) {
        const recordedEmail = matchEmail[1].toLowerCase()
        const recordedName = row.student_name.trim().toUpperCase()

        // 1. Prevent one email from being used by another student
        if (recordedEmail === cleanEmail && recordedName !== cleanName) {
          return NextResponse.json(
            {
              error: `This school email (${cleanEmail}) is already registered to another student.`
            },
            { status: 403 }
          )
        }

        // 2. Prevent a student record that already locked an email from being accessed with a different email
        if (recordedName === cleanName && recordedEmail !== cleanEmail) {
          return NextResponse.json(
            {
              error: `This student profile is already locked to a different school email.`
            },
            { status: 403 }
          )
        }
      }
    }

    const expectedOtp = generateDeterministicOtp(cleanName, cleanEmail)
    const teacherPasscode = 'BSIT2026'

    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ error: 'Please enter the verification code.' }, { status: 400 })
      }
      const trimmedCode = code.trim().toUpperCase()
      if (trimmedCode === expectedOtp || trimmedCode === teacherPasscode) {
        return NextResponse.json({ verified: true })
      }
      return NextResponse.json({ verified: false, error: 'Invalid verification code.' }, { status: 400 })
    }

    if (action === 'admin_lookup') {
      return NextResponse.json({ otp: expectedOtp, name: cleanName, email: cleanEmail })
    }

    const gmailUser = (process.env.GMAIL_USER || 'japhet.gonzales@southlandcollege.edu.ph').trim()
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')

    if (!gmailPass) {
      return NextResponse.json(
        {
          error: 'Email service is not configured. Ask your instructor for your 6-digit code.'
        },
        { status: 503 }
      )
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    })

    await transporter.sendMail({
      from: `"Online Examination Portal" <${gmailUser}>`,
      to: cleanEmail,
      subject: `Your Examination Verification Code: ${expectedOtp}`,
      text: `Hello ${cleanName},\n\nYour 6-digit verification code for the Online Examination Portal is:\n\n${expectedOtp}\n\nEnter this code in Step 2 to proceed to your exam.\n\n— Sir Japheth Gonzales`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 440px; margin: 0 auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 12px; color: #171717;">
          <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #737373; margin: 0 0 8px;">Online Examination Portal</p>
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">Verification Code for ${cleanName}</h2>
          <p style="font-size: 14px; color: #525252; line-height: 1.5; margin: 0 0 16px;">Use the 6-digit code below to verify your school email and unlock your examination:</p>
          <div style="background: #f5f5f5; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; text-align: center; font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.25em; color: #171717;">
            ${expectedOtp}
          </div>
          <p style="font-size: 12px; color: #737373; margin: 16px 0 0;">If you did not request this code, you may ignore this email.</p>
        </div>
      `
    })

    return NextResponse.json({
      sent: true,
      message: `6-digit verification code sent to ${cleanEmail}`
    })
  } catch (err: any) {
    console.error('OTP Route Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to send verification email.' },
      { status: 500 }
    )
  }
}
