// src/App.tsx
import React from "react";
import { AppRouter } from "./app/router";

export default function App() {
  // 개발 환경에서 StrictMode 이중 마운트가 문제가 되면 조건부로 끈다
  return import.meta.env.DEV ? (
    <AppRouter />
  ) : (
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
}
