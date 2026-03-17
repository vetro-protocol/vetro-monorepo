// Represents a single item in an allocation card's chart and legend.
// `amount` is a pre-computed USD value used for bar proportions (via CSS flex)
// and formatted to compact currency ("$37.5M") by the AllocationLegend component.
// Raw API data (bigint strings from /analytics/treasury) will be transformed
// into this shape by dedicated hooks in future PRs.
export type AllocationItem = {
  amount: number;
  color: string;
  label: string;
};
