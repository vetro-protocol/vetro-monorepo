import { arbitrum, base, bsc, hemi, optimism } from "viem/chains";

import { mainnet } from "./mainnet";

export const allChains = [
  mainnet,
  hemi,
  arbitrum,
  base,
  optimism,
  bsc,
] as const;
