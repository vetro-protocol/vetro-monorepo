import { createMainnetClient } from "@vetro-protocol/core";

import {
  fulfilledValues,
  throwIfAllRejected,
  withTimeout,
} from "../utils/promises.ts";

import { getBrownfiPools } from "./brownfi.ts";
import { getCurvePools } from "./curve.ts";
import { getSushiPools } from "./sushi.ts";
import { getUniswapPools } from "./uniswap.ts";

export async function getDexPools({
  rpcUrl,
  subgraphApiKey,
}: {
  rpcUrl: string | undefined;
  subgraphApiKey: string | undefined;
}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const client = createMainnetClient(rpcUrl);
  const results = await Promise.allSettled(
    [
      getBrownfiPools({ nowSeconds, subgraphApiKey }),
      getCurvePools(),
      getSushiPools({ client, nowSeconds, subgraphApiKey }),
      getUniswapPools(client),
    ].map(withTimeout),
  );
  throwIfAllRejected(results);
  return fulfilledValues(results).flat();
}
