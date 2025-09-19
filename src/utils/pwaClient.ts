// src/utils/pwaClient.ts
// PWA 업데이트/등록 유틸
// autoUpdate와 prompt 모두 지원: prompt 모드에서는 updateAvailable 콜백을 통해 사용자 동의 후 update()
import { registerSW } from "virtual:pwa-register";

type Listener = () => void;

let onNeedRefresh: Listener | null = null;
let onOfflineReady: Listener | null = null;

const pwaRegistration = registerSW({
  immediate: true, // auto reload를 원할 땐 true, prompt UX면 false 권장
  onNeedRefresh() {
    onNeedRefresh?.();
  },
  onOfflineReady() {
    onOfflineReady?.();
  },
});

export const applyUpdate = pwaRegistration.updateSW;
export const getNeedRefresh = () => !!onNeedRefresh;

export function setPwaListeners(opts: {
  onNeedRefresh?: Listener;
  onOfflineReady?: Listener;
}) {
  onNeedRefresh = opts.onNeedRefresh ?? null;
  onOfflineReady = opts.onOfflineReady ?? null;
}

// 개발용 캐시 클리어 기능 (기존 PWA 로직에 영향 없음)
export const clearDevCache = async () => {
  if (process.env.NODE_ENV !== "development") {
    console.warn("Cache clear is only available in development mode");
    return;
  }

  try {
    // 브라우저 캐시 클리어
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log("Browser caches cleared");
    }

    // LocalStorage 클리어 (선택적)
    const shouldClearStorage = confirm(
      "로컬 스토리지도 클리어하시겠습니까? (모든 데이터가 삭제됩니다)"
    );
    if (shouldClearStorage) {
      localStorage.clear();
      sessionStorage.clear();
      console.log("Storage cleared");
    }

    // 서비스 워커 재시작
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
      console.log("Service workers unregistered");
    }

    // 완전 새로고침
    window.location.reload();
  } catch (error) {
    console.error("Failed to clear cache:", error);
    alert(
      "캐시 클리어에 실패했습니다. 수동으로 브라우저 캐시를 클리어해주세요."
    );
  }
};
