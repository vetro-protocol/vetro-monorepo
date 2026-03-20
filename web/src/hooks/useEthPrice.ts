import { useTokenPrices } from "./useTokenPrices";

export function parseEthPrice(prices: Record<string, string> | undefined) {
  const ethPriceRaw = prices?.ETH;
  const ethPrice =
    typeof ethPriceRaw === "string" ? parseFloat(ethPriceRaw) : NaN;

  if (!Number.isFinite(ethPrice)) {
    throw new Error("Invalid ETH price received from API");
  }

  return ethPrice;
}

export const useEthPrice = () =>
  useTokenPrices({
    select: parseEthPrice,
  });
