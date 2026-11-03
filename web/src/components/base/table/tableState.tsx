import type { ReactNode } from "react";

export const TableState = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center justify-center border-b border-gray-200 bg-white px-8 py-12">
    {children}
  </div>
);
