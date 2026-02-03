import { useWalletClient } from "wagmi";

import { useMainnet } from "./useMainnet";

export const useEthereumWalletClient = () =>
  useWalletClient({ chainId: useMainnet().id });
