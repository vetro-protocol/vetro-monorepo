import { useWalletClient } from "wagmi";

import { useHemi } from "./useHemi";

export const useHemiWalletClient = () =>
  useWalletClient({ chainId: useHemi().id });
