// src/layouts/AppLayout.tsx
import RootLayout from "../components/RootLayout";

// 프로젝트 내 일부 코드가 AppLayout을 참조할 수 있어 RootLayout을 래핑 제공
export default function AppLayout() {
  return <RootLayout />;
}
