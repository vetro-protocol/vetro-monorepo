import type { StrategySource } from "@vetro-protocol/core";
import { type Address, isAddressEqual } from "viem";

import type { StakeDaoStrategy } from "./liquidity/stake-dao.ts";

export const getStrategySource = function ({
  name,
  receiptToken,
  stakeDaoStrategies,
}: {
  name: string;
  receiptToken: Address | undefined;
  stakeDaoStrategies: StakeDaoStrategy[] | null;
}): StrategySource | undefined {
  if (!receiptToken) {
    return undefined;
  }
  const stakeDaoStrategy = stakeDaoStrategies?.find((strategy) =>
    isAddressEqual(strategy.lpToken.address, receiptToken),
  );
  if (stakeDaoStrategy) {
    return { protocol: "stakeDao", strategyKey: stakeDaoStrategy.key };
  }
  if (name.startsWith("Morpho ")) {
    return { protocol: "morpho", vaultAddress: receiptToken };
  }
  if (name.startsWith("Lagoon ")) {
    return { protocol: "lagoon", vaultAddress: receiptToken };
  }
  return undefined;
};
