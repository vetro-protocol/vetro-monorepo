import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

// TODO extend custom RPC https://github.com/vetro-protocol/vetro-monorepo/issues/445#issuecomment-5062771972
// For the time being, for development, let's allow overriding with env vars
export const createVetroClient = () =>
  createPublicClient({
    chain: mainnet,
    transport: http(process.env.RPC_URL),
  });
