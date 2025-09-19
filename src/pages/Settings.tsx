// src/pages/Settings.tsx
import { useState, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useAuthStore } from "../stores/authStore";
import { useOutboxStore } from "../stores/outboxStore";
import { setPwaListeners, applyUpdate } from "../utils/pwaClient"; // FIX: getNeedRefresh 제거

// 필요시 Role을 가져와 멤버 타입 정의
import type { Role } from "../types/auth";
type Member = { userId: string; role: Role };

export function Component() {
  const exp = useSettingsStore((s) => s.expiringDays);
  const size = useSettingsStore((s) => s.pageSize);
  const mode = useSettingsStore((s) => s.updateMode);
  const setExp = useSettingsStore((s) => s.setExpiringDays);
  const setSize = useSettingsStore((s) => s.setPageSize);
  const setMode = useSettingsStore((s) => s.setUpdateMode);

  // Outbox 상태 가시화
  const outboxJobs = useOutboxStore((s) => s.jobs);
  const isSyncing = useOutboxStore((s) => s.isSyncing);
  const lastSyncAt = useOutboxStore((s) => s.lastSyncAt); // FIX: 스토어에 없다면 제거

  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  // currentId와 workspaces에서 현재 워크스페이스/멤버 유도
  const currentId = useWorkspaceStore((s) => s.currentId); // FIX: current → currentId
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const workspace = workspaces.find((w) => w.id === currentId) || null;
  const members: Member[] = (workspace?.members as Member[]) ?? []; // FIX: members 접근

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setPwaListeners({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
  }, []);
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* App Settings */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">App Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Expiring Days Warning
            </label>
            <input
              type="number"
              value={exp ?? 30}
              onChange={(e) => setExp(parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Show warning for items expiring within this many days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Page Size</label>
            <select
              value={size ?? 20}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sync Status</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {outboxJobs.length}
            </div>
            <div className="text-sm text-gray-600">Pending Jobs</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded">
            <div
              className={`text-2xl font-bold ${
                isSyncing ? "text-yellow-600" : "text-green-600"
              }`}
            >
              {isSyncing ? "Syncing..." : "Idle"}
            </div>
            <div className="text-sm text-gray-600">Sync Status</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-sm font-medium text-gray-600">Last Sync</div>
            <div className="text-sm text-gray-500">
              {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "Never"}
            </div>
          </div>
        </div>

        {outboxJobs.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Pending Operations</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {outboxJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm">
                    {job.payload.type} - {job.payload.itemId} (qty:{" "}
                    {job.payload.qty})
                  </span>
                  {job.retries > 0 && (
                    <span className="text-xs text-red-600">
                      Retries: {job.retries}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PWA Settings */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">PWA Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Update Mode
            </label>
            <select
              value={mode ?? "prompt"}
              onChange={(e) => setMode(e.target.value as "auto" | "prompt")}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="auto">Auto Update</option>
              <option value="prompt">Prompt for Update</option>
            </select>
          </div>

          {needRefresh && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 mb-2">App update available!</p>
              <button
                onClick={() => applyUpdate()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update & Restart
              </button>
            </div>
          )}

          {offlineReady && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">App is ready for offline use!</p>
            </div>
          )}

          <div className="text-sm text-gray-600">
            브라우저의 설치(홈 화면 추가) 메뉴를 사용해 설치하세요.
          </div>
        </div>
      </div>

      {/* Workspace Members */}
      {workspace && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Workspace Members</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.userId} className="border-b">
                    <td className="p-2">{m.userId}</td>
                    <td className="p-2">{m.role}</td>
                    <td className="p-2">
                      {user?.id === m.userId ? (
                        <span className="text-gray-500">
                          {user?.id === m.userId ? <>You</> : null}
                        </span>
                      ) : (
                        <button className="text-red-600 hover:underline">
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PWA 업데이트 알림/버튼 */}
            {needRefresh && (
              <div className="mt-3">
                <p>App update available!</p>
                <button className="btn" onClick={() => applyUpdate()}>
                  업데이트 적용
                </button>
              </div>
            )}
            {offlineReady && (
              <p className="mt-2">App is ready for offline use!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Component;
