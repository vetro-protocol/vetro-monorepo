import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { analyticsBackingVusdOptions } from "hooks/useAnalyticsBackingVusd";
import { analyticsTotalsOptions } from "hooks/useAnalyticsTotals";
import { analyticsTreasuryOptions } from "hooks/useAnalyticsTreasury";
import { peggedTokenQueryOptions } from "hooks/usePeggedToken";
import { previewRedeemTokenOptions } from "hooks/usePreviewRedeem";
import { type Address, type Client, formatUnits } from "viem";

// Converts treasury token holdings to VUSD using on-chain previewRedeem prices.
const fetchTreasuryTotal = async function ({
  chainId,
  client,
  gatewayAddress,
  oneVusd,
  queryClient,
}: {
  chainId: number;
  client: Client;
  gatewayAddress: Address;
  oneVusd: bigint;
  queryClient: QueryClient;
}) {
  const treasuryTokens = await queryClient.ensureQueryData(
    analyticsTreasuryOptions(),
  );
  const tokensPerVusd = await Promise.all(
    treasuryTokens.map(({ tokenAddress }) =>
      queryClient.ensureQueryData(
        previewRedeemTokenOptions({
          chainId,
          client,
          gatewayAddress,
          peggedTokenIn: oneVusd,
          tokenOut: tokenAddress as Address,
        }),
      ),
    ),
  );

  let total = 0n;
  for (let i = 0; i < treasuryTokens.length; i++) {
    const rate = tokensPerVusd[i];
    if (rate > 0n) {
      total += (BigInt(treasuryTokens[i].withdrawable) * oneVusd) / rate;
    }
  }
  return total;
};

export const fetchCollateralizationRatio = async function ({
  client,
  queryClient,
}: {
  client: Client;
  queryClient: QueryClient;
}) {
  const chainId = client.chain!.id;
  const gatewayAddress = getGatewayAddress(chainId);
  const vusd = await queryClient.ensureQueryData(
    peggedTokenQueryOptions({ client, queryClient }),
  );
  const { decimals } = vusd;
  const oneVusd = 10n ** BigInt(decimals);

  const [backing, { vusdMinted }, treasuryTotal] = await Promise.all([
    queryClient.ensureQueryData(analyticsBackingVusdOptions()).then((b) => ({
      strategicReserves: BigInt(b.strategicReserves),
      surplus: BigInt(b.surplus),
    })),
    queryClient.ensureQueryData(analyticsTotalsOptions()),
    fetchTreasuryTotal({
      chainId,
      client,
      gatewayAddress,
      oneVusd,
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
    vusdSupply: toNumber(BigInt(vusdMinted)),
  };
};
