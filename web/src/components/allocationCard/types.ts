import type { ReactNode } from "react";

// `amount` is used for bar proportions (via CSS flex) and formatted by AllocationLegend.
export type AllocationItem = {
  amount: number;
  color: string;
  details?: ReactNode;
  href?: string;
  label: string;
  logoURI?: string;
  tooltip?: string;
};
