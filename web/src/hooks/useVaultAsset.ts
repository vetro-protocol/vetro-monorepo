import { queryOptions } from "@tanstack/react-query";
import type { Address, Client } from "viem";
import { asset } from "viem-erc4626/actions";

export const vaultAssetOptions = ({
  client,
  vaultAddress,
}: {
  client: Client | undefined;
  vaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => asset(client!, { address: vaultAddress }),
    queryKey: ["vault-asset", client?.chain?.id, vaultAddress],
  });
