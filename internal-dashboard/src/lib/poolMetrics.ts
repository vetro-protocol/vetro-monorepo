import { formatUnits } from "viem";

import { type PoolCoin } from "./types";

export const poolTvlUsd = function (coins: PoolCoin[]) {
  let total = 0;
  for (const coin of coins) {
    if (coin.usdPrice === undefined) {
      return undefined;
    }
    total += Number(formatUnits(coin.balance, coin.decimals)) * coin.usdPrice;
  }
  return total;
};
