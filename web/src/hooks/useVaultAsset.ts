import { queryOptions } from "@tanstack/react-query";
import { graphVaultAsset } from "utils/protocolGraph";
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
    placeholderData: graphVaultAsset(vaultAddress),
    queryFn: () => asset(client!, { address: vaultAddress }),
    queryKey: ["vault-asset", client?.chain?.id, vaultAddress],
  });
