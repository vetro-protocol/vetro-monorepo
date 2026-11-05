import { veVetroChain } from "utils/veVetro";
import { usePublicClient } from "wagmi";

export const useHemiClient = () =>
  usePublicClient({ chainId: veVetroChain.id });
