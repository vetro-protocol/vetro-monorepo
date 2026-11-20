import { createMainnetClient } from "@vetro-protocol/core";
import { getPeggedToken } from "@vetro-protocol/gateway/actions";
import type { Context } from "hono";
import { type Address, checksumAddress } from "viem";
import { decimals } from "viem-erc20/actions";

import { toPeggedValue } from "./treasury-value.ts";
import { readWarmedTask } from "./warm-cache.ts";
import { treasuryTask } from "./warm-tasks.ts";

type TreasuryTokens = Awaited<ReturnType<typeof treasuryTask.produce>>;

const apyScale = 10n ** 9n;

export const applyApy = ({ amount, apy }: { amount: bigint; apy: number }) =>
  (amount * BigInt(Math.round(apy * Number(apyScale)))) / (100n * apyScale);

export function toYieldSummary({
  peggedDecimals,
  treasuryTokens,
}: {
  peggedDecimals: number;
  treasuryTokens: TreasuryTokens;
}) {
  const items = treasuryTokens.flatMap(function (treasuryToken) {
    const token = checksumAddress(treasuryToken.tokenAddress);
    const totalDebt = BigInt(treasuryToken.totalDebt);
    const withdrawable = BigInt(treasuryToken.withdrawable);
    const hasHoldings =
      withdrawable > 0n ||
      treasuryToken.activeStrategies.some(
        (strategy) => BigInt(strategy.totalDebt) > 0n,
      );
    // Treasury.reserve() reads the oracle only for a token it holds
    if (hasHoldings && BigInt(treasuryToken.latestPrice) <= 0n) {
      throw new Error(`Invalid oracle price for ${token}`);
    }
    const toValue = (amount: bigint) =>
      toPeggedValue({ amount, peggedDecimals, ...treasuryToken });

    const reserveBalance = toValue(
      withdrawable > totalDebt ? withdrawable - totalDebt : 0n,
    );
    return [
      ...treasuryToken.activeStrategies.map(function (strategy) {
        const balance = toValue(BigInt(strategy.totalDebt));
        const apy = Number.isFinite(strategy.apy) ? strategy.apy : undefined;
        return {
          address: checksumAddress(strategy.address),
          apy,
          balance,
          name: strategy.name,
          projectedYield:
            apy === undefined ? undefined : applyApy({ amount: balance, apy }),
          source: strategy.source,
          token,
          type: "strategy" as const,
        };
      }),
      {
        apy: 0,
        balance: reserveBalance,
        projectedYield: 0n,
        token,
        type: "reserve" as const,
      },
    ];
  });

  const balance = items.reduce((sum, item) => sum + item.balance, 0n);
  const isYieldUnknown = items.some(
    (item) => item.balance > 0n && item.projectedYield === undefined,
  );
  const projectedYield = isYieldUnknown
    ? null
    : items.reduce((sum, item) => sum + (item.projectedYield ?? 0n), 0n);
  const apy =
    projectedYield === null || balance === 0n
      ? null
      : (Number(projectedYield) / Number(balance)) * 100;

  return {
    items: items.sort((a, b) =>
      a.balance === b.balance ? 0 : a.balance > b.balance ? -1 : 1,
    ),
    total: { apy, balance, projectedYield },
  };
}

export async function readPeggedToken({
  client,
  gatewayAddress,
}: {
  client: ReturnType<typeof createMainnetClient>;
  gatewayAddress: Address;
}) {
  const address = await getPeggedToken(client, { address: gatewayAddress });
  return { address, decimals: await decimals(client, { address }) };
}

export async function getYieldSummary({
  c,
  gatewayAddress,
}: {
  c: Context<{ Bindings: Env }>;
  gatewayAddress: Address;
}) {
  const client = createMainnetClient(c.env.CUSTOM_RPC_URL_MAINNET);
  const [peggedToken, treasuryTokens] = await Promise.all([
    readPeggedToken({ client, gatewayAddress }),
    readWarmedTask({ c, item: gatewayAddress, task: treasuryTask }),
  ]);
  return toYieldSummary({
    peggedDecimals: peggedToken.decimals,
    treasuryTokens,
  });
}
