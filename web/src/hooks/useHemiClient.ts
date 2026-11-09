import { veVetroChain } from "networks";
import { usePublicClient } from "wagmi";

export const useHemiClient = () =>
  usePublicClient({ chainId: veVetroChain.id });
