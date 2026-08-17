import {
  type Chain,
  createPublicClient,
  type FallbackTransport,
  type HttpTransport,
  type PublicClient,
} from "viem";

import { createRpcTransport } from "./createRpcTransport.ts";

/**
 * Create a viem public client for a chain, with the transport and the batching
 * options every Vetro client shares. The caller decides which RPC endpoints the
 * chain carries; see `createMainnetClient` to take them from an env var.
 */
export const createChainClient = (
  chain: Chain,
): PublicClient<FallbackTransport | HttpTransport, Chain> =>
  createPublicClient({
    batch: { multicall: true },
    chain,
    transport: createRpcTransport(chain),
  });
