import { gatewayAddresses } from "@vetro-protocol/gateway";
import type { Address } from "viem";

import { getTreasuryComposition } from "./analytics.ts";
import { convertBigIntsToString } from "./convert-bigints-to-string.ts";
import type { WarmTask } from "./warm-cache.ts";

// Warms `GET /analytics/treasury/:gatewayAddress`
export const treasuryTask: WarmTask<Address> = {
  cron: "* * * * *",
  items: gatewayAddresses,
  key: (gatewayAddress) => `analytics:treasury:${gatewayAddress}`,
  produce: (gatewayAddress, env) =>
    getTreasuryComposition({
      gatewayAddress,
      url: env.CUSTOM_RPC_URL_MAINNET,
    }).then(convertBigIntsToString),
};

export const warmTasks = [treasuryTask];
