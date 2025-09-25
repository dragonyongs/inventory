// src/App.tsx - 기존 구조 유지하되 개선
import { StrictMode } from "react";
import { AppRouter } from "./app/router";

export default function App() {
  return (
    // ✅ 개발 환경에서만 StrictMode 비활성화 (PWA 문제 방지)
    import.meta.env.DEV ? (
      <AppRouter />
    ) : (
      <StrictMode>
        <AppRouter />
      </StrictMode>
    )
  );
}
