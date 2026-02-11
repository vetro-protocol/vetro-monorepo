import { sepolia as sepoliaDefinition } from "viem/chains";

import { updateRpcUrls } from "./updateRpcUrls";

export const sepolia = updateRpcUrls(
  sepoliaDefinition,
  import.meta.env.VITE_RPC_URL_SEPOLIA,
);
