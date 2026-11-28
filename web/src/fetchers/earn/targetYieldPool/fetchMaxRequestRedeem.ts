import {
  getMaxMint,
  getMaxRequestRedeem,
} from "@vetro-protocol/target-yield-earn/actions";
import type { Address, Client } from "viem";

export const fetchMaxRequestRedeem = async function ({
  account,
  client,
  stakingVaultAddress,
}: {
  account: Address;
  client: Client;
  stakingVaultAddress: Address;
}) {
  const params = {
    address: stakingVaultAddress,
    controller: account,
  };
  const [maxShares, claimableShares] = await Promise.all([
    getMaxRequestRedeem(client, { ...params, owner: account }),
    getMaxMint(client, params),
  ]);

  if (claimableShares === 0n || maxShares > 0n) {
    return maxShares + claimableShares;
  }

  // A 0n max means the request is blocked or the owner holds no shares. The
  // vault holds the claimable deposit shares itself, so its own max is above
  // 0n only when the request is not blocked.
  const vaultMaxShares = await getMaxRequestRedeem(client, {
    ...params,
    owner: stakingVaultAddress,
  });
  return vaultMaxShares > 0n ? claimableShares : 0n;
};
