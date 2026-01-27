import { usePublicClient } from "wagmi";

import { useHemi } from "./useHemi";

export const useHemiClient = () => usePublicClient({ chainId: useHemi().id });
