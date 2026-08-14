import type { Client } from "viem";

import {
  getKeeperRole,
  getPrice,
  getTokenConfig,
  getWhitelistedTokens,
  getWithdrawable,
} from "./actions/public/index.ts";

// Export ABI
export { treasuryAbi } from "./abi/treasuryAbi.ts";

// Export factory function for .extend() pattern
export const treasuryPublicActions = () => (client: Client) => ({
  getKeeperRole: (params: Parameters<typeof getKeeperRole>[1]) =>
    getKeeperRole(client, params),
  getPrice: (params: Parameters<typeof getPrice>[1]) =>
    getPrice(client, params),
  getTokenConfig: (params: Parameters<typeof getTokenConfig>[1]) =>
    getTokenConfig(client, params),
  getWhitelistedTokens: (params: Parameters<typeof getWhitelistedTokens>[1]) =>
    getWhitelistedTokens(client, params),
  getWithdrawable: (params: Parameters<typeof getWithdrawable>[1]) =>
    getWithdrawable(client, params),
});
