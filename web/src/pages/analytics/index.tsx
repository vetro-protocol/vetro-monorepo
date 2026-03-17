import { PageTitle } from "components/base/pageTitle";
import { useTranslation } from "react-i18next";

import { AllocationCard } from "./components/allocationCard";
import { DatabaseIcon } from "./icons/databaseIcon";
import { PieChartIcon } from "./icons/pieChartIcon";
import type { AllocationItem } from "./types";

// Mock data for UI development. Will be replaced by hooks fetching /analytics/treasury in a future PR.
//
// TVL card:
//   - items: one entry per token in the response
//   - amount: (totalDebt / 10^tokenDecimals) × (latestPrice / 10^8)
//     note: latestPrice has 8 decimal places (e.g. 100010000 = $1.0001)
//     note: tokenDecimals can be looked up from knownTokens (src/utils/tokenList.ts) by tokenAddress;
//           fall back to useTokenInfo for any token not in that list
//   - value: sum of all token USD amounts, formatted as currency
//
// Yield allocation card:
//   - items: one entry per unique protocol, grouping activeStrategies by protocol name across all tokens
//   - amount: sum of (strategy.totalDebt / 10^tokenDecimals × latestPrice / 10^8) per protocol
//   - value: total count of active strategies across all tokens
const tvlItems: AllocationItem[] = [
  { amount: 37_500_000, color: "bg-blue-400", label: "USDT" },
  { amount: 37_500_000, color: "bg-emerald-400", label: "USDC" },
  { amount: 37_500_000, color: "bg-amber-400", label: "DAI" },
  { amount: 12_500_000, color: "bg-rose-400", label: "HemiBTC CDPs" },
];

const yieldItems: AllocationItem[] = [
  { amount: 147, color: "bg-emerald-400", label: "Morpho" },
  { amount: 80, color: "bg-blue-400", label: "Aave" },
  { amount: 100, color: "bg-rose-400", label: "Summer.fi" },
  { amount: 64, color: "bg-amber-400", label: "Compound" },
];

export const Analytics = function () {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <PageTitle value={t("pages.analytics.title")} />
      <div className="flex flex-col border-t border-gray-200 md:flex-row md:divide-x md:divide-gray-200">
        <AllocationCard
          icon={<DatabaseIcon />}
          items={tvlItems}
          label={t("pages.analytics.tvl-label")}
          // Mock value — will be derived from /analytics/treasury in a future PR
          value="$125,000,000.00"
        />
        <AllocationCard
          icon={<PieChartIcon />}
          items={yieldItems}
          label={t("pages.analytics.yield-label")}
          // Mock value — will be derived from /analytics/treasury in a future PR
          value="8 protocols"
        />
      </div>
    </div>
  );
};
