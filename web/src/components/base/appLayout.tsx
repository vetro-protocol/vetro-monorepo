import type { ReactNode } from "react";

import "react-loading-skeleton/dist/skeleton.css";

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex">
    <main className="mx-auto w-5xl">{children}</main>
  </div>
);
