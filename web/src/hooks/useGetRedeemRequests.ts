import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import type { Address, Chain } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";
import { redeemRequestQueryOptions } from "./useGetRedeemRequest";

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
          const result = await queryClient.ensureQueryData(
            redeemRequestQueryOptions({
              client,
              gatewayAddress,
              user: address,
            }),
          );
          return {
            amountLocked: result[0],
            claimableAt: result[1],
            gatewayAddress,
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
