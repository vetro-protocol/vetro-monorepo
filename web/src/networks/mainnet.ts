import { mainnet as mainnetDefinition } from "viem/chains";

import { updateRpcUrls } from "./updateRpcUrls";

export const mainnet = updateRpcUrls(
  mainnetDefinition,
  import.meta.env.VITE_RPC_URL_MAINNET,
);
