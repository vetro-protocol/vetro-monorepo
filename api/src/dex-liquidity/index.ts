import { createMainnetClient } from "@vetro-protocol/core";

import {
  fulfilledValues,
  throwIfAllRejected,
  withTimeout,
} from "../utils/promises.ts";

import { getBrownfiPools } from "./brownfi.ts";
import { getCurvePools } from "./curve.ts";
import { addIncentives, getIncentiveSources } from "./incentives.ts";
import { getSushiPools } from "./sushi.ts";
import { getUniswapPools } from "./uniswap.ts";

const getVenuePools = async function ({
  nowSeconds,
  rpcUrl,
  subgraphApiKey,
}: {
  nowSeconds: number;
  rpcUrl: string | undefined;
  subgraphApiKey: string | undefined;
}) {
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
};

export async function getDexPools({
  rpcUrl,
  subgraphApiKey,
}: {
  rpcUrl: string | undefined;
  subgraphApiKey: string | undefined;
}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const pools = getVenuePools({ nowSeconds, rpcUrl, subgraphApiKey });
  const [discovered, sources] = await Promise.all([
    pools,
    getIncentiveSources({ nowSeconds, pools }),
  ]);
  return discovered.map((pool) => addIncentives({ nowSeconds, pool, sources }));
}
