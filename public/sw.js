// public/sw.js - 최적화된 Service Worker
const CACHE_NAME = "inventory-pwa-v3"; // ✅ 버전 업그레이드
const STATIC_CACHE = "inventory-static-v3";
const DYNAMIC_CACHE = "inventory-dynamic-v3";

// ✅ 캐시할 정적 자원 (Vite 빌드 구조에 맞게 수정)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// ✅ 동적으로 캐시할 자원 패턴
const DYNAMIC_CACHE_PATTERNS = [
  /\/assets\/.*\.(js|css|woff|woff2|ttf)$/,
  /\/src\/.*\.(ts|tsx|js|jsx)$/,
];

// ✅ 캐시하지 않을 자원 (개발 도구, API 등)
const CACHE_BLACKLIST = [
  /\/@vite\/client/,
  /\/node_modules/,
  /\/api\//,
  /\/auth\//,
  /\.hot-update\./,
  /sockjs-node/,
  /webpack-dev-server/,
];

// ✅ 업데이트 제한 변수 (기존 로직 개선)
let updateState = {
  isUpdating: false,
  lastUpdateTime: 0,
  cooldownPeriod: 3 * 60 * 1000, // 3분으로 단축
  maxRetries: 3,
  retryCount: 0,
};

// ✅ 유틸리티 함수들
const isStaticAsset = (url) => {
  return STATIC_ASSETS.some((asset) => url.pathname === asset);
};

const isDynamicAsset = (url) => {
  return DYNAMIC_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));
};

const isBlacklisted = (url) => {
  return CACHE_BLACKLIST.some((pattern) => pattern.test(url.href));
};

const shouldCache = (request, response) => {
  return (
    response &&
    response.status === 200 &&
    response.type === "basic" &&
    !isBlacklisted(new URL(request.url))
  );
};

// ✅ 설치 이벤트 - 개선된 버전
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker 설치 중...", CACHE_NAME);

  event.waitUntil(
    Promise.all([
      // 정적 자산 캐시
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("📦 정적 자산 캐싱 시작");
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.error("❌ 정적 자산 캐싱 실패:", error);
          // 실패한 자산 개별 처리
          return Promise.allSettled(
            STATIC_ASSETS.map((asset) =>
              cache
                .add(asset)
                .catch((e) => console.warn(`⚠️ ${asset} 캐싱 실패:`, e))
            )
          );
        });
      }),

      // 조건부 skipWaiting (기존 로직 유지하되 개선)
      self.clients.matchAll().then((clients) => {
        if (clients.length === 0 || self.skipWaiting) {
          console.log("✅ 즉시 활성화");
          return self.skipWaiting();
        } else {
          console.log("⏳ 기존 클라이언트 존재, 업데이트 대기");
        }
      }),
    ])
  );
});

// ✅ 활성화 이벤트 - 안전한 캐시 정리 (개선)
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker 활성화 중...", CACHE_NAME);

  event.waitUntil(
    Promise.all([
      // ✅ 이전 버전 캐시 정리 (더 정확한 정리)
      caches.keys().then((cacheNames) => {
        const deletePromises = cacheNames
          .filter((cacheName) => {
            // inventory-pwa로 시작하는 이전 버전만 삭제
            return (
              (cacheName.startsWith("inventory-pwa-") ||
                cacheName.startsWith("inventory-static-") ||
                cacheName.startsWith("inventory-dynamic-")) &&
              !Object.values({
                CACHE_NAME,
                STATIC_CACHE,
                DYNAMIC_CACHE,
              }).includes(cacheName)
            );
          })
          .map((cacheName) => {
            console.log("🗑️ 이전 캐시 삭제:", cacheName);
            return caches.delete(cacheName);
          });

        return Promise.all(deletePromises);
      }),

      // 모든 클라이언트 제어
      self.clients.claim(),
    ])
  );

  // ✅ 클라이언트에 활성화 알림 (기존 로직 통합)
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "SW_ACTIVATED",
        cacheVersion: CACHE_NAME,
        timestamp: Date.now(),
      });
    });
  });
});

// ✅ Fetch 이벤트 - 향상된 캐싱 전략
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ✅ 블랙리스트 자원 제외
  if (isBlacklisted(url)) {
    return; // 기본 네트워크 요청
  }

  // ✅ 정적 자산: Stale While Revalidate
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAssets(event.request));
  }
  // ✅ 동적 자산: Network First with Cache Fallback
  else if (isDynamicAsset(url)) {
    event.respondWith(handleDynamicAssets(event.request));
  }
  // ✅ HTML 문서: Network First
  else if (event.request.destination === "document") {
    event.respondWith(handleDocuments(event.request));
  }
  // ✅ API 요청: Network Only (캐시하지 않음)
  else if (url.pathname.startsWith("/api/")) {
    return; // 기본 네트워크 요청
  }
  // ✅ 기타: Network First
  else {
    event.respondWith(handleOtherRequests(event.request));
  }
});

// ✅ 정적 자산 처리: Stale While Revalidate
async function handleStaticAssets(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    // 백그라운드에서 업데이트
    const networkPromise = fetch(request)
      .then((response) => {
        if (shouldCache(request, response)) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => null);

    // 캐시가 있으면 즉시 반환, 없으면 네트워크 대기
    return (
      cachedResponse ||
      networkPromise ||
      new Response("Offline", { status: 503 })
    );
  } catch (error) {
    console.error("정적 자산 처리 실패:", error);
    return new Response("Error", { status: 500 });
  }
}

// ✅ 동적 자산 처리: Network First with Cache Fallback
async function handleDynamicAssets(request) {
  try {
    const networkResponse = await fetch(request);

    if (shouldCache(request, networkResponse)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("네트워크 실패, 캐시에서 찾는 중...", request.url);
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    return (
      cachedResponse ||
      new Response("Offline", {
        status: 503,
        statusText: "Service Unavailable",
      })
    );
  }
}

// ✅ HTML 문서 처리
async function handleDocuments(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // 오프라인 시 메인 페이지로 fallback
    const cache = await caches.open(STATIC_CACHE);
    const fallback =
      (await cache.match("/")) || (await cache.match("/index.html"));
    return fallback || new Response("Offline", { status: 503 });
  }
}

// ✅ 기타 요청 처리
async function handleOtherRequests(request) {
  try {
    const networkResponse = await fetch(request);

    // 성공적인 응답만 캐시
    if (shouldCache(request, networkResponse)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response("Network Error", { status: 503 });
  }
}

// ✅ 메시지 이벤트 - 개선된 업데이트 처리
self.addEventListener("message", (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      handleSkipWaiting(event);
      break;

    case "GET_CACHE_INFO":
      handleGetCacheInfo(event);
      break;

    case "CLEAR_CACHE":
      handleClearCache(event);
      break;

    default:
      console.log("알 수 없는 메시지:", type);
  }
});

// ✅ Skip Waiting 처리 (기존 로직 개선)
async function handleSkipWaiting(event) {
  const now = Date.now();

  // 쿨다운 체크
  if (now - updateState.lastUpdateTime < updateState.cooldownPeriod) {
    console.log("⏳ 업데이트 쿨다운 중...");
    event.ports[0]?.postMessage({
      type: "SW_SKIP_WAITING_FAILED",
      reason: "COOLDOWN",
    });
    return;
  }

  // 업데이트 상태 체크
  if (updateState.isUpdating) {
    console.log("🔄 이미 업데이트 진행 중...");
    event.ports[0]?.postMessage({
      type: "SW_SKIP_WAITING_FAILED",
      reason: "ALREADY_UPDATING",
    });
    return;
  }

  try {
    updateState.isUpdating = true;
    updateState.lastUpdateTime = now;

    console.log("🚀 Service Worker 업데이트 진행...");
    await self.skipWaiting();

    event.ports[0]?.postMessage({
      type: "SW_SKIP_WAITING_SUCCESS",
      cacheVersion: CACHE_NAME,
    });
  } catch (error) {
    console.error("❌ Skip Waiting 실패:", error);
    event.ports[0]?.postMessage({
      type: "SW_SKIP_WAITING_FAILED",
      reason: "ERROR",
      error: error.message,
    });
  } finally {
    updateState.isUpdating = false;
  }
}

// ✅ 캐시 정보 제공
async function handleGetCacheInfo(event) {
  try {
    const cacheNames = await caches.keys();
    const cacheInfo = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheInfo[cacheName] = {
        size: keys.length,
        keys: keys.map((req) => req.url),
      };
    }

    event.ports[0]?.postMessage({
      type: "CACHE_INFO_RESPONSE",
      data: cacheInfo,
    });
  } catch (error) {
    console.error("캐시 정보 조회 실패:", error);
    event.ports[0]?.postMessage({
      type: "CACHE_INFO_ERROR",
      error: error.message,
    });
  }
}

// ✅ 캐시 삭제
async function handleClearCache(event) {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));

    console.log("🗑️ 모든 캐시 삭제 완료");
    event.ports[0]?.postMessage({
      type: "CACHE_CLEAR_SUCCESS",
    });
  } catch (error) {
    console.error("캐시 삭제 실패:", error);
    event.ports[0]?.postMessage({
      type: "CACHE_CLEAR_ERROR",
      error: error.message,
    });
  }
}

// ✅ Push 알림 - 개선된 버전
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "재고 관리 알림",
    body: "새로운 알림이 있습니다.",
    icon: "/icon-192x192.png",
    badge: "/icon-96x96.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Math.random().toString(36).substr(2, 9),
    },
    actions: [
      { action: "explore", title: "확인하기", icon: "/icon-192x192.png" },
      { action: "close", title: "닫기", icon: "/icon-192x192.png" },
    ],
    requireInteraction: false,
    silent: false,
  };

  // Push 데이터가 있는 경우 파싱
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error("Push 데이터 파싱 실패:", error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// ✅ 알림 클릭 처리 - 개선된 버전
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  if (event.action === "explore" || !event.action) {
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          // 이미 열린 창이 있는지 확인
          const existingClient = clients.find((client) =>
            client.url.includes(self.location.origin)
          );

          if (existingClient) {
            existingClient.focus();
            existingClient.navigate(urlToOpen);
          } else {
            self.clients.openWindow(urlToOpen);
          }
        })
    );
  }
  // close 액션은 알림만 닫힘 (기본 동작)
});

// ✅ 백그라운드 동기화 (선택사항)
self.addEventListener("sync", (event) => {
  if (event.tag === "inventory-sync") {
    event.waitUntil(
      // 백그라운드에서 데이터 동기화 로직
      syncInventoryData()
    );
  }
});

async function syncInventoryData() {
  try {
    console.log("🔄 백그라운드 동기화 시작");
    // 실제 동기화 로직은 필요에 따라 구현
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_COMPLETED" });
    });
  } catch (error) {
    console.error("동기화 실패:", error);
  }
}

// ✅ 에러 핸들링
self.addEventListener("error", (event) => {
  console.error("Service Worker 오류:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("처리되지 않은 Promise 거부:", event.reason);
});

console.log("✅ Service Worker 로드 완료:", CACHE_NAME);
