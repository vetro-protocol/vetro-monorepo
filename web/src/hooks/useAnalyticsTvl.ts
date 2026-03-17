import { useQuery } from "@tanstack/react-query";
import type { AllocationItem } from "pages/analytics/types";

type AnalyticsTvl = {
  items: AllocationItem[];
  value: string;
};

// Mock data — will be replaced by /analytics/treasury API call in a future PR.
//
// items: one entry per token in the response
//   - amount: (totalDebt / 10^tokenDecimals) × (latestPrice / 10^8)
//     note: latestPrice has 8 decimal places (e.g. 100010000 = $1.0001)
//     note: tokenDecimals can be looked up from knownTokens (src/utils/tokenList.ts) by tokenAddress;
//           fall back to useTokenInfo for any token not in that list
// value: sum of all token USD amounts, formatted as currency
const mockData: AnalyticsTvl = {
  items: [
    { amount: 37_500_000, color: "bg-blue-400", label: "USDT" },
    { amount: 37_500_000, color: "bg-emerald-400", label: "USDC" },
    { amount: 37_500_000, color: "bg-amber-400", label: "DAI" },
    { amount: 12_500_000, color: "bg-rose-400", label: "HemiBTC CDPs" },
  ],
  value: "$125,000,000.00",
};

export const useAnalyticsTvl = () =>
  useQuery({
    queryFn: () =>
      new Promise<AnalyticsTvl>((resolve) =>
        setTimeout(() => resolve(mockData), 2000),
      ),
    queryKey: ["analytics-tvl"],
  });
