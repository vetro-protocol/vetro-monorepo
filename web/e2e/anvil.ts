import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export const ANVIL_PORT = 8545;
export const ANVIL_URL = `http://127.0.0.1:${ANVIL_PORT}`;

// A viem public client pointed at the local Anvil mainnet fork.
export const createEthereumClient = () =>
  createPublicClient({ chain: mainnet, transport: http(ANVIL_URL) });
