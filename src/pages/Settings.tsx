// src/pages/Settings.tsx
import { useState, useEffect } from "react";
import {
  Settings2,
  Database,
  Users,
  Bell,
  Calendar,
  List,
  Cloud,
  Clock,
  AlertCircle,
  CheckCircle2,
  Download,
  Trash2,
  UserPlus,
  Crown,
  User,
  Eye,
} from "lucide-react";

import { useSettingsStore } from "../stores/settingsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useAuthStore } from "../stores/authStore";
import { useOutboxStore } from "../stores/outboxStore";
import { setPwaListeners, applyUpdate } from "../utils/pwaClient";
import type { UpdateMode } from "../stores/settingsStore";

type Role = "owner" | "admin" | "member" | "viewer";
type Member = { userId: string; role: Role };

export default function Settings() {
  const exp = useSettingsStore((s) => s.expiringDays);
  const size = useSettingsStore((s) => s.pageSize);
  const mode = useSettingsStore((s) => s.updateMode);
  const setExp = useSettingsStore((s) => s.setExpiringDays);
  const setSize = useSettingsStore((s) => s.setPageSize);
  const setMode = useSettingsStore((s) => s.setUpdateMode);

  // Outbox 상태
  const outboxJobs = useOutboxStore((s) => s.jobs);
  const isSyncing = useOutboxStore((s) => s.isSyncing);
  const lastSyncAt = useOutboxStore((s) => s.lastSyncAt);

  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // 워크스페이스 정보 가져오기 (수정된 스토어 구조 반영)
  // const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId); // currentId → currentWorkspaceId
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentId = useWorkspaceStore((s) => s.currentId); // currentWorkspaceId → currentId
  const workspace = workspaces.find((w: any) => w.id === currentId) || null;
  const members: Member[] = workspace?.members || [];
  const user = useAuthStore((s) => s.user);

  // 현재 사용자의 역할 확인
  const currentUserRole = members.find((m) => m.userId === user?.id)?.role;
  const isOwnerOrAdmin =
    currentUserRole === "owner" || currentUserRole === "admin";

  // 워크스페이스 오너 찾기
  const workspaceOwner = members.find((m) => m.role === "owner");

  useEffect(() => {
    setPwaListeners({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
  }, []);

  const tabs = [
    { id: "general", label: "일반", icon: Settings2 },
    { id: "notifications", label: "알림", icon: Bell },
    { id: "data", label: "데이터", icon: Database },
    ...(workspace ? [{ id: "members", label: "멤버", icon: Users }] : []),
  ];

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "admin":
        return <User className="w-4 h-4 text-blue-600" />; // Shield 대신 User 사용
      case "member":
        return <User className="w-4 h-4 text-green-600" />;
      case "viewer":
        return <Eye className="w-4 h-4 text-gray-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case "owner":
        return "오너";
      case "admin":
        return "관리자";
      case "member":
        return "멤버";
      case "viewer":
        return "뷰어";
      default:
        return "사용자";
    }
  };

  // 타입 안전한 핸들러
  const handleUpdateModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as UpdateMode;
    if (value === "auto" || value === "manual" || value === "prompt") {
      setMode(value);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
        <p className="text-gray-600">애플리케이션 설정을 관리하세요</p>
      </div>

      {/* 알림 배너 */}
      {needRefresh && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Download className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-900">
                앱 업데이트 사용 가능
              </h3>
              <p className="text-sm text-blue-700">
                새로운 버전이 준비되었습니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => applyUpdate()} // 이벤트 핸들러 수정
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            업데이트
          </button>
        </div>
      )}

      {offlineReady && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
          <div>
            <h3 className="font-semibold text-green-900">오프라인 준비 완료</h3>
            <p className="text-sm text-green-700">
              이제 오프라인에서도 앱을 사용할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="border-b border-gray-100">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 탭 내용 */}
        <div className="p-6">
          {activeTab === "general" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <List className="w-5 h-5 mr-2" />
                  페이지 설정
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      페이지당 항목 수
                    </label>
                    <select
                      value={size}
                      onChange={(e) => setSize(Number(e.target.value))}
                      className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10개</option>
                      <option value={20}>20개</option>
                      <option value={50}>50개</option>
                      <option value={100}>100개</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      업데이트 모드
                    </label>
                    <select
                      value={mode}
                      onChange={handleUpdateModeChange} // ✅ 타입 안전한 핸들러
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="auto">자동 업데이트</option>
                      <option value="manual">수동 업데이트</option>
                      <option value="prompt">업데이트 확인</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  유통기한 알림
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      유통기한 임박 경고 (일)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={exp}
                        onChange={(e) => setExp(Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-500">
                        이 기간 내에 만료되는 상품에 대해 경고를 표시합니다
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Cloud className="w-5 h-5 mr-2" />
                  동기화 상태
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      동기화 상태
                    </span>
                    <div className="flex items-center">
                      {isSyncing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          <span className="text-sm text-blue-600">
                            동기화 중
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm text-green-600">완료</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      대기 중인 작업
                    </span>
                    <span className="text-sm text-gray-600">
                      {outboxJobs.length}개
                    </span>
                  </div>

                  {lastSyncAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        마지막 동기화
                      </span>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(lastSyncAt).toLocaleString("ko-KR")}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {outboxJobs.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    대기 중인 작업
                  </h4>
                  <div className="bg-yellow-50 rounded-lg border border-yellow-200">
                    {outboxJobs.slice(0, 5).map((job, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border-b border-yellow-200 last:border-b-0"
                      >
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="text-sm font-medium text-yellow-900">
                            {(job as any).type || "알 수 없는 작업"}{" "}
                            {/* job.type 수정 */}
                          </span>
                        </div>
                        <span className="text-xs text-yellow-700">
                          {new Date((job as any).createdAt || 0).toLocaleString(
                            "ko-KR"
                          )}
                        </span>
                      </div>
                    ))}
                    {outboxJobs.length > 5 && (
                      <div className="p-3 text-center text-sm text-yellow-700">
                        그 외 {outboxJobs.length - 5}개 작업 더...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "members" && workspace && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    워크스페이스 멤버
                  </h3>
                  {isOwnerOrAdmin && (
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <UserPlus className="w-4 h-4 mr-2" />
                      멤버 초대
                    </button>
                  )}
                </div>

                {/* 워크스페이스 정보 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        {workspace.name}
                      </h4>
                      {workspace.description && (
                        <p className="text-sm text-blue-700 mt-1">
                          {workspace.description}
                        </p>
                      )}
                      {workspaceOwner && (
                        <p className="text-sm text-blue-600 mt-2">
                          <Crown className="w-4 h-4 inline mr-1" />
                          오너: {workspaceOwner.userId}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-blue-700">
                        멤버 {members.length}명
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-gray-700">
                      <span>사용자</span>
                      <span>역할</span>
                      <span className="text-right">작업</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {members.map((member, index) => (
                      <div key={index} className="px-6 py-4">
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">
                                {member.userId}
                              </span>
                              {user?.id === member.userId && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  나
                                </span>
                              )}
                              {member.userId === workspaceOwner?.userId && (
                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                  오너
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {getRoleIcon(member.role)}
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {getRoleLabel(member.role)}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            {isOwnerOrAdmin &&
                              user?.id !== member.userId &&
                              member.userId !== workspaceOwner?.userId && (
                                <button className="flex items-center px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  제거
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
