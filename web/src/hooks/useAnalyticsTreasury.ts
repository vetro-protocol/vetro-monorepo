import { useQuery } from "@tanstack/react-query";
import type { TreasuryToken } from "pages/analytics/types";

// Mock data matching the shape of GET /analytics/treasury.
// Will be replaced by the actual API call in a future PR.
const mockData: TreasuryToken[] = [
  {
    activeStrategies: [
      { name: "Morpho SkyMoney USDT Savings", totalDebt: "37500000000000" },
      { name: "Aave USDT", totalDebt: "0" },
    ],
    latestPrice: "100010000",
    tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    totalDebt: "37500000000000",
    withdrawable: "37500000000000",
  },
  {
    activeStrategies: [
      { name: "Morpho AlphaPing USDC Core", totalDebt: "37500000000000" },
    ],
    latestPrice: "99991000",
    tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    totalDebt: "37500000000000",
    withdrawable: "37500000000000",
  },
  {
    activeStrategies: [
      {
        name: "Summer.fi DAI Savings",
        totalDebt: "37500000000000000000000000",
      },
      { name: "Compound DAI", totalDebt: "0" },
    ],
    latestPrice: "100000000",
    tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    totalDebt: "37500000000000000000000000",
    withdrawable: "37500000000000000000000000",
  },
  {
    activeStrategies: [{ name: "Morpho HemiBTC CDPs", totalDebt: "125000000" }],
    latestPrice: "10000000000000",
    tokenAddress: "0x06ea695B91700071B161A434fED42D1DcbAD9f00",
    totalDebt: "125000000",
    withdrawable: "125000000",
  },
];

export const useAnalyticsTreasury = () =>
  useQuery({
    queryFn: () =>
      new Promise<TreasuryToken[]>((resolve) =>
        setTimeout(() => resolve(mockData), 2000),
      ),
    queryKey: ["analytics-treasury"],
  });
