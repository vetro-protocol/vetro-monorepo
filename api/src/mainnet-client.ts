import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

/**
 * Create a viem public client for Ethereum mainnet using the given RPC URL.
 * When `rpcUrl` is undefined, viem falls back to the chain's default RPC.
 *
 * `batch.multicall` aggregates contract reads issued in the same tick into a
 * single `eth_call` to Multicall3, and `http({ batch: true })` packs any
 * remaining concurrent calls into one JSON-RPC request. Together they collapse
 * the many reads each analytics endpoint makes into a handful of round trips.
 */
export const createMainnetClient = (rpcUrl: string | undefined) =>
  createPublicClient({
    batch: { multicall: true },
    chain: mainnet,
    transport: http(rpcUrl, { batch: true }),
  });
