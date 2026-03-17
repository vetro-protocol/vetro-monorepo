import { useQuery } from "@tanstack/react-query";
import type { AllocationItem } from "pages/analytics/types";

type AnalyticsTreasury = {
  items: AllocationItem[];
  value: string;
};

// Mock data — will be replaced by /analytics/treasury API call in a future PR.
//
// items: one entry per unique protocol, grouping activeStrategies by protocol name across all tokens
//   - amount: sum of (strategy.totalDebt / 10^tokenDecimals × latestPrice / 10^8) per protocol
// value: total count of active strategies across all tokens
const mockData: AnalyticsTreasury = {
  items: [
    { amount: 147, color: "bg-emerald-400", label: "Morpho" },
    { amount: 80, color: "bg-blue-400", label: "Aave" },
    { amount: 100, color: "bg-rose-400", label: "Summer.fi" },
    { amount: 64, color: "bg-amber-400", label: "Compound" },
  ],
  value: "8 protocols",
};

export const useAnalyticsTreasury = () =>
  useQuery({
    queryFn: () =>
      new Promise<AnalyticsTreasury>((resolve) =>
        setTimeout(() => resolve(mockData), 2000),
      ),
    queryKey: ["analytics-treasury"],
  });
