import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { fetchRedeemDelay } from "fetchers/fetchRedeemDelay";
import type { Address, Chain } from "viem";
import { useAccount } from "wagmi";

import { useHemi } from "./useHemi";
import { useHemiClient } from "./useHemiClient";

export const redeemDelayQueryKey = ({
  account,
  chainId,
  gatewayAddress,
}: {
  account: Address | undefined;
  chainId: Chain["id"] | undefined;
  gatewayAddress: Address;
}) => ["redeem-delay", chainId, gatewayAddress, account];

export const useRedeemDelay = function () {
  const { address: account } = useAccount();
  const hemi = useHemi();
  const client = useHemiClient();
  const gatewayAddress = getGatewayAddress(hemi.id);

  return useQuery({
    enabled: !!client && !!account,
    queryFn: () =>
      fetchRedeemDelay({
        account: account!,
        client: client!,
        gatewayAddress,
      }),
    queryKey: redeemDelayQueryKey({
      account,
      chainId: client?.chain.id,
      gatewayAddress,
    }),
  });
};
