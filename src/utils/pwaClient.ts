// src/utils/pwaClient.ts

let swRegistration: ServiceWorkerRegistration | null = null;
let updateAvailable = false;
let updateCallbacks: Array<(available: boolean) => void> = [];

// PWA 리스너 콜백 함수들
let onNeedRefreshCallback: (() => void) | null = null;
let onOfflineReadyCallback: (() => void) | null = null;

export const registerSW = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
          swRegistration = registration;

          // 업데이트 감지
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("새 버전 사용 가능");
                  updateAvailable = true;
                  updateCallbacks.forEach((callback) => callback(true));

                  // Settings.tsx용 콜백 호출
                  if (onNeedRefreshCallback) {
                    onNeedRefreshCallback();
                  }
                }
              });
            }
          });

          // 오프라인 준비 완료
          if (registration.active && !navigator.serviceWorker.controller) {
            if (onOfflineReadyCallback) {
              onOfflineReadyCallback();
            }
          }

          // 🔧 개발 모드에서는 캐시 무력화
          if (import.meta.env.DEV) {
            console.log("개발 모드: 캐시 무력화");
            registration.update(); // 즉시 업데이트 체크

            // 기존 캐시 모두 삭제
            caches.keys().then((cacheNames) => {
              return Promise.all(
                cacheNames.map((cacheName) => {
                  console.log("캐시 삭제:", cacheName);
                  return caches.delete(cacheName);
                })
              );
            });
          }
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    });
  }
};

// 🔧 Settings.tsx에서 필요한 PWA 리스너 설정 함수
export const setPwaListeners = (options: {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}) => {
  console.log("PWA 리스너 설정:", options);

  onNeedRefreshCallback = options.onNeedRefresh || null;
  onOfflineReadyCallback = options.onOfflineReady || null;

  // 이미 업데이트가 있다면 즉시 콜백 호출
  if (updateAvailable && onNeedRefreshCallback) {
    onNeedRefreshCallback();
  }
};

// Settings.tsx에서 사용하는 함수들
export const onUpdateAvailable = (callback: (available: boolean) => void) => {
  updateCallbacks.push(callback);
  // 이미 업데이트가 있다면 즉시 콜백 호출
  if (updateAvailable) {
    callback(true);
  }

  // cleanup 함수 반환
  return () => {
    updateCallbacks = updateCallbacks.filter((cb) => cb !== callback);
  };
};

export const applyUpdate = async (): Promise<void> => {
  if (!swRegistration) {
    console.warn("Service Worker가 등록되지 않았습니다");
    return;
  }

  const waitingWorker: ServiceWorker | null = swRegistration.waiting;
  if (!waitingWorker) {
    console.warn("대기 중인 Service Worker가 없습니다");
    return;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === "SW_SKIP_WAITING_SUCCESS") {
        console.log("Service Worker 업데이트 적용됨");
        updateAvailable = false;
        updateCallbacks.forEach((callback) => callback(false));
        resolve();

        // 페이지 새로고침
        window.location.reload();
      }
    };

    waitingWorker.postMessage({ type: "SKIP_WAITING" }, [messageChannel.port2]);
  });
};

export const checkForUpdate = async (): Promise<boolean> => {
  if (!swRegistration) {
    console.warn("Service Worker가 등록되지 않았습니다");
    return false;
  }

  try {
    const registration = await swRegistration.update();
    return !!registration.waiting;
  } catch (error) {
    console.error("업데이트 확인 실패:", error);
    return false;
  }
};

export const getAppVersion = (): string => {
  // package.json의 버전을 가져오거나 build time에 주입된 버전 사용
  return import.meta.env.VITE_APP_VERSION || "1.0.0";
};

export const isUpdateAvailable = (): boolean => {
  return updateAvailable;
};

export const getNeedRefresh = (): boolean => {
  return updateAvailable;
};

// 🔧 개발 모드용 캐시 강제 새로고침
export const forceRefresh = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.update();
      });
    });

    // 모든 캐시 삭제
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        console.log("모든 캐시 삭제 완료");
        window.location.reload();
      });
  }
};

// 🔧 localStorage 강제 새로고침
export const clearAllStorage = () => {
  // localStorage 정리
  const keysToKeep = ["auth-storage", "workspace-storage"];
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.includes(key)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
    console.log("localStorage 키 제거:", key);
  });

  // 캐시도 함께 정리
  forceRefresh();
};

// 🔧 개발 모드용 캐시 클리어 (Settings.tsx용)
export const clearDevCache = async (): Promise<void> => {
  if (!import.meta.env.DEV) {
    console.warn("Cache clear is only available in development mode");
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log("개발 캐시가 삭제되었습니다");
  } catch (error) {
    console.error("캐시 삭제 실패:", error);
  }
};

// 🔧 PWA 설치 관련 함수들 (Settings.tsx에서 사용할 수 있도록)
let deferredPrompt: any = null;

export const canInstall = (): boolean => {
  return !!deferredPrompt;
};

export const installApp = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  try {
    const result = await deferredPrompt.prompt();
    deferredPrompt = null;
    return result.outcome === "accepted";
  } catch (error) {
    console.error("앱 설치 실패:", error);
    return false;
  }
};

// PWA 설치 이벤트 리스너
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("PWA 설치 프롬프트 준비됨");
});

// 앱이 설치되었을 때
window.addEventListener("appinstalled", () => {
  console.log("PWA가 설치되었습니다");
  deferredPrompt = null;
});

// Service Worker에서 메시지 수신
navigator.serviceWorker?.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SW_ACTIVATED") {
    console.log("Service Worker 활성화됨 - 새로고침 권장");
    if (onNeedRefreshCallback) {
      onNeedRefreshCallback();
    }
  }
});
