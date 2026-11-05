import { hemi } from "hemi-viem";
import { usePublicClient } from "wagmi";

export const useHemiClient = () => usePublicClient({ chainId: hemi.id });
