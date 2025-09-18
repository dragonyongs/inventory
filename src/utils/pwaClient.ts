// PWA 업데이트/등록 유틸
// autoUpdate와 prompt 모두 지원: prompt 모드에서는 updateAvailable 콜백을 통해 사용자 동의 후 update()
import { registerSW } from "virtual:pwa-register";

type Listener = () => void;
let onNeedRefresh: Listener | null = null;
let onOfflineReady: Listener | null = null;

export const { update: applyUpdate, needRefresh: getNeedRefresh } = registerSW({
  immediate: true, // auto reload를 원할 땐 true, prompt UX면 false 권장
  onNeedRefresh() {
    onNeedRefresh?.();
  },
  onOfflineReady() {
    onOfflineReady?.();
  },
});

export function setPwaListeners(opts: {
  onNeedRefresh?: Listener;
  onOfflineReady?: Listener;
}) {
  onNeedRefresh = opts.onNeedRefresh ?? null;
  onOfflineReady = opts.onOfflineReady ?? null;
}
