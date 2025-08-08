import nodemailer from 'nodemailer'
import { supabase } from '../lib/supabase'

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
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      })

      const htmlEmail = `
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <title>이메일 변경 인증코드</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <style>
              body {
                margin: 0;
                padding: 0;
                background: #f6f8fa;
                font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', Arial, sans-serif;
                color: #2c3347;
              }
              .container {
                max-width: 440px;
                margin: 40px auto;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 2px 14px rgba(40,48,68,0.07);
                padding: 40px 32px 32px 32px;
                text-align: center;
              }
              .logo {
                margin-bottom: 18px;
                font-weight: bold;
                font-size: 24px;
                color: #4f46e5;
                letter-spacing: 2px;
              }
              .subtitle {
                font-size: 18px;
                color: #6366f1;
                margin-bottom: 24px;
                letter-spacing: 1px;
              }
              .divider {
                border-top: 1px solid #e5e7eb;
                margin: 24px 0;
              }
              .mainmsg {
                font-size: 16px;
                font-weight: 500;
                margin: 30px 0 18px 0;
                line-height: 1.7;
              }
              .codebox {
                background: #f3f4f6;
                border-radius: 9px;
                border: 2px dashed #a5b4fc;
                display: inline-block;
                padding: 18px 35px;
                margin: 24px 0;
              }
              .code {
                font-size: 38px; font-weight: 700; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', monospace;
              }
              .warn {
                margin: 0 auto;
                color: #c2410c;
                background: #fef3c7;
                border-radius: 6px;
                font-size:14px;
                padding: 12px 8px;
                max-width: 340px;
                margin-top: 30px;
                margin-bottom: 12px;
                display:flex;
                align-items:center;
                gap:8px;
                justify-content: center;
              }
              .footer {
                margin-top: 30px;
                font-size:12px;
                color:#7b8193;
                text-align:center;
              }
              @media (max-width: 560px) {
                .container {padding:24px 8px;}
                .codebox {padding:14px 8px;}
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">📦 재고 관리</div>
              <div class="subtitle">이메일 변경 인증코드</div>
              <div class="divider"></div>
              <div class="mainmsg">
                안녕하세요,<br/>
                이메일 주소를 <span style="color:#4f46e5;"><b>${newEmail}</b></span>로 변경하시려면<br/>
                아래 <b>6자리 인증 코드</b>를 입력해 주세요.
              </div>
              <div class="codebox">
                <span class="code">${otpCode}</span>
              </div>
              <div class="warn">
                <svg width="20" height="20" fill="none"><circle cx="10" cy="10" r="10" fill="#fde68a"/><rect x="9.2" y="4.3" width="1.6" height="6.6" rx=".8" fill="#f59e42"/><rect x="9.2" y="13.3" width="1.6" height="1.6" rx=".8" fill="#f59e42"/></svg>
                <span><b>인증 코드는 5분 후 만료됩니다.</b></span>
              </div>
              <div class="footer">
                문의: <a href="mailto:${process.env.GMAIL_USER}" style="color:#6366f1; text-decoration:none;">고객센터</a> <br/>
                Copyright &copy; 2025 재고 관리. All rights reserved.
              </div>
            </div>
          </body>
        </html>
      `

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: newEmail,
        subject: '📦 재고 관리 - 이메일 변경 인증코드',
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
