import type { ReactNode } from "react";
import { vToken } from "utils/veVetro";

export const VAmountContainer = ({ children }: { children?: ReactNode }) => (
  <span>
    {children} ${vToken.symbol}
  </span>
);
