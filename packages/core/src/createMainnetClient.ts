import {
  type Chain,
  createPublicClient,
  type FallbackTransport,
  type HttpTransport,
  type PublicClient,
} from "viem";
import { mainnet } from "viem/chains";

import { createRpcTransport } from "./createRpcTransport.ts";
import { updateRpcUrls } from "./utils/updateRpcUrls.ts";

/**
 * Create a viem public client for Ethereum mainnet from the given RPC URL
 * config. See `updateRpcUrls` for the accepted formats, and
 * `createRpcTransport` for how they become a transport.
 */
export const createMainnetClient = function (
  rpcUrl: string | undefined,
): PublicClient<FallbackTransport | HttpTransport, Chain> {
  const chain = updateRpcUrls(mainnet, rpcUrl);
  return createPublicClient({
    batch: { multicall: true },
    chain,
    transport: createRpcTransport(chain),
  });
};
