import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchRedeemDelay } from "fetchers/fetchRedeemDelay";
import { mainnet } from "networks/mainnet";
import type { Address, Chain, Client } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";

const redeemDelayQueryKey = ({
  account,
  chainId,
  gatewayAddress,
}: {
  account: Address | undefined;
  chainId: Chain["id"] | undefined;
  gatewayAddress: Address;
}) => ["redeem-delay", chainId, gatewayAddress, account];

export const redeemDelayOptions = ({
  account,
  chainId,
  client,
  gatewayAddress,
}: {
  account: Address | undefined;
  chainId: Chain["id"];
  client: Client | undefined;
  gatewayAddress: Address;
}) =>
  queryOptions({
    enabled: !!account && !!client,
    queryFn: ({ client: queryClient }) =>
      fetchRedeemDelay({
        account: account!,
        client: client!,
        gatewayAddress,
        queryClient,
      }),
    queryKey: redeemDelayQueryKey({
      account,
      chainId,
      gatewayAddress,
    }),
  });

export const useRedeemDelay = function (gatewayAddress: Address) {
  const { address: account } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    redeemDelayOptions({
      account,
      chainId: mainnet.id,
      client,
      gatewayAddress,
    }),
  );
};
