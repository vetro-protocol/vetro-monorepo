import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAtRiskPositions } from "fetchers/fetchAtRiskPositions";
import type { Address, Chain } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "../useEthereumClient";
import { useMainnet } from "../useMainnet";

export const atRiskPositionsQueryKey = ({
  account,
  chainId,
}: {
  account: Address | undefined;
  chainId: Chain["id"];
}) => ["at-risk-positions", chainId, account];

export const useAtRiskPositions = function () {
  const { address: account } = useAccount();
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery({
    enabled: !!client && !!account,
    queryFn: () =>
      fetchAtRiskPositions({
        account: account!,
        chainId: ethereumChain.id,
        client: client!,
        queryClient,
      }),
    queryKey: atRiskPositionsQueryKey({
      account: account!,
      chainId: ethereumChain.id,
    }),
  });
};
