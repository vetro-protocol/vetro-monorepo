import type { QueryClient } from "@tanstack/react-query";
import { getClaimableSubset } from "@vetro-protocol/ve-vetro/actions";
import { veHemiSnapshotTokenIdsOptions } from "hooks/useVeHemiSnapshotTokenIds";
import { veVetroContracts } from "utils/veVetro";
import type { Address, Client } from "viem";

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
  return getClaimableSubset(client, {
    address: veVetroContracts.lens,
    claimant: account,
    tokenIds,
  });
};
