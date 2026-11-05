import {
  getCooldownEnabled,
  getInstantWithdrawWhitelist,
} from "@vetro-protocol/earn/actions";
import type { Address, Client } from "viem";

// Mirrors Agent.handleRedeemRequest exactly; any drift makes the Agent cancel and the user eats gas.
export const resolveIsInstant = async function (
  client: Client,
  {
    address,
    caller,
  }: {
    address: Address;
    caller: Address;
  },
): Promise<boolean> {
  const [cooldownEnabled, whitelisted] = await Promise.all([
    getCooldownEnabled(client, { address }),
    getInstantWithdrawWhitelist(client, { account: caller, address }),
  ]);

  return !cooldownEnabled || whitelisted;
};
