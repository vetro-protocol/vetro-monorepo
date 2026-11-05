import { queryOptions } from "@tanstack/react-query";
import { fetchVeHemiSnapshotTokenIds } from "fetchers/fetchVeHemiSnapshotTokenIds";
import type { Address, Client } from "viem";

export const veHemiSnapshotTokenIdsOptions = ({
  account,
  client,
}: {
  account: Address | undefined;
  client: Client | undefined;
}) =>
  queryOptions({
    enabled: !!account && !!client,
    queryFn: () =>
      fetchVeHemiSnapshotTokenIds({ account: account!, client: client! }),
    queryKey: ["ve-hemi-snapshot-token-ids", account],
  });
