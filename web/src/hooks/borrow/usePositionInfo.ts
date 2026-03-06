import { type MarketId } from "@morpho-org/blue-sdk";
import { AccrualPosition } from "@morpho-org/blue-sdk-viem/lib/augment/Position";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Address, Chain, Client, Hash } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "../useEthereumClient";
import { useMainnet } from "../useMainnet";

export const positionInfoQueryKey = ({
  account,
  chainId,
  marketId,
}: {
  account: Address | undefined;
  chainId: Chain["id"];
  marketId: Hash;
}) => ["position-info", chainId, marketId, account];

export const positionInfoOptions = ({
  account,
  chainId,
  client,
  marketId,
}: {
  account: Address | undefined;
  chainId: Chain["id"];
  client: Client | undefined;
  marketId: Hash;
}) =>
  queryOptions({
    enabled: !!client && !!account,
    queryFn: () =>
      AccrualPosition.fetch(account!, marketId as MarketId, client!),
    queryKey: positionInfoQueryKey({ account, chainId, marketId }),
  });

export const usePositionInfo = function (marketId: Hash) {
  const { address: account } = useAccount();
  const ethereumChain = useMainnet();
  const client = useEthereumClient();

  return useQuery(
    positionInfoOptions({
      account,
      chainId: ethereumChain.id,
      client: client!,
      marketId,
    }),
  );
};
