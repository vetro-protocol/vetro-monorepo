import type { QueryClient } from "@tanstack/react-query";
import { veHemiSnapshotTokenIdsOptions } from "hooks/useVeHemiSnapshotTokenIds";
import { vToken } from "utils/veVetro";
import { type Address, type Client, parseUnits } from "viem";

// Placeholder until the distributor lens is deployed. Replace the return value
// with `getClaimableSubset(client, { address: lensAddress, claimant: account, tokenIds })`
// from `@vetro-protocol/ve-vetro/actions`, which returns `{ amount, ids }`.
export const fetchVeVetroClaimableSubset = async function ({
  account,
  client,
  queryClient,
}: {
  account: Address;
  client: Client;
  queryClient: QueryClient;
}) {
  const tokenIds = await queryClient.ensureQueryData(
    veHemiSnapshotTokenIdsOptions({ account, client }),
  );
  return {
    amount: parseUnits("12478.06", vToken.decimals),
    ids: tokenIds.filter((tokenId) => tokenId !== 4410n),
  };
};
