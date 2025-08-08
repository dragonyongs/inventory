// api/verify-email-change-otp.js
import { supabase } from '../lib/supabase'

export default async function handler(req, res) {
  // CORS 설정
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
    const { userId, newEmail, otpCode } = req.body

    if (!userId || !newEmail || !otpCode) {
      return res.status(400).json({ 
        success: false, 
        error: '필수 정보가 누락되었습니다.' 
      })
    }

    // OTP 확인
    const { data: otpData, error: otpError } = await supabase
      .from('inventory_email_change_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('new_email', newEmail)
      .eq('otp_code', otpCode)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (otpError || !otpData) {
      return res.status(400).json({ 
        success: false, 
        error: '인증 코드가 올바르지 않거나 만료되었습니다.' 
      })
    }

    // 이메일 변경
    const { error: updateError } = await supabase
      .from('inventory_users')
      .update({ 
        email: newEmail,
        profile_updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('User update error:', updateError)
      throw updateError
    }

    // OTP 요청 완료 처리
    await supabase
      .from('inventory_email_change_requests')
      .update({ verified: true })
      .eq('id', otpData.id)

    res.status(200).json({ 
      success: true, 
      message: '이메일이 성공적으로 변경되었습니다.' 
    })
  } catch (error) {
    console.error('이메일 변경 OTP 인증 실패:', error)
    res.status(500).json({ 
      success: false, 
      error: '인증 중 오류가 발생했습니다.' 
    })
  }
}
