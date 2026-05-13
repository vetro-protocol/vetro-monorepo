import { queryOptions } from "@tanstack/react-query";
import type { Address, Client } from "viem";
import { convertToAssets } from "viem-erc4626/actions";

export const convertToAssetsQueryOptions = ({
  client,
  shares,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  shares: bigint | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && shares !== undefined,
    queryFn: () =>
      convertToAssets(client!, {
        address: stakingVaultAddress,
        shares: shares!,
      }),
    queryKey: [
      "convert-to-assets",
      client?.chain?.id,
      stakingVaultAddress,
      shares?.toString(),
    ],
  });
