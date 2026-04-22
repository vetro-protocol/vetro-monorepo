import type { QueryClient } from "@tanstack/react-query";
import { analyticsBackingVusdOptions } from "hooks/useAnalyticsBackingVusd";
import { analyticsTotalsOptions } from "hooks/useAnalyticsTotals";
import { analyticsTreasuryOptions } from "hooks/useAnalyticsTreasury";
import { peggedTokenQueryOptions } from "hooks/usePeggedToken";
import { previewRedeemTokenOptions } from "hooks/usePreviewRedeem";
import { type Address, type Client, formatUnits } from "viem";

// Converts treasury token holdings to PeggedToken using on-chain previewRedeem prices.
const fetchTreasuryTotal = async function ({
  chainId,
  client,
  gatewayAddress,
  oneUnit,
  queryClient,
}: {
  chainId: number;
  client: Client;
  gatewayAddress: Address;
  oneUnit: bigint;
  queryClient: QueryClient;
}) {
  const treasuryTokens = await queryClient.ensureQueryData(
    analyticsTreasuryOptions({ gatewayAddress }),
  );
  const tokensPerPeggedToken = await Promise.all(
    treasuryTokens.map(({ tokenAddress }) =>
      queryClient.ensureQueryData(
        previewRedeemTokenOptions({
          chainId,
          client,
          gatewayAddress,
          peggedTokenIn: oneUnit,
          tokenOut: tokenAddress as Address,
        }),
      ),
    ),
  );

  let total = 0n;
  for (let i = 0; i < treasuryTokens.length; i++) {
    const rate = tokensPerPeggedToken[i];
    if (rate > 0n) {
      total += (BigInt(treasuryTokens[i].withdrawable) * oneUnit) / rate;
    }
  }
  return total;
};

export const fetchCollateralizationRatio = async function ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client;
  gatewayAddress: Address;
  queryClient: QueryClient;
}) {
  const chainId = client.chain!.id;
  const peggedToken = await queryClient.ensureQueryData(
    peggedTokenQueryOptions({ client, gatewayAddress, queryClient }),
  );
  const { decimals } = peggedToken;
  const oneUnit = 10n ** BigInt(decimals);

  const [backing, { minted }, treasuryTotal] = await Promise.all([
    queryClient.ensureQueryData(analyticsBackingVusdOptions()).then((b) => ({
      strategicReserves: BigInt(b.strategicReserves),
      surplus: BigInt(b.surplus),
    })),
    queryClient.ensureQueryData(analyticsTotalsOptions({ gatewayAddress })),
    fetchTreasuryTotal({
      chainId,
      client,
      gatewayAddress,
      oneUnit,
      queryClient,
    }),
  ]);

  const total = backing.strategicReserves + backing.surplus + treasuryTotal;
  const toNumber = (value: bigint) => Number(formatUnits(value, decimals));

  return {
    strategicReserves: toNumber(backing.strategicReserves),
    surplus: toNumber(backing.surplus),
    total: toNumber(total),
    treasuryTotal: toNumber(treasuryTotal),
    vusdSupply: toNumber(BigInt(minted)),
  };
};
