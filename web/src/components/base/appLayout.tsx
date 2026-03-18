import type { ReactNode } from "react";
import { useLocation } from "react-router";

import "react-loading-skeleton/dist/skeleton.css";

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col overflow-y-auto *:mx-auto *:w-[calc(100%-2rem)] md:*:w-[calc(100%-6rem)] xl:*:w-5xl">
      <main className="animate-page-in border-x border-gray-200" key={pathname}>
        {children}
      </main>
      <div className="relative border-x border-gray-200 pt-18">
        <img alt="" src="/pageBackground.svg" />
        <img
          alt=""
          className="absolute right-0 bottom-0 left-0"
          src="/squareDotsBackground.svg"
        />
      </div>
    </div>
  );
}
