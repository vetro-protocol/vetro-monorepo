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
  const stakerApr =
    stakerApy !== null && Number.isFinite(stakerApy)
      ? Math.log1p(stakerApy / 100) * 100
      : null;
  const stakerPayouts =
    stakerApr === null ? null : applyApy({ amount: staked, apy: stakerApr });
  return {
    backendApy: backendTotal.apy,
    backendBalance: backendTotal.balance,
    backendYield: backendTotal.projectedYield,
    netRevenue:
      backendTotal.projectedYield === null || stakerPayouts === null
        ? null
        : backendTotal.projectedYield - stakerPayouts,
    staked,
    stakerApr,
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
  const peggedTokenAndVault = readPeggedTokenAndVault();
  const apy = peggedTokenAndVault.then(async function ({
    stakingVaultAddress,
  }) {
    try {
      return await readWarmedTask({
        c,
        item: stakingVaultAddress,
        task: apyTask,
      });
    } catch (error) {
      console.warn(`Failed to read staking vault APY: ${error.message}`);
      return null;
    }
  });
  const [
    { peggedToken, stakingVaultAddress },
    treasuryTokens,
    { staked },
    stakerApy,
  ] = await Promise.all([
    peggedTokenAndVault,
    readWarmedTask({ c, item: gatewayAddress, task: treasuryTask }),
    readWarmedTask({ c, item: gatewayAddress, task: stakedTask }),
    apy,
  ]);
  const { total } = toYieldSummary({
    peggedDecimals: peggedToken.decimals,
    treasuryTokens,
  });
  return {
    ...toNetRevenue({
      backendTotal: total,
      staked: BigInt(staked),
      stakerApy: stakerApy?.apy ?? null,
    }),
    stakingVaultAddress,
  };
}
