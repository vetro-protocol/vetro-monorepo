import type { Client, WalletClient } from "viem";

import { approvalRequired } from "./actions/public/approvalRequired.ts";
import { quoteSend } from "./actions/public/quoteSend.ts";
import { token } from "./actions/public/token.ts";
import { send } from "./actions/wallet/send.ts";
import type { SendParams } from "./types.ts";

// Export ABI
export { oftAbi } from "./abi/oftAbi.ts";

// Export types
export type { SendEvents } from "./types.ts";

// Export encoders
export { encodeSend } from "./actions/wallet/send.ts";

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
