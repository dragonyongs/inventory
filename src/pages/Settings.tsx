import { useState, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import {
  setPwaListeners,
  applyUpdate,
  getNeedRefresh,
} from "../utils/pwaClient";

export function Component() {
  const exp = useSettingsStore((s) => s.expiringDays);
  const size = useSettingsStore((s) => s.pageSize);
  const mode = useSettingsStore((s) => s.updateMode);
  const setExp = useSettingsStore((s) => s.setExpiringDays);
  const setSize = useSettingsStore((s) => s.setPageSize);
  const setMode = useSettingsStore((s) => s.setUpdateMode);

  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    setPwaListeners({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-xl">Settings</div>

      <section className="space-y-2">
        <h3 className="font-medium">Inventory</h3>
        <label className="flex items-center gap-2">
          <span>Expiring days</span>
          <input
            className="border px-2 py-1 w-24"
            type="number"
            min={1}
            value={exp}
            onChange={(e) => setExp(parseInt(e.target.value || "1", 10))}
          />
        </label>
        <label className="flex items-center gap-2">
          <span>Page size</span>
          <input
            className="border px-2 py-1 w-24"
            type="number"
            min={5}
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value || "5", 10))}
          />
        </label>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">PWA</h3>
        <label className="flex items-center gap-2">
          <span>Update mode</span>
          <select
            className="border px-2 py-1"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="auto">auto</option>
            <option value="prompt">prompt</option>
          </select>
        </label>

        <div className="flex gap-2">
          <button
            className="border px-2 py-1"
            onClick={() => {
              // 브라우저가 새로운 SW를 내려받아 대기 중이면 토글됨
              setNeedRefresh(getNeedRefresh());
            }}
          >
            Check Update
          </button>
          <button
            className="border px-2 py-1"
            disabled={!needRefresh}
            onClick={() => applyUpdate()}
          >
            Apply Update
          </button>
          <button
            className="border px-2 py-1"
            onClick={async () => {
              // 캐시 초기화
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
              location.reload();
            }}
          >
            Clear Cache
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {needRefresh ? "New version ready" : "No updates"}
          {offlineReady ? " · Offline ready" : ""}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Install</h3>
        <p className="text-sm">
          브라우저의 설치(홈 화면 추가) 메뉴를 사용해 설치하세요.
        </p>
      </section>
    </div>
  );
}

export { Component as default };
export function ErrorBoundary() {
  return <div>Settings failed to load.</div>;
}
