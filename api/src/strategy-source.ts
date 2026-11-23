import type { StrategySource } from "@vetro-protocol/core";
import { type Address, isAddress } from "viem";

import {
  findStrategyByLpToken,
  type StakeDaoStrategy,
} from "./liquidity/stake-dao.ts";

const strategySourceCacheTtl = 24 * 60 * 60;

const strategySourceCacheKey = (address: Address) =>
  `analytics:treasury:source:${address.toLowerCase()}`;

function isStrategySource(value: unknown): value is StrategySource {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (!("protocol" in value)) {
    return false;
  }
  if (value.protocol === "stakeDao") {
    return "strategyKey" in value && typeof value.strategyKey === "string";
  }
  return (
    (value.protocol === "morpho" || value.protocol === "lagoon") &&
    "vaultAddress" in value &&
    typeof value.vaultAddress === "string" &&
    isAddress(value.vaultAddress)
  );
}

function getFreshStrategySource({
  name,
  receiptToken,
  stakeDaoStrategies,
}: {
  name: string;
  receiptToken: Address | undefined;
  stakeDaoStrategies: StakeDaoStrategy[] | null;
}) {
  if (!receiptToken) {
    return undefined;
  }
  const stakeDaoStrategy = stakeDaoStrategies
    ? findStrategyByLpToken({
        lpToken: receiptToken,
        strategies: stakeDaoStrategies,
      })
    : undefined;
  if (stakeDaoStrategy) {
    return {
      protocol: "stakeDao" as const,
      strategyKey: stakeDaoStrategy.key,
    };
  }
  if (name.startsWith("Morpho ")) {
    return { protocol: "morpho" as const, vaultAddress: receiptToken };
  }
  if (name.startsWith("Lagoon ")) {
    return { protocol: "lagoon" as const, vaultAddress: receiptToken };
  }
  return undefined;
}

async function getCachedStrategySource({
  address,
  kv,
}: {
  address: Address;
  kv: KVNamespace;
}) {
  try {
    const source = await kv.get<unknown>(
      strategySourceCacheKey(address),
      "json",
    );
    if (source === null) {
      return undefined;
    }
    if (isStrategySource(source)) {
      return source;
    }
    console.warn(`Invalid cached source of strategy ${address}`);
    return undefined;
  } catch (error) {
    console.warn(
      `Failed to read the cached source of strategy ${address}: ${error.message}`,
    );
    return undefined;
  }
}

async function cacheStrategySource({
  address,
  kv,
  source,
}: {
  address: Address;
  kv: KVNamespace;
  source: StrategySource;
}) {
  try {
    await kv.put(strategySourceCacheKey(address), JSON.stringify(source), {
      expirationTtl: strategySourceCacheTtl,
    });
  } catch (error) {
    console.warn(
      `Failed to cache the source of strategy ${address}: ${error.message}`,
    );
  }
}

export const getStrategySource = async function ({
  address,
  kv,
  name,
  receiptToken,
  stakeDaoStrategies,
}: {
  address: Address;
  kv: KVNamespace;
  name: string;
  receiptToken: Address | undefined;
  stakeDaoStrategies: StakeDaoStrategy[] | null;
}) {
  const source = getFreshStrategySource({
    name,
    receiptToken,
    stakeDaoStrategies,
  });
  if (source) {
    await cacheStrategySource({ address, kv, source });
    return source;
  }
  if (receiptToken === undefined || stakeDaoStrategies === null) {
    return await getCachedStrategySource({ address, kv });
  }
  return undefined;
};
