import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hemi } from "hemi-viem";
import { useHemiClient } from "hooks/useHemiClient";
import {
  veVetroClaimableSubsetOptions,
  veVetroClaimableSubsetQueryKey,
} from "hooks/useVeVetroClaimableSubset";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";
import { veVetroEip712DomainOptions } from "hooks/useVeVetroEip712Domain";
import { veVetroSnapshotPositionsQueryKey } from "hooks/useVeVetroSnapshotPositions";
import { veVetroTerms } from "utils/veVetro";
import type { Address, Hex } from "viem";
import { signTypedData } from "viem/actions";
import { useAccount, useWalletClient } from "wagmi";

// Placeholder until the ve-vetro package has the `claim` write action. Replace
// with `claim(walletClient, { address: veVetroDistributorAddress, recipient, termsSignature, tokenIds })`
// from `@vetro-protocol/ve-vetro/actions`.
const claim = (params: {
  recipient: Address;
  termsSignature: Hex;
  tokenIds: bigint[];
}) =>
  new Promise<typeof params>((resolve) =>
    setTimeout(() => resolve(params), 3000),
  );

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
  const { data: walletClient } = useWalletClient({ chainId: hemi.id });
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();
  const { queryKey: nativeBalanceKey } = useNativeBalance(hemi.id);

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

      await ensureConnectedTo(hemi.id);

      const termsSignature = requireTermsSignature
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
        : "0x";

      onClaimStart?.();

      const { ids: tokenIds } = await queryClient.fetchQuery({
        ...veVetroClaimableSubsetOptions({ account, client }),
        staleTime: 0,
      });

      return claim({ recipient: account, termsSignature, tokenIds });
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
