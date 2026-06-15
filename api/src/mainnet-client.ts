import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

/**
 * Create a viem public client for Ethereum mainnet using the given RPC URL.
 * When `rpcUrl` is undefined, viem falls back to the chain's default RPC.
 */
export const createMainnetClient = (rpcUrl: string | undefined) =>
  createPublicClient({ chain: mainnet, transport: http(rpcUrl) });
