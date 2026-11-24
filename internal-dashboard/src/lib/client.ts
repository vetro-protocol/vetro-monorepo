import { createChainClient, createMainnetClient } from "@vetro-protocol/core";
import { hemi } from "viem/chains";

export const client = createMainnetClient(import.meta.env.VITE_RPC_URL_MAINNET);

export const hemiClient = createChainClient(hemi);
