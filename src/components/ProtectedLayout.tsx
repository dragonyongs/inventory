// src/components/ProtectedLayout.tsx
import { AuthGuard } from "./AuthGuard";
import { RootLayout } from "./RootLayout";

export function ProtectedLayout() {
  return (
    <AuthGuard>
      <RootLayout />
    </AuthGuard>
  );
}
