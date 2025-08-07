import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { emailService } from '../lib/emailService'
import { differenceInDays, isAfter } from 'date-fns'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,

  // 만료 임박 아이템 체크 및 알림 발송
  checkExpiryAlerts: async () => {
    try {
      const today = new Date()
      
      // 7일 내 만료 예정 아이템 조회
      const { data: items, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:inventory_categories!category_id(
            name,
            owner:inventory_users!owner_id(email, notification_settings)
          )
        `)
        .not('expiry_date', 'is', null)
        .gte('expiry_date', today.toISOString().split('T')[0])
        .lte('expiry_date', new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error) throw error

      // 사용자별로 그룹화
      const userGroups = {}
      items.forEach(item => {
        const userEmail = item.category.owner.email
        const notificationSettings = item.category.owner.notification_settings
        
        if (notificationSettings?.expiry_alerts) {
          if (!userGroups[userEmail]) {
            userGroups[userEmail] = []
          }
          userGroups[userEmail].push({
            ...item,
            category_name: item.category.name
          })
        }
      })

      // 각 사용자에게 알림 발송
      for (const [email, userItems] of Object.entries(userGroups)) {
        await emailService.sendExpiryAlert(email, userItems)
      }

      return { success: true, count: Object.keys(userGroups).length }
    } catch (error) {
      console.error('Error checking expiry alerts:', error)
      return { success: false, error: error.message }
    }
  },

  // 저재고 알림 체크 및 발송
  checkLowStockAlerts: async () => {
    try {
      // 저재고 기준 조회 (시스템 설정에서)
      const lowStockThreshold = 5 // 추후 시스템 설정에서 가져오기

      const { data: items, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:inventory_categories!category_id(
            name,
            owner:inventory_users!owner_id(email, notification_settings)
          )
        `)
        .lte('quantity', lowStockThreshold)

      if (error) throw error

      // 사용자별로 그룹화
      const userGroups = {}
      items.forEach(item => {
        const userEmail = item.category.owner.email
        const notificationSettings = item.category.owner.notification_settings
        
        if (notificationSettings?.low_stock_alerts) {
          if (!userGroups[userEmail]) {
            userGroups[userEmail] = []
          }
          userGroups[userEmail].push({
            ...item,
            category_name: item.category.name
          })
        }
      })

      // 각 사용자에게 알림 발송
      for (const [email, userItems] of Object.entries(userGroups)) {
        await emailService.sendLowStockAlert(email, userItems)
      }

      return { success: true, count: Object.keys(userGroups).length }
    } catch (error) {
      console.error('Error checking low stock alerts:', error)
      return { success: false, error: error.message }
    }
  },

  // 시스템 알림 발송
  sendSystemNotification: async (subject, message, targetUsers = 'all') => {
    try {
      let query = supabase
        .from('inventory_users')
        .select('email, notification_settings')

      if (targetUsers === 'admin') {
        query = query.eq('is_admin', true)
      }

      const { data: users, error } = await query

      if (error) throw error

      // 알림 설정이 활성화된 사용자에게만 발송
      const targetEmails = users
        .filter(user => user.notification_settings?.system_alerts)
        .map(user => user.email)

      for (const email of targetEmails) {
        await emailService.sendSystemAlert(email, subject, message)
      }

      return { success: true, count: targetEmails.length }
    } catch (error) {
      console.error('Error sending system notification:', error)
      return { success: false, error: error.message }
    }
  }
}))
