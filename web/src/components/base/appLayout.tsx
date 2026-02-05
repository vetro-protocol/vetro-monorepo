import type { ReactNode } from "react";

import "react-loading-skeleton/dist/skeleton.css";

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex h-full border-t border-gray-200">
    <main className="mx-auto w-5xl border-x border-gray-200">{children}</main>
  </div>
);
