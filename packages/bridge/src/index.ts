import type { Client, WalletClient } from "viem";

import { approvalRequired } from "./actions/public/approvalRequired.js";
import { quoteSend } from "./actions/public/quoteSend.js";
import { token } from "./actions/public/token.js";
import { send } from "./actions/wallet/send.js";
import type { SendParams } from "./types.js";

// Export ABI
export { oftAbi } from "./abi/oftAbi.js";

// Export types
export type { SendEvents } from "./types.js";

// Export encoders
export { encodeSend } from "./actions/wallet/send.js";

// Export factory functions for .extend() pattern
export const bridgePublicActions = () => (client: Client) => ({
  approvalRequired: (params: Parameters<typeof approvalRequired>[1]) =>
    approvalRequired(client, params),
  quoteSend: (params: Parameters<typeof quoteSend>[1]) =>
    quoteSend(client, params),
  token: (params: Parameters<typeof token>[1]) => token(client, params),
});

export const bridgeWalletActions = () => (client: WalletClient) => ({
  send: (params: SendParams) => send(client, params),
});
