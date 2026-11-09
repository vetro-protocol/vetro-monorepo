import type { QueryClient } from "@tanstack/react-query";
import { previewClaim } from "@vetro-protocol/ve-vetro/actions";
import { veHemiSnapshotTokenIdsOptions } from "hooks/useVeHemiSnapshotTokenIds";
import { veVetroContracts } from "utils/veVetro";
import type { Address, Client } from "viem";

export const fetchVeVetroSnapshotPositions = async function ({
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
  const previews = await Promise.all(
    tokenIds.map((tokenId) =>
      previewClaim(client, { address: veVetroContracts.distributor, tokenId }),
    ),
  );
  return previews.map(({ claimed, share, weight }, index) => ({
    claimed,
    share,
    tokenId: tokenIds[index],
    weight,
  }));
};
