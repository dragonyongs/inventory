// src/components/AppLayout.tsx
import { WorkspaceGuard } from "./WorkspaceGuard";
import { RootLayout } from "./RootLayout";

export function AppLayout() {
  return (
    <WorkspaceGuard>
      <RootLayout />
    </WorkspaceGuard>
  );
}
