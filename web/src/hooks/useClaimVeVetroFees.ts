import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchClaimVeVetroFees } from "fetchers/fetchClaimVeVetroFees";
import { useHemiClient } from "hooks/useHemiClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const claimVeVetroFeesOptions = ({
  account,
  client,
  enabled,
  tokenIds,
}: {
  account: Address | undefined;
  client: Client | undefined;
  enabled: boolean;
  tokenIds: readonly bigint[] | undefined;
}) =>
  queryOptions({
    enabled: enabled && !!account && !!client && !!tokenIds?.length,
    queryFn: ({ client: queryClient }) =>
      fetchClaimVeVetroFees({
        account: account!,
        client: client!,
        queryClient,
        tokenIds: tokenIds!,
      }),
    queryKey: [
      "ve-vetro-claim-fees",
      account,
      tokenIds?.map((tokenId) => tokenId.toString()),
    ],
  });

export function useClaimVeVetroFees({
  enabled,
  tokenIds,
}: {
  enabled: boolean;
  tokenIds: readonly bigint[] | undefined;
}) {
  const { address: account } = useAccount();
  const client = useHemiClient();
  return useQuery(
    claimVeVetroFeesOptions({ account, client, enabled, tokenIds }),
  );
}
