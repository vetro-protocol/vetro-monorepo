import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import type { TokenWithGateway } from "types";
import type { Address, Chain } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";
import { redeemRequestQueryOptions } from "./useGetRedeemRequest";
import { peggedTokenQueryOptions } from "./usePeggedToken";

export type RedeemRequest = {
  amountLocked: bigint;
  claimableAt: bigint;
  peggedToken: TokenWithGateway;
};

export const redeemRequestsQueryKey = ({
  address,
  chainId,
}: {
  address: Address | undefined;
  chainId: Chain["id"] | undefined;
}) => ["redeem-requests", chainId, address];

export const useGetRedeemRequests = function () {
  const { address } = useAccount();
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery({
    enabled: !!client && !!address,
    async queryFn() {
      const results = await Promise.all(
        gatewayAddresses.map(async function (gatewayAddress) {
          const [request, peggedToken] = await Promise.all([
            queryClient.ensureQueryData(
              redeemRequestQueryOptions({
                client,
                gatewayAddress,
                user: address,
              }),
            ),
            queryClient.ensureQueryData(
              peggedTokenQueryOptions({
                client,
                gatewayAddress,
                queryClient,
              }),
            ),
          ]);
          return {
            amountLocked: request[0],
            claimableAt: request[1],
            peggedToken,
          };
        }),
      );
      return results.filter((r) => r.amountLocked > 0n);
    },
    queryKey: redeemRequestsQueryKey({
      address,
      chainId: client?.chain?.id,
    }),
  });
};
