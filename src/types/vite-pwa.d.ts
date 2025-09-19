// src/types/vite-pwa.d.ts
declare module "virtual:pwa-register" {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
  }

  export interface RegisterSWResult {
    updateSW: (reloadPage?: boolean) => Promise<void>;
  }

  export function registerSW(options?: RegisterSWOptions): RegisterSWResult;
}
