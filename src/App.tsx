// src/App.tsx
import { StrictMode } from "react";
import AppRouter from "./app/router";

export default function App() {
  return (
    <StrictMode>
      <AppRouter />
    </StrictMode>
  );
}
