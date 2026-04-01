import { queryOptions } from "@tanstack/react-query";
import { getTreasury } from "@vetro-protocol/gateway/actions";
import type { Address, Chain, Client } from "viem";

export const treasuryAddressOptions = ({
  chainId,
  client,
  gatewayAddress,
}: {
  chainId: Chain["id"];
  client: Client | undefined;
  gatewayAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => getTreasury(client!, { address: gatewayAddress }),
    queryKey: ["treasury-address", chainId, gatewayAddress],
    staleTime: Infinity,
  });
