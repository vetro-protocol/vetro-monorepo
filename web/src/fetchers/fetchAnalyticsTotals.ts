import type { QueryClient } from "@tanstack/react-query";
import { poolDepositsOptions } from "hooks/usePoolDeposits";
import { stakingVaultForPeggedTokenOptions } from "hooks/useStakingVaultForPeggedToken";
import type { TokenWithGateway } from "types";
import type { Client } from "viem";
import { totalSupply } from "viem-erc20/actions";

export const fetchAnalyticsTotals = async function ({
  chainId,
  client,
  peggedToken,
  queryClient,
}: {
  chainId: number;
  client: Client;
  peggedToken: TokenWithGateway;
  queryClient: QueryClient;
}) {
  const mintedPromise = totalSupply(client, { address: peggedToken.address });
  const stakingVaultAddress = await queryClient.ensureQueryData(
    stakingVaultForPeggedTokenOptions({
      chainId,
      client,
      peggedTokenAddress: peggedToken.address,
      queryClient,
    }),
  );
  const [minted, staked] = await Promise.all([
    mintedPromise,
    queryClient.ensureQueryData(
      poolDepositsOptions({ client, stakingVaultAddress }),
    ),
  ]);
  return { minted, staked };
};
