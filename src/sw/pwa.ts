// src/sw/pwa.ts
import { registerSW } from "virtual:pwa-register";

export function setupPWA() {
  const updateSW = registerSW({
    immediate: true, // take control asap
    onNeedRefresh() {
      // show UI prompt or auto-apply
      const shouldUpdate = confirm(
        "새 콘텐츠가 있습니다. 지금 업데이트할까요?"
      );
      if (shouldUpdate) updateSW();
    },
    onOfflineReady() {
      console.log("앱이 오프라인에서 사용할 준비가 되었습니다.");
    },
  });

  return updateSW;
}
