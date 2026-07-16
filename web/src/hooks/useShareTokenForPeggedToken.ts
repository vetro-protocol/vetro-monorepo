import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { stakingVaultForPeggedTokenOptions } from "hooks/useStakingVaultForPeggedToken";
import { tokenInfoOptions } from "hooks/useTokenInfo";
import type { TokenWithGateway } from "types";
import type { Client } from "viem";

const shareTokenForPeggedTokenOptions = ({
  client,
  peggedToken,
}: {
  client: Client | undefined;
  peggedToken: TokenWithGateway | undefined;
}) =>
  queryOptions({
    enabled: !!client && !!peggedToken,
    async queryFn({ client: queryClient }) {
      const stakingVaultAddress = await queryClient.ensureQueryData(
        stakingVaultForPeggedTokenOptions({
          chainId: client!.chain!.id,
          client: client!,
          peggedTokenAddress: peggedToken!.address,
          queryClient,
        }),
      );
      // The staking vault is an ERC-4626 ERC-20, so its own metadata is the
      // share token.
      return queryClient.ensureQueryData(
        tokenInfoOptions({
          address: stakingVaultAddress,
          chainId: client!.chain!.id,
          client: client!,
        }),
      );
    },
    queryKey: [
      "share-token-for-pegged-token",
      client?.chain?.id,
      peggedToken?.address,
    ],
  });

export const useShareTokenForPeggedToken = function ({
  peggedToken,
}: {
  peggedToken: TokenWithGateway | undefined;
}) {
  const client = useEthereumClient();
  return useQuery(shareTokenForPeggedTokenOptions({ client, peggedToken }));
};
