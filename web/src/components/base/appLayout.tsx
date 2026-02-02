import type { ReactNode } from "react";

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex">
    <main className="mx-auto w-5xl">{children}</main>
  </div>
);
