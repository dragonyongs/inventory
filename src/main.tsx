// src/main.tsx - 기존 App.tsx 구조 유지
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // ✅ 기존 App.tsx 사용
import "./index.css";

// PWA 등록 함수 (프로덕션에서만)
const registerPWA = async () => {
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("✅ PWA Service Worker 등록 성공:", registration);
    } catch (error) {
      console.error("❌ PWA Service Worker 등록 실패:", error);
    }
  } else {
    console.log("🔧 개발 모드: PWA Service Worker 비활성화");
  }
};

// 전역 에러 핸들러
window.addEventListener("error", (event) => {
  console.error("❌ 전역 에러:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("❌ 처리되지 않은 Promise 거부:", event.reason);
});

// React 앱 초기화
const initApp = async () => {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error("❌ Root element를 찾을 수 없습니다");
  }

  const root = createRoot(container);

  // ✅ 기존 App.tsx 구조 유지 (StrictMode는 App에서 처리)
  root.render(<App />);
  console.log("🚀 앱 시작");

  // 프로덕션에서만 PWA 등록
  if (import.meta.env.PROD) {
    await registerPWA();
  }
};

// 앱 초기화 실행
initApp().catch((error) => {
  console.error("❌ 앱 초기화 실패:", error);

  // fallback UI 표시
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
      <div style="text-align: center;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">앱 로딩 실패</h1>
        <p style="color: #6b7280; margin-bottom: 1rem;">애플리케이션을 불러올 수 없습니다.</p>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
          새로고침
        </button>
      </div>
    </div>
  `;
});
