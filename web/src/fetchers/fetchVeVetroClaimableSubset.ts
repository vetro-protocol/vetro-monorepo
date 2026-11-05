import type { QueryClient } from "@tanstack/react-query";
import { veHemiSnapshotTokenIdsOptions } from "hooks/useVeHemiSnapshotTokenIds";
import { vToken } from "utils/veVetro";
import { type Address, parseUnits } from "viem";

// Placeholder until the ve-vetro package (#1062) is merged and the
// distributor lens is deployed. Replace the return value with
// `getClaimableSubset(hemiClient, { address: lensAddress, claimant: account, tokenIds })`
// from `@vetro-protocol/ve-vetro/actions`, which returns `{ amount, ids }`.
export const fetchVeVetroClaimableSubset = async function ({
  account,
  queryClient,
}: {
  account: Address;
  queryClient: QueryClient;
}) {
  const tokenIds = await queryClient.ensureQueryData(
    veHemiSnapshotTokenIdsOptions(account),
  );
  return {
    amount: parseUnits("12478.06", vToken.decimals),
    ids: tokenIds.filter((tokenId) => tokenId !== 4410n),
  };
};
