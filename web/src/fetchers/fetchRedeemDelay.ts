import type { QueryClient } from "@tanstack/react-query";
import {
  getWithdrawalDelayEnabled,
  isInstantRedeemWhitelisted,
} from "@vetro/gateway/actions";
import { withdrawalDelayOptions } from "hooks/useWithdrawalDelay";
import type { Address, Client } from "viem";

export const fetchRedeemDelay = async function ({
  account,
  client,
  gatewayAddress,
  queryClient,
}: {
  account: Address;
  client: Client;
  gatewayAddress: Address;
  queryClient: QueryClient;
}) {
  const [delayEnabled, isWhitelisted, delay] = await Promise.all([
    getWithdrawalDelayEnabled(client, { address: gatewayAddress }),
    isInstantRedeemWhitelisted(client, {
      account,
      address: gatewayAddress,
    }),
    queryClient.ensureQueryData(
      withdrawalDelayOptions({
        chainId: client.chain!.id,
        client,
        gatewayAddress,
      }),
    ),
  ]);

  if (!delayEnabled || isWhitelisted || delay === 0n) {
    return 0n;
  }

  return delay;
};
