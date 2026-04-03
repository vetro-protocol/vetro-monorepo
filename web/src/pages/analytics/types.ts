// Represents a single item in an allocation card's chart and legend.
// `amount` is used for bar proportions (via CSS flex) and formatted by AllocationLegend.
export type AllocationItem = {
  amount: number;
  color: string;
  label: string;
  logoURI?: string;
  tooltip?: string;
};

// Raw response shape from GET /analytics/treasury.
export type TreasuryToken = {
  activeStrategies: { name: string; totalDebt: string }[];
  latestPrice: string;
  priceDecimals: number;
  tokenAddress: string;
  totalDebt: string;
  withdrawable: string;
};
