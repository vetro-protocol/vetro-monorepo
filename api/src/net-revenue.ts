import { createMainnetClient } from "@vetro-protocol/core";
import type { Context } from "hono";
import type { Address } from "viem";

import { findStakingVaultForPeggedToken } from "./staking-vault.ts";
import { readWarmedTask } from "./warm-cache.ts";
import { apyTask, stakedTask, treasuryTask } from "./warm-tasks.ts";
import { applyApy, readPeggedToken, toYieldSummary } from "./yield-summary.ts";

/**
 * Compare the projected yield per year of the Treasury with what the staking
 * vault pays to its stakers per year. Amounts are in pegged token base units.
 * A value that depends on an unknown APY is `null`, never zero.
 */
export function toNetRevenue({
  backendTotal,
  staked,
  stakerApy,
}: {
  backendTotal: ReturnType<typeof toYieldSummary>["total"];
  staked: bigint;
  stakerApy: number | null;
}) {
  const apy =
    stakerApy !== null && Number.isFinite(stakerApy) ? stakerApy : null;
  const stakerPayouts = apy === null ? null : applyApy({ amount: staked, apy });
  return {
    backendApy: backendTotal.apy,
    backendBalance: backendTotal.balance,
    backendYield: backendTotal.projectedYield,
    netRevenue:
      backendTotal.projectedYield === null || stakerPayouts === null
        ? null
        : backendTotal.projectedYield - stakerPayouts,
    staked,
    stakerApy: apy,
    stakerPayouts,
  };
}

export async function getNetRevenue({
  c,
  gatewayAddress,
}: {
  c: Context<{ Bindings: Env }>;
  gatewayAddress: Address;
}) {
  const client = createMainnetClient(c.env.CUSTOM_RPC_URL_MAINNET);
  const readPeggedTokenAndVault = async function () {
    const peggedToken = await readPeggedToken({ client, gatewayAddress });
    const stakingVaultAddress = await findStakingVaultForPeggedToken({
      client,
      peggedTokenAddress: peggedToken.address,
    });
    return { peggedToken, stakingVaultAddress };
  };
  const [
    { peggedToken, stakingVaultAddress },
    treasuryTokens,
    { staked },
    apys,
  ] = await Promise.all([
    readPeggedTokenAndVault(),
    readWarmedTask({ c, item: gatewayAddress, task: treasuryTask }),
    readWarmedTask({ c, item: gatewayAddress, task: stakedTask }),
    readWarmedTask({ c, task: apyTask }),
  ]);
  const { total } = toYieldSummary({
    peggedDecimals: peggedToken.decimals,
    treasuryTokens,
  });
  return {
    ...toNetRevenue({
      backendTotal: total,
      staked: BigInt(staked),
      stakerApy: apys?.[stakingVaultAddress]?.apy ?? null,
    }),
    stakingVaultAddress,
  };
}
