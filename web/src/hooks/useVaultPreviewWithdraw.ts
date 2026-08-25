import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { previewWithdraw } from "viem-erc4626/actions";

const vaultPreviewWithdrawOptions = ({
  assets,
  client,
  stakingVaultAddress,
}: {
  assets: bigint;
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && assets > 0n,
    queryFn: () =>
      previewWithdraw(client!, { address: stakingVaultAddress, assets }),
    queryKey: [
      "vault-preview-withdraw",
      client?.chain?.id,
      stakingVaultAddress,
      assets.toString(),
    ],
  });

export function useVaultPreviewWithdraw({
  assets,
  stakingVaultAddress,
}: {
  assets: bigint;
  stakingVaultAddress: Address;
}) {
  const client = useEthereumClient();

  return useQuery(
    vaultPreviewWithdrawOptions({ assets, client, stakingVaultAddress }),
  );
}
