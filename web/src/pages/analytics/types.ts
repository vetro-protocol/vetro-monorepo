// Represents a single item in an allocation card's chart and legend.
// `amount` is a pre-computed USD value used for bar proportions (via CSS flex)
// and formatted to compact currency ("$37.5M") by the AllocationLegend component.
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
  tokenAddress: string;
  totalDebt: string;
  withdrawable: string;
};
