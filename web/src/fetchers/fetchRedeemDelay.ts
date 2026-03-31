import type { QueryClient } from "@tanstack/react-query";
import {
  getWithdrawalDelayEnabled,
  isInstantRedeemWhitelisted,
} from "@vetro-protocol/gateway/actions";
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
  const [delayEnabled, isWhitelisted] = await Promise.all([
    getWithdrawalDelayEnabled(client, { address: gatewayAddress }),
    isInstantRedeemWhitelisted(client, {
      account,
      address: gatewayAddress,
    }),
  ]);

  if (!delayEnabled || isWhitelisted) {
    return 0n;
  }

  // Per the contract, delay can't be zero when enabled
  return queryClient.ensureQueryData(
    withdrawalDelayOptions({
      chainId: client.chain!.id,
      client,
      gatewayAddress,
    }),
  );
};
