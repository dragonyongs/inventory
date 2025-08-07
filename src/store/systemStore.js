import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useSystemStore = create((set, get) => ({
  settings: {
    general: {
      systemName: '재고 관리 PWA',
      systemDescription: '회사 및 개인용 재고 관리 시스템',
      enablePublicRegistration: true,
      enablePublicCategories: true,
      systemMaintenanceMode: false,
      emailNotifications: true
    },
    limits: {
      maxUsersPerCategory: 10,
      maxItemsPerCategory: 1000,
      maxCategoriesPerUser: 50,
      defaultItemExpiry: 365,
      lowStockThreshold: 5
    },
    automation: {
      autoDeleteExpiredItems: false,
      autoBackupEnabled: false,
      autoNotificationEnabled: true
    }
  },
  loading: false,

  // 설정 로드
  loadSettings: async () => {
    try {
      set({ loading: true })
      
      const { data, error } = await supabase
        .from('inventory_system_settings') // 테이블명 수정
        .select('key, value')
        .in('key', ['general', 'limits', 'automation'])

      if (error) throw error

      const settings = {}
      data.forEach(setting => {
        settings[setting.key] = setting.value
      })

      set({ settings: { ...get().settings, ...settings }, loading: false })
    } catch (error) {
      console.error('Error loading settings:', error)
      set({ loading: false })
    }
  },

  // 설정 저장 (올바른 UPSERT 구현)
  saveSettings: async (category, newSettings, userId) => {
    try {
      // UPSERT: 존재하면 UPDATE, 없으면 INSERT
      const { error } = await supabase
        .from('inventory_system_settings') // 테이블명 수정
        .upsert({
          key: category,
          value: newSettings,
          updated_by: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key', // key 필드에서 충돌 시 UPDATE
          ignoreDuplicates: false // 중복 시 무시하지 않고 업데이트
        })

      if (error) throw error

      set(state => ({
        settings: {
          ...state.settings,
          [category]: newSettings
        }
      }))

      return { success: true }
    } catch (error) {
      console.error('Error saving settings:', error)
      return { success: false, error: error.message }
    }
  },

  // 특정 설정값 가져오기
  getSetting: (category, key) => {
    const { settings } = get()
    return settings[category]?.[key]
  },

  // 유지보수 모드 확인
  isMaintenanceMode: () => {
    return get().getSetting('general', 'systemMaintenanceMode')
  },

  // 공개 회원가입 허용 확인
  isPublicRegistrationEnabled: () => {
    return get().getSetting('general', 'enablePublicRegistration')
  },

  // 공개 카테고리 허용 확인
  isPublicCategoriesEnabled: () => {
    return get().getSetting('general', 'enablePublicCategories')
  },

  // 제한값 확인
  getLimit: (key) => {
    return get().getSetting('limits', key)
  }
}))
