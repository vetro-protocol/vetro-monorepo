import { mainnet } from "viem/chains";

import { createChainClient } from "./createChainClient.ts";
import { updateRpcUrls } from "./utils/updateRpcUrls.ts";

/**
 * Create a viem public client for Ethereum mainnet, reading the RPC endpoints
 * from an env var value. See `updateRpcUrls` for the accepted formats.
 */
export const createMainnetClient = (rpcUrlEnv: string | undefined) =>
  createChainClient(updateRpcUrls(mainnet, rpcUrlEnv));
