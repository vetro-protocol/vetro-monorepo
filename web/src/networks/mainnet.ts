import { updateRpcUrls } from "@vetro-protocol/core";
import { mainnet as mainnetDefinition } from "viem/chains";

export const mainnet = updateRpcUrls(
  mainnetDefinition,
  import.meta.env.VITE_RPC_URL_MAINNET,
);
