import { type ReactNode } from "react";

import { HeaderTabs } from "./headerTabs";

type Props = {
  children: ReactNode;
};

export const Layout = ({ children }: Props) => (
  <>
    <HeaderTabs />
    <div className="mx-auto min-h-screen bg-white p-4">{children}</div>
  </>
);
