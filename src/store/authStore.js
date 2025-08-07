import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyToken,
  getUserFromToken,
  isTokenExpired 
} from '../lib/auth'

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: true,

  // 로그인
  login: async (username, password) => {
    try {
      // 사용자 조회
      const { data: user, error } = await supabase
        .from('inventory_users')
        .select('*')
        .eq('username', username)
        .single()

      if (error) throw new Error('사용자를 찾을 수 없습니다.')
      
      // 비밀번호 검증
      const isValidPassword = await verifyPassword(password, user.password_hash)
      if (!isValidPassword) {
        throw new Error('비밀번호가 올바르지 않습니다.')
      }

      // JWT 토큰 생성 (async 함수로 변경됨)
      const accessToken = await generateAccessToken(user)
      const refreshToken = await generateRefreshToken(user)

      // 리프레시 토큰을 데이터베이스에 저장
      await supabase
        .from('inventory_users')
        .update({ refresh_token: refreshToken })
        .eq('id', user.id)

      // 로컬 스토리지에 토큰 저장
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        username: user.username,
        name: user.name
      }))

      set({ 
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          is_admin: user.is_admin || false
        },
        accessToken,
        refreshToken,
        loading: false 
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // 회원가입
  register: async (username, name, password, email) => {
    try {

      // 이메일 중복 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('inventory_users')
        .select('email')
        .eq('email', email)
        .single()

      if (existingUser) {
        throw new Error('이미 사용 중인 이메일입니다.')
      }

      // 비밀번호 해시화
      const hashedPassword = await hashPassword(password)

      // 사용자 생성
      const { data: user, error } = await supabase
      .from('inventory_users')
      .insert([{
        username,
        name,
        email,
        password_hash: hashedPassword,
        email_verified: false,
        notification_settings: {
          expiry_alerts: true,
          low_stock_alerts: true,
          system_alerts: true
        }
      }])
      .select()
      .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('이미 존재하는 사용자명입니다.')
        }
        throw error
      }

      // JWT 토큰 생성 (async 함수로 변경됨)
      const accessToken = await generateAccessToken(user)
      const refreshToken = await generateRefreshToken(user)

      // 리프레시 토큰을 데이터베이스에 저장
      await supabase
        .from('inventory_users')
        .update({ refresh_token: refreshToken })
        .eq('id', user.id)

      // 로컬 스토리지에 토큰 저장
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin || false
      }))

      set({ 
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          is_admin: user.is_admin || false
        },
        accessToken,
        refreshToken,
        loading: false 
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // 토큰 갱신
  refreshAccessToken: async () => {
    try {
      const { refreshToken } = get()
      if (!refreshToken) throw new Error('No refresh token available')

      // 리프레시 토큰 검증 (async 함수로 변경됨)
      const decoded = await verifyToken(refreshToken)
      
      // 데이터베이스에서 사용자 및 리프레시 토큰 확인
      const { data: user, error } = await supabase
        .from('inventory_users')
        .select('*')
        .eq('id', decoded.id)
        .eq('refresh_token', refreshToken)
        .single()

      if (error) throw new Error('Invalid refresh token')

      // 새 액세스 토큰 생성 (async 함수로 변경됨)
      const newAccessToken = await generateAccessToken(user)
      
      // 로컬 스토리지 업데이트
      localStorage.setItem('accessToken', newAccessToken)

      set({ accessToken: newAccessToken })
      return newAccessToken
    } catch (error) {
      // 리프레시 실패 시 로그아웃
      get().logout()
      throw error
    }
  },

  // 인증 상태 확인
  checkAuth: async () => {
    try {
      set({ loading: true })

      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const userData = localStorage.getItem('user')

      if (!accessToken || !refreshToken || !userData) {
        set({ loading: false })
        return
      }

      const user = JSON.parse(userData)

      // 액세스 토큰이 만료되었는지 확인
      if (isTokenExpired(accessToken)) {
        try {
          // 토큰 갱신 시도
          await get().refreshAccessToken()
        } catch (error) {
          // 갱신 실패 시 로그아웃
          get().logout()
          return
        }
      }

      // 데이터베이스에서 최신 사용자 정보 조회 (is_admin 포함)
      try {
        const { data: latestUserData, error } = await supabase
          .from('inventory_users')
          .select('id, username, name, is_admin')
          .eq('id', user.id)
          .single()

        if (!error && latestUserData) {
          // 최신 사용자 정보로 업데이트
          const updatedUser = {
            id: latestUserData.id,
            username: latestUserData.username,
            name: latestUserData.name,
            is_admin: latestUserData.is_admin
          }

          // localStorage 업데이트
          localStorage.setItem('user', JSON.stringify(updatedUser))

          set({ 
            user: updatedUser,
            accessToken,
            refreshToken,
            loading: false 
          })
        } else {
          // 사용자를 찾을 수 없으면 로그아웃
          get().logout()
        }
      } catch (dbError) {
        console.error('Error fetching latest user info:', dbError)
        // 데이터베이스 오류 시 기존 정보 사용
        set({ 
          user,
          accessToken,
          refreshToken,
          loading: false 
        })
      }
    } catch (error) {
      console.error('Auth check error:', error)
      get().logout()
    }
  },

  // 로그아웃
  logout: async () => {
    try {
      const { user, refreshToken } = get()
      
      // 데이터베이스에서 리프레시 토큰 제거
      if (user && refreshToken) {
        await supabase
          .from('inventory_users')
          .update({ refresh_token: null })
          .eq('id', user.id)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 로컬 스토리지 및 상태 클리어
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      set({ 
        user: null, 
        accessToken: null,
        refreshToken: null,
        loading: false 
      })
    }
  },

  // API 요청용 인증 헤더 가져오기
  getAuthHeader: () => {
    const { accessToken } = get()
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  },

  updateUserProfile: (updatedUser) => {
    set({ user: updatedUser })
  }
}))
