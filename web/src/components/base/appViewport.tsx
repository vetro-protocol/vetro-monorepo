import type { ReactNode } from "react";

export const AppViewport = ({ children }: { children: ReactNode }) => (
  <div className="font-geist flex h-dvh flex-col bg-gray-50">{children}</div>
);
