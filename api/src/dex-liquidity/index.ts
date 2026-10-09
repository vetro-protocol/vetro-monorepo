import { createMainnetClient } from "@vetro-protocol/core";

import { getBrownfiPools } from "./brownfi.ts";
import { getCurvePools } from "./curve.ts";
import { getSushiPools } from "./sushi.ts";
import type { Pool } from "./types.ts";
import { getUniswapPools } from "./uniswap.ts";

type VenueArgs = {
  nowSeconds: number;
  rpcUrl: string | undefined;
  subgraphApiKey: string | undefined;
};

const venuePools = {
  brownfi: ({ nowSeconds, subgraphApiKey }: VenueArgs) =>
    getBrownfiPools({ nowSeconds, subgraphApiKey }),
  curve: () => getCurvePools(),
  sushi: ({ nowSeconds, rpcUrl, subgraphApiKey }: VenueArgs) =>
    getSushiPools({
      client: createMainnetClient(rpcUrl),
      nowSeconds,
      subgraphApiKey,
    }),
  uniswap: ({ rpcUrl }: VenueArgs) =>
    getUniswapPools(createMainnetClient(rpcUrl)),
} satisfies Record<string, (args: VenueArgs) => Promise<Pool[]>>;

export const venues = Object.keys(venuePools) as (keyof typeof venuePools)[];

export const getVenuePools = ({
  venue,
  ...args
}: VenueArgs & { venue: keyof typeof venuePools }): Promise<Pool[]> =>
  venuePools[venue](args);
