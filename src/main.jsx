import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 업데이트 관리자
class ServiceWorkerManager {
  constructor() {
    this.updateAvailable = false
    this.refreshing = false
    this.registration = null
    this.lastUpdateCheck = 0
    this.updateCheckInterval = 30 * 60 * 1000 // 30분마다 체크
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/service-worker.js')
        console.log('SW 등록 성공')

        this.setupUpdateListeners()
        this.scheduleUpdateCheck()

      } catch (error) {
        console.error('SW 등록 실패:', error)
      }
    }
  }

  setupUpdateListeners() {
    // 업데이트 감지
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing
      console.log('새로운 서비스워커 감지')

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('새 버전 설치 완료')
          this.updateAvailable = true
          this.showUpdatePrompt()
        }
      })
    })

    // 컨트롤러 변경 (업데이트 적용됨)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.refreshing) return
      console.log('새 서비스워커 활성화됨')
      this.refreshing = true
      window.location.reload()
    })
  }

  showUpdatePrompt() {
    // 사용자 친화적인 업데이트 알림
    const updateBanner = this.createUpdateBanner()
    document.body.appendChild(updateBanner)
  }

  createUpdateBanner() {
    const banner = document.createElement('div')
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; 
      background: #2196F3; color: white; padding: 16px;
      text-align: center; z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `
    banner.innerHTML = `
      <span>새로운 업데이트가 있습니다!</span>
      <button id="update-btn" style="margin-left: 16px; padding: 8px 16px; background: white; color: #2196F3; border: none; border-radius: 4px; cursor: pointer;">
        지금 업데이트
      </button>
      <button id="dismiss-btn" style="margin-left: 8px; padding: 8px 16px; background: transparent; color: white; border: 1px solid white; border-radius: 4px; cursor: pointer;">
        나중에
      </button>
    `

    banner.querySelector('#update-btn').onclick = () => {
      this.applyUpdate()
      banner.remove()
    }

    banner.querySelector('#dismiss-btn').onclick = () => {
      banner.remove()
      // 1시간 후 다시 알림
      setTimeout(() => this.showUpdatePrompt(), 60 * 60 * 1000)
    }

    return banner
  }

  applyUpdate() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  scheduleUpdateCheck() {
    setInterval(() => {
      if (this.registration) {
        console.log('업데이트 확인 중...')
        this.registration.update()
      }
    }, this.updateCheckInterval)
  }
}

// 서비스워커 관리자 초기화
const swManager = new ServiceWorkerManager()
swManager.init()
