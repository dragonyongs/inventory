import nodemailer from 'nodemailer'

export default async function handler(req, res) {
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
    const { email, subject, message } = req.body

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
          <title>${subject}</title>
      </head>
      <body style="font-family: 'Noto Sans KR', sans-serif; margin: 0; padding: 0; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);">
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; margin-bottom: 30px;">
                  <h1 style="color: #2b3a4a; font-size: 24px; font-weight: 700; margin: 0 0 10px;">재고 관리 PWA</h1>
                  <h2 style="color: #4f46e5; font-size: 20px; font-weight: 600; margin: 0;">📢 ${subject}</h2>
              </div>
              
              <div style="padding: 0 15px;">
                  <p style="margin: 0 0 20px; font-size: 16px;">안녕하세요,</p>
                  <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; border-left: 4px solid #0ea5e9;">
                      <p style="margin: 0; font-size: 16px; white-space: pre-line;">${message}</p>
                  </div>
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.VITE_DOMAIN}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">시스템 확인하기</a>
                  </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; font-size: 14px; color: #6b7280;">
                  <p style="margin: 0;">© 2025 재고 관리 PWA. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `📢 ${subject}`,
      html: htmlEmail
    }

    await transporter.sendMail(mailOptions)
    
    res.status(200).json({ success: true, message: '시스템 알림이 발송되었습니다.' })
  } catch (error) {
    console.error('시스템 알림 발송 실패:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}
