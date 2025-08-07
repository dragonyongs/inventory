import nodemailer from 'nodemailer'

// Supabase import - 경로 수정
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

import { createClient } from '@supabase/supabase-js'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, currentEmail, newEmail } = req.body

    if (!userId || !currentEmail || !newEmail) {
      return res.status(400).json({ 
        success: false, 
        error: '필수 정보가 누락되었습니다.' 
      })
    }

    // 이메일 중복 확인
    const { data: existingUser } = await supabase
      .from('inventory_users')
      .select('id')
      .eq('email', newEmail)
      .neq('id', userId)
      .single()

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: '이미 사용 중인 이메일 주소입니다.' 
      })
    }

    // 6자리 OTP 생성
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5분 후 만료

    // 기존 OTP 요청 삭제
    await supabase
      .from('inventory_email_change_requests')
      .delete()
      .eq('user_id', userId)

    // 새 OTP 정보 저장
    const { error: insertError } = await supabase
      .from('inventory_email_change_requests')
      .insert([{
        user_id: userId,
        current_email: currentEmail,
        new_email: newEmail,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      }])

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw insertError
    }

    // Gmail 설정이 있는 경우에만 이메일 발송
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      })

      const htmlEmail = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>이메일 변경 인증</title>
        </head>
        <body style="font-family: 'Noto Sans KR', sans-serif; margin: 0; padding: 0; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 8px;">
                <h1 style="color: #2b3a4a; font-size: 24px; text-align: center;">재고 관리 PWA</h1>
                <h2 style="color: #4f46e5; font-size: 20px; text-align: center;">✉️ 이메일 변경 인증</h2>
                
                <p>안녕하세요,</p>
                <p>이메일 주소를 <strong>${newEmail}</strong>로 변경하시려면 아래 인증 코드를 입력해 주세요.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px; padding: 20px 40px;">
                    <div style="font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                      ${otpCode}
                    </div>
                  </div>
                </div>
                
                <p style="color: #92400e; background-color: #fef3c7; padding: 15px; border-radius: 4px;">
                  <strong>⏰ 중요:</strong> 이 인증 코드는 <strong>5분 후에 만료</strong>됩니다.
                </p>
            </div>
        </body>
        </html>
      `

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: newEmail,
        subject: '✉️ 이메일 변경 인증 코드',
        html: htmlEmail
      }

      await transporter.sendMail(mailOptions)
    }
    
    res.status(200).json({ 
      success: true, 
      message: '인증 코드가 새 이메일로 발송되었습니다.',
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined // 개발환경에서만 OTP 코드 반환
    })
  } catch (error) {
    console.error('이메일 변경 OTP 발송 실패:', error)
    res.status(500).json({ 
      success: false, 
      error: '이메일 발송 중 오류가 발생했습니다.' 
    })
  }
}
