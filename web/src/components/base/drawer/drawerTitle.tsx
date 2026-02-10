import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const DrawerTitle = ({ children }: Props) => (
  <h3 className="px-6 py-8 text-gray-900">{children}</h3>
);
