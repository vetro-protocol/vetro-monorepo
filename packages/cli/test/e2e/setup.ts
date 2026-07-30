import { anvilFork } from "@hemilabs/anvil-fork-setup/vitest";
import { mainnet } from "viem/chains";

export default anvilFork({
  chainId: mainnet.id,
  forkUrl: process.env.FORK_URL ?? "https://eth.drpc.org",
});
