import { gatewayAddresses } from "@vetro-protocol/gateway";
import type { Address } from "viem";

import {
  getCollateralizationRatio,
  getStaked,
  getTreasuryComposition,
  getTvl,
} from "./analytics.ts";
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

// Warms `GET /analytics/collateralization-ratio/:gatewayAddress`
export const collateralizationRatioTask: WarmTask<Address> = {
  cron: "*/5 * * * *",
  items: gatewayAddresses,
  key: (gatewayAddress) =>
    `analytics:collateralization-ratio:${gatewayAddress}`,
  produce: (gatewayAddress, env) =>
    getCollateralizationRatio({
      gatewayAddress,
      url: env.CUSTOM_RPC_URL_MAINNET,
    }).then(convertBigIntsToString),
};

// Warms `GET /analytics/tvl/:gatewayAddress`
export const tvlTask: WarmTask<Address> = {
  cron: "* * * * *",
  items: gatewayAddresses,
  key: (gatewayAddress) => `analytics:tvl:${gatewayAddress}`,
  produce: (gatewayAddress, env) =>
    getTvl({
      gatewayAddress,
      url: env.CUSTOM_RPC_URL_MAINNET,
    }).then(convertBigIntsToString),
};

// Warms `GET /analytics/staked/:gatewayAddress`
export const stakedTask: WarmTask<Address> = {
  cron: "* * * * *",
  items: gatewayAddresses,
  key: (gatewayAddress) => `analytics:staked:${gatewayAddress}`,
  produce: (gatewayAddress, env) =>
    getStaked({
      gatewayAddress,
      url: env.CUSTOM_RPC_URL_MAINNET,
    }).then(convertBigIntsToString),
};

export const warmTasks = [
  treasuryTask,
  collateralizationRatioTask,
  tvlTask,
  stakedTask,
];
