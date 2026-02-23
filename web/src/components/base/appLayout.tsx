import type { ReactNode } from "react";

import "react-loading-skeleton/dist/skeleton.css";

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex h-full flex-col overflow-y-auto *:mx-auto *:w-[calc(100%-2rem)] md:*:w-[calc(100%-6rem)] xl:*:w-5xl">
    <main className="border-x border-gray-200">{children}</main>
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
