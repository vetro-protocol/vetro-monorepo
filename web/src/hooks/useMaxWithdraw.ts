import { queryOptions } from "@tanstack/react-query";
import { getMaxWithdraw } from "@vetro/gateway/actions";
import type { Address, Chain, Client } from "viem";

const maxWithdrawQueryKey = ({
  chainId,
  gatewayAddress,
  tokenOut,
}: {
  chainId: Chain["id"];
  gatewayAddress: Address;
  tokenOut: Address;
}) => ["max-withdraw", chainId, gatewayAddress, tokenOut];

export const maxWithdrawOptions = ({
  chainId,
  client,
  gatewayAddress,
  tokenOut,
}: {
  chainId: Chain["id"];
  client: Client | undefined;
  gatewayAddress: Address;
  tokenOut: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      getMaxWithdraw(client!, { address: gatewayAddress, tokenOut }),
    queryKey: maxWithdrawQueryKey({
      chainId,
      gatewayAddress,
      tokenOut,
    }),
  });
