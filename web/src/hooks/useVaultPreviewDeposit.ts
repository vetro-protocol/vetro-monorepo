import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { previewDeposit } from "viem-erc4626/actions";

const vaultPreviewDepositOptions = ({
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
      previewDeposit(client!, { address: stakingVaultAddress, assets }),
    queryKey: [
      "vault-preview-deposit",
      client?.chain?.id,
      stakingVaultAddress,
      assets.toString(),
    ],
  });

export function useVaultPreviewDeposit({
  assets,
  stakingVaultAddress,
}: {
  assets: bigint;
  stakingVaultAddress: Address;
}) {
  const client = useEthereumClient();

  return useQuery(
    vaultPreviewDepositOptions({ assets, client, stakingVaultAddress }),
  );
}
