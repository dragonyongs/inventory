import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Axios 인터셉터 설정
const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore.getState()
      const token = authStore.accessToken
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const authStore = useAuthStore.getState()
      
      if (error.response?.status === 401 && authStore.accessToken) {
        try {
          await authStore.refreshAccessToken()
          // 원래 요청 재시도
          return axios.request(error.config)
        } catch (refreshError) {
          authStore.logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
      
      return Promise.reject(error)
    }
  )
}

export default setupAxiosInterceptors
