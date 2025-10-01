// src/components/AuthLayout.tsx
import React from "react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-screen grid place-items-center bg-gray-50 px-4">
      {children}
    </main>
  );
}
