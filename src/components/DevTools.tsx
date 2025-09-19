// src/components/DevTools.tsx
import { useState } from "react";
import { Trash2, Wrench, AlertTriangle } from "lucide-react";

const clearDevCache = async () => {
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

    // 완전 새로고침
    window.location.reload();
  } catch (error) {
    console.error("Failed to clear cache:", error);
    alert("캐시 클리어에 실패했습니다.");
  }
};

export const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="개발 도구"
      >
        <Wrench className="w-5 h-5" />
      </button>

      {/* 개발 도구 패널 */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            개발 도구
          </h3>

          {/* 캐시 관리 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-yellow-600" />
              캐시 관리
            </h4>
            <button
              onClick={clearDevCache}
              className="w-full flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              캐시 클리어 & 새로고침
            </button>
            <p className="text-xs text-gray-500 mt-1">
              PWA 캐시와 브라우저 캐시를 모두 클리어합니다
            </p>
          </div>

          {/* 추가 정보 */}
          <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
            <p>개발 모드에서만 표시됩니다</p>
            <p>Google OAuth 로그인 상태는 유지됩니다</p>
          </div>
        </div>
      )}
    </div>
  );
};
