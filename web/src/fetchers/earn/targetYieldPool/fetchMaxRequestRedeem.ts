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

  const vaultMaxShares = await getMaxRequestRedeem(client, {
    ...params,
    owner: stakingVaultAddress,
  });
  return vaultMaxShares > 0n ? claimableShares : 0n;
};
