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
        .then((registration: ServiceWorkerRegistration) => {
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

                  if (onNeedRefreshCallback) {
                    onNeedRefreshCallback();
                  }
                }
              });
            }
          });

          if (registration.active && !navigator.serviceWorker.controller) {
            if (onOfflineReadyCallback) {
              onOfflineReadyCallback();
            }
          }

          if (import.meta.env.DEV) {
            console.log("개발 모드: 캐시 무력화");
            registration.update();

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

export const setPwaListeners = (options: {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}) => {
  console.log("PWA 리스너 설정:", options);
  onNeedRefreshCallback = options.onNeedRefresh || null;
  onOfflineReadyCallback = options.onOfflineReady || null;

  if (updateAvailable && onNeedRefreshCallback) {
    onNeedRefreshCallback();
  }
};

export const onUpdateAvailable = (callback: (available: boolean) => void) => {
  updateCallbacks.push(callback);

  if (updateAvailable) {
    callback(true);
  }

  return () => {
    updateCallbacks = updateCallbacks.filter((cb) => cb !== callback);
  };
};

// ✅ 핵심 수정: applyUpdate 함수 - 불필요한 변수 할당 제거
export const applyUpdate = async (): Promise<void> => {
  if (!swRegistration) {
    console.warn("Service Worker가 등록되지 않았습니다");
    return;
  }

  // 직접 접근 - 이미 null 체크를 했으므로 안전
  const waitingWorker: ServiceWorker | null = swRegistration.waiting;

  if (!waitingWorker) {
    console.warn("대기 중인 Service Worker가 없습니다");
    return;
  }

  return new Promise<void>((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.type === "SW_SKIP_WAITING_SUCCESS") {
        console.log("Service Worker 업데이트 적용됨");
        updateAvailable = false;
        updateCallbacks.forEach((callback) => callback(false));
        resolve();
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
    // swRegistration.update()는 Promise<ServiceWorkerRegistration>을 반환
    await swRegistration.update();
    return !!swRegistration.waiting;
  } catch (error) {
    console.error("업데이트 확인 실패:", error);
    return false;
  }
};

export const getAppVersion = (): string => {
  return import.meta.env.VITE_APP_VERSION || "1.0.0";
};

export const isUpdateAvailable = (): boolean => {
  return updateAvailable;
};

export const getNeedRefresh = (): boolean => {
  return updateAvailable;
};

export const forceRefresh = (): void => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.update();
      });
    });

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

export const clearAllStorage = (): void => {
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

  forceRefresh();
};

// ✅ 수정: clearDevCache 함수 - 타입 비교 문제 해결
export const clearDevCache = async (): Promise<void> => {
  // boolean 타입으로 직접 비교
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

// PWA 설치 관련
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

// PWA 이벤트 리스너들
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("PWA 설치 프롬프트 준비됨");
});

window.addEventListener("appinstalled", () => {
  console.log("PWA가 설치되었습니다");
  deferredPrompt = null;
});

// Service Worker 메시지 수신
navigator.serviceWorker?.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SW_ACTIVATED") {
    console.log("Service Worker 활성화됨 - 새로고침 권장");
    if (onNeedRefreshCallback) {
      onNeedRefreshCallback();
    }
  }
});
