const CACHE_NAME = 'inventory-pwa-v2'
const urlsToCache = [
  '/',
  '/static/css/main.css', 
  '/static/js/main.js',
  '/manifest.json'
]

// 업데이트 제한을 위한 변수
let isUpdating = false
let lastUpdateTime = 0
const UPDATE_COOLDOWN = 5 * 60 * 1000 // 5분 쿨타임

// 설치 이벤트 - 조건부 skipWaiting
self.addEventListener('install', (event) => {
  console.log('서비스워커 설치 중...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        // 기존 서비스워커가 없는 경우에만 즉시 활성화
        return self.clients.matchAll()
      })
      .then((clients) => {
        if (clients.length === 0) {
          return self.skipWaiting()
        }
        // 기존 클라이언트가 있으면 대기
        console.log('기존 클라이언트 존재, 업데이트 대기 중...')
      })
  )
})

// 활성화 이벤트 - 안전한 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('서비스워커 활성화 중...')
  event.waitUntil(
    Promise.all([
      // 이전 버전 캐시만 삭제 (현재 버전 유지)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('inventory-pwa-') && cacheName !== CACHE_NAME) {
              console.log('이전 캐시 삭제:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      self.clients.claim()
    ])
  )
})

// 효율적인 fetch 전략 - Stale While Revalidate
self.addEventListener('fetch', (event) => {
  // 정적 자원에 대해서만 캐시 적용
  if (urlsToCache.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // 캐시된 응답 즉시 반환
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // 백그라운드에서 캐시 업데이트 (조건부)
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone()
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone)
                  })
              }
              return networkResponse
            })
            .catch(() => cachedResponse) // 네트워크 실패 시 캐시 사용

          return cachedResponse || fetchPromise
        })
    )
  } else {
    // API 요청 등은 네트워크 우선
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
        })
    )
  }
})

// 제어된 업데이트 처리
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    const now = Date.now()
    
    // 쿨타임 체크
    if (now - lastUpdateTime < UPDATE_COOLDOWN) {
      console.log('업데이트 쿨타임 중...')
      return
    }
    
    if (!isUpdating) {
      isUpdating = true
      lastUpdateTime = now
      
      console.log('서비스워커 업데이트 진행...')
      self.skipWaiting()
    }
  }
})

// 푸시 알림 (기존 코드 유지)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: { dateOfArrival: Date.now(), primaryKey: 1 },
    actions: [
      { action: 'explore', title: '확인하기', icon: '/icon-192x192.png' },
      { action: 'close', title: '닫기', icon: '/icon-192x192.png' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('재고 관리 알림', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    )
  }
})
