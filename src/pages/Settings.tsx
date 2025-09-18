import { useState, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useAuthStore } from "../stores/authStore";
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

      <WorkspaceSection />
    </div>
  );
}

export { Component as default };
export function ErrorBoundary() {
  return <div>Settings failed to load.</div>;
}

function WorkspaceSection() {
  const { user } = useAuthStore();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentId = useWorkspaceStore((s) => s.currentId);
  const setCurrent = useWorkspaceStore((s) => s.setCurrent);
  const createWs = useWorkspaceStore((s) => s.createWorkspace);
  const renameWs = useWorkspaceStore((s) => s.renameWorkspace);
  const invite = useWorkspaceStore((s) => s.inviteMember);
  const can = useWorkspaceStore((s) => s.can);

  const [name, setName] = useState("");
  const [rename, setRename] = useState("");
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-medium">Workspace</h3>

      <div className="flex gap-2 items-center">
        <select
          className="border px-2 py-1"
          value={currentId ?? ""}
          onChange={(e) => setCurrent(e.target.value)}
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <input
          className="border px-2 py-1"
          placeholder="New workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="border px-2 py-1"
          onClick={() => {
            if (!name.trim()) return;
            createWs(name.trim());
            setName("");
          }}
        >
          Create
        </button>
      </div>

      {currentId && (
        <div className="space-y-2 border rounded p-3">
          <div className="font-medium">
            Current: {workspaces.find((w) => w.id === currentId)?.name}
          </div>

          <div className="flex gap-2 items-center">
            <input
              className="border px-2 py-1"
              placeholder="Rename"
              value={rename}
              onChange={(e) => setRename(e.target.value)}
            />
            <button
              className="border px-2 py-1"
              disabled={!can(currentId, "edit")}
              onClick={() => {
                if (!rename.trim()) return;
                renameWs(currentId, rename.trim());
                setRename("");
              }}
            >
              Rename
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <input
              className="border px-2 py-1"
              placeholder="Invite userId"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
            />
            <select
              className="border px-2 py-1"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
            >
              <option value="editor">editor</option>
              <option value="viewer">viewer</option>
            </select>
            <button
              className="border px-2 py-1"
              disabled={!can(currentId, "edit")}
              onClick={() => {
                if (!inviteUserId.trim()) return;
                invite(currentId, inviteUserId.trim(), inviteRole);
                setInviteUserId("");
              }}
            >
              Invite
            </button>
          </div>

          <MembersList workspaceId={currentId} />
        </div>
      )}

      <div className="text-sm text-gray-600">
        Only the creator can delete a workspace; others can use features by role
        but cannot delete.
      </div>
    </section>
  );
}

function MembersList({ workspaceId }: { workspaceId: string }) {
  const ws = useWorkspaceStore(
    (s) => s.workspaces.find((w) => w.id === workspaceId)!
  );
  const remove = useWorkspaceStore((s) => s.removeMember);
  const can = useWorkspaceStore((s) => s.can);

  return (
    <div>
      <div className="font-medium mb-1">Members</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left px-2 py-1">User</th>
            <th className="text-left px-2 py-1">Role</th>
            <th className="text-right px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ws.members.map((m) => (
            <tr key={m.userId} className="border-b">
              <td className="px-2 py-1">{m.userId}</td>
              <td className="px-2 py-1">{m.role}</td>
              <td className="px-2 py-1 text-right">
                <button
                  className="border px-2 py-1"
                  disabled={!can(workspaceId, "delete") || m.role === "owner"}
                  onClick={() => remove(workspaceId, m.userId)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {ws.members.length === 0 && (
            <tr>
              <td className="px-2 py-2" colSpan={3}>
                No members
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
