import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, items } = req.body

    // Gmail transporter 설정
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })

    const itemsList = items.map(item => `
      <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #ef4444;">
        <strong>${item.name}</strong><br>
        <span style="color: #6b7280;">카테고리: ${item.category_name}</span><br>
        <span style="color: #ef4444; font-weight: 500;">만료일: ${item.expiry_date}</span>
      </div>
    `).join('')

    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>유통기한 만료 임박 알림</title>
      </head>
      <body style="font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);">
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; margin-bottom: 30px;">
                  <h1 style="color: #2b3a4a; font-size: 24px; font-weight: 700; margin: 0 0 10px;">재고 관리 PWA</h1>
                  <h2 style="color: #4f46e5; font-size: 20px; font-weight: 600; margin: 0;">🚨 유통기한 만료 임박 알림</h2>
              </div>
              
              <div style="padding: 0 15px;">
                  <p style="margin: 0 0 20px; font-size: 16px;">안녕하세요,</p>
                  <p style="margin: 0 0 20px; font-size: 16px;">다음 아이템들의 유통기한이 곧 만료됩니다:</p>
                  ${itemsList}
                  <p style="margin: 20px 0; font-size: 16px;">빠른 시일 내에 확인해 주세요.</p>
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.VITE_DOMAIN}/inventory" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">재고 확인하기</a>
                  </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; font-size: 14px; color: #6b7280;">
                  <p style="margin: 0 0 5px;">본 메일은 시스템에서 자동 발송된 알림입니다.</p>
                  <p style="margin: 0;">© 2025 재고 관리 PWA. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: '🚨 유통기한 만료 임박 알림',
      html: htmlEmail
    }

    // 중요: Vercel에서는 await 사용 필수 (콜백 방식 X)
    await transporter.sendMail(mailOptions)
    
    res.status(200).json({ success: true, message: '만료 임박 알림이 발송되었습니다.' })
  } catch (error) {
    console.error('만료 임박 알림 발송 실패:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
