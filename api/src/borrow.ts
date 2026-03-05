import * as morpho from "./morpho.ts";
import { vusdAddress } from "./vusd.ts";

// List of whitelisted Morpho market ids, mostly for testing purposes.
export const whitelistedMarketIds = [
  "0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49", // WBTC/USDC
];

/**
 * Validates the given market id by checking it is a valid market and that its
 * loan asset is either VUSD or the market is whitelisted.
 */
export async function validateMarketId({
  marketId,
}: {
  marketId: string;
}): Promise<boolean> {
  const loanAssetAddress = await morpho.getLoanAssetAddress({
    marketId,
  });
  if (loanAssetAddress === vusdAddress) {
    return true;
  }
  if (whitelistedMarketIds.includes(marketId)) {
    return true;
  }
  return false;
}

/* eslint-disable sort-keys */
const periodsToIntervalMap: Record<
  string,
  {
    interval: string;
    startOffset: number;
  }
> = {
  "1w": {
    interval: "HOUR",
    startOffset: 604800, // 7 * 24 * 60 * 60
  },
  "1m": {
    interval: "DAY",
    startOffset: 2592000, // 30 * 24 * 60 * 60
  },
  "3m": {
    interval: "DAY",
    startOffset: 7776000, // 90 * 24 * 60 * 60
  },
  "1y": {
    interval: "WEEK",
    startOffset: 31449600, // 52 * 7 * 24 * 60 * 60
  },
};
/* eslint-enable sort-keys */

export const validPeriods = Object.keys(periodsToIntervalMap);

/**
 * Obtains the historical borrow APY for a given market and period, then
 * converting the APY to APR using continuous compounding. Timestamps are
 * returned in milliseconds as it is the standard in JavaScript.
 */
export async function getAprHistory({
  marketId,
  period,
}: {
  marketId: string;
  period: string;
}): Promise<
  {
    apr: number;
    timestamp: number;
  }[]
> {
  const { interval, startOffset } = periodsToIntervalMap[period];
  const startTimestamp = Math.floor(Date.now() / 1000) - startOffset;
  const data = await morpho.getHistoricalBorrowApy({
    interval,
    marketId,
    startTimestamp,
  });
  return data.map(({ x, y }) => ({
    apr: Math.log(1 + y), // Convert APY to APR using continuous compounding
    timestamp: x * 1000,
  }));
}
