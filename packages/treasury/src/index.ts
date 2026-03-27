import type { Client } from "viem";

import {
  getPrice,
  getTokenConfig,
  getWhitelistedTokens,
  getWithdrawable,
} from "./actions/public/index.js";

// Export ABI
export { treasuryAbi } from "./abi/treasuryAbi.js";

// Export factory function for .extend() pattern
export const treasuryPublicActions = () => (client: Client) => ({
  getPrice: (params: Parameters<typeof getPrice>[1]) =>
    getPrice(client, params),
  getTokenConfig: (params: Parameters<typeof getTokenConfig>[1]) =>
    getTokenConfig(client, params),
  getWhitelistedTokens: (params: Parameters<typeof getWhitelistedTokens>[1]) =>
    getWhitelistedTokens(client, params),
  getWithdrawable: (params: Parameters<typeof getWithdrawable>[1]) =>
    getWithdrawable(client, params),
});
