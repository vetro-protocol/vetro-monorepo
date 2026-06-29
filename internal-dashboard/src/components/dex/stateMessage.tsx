import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const StateMessage = ({ children }: Props) => (
  <p className="py-12 text-center text-sm font-medium text-neutral-600">
    {children}
  </p>
);
