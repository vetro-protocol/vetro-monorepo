import type { ReactNode } from "react";

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="font-geist flex min-h-screen flex-col bg-gray-50">
    {children}
  </div>
);
