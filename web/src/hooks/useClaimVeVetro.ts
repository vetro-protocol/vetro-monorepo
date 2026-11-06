import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claim } from "@vetro-protocol/ve-vetro/actions";
import type { fetchVeVetroClaimableSubset } from "fetchers/fetchVeVetroClaimableSubset";
import type { fetchVeVetroSnapshotPositions } from "fetchers/fetchVeVetroSnapshotPositions";
import { useHemiClient } from "hooks/useHemiClient";
import {
  veVetroClaimableSubsetOptions,
  veVetroClaimableSubsetQueryKey,
} from "hooks/useVeVetroClaimableSubset";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";
import { veVetroEip712DomainOptions } from "hooks/useVeVetroEip712Domain";
import { veVetroSnapshotPositionsQueryKey } from "hooks/useVeVetroSnapshotPositions";
import { veVetroChain } from "networks";
import { veVetroContracts, veVetroTerms } from "utils/veVetro";
import { signTypedData } from "viem/actions";
import { useAccount, useWalletClient } from "wagmi";

type ClaimableSubset = Awaited<ReturnType<typeof fetchVeVetroClaimableSubset>>;

type SnapshotPositions = Awaited<
  ReturnType<typeof fetchVeVetroSnapshotPositions>
>;

const termsAcceptanceTypes = {
  TermsAcceptance: [
    { name: "claimant", type: "address" },
    { name: "recipient", type: "address" },
    { name: "terms", type: "string" },
  ],
} as const;

type Params = {
  onClaimStart?: VoidFunction;
};

export function useClaimVeVetro({ onClaimStart }: Params = {}) {
  const { address: account } = useAccount();
  const client = useHemiClient();
  const { data: walletClient } = useWalletClient({
    assertChainId: false,
    chainId: veVetroChain.id,
  });
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();
  const { queryKey: nativeBalanceKey } = useNativeBalance(veVetroChain.id);
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    veVetroChain.id,
  );

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }
      if (!walletClient) {
        throw new Error("No wallet client available");
      }
      if (!client) {
        throw new Error("No public client available");
      }

      const { requireTermsSignature } = await queryClient.ensureQueryData(
        veVetroConfigOptions(client),
      );

      await ensureConnectedTo(veVetroChain.id);

      const signature = requireTermsSignature
        ? await signTypedData(walletClient, {
            account,
            domain: await queryClient.ensureQueryData(
              veVetroEip712DomainOptions(client),
            ),
            message: {
              claimant: account,
              recipient: account,
              terms: veVetroTerms,
            },
            primaryType: "TermsAcceptance",
            types: termsAcceptanceTypes,
          })
        : undefined;

      onClaimStart?.();

      const { ids: tokenIds } = await queryClient.fetchQuery({
        ...veVetroClaimableSubsetOptions({ account, client }),
        staleTime: 0,
      });

      const { emitter, promise } = claim(walletClient, {
        address: veVetroContracts.distributor,
        recipient: account,
        signature,
        tokenIds,
      });

      let failed = false;
      const markFailed = function () {
        failed = true;
      };

      emitter.on("claim-failed", markFailed);
      emitter.on("claim-failed-validation", markFailed);
      emitter.on("unexpected-error", markFailed);
      emitter.on("user-signing-claim-error", markFailed);
      emitter.on("claim-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        markFailed();
      });
      emitter.on("claim-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        queryClient.setQueryData<ClaimableSubset>(
          veVetroClaimableSubsetQueryKey(account),
          (old) => old && { amount: 0n, ids: [] },
        );
        queryClient.setQueryData<SnapshotPositions>(
          veVetroSnapshotPositionsQueryKey(account),
          (old) =>
            old?.map((position) =>
              tokenIds.includes(position.tokenId)
                ? { ...position, claimed: true }
                : position,
            ),
        );
      });

      await promise;

      if (failed) {
        throw new Error("veVETRO claim failed");
      }
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: nativeBalanceKey });
      queryClient.invalidateQueries({
        queryKey: veVetroClaimableSubsetQueryKey(account),
      });
      queryClient.invalidateQueries({
        queryKey: veVetroSnapshotPositionsQueryKey(account),
      });
    },
  });
}
