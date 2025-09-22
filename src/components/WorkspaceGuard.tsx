// src/components/WorkspaceGuard.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceInit } from "../hooks/useWorkspaceInit";
import { Package, Loader2 } from "lucide-react";

interface WorkspaceGuardProps {
  children: React.ReactNode;
}

export const WorkspaceGuard = ({ children }: WorkspaceGuardProps) => {
  const navigate = useNavigate();
  const { isLoading, isReady, needsWorkspaceSetup, currentWorkspace } =
    useWorkspaceInit();

  useEffect(() => {
    if (needsWorkspaceSetup) {
      navigate("/setup-workspace");
    }
  }, [needsWorkspaceSetup, navigate]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              워크스페이스 설정 중
            </h2>
            <p className="text-gray-600">잠시만 기다려주세요...</p>
          </div>
        </div>
      </div>
    );
  }

  // 워크스페이스 준비 안됨
  if (!isReady || !currentWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex items-center justify-center w-20 h-20 mx-auto bg-orange-100 rounded-full">
            <Package className="w-10 h-10 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              워크스페이스가 필요합니다
            </h2>
            <p className="text-gray-600 mt-2">
              재고 관리를 시작하려면 워크스페이스를 설정해야 합니다.
            </p>
          </div>
          <button
            onClick={() => navigate("/setup-workspace")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            워크스페이스 설정하기
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
