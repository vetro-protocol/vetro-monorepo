import type { Client } from "viem";

import {
  getCurrentRate,
  getEpochId,
  getMaxRequestDeposit,
  pendingDepositRequest,
} from "./actions/public/index.js";

export { targetYieldEarnVaultAbi } from "./abi/targetYieldEarnVaultAbi.js";

export {
  maxExitWindowSeconds,
  minEpochDurationSeconds,
  minExitWindowSeconds,
} from "./constants.js";

// Export factory functions for .extend() pattern
export const targetYieldEarnPublicActions = () => (client: Client) => ({
  getCurrentRate: (params: Parameters<typeof getCurrentRate>[1]) =>
    getCurrentRate(client, params),
  getEpochId: (params: Parameters<typeof getEpochId>[1]) =>
    getEpochId(client, params),
  getMaxRequestDeposit: (params: Parameters<typeof getMaxRequestDeposit>[1]) =>
    getMaxRequestDeposit(client, params),
  pendingDepositRequest: (
    params: Parameters<typeof pendingDepositRequest>[1],
  ) => pendingDepositRequest(client, params),
});
