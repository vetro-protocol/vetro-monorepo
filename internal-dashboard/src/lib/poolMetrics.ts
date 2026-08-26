import { formatUnits } from "viem";

import { type PoolCoin } from "./types";

export const poolTvlUsd = (coins: PoolCoin[]) =>
  coins.reduce(
    (sum, coin) =>
      sum + Number(formatUnits(coin.balance, coin.decimals)) * coin.usdPrice,
    0,
  );
