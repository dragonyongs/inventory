// 프론트엔드에서는 직접 이메일을 보낼 수 없으므로 
// Supabase Edge Functions나 별도 API를 호출하는 방식으로 구현
export const emailService = {
  // 만료 임박 알림
  sendExpiryAlert: async (userEmail, items) => {
    try {
      const response = await fetch('/api/send-expiry-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          items: items
        })
      })
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error sending expiry alert:', error)
      return { success: false, error: error.message }
    }
  },

  // 저재고 알림
  sendLowStockAlert: async (userEmail, items) => {
    try {
      const response = await fetch('/api/send-low-stock-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          items: items
        })
      })
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error sending low stock alert:', error)
      return { success: false, error: error.message }
    }
  },

  // 시스템 알림
  sendSystemAlert: async (userEmail, subject, message) => {
    try {
      const response = await fetch('/api/send-system-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          subject: subject,
          message: message
        })
      })
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error sending system alert:', error)
      return { success: false, error: error.message }
    }
  }
}
