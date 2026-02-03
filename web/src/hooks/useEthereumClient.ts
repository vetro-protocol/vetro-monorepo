import { usePublicClient } from "wagmi";

import { useMainnet } from "./useMainnet";

export const useEthereumClient = () =>
  usePublicClient({ chainId: useMainnet().id });
