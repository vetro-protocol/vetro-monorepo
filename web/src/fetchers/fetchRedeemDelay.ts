import {
  getWithdrawalDelay,
  getWithdrawalDelayEnabled,
  isInstantRedeemWhitelisted,
} from "@vetro/gateway/actions";
import type { Address, Client } from "viem";

export const fetchRedeemDelay = async function ({
  account,
  client,
  gatewayAddress,
}: {
  account: Address;
  client: Client;
  gatewayAddress: Address;
}) {
  const [delayEnabled, isWhitelisted, delay] = await Promise.all([
    getWithdrawalDelayEnabled(client, { address: gatewayAddress }),
    isInstantRedeemWhitelisted(client, {
      account,
      address: gatewayAddress,
    }),
    getWithdrawalDelay(client, { address: gatewayAddress }),
  ]);

  if (!delayEnabled || isWhitelisted || delay === 0n) {
    return 0n;
  }

  return delay;
};
