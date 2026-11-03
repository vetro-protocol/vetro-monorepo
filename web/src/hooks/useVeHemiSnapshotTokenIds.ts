import { queryOptions } from "@tanstack/react-query";
import { fetchVeHemiSnapshotTokenIds } from "fetchers/fetchVeHemiSnapshotTokenIds";
import type { Address } from "viem";

export const veHemiSnapshotTokenIdsOptions = (account: Address | undefined) =>
  queryOptions({
    enabled: !!account,
    queryFn: fetchVeHemiSnapshotTokenIds,
    queryKey: ["ve-hemi-snapshot-token-ids", account],
  });
