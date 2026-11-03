import type { QueryClient } from "@tanstack/react-query";
import { veHemiSnapshotTokenIdsOptions } from "hooks/useVeHemiSnapshotTokenIds";
import { vToken } from "utils/veVetro";
import { type Address, parseUnits } from "viem";

const placeholderPreviews: Record<
  string,
  { claimed: boolean; share: bigint; weight: bigint }
> = {
  "1042": {
    claimed: false,
    share: parseUnits("8214.30", vToken.decimals),
    weight: parseUnits("182400.12", 18),
  },
  "2219": {
    claimed: false,
    share: parseUnits("4138.55", vToken.decimals),
    weight: parseUnits("91880", 18),
  },
  "3307": {
    claimed: false,
    share: parseUnits("125.21", vToken.decimals),
    weight: parseUnits("2780.40", 18),
  },
  "4410": { claimed: false, share: 0n, weight: 0n },
};

// Placeholder for the `previewClaim` action of `@vetro-protocol/ve-vetro/actions`,
// which reads `VeVetroDistributor.previewClaim(tokenId)`. Replace the call
// below with `previewClaim(hemiClient, { address: distributorAddress, tokenId })`.
// Use it and not the lens's `previewClaimBatch`, because the batch sets
// `share` to `0` for a claimed id.
const previewClaim = async ({
  account,
  tokenId,
}: {
  account: Address;
  tokenId: bigint;
}) => ({
  bucket: 0,
  ownerOfRecord: account,
  ...placeholderPreviews[tokenId.toString()],
});

export const fetchVeVetroSnapshotPositions = async function ({
  account,
  queryClient,
}: {
  account: Address;
  queryClient: QueryClient;
}) {
  const tokenIds = await queryClient.ensureQueryData(
    veHemiSnapshotTokenIdsOptions(account),
  );
  const previews = await Promise.all(
    tokenIds.map((tokenId) => previewClaim({ account, tokenId })),
  );
  return previews.map(({ claimed, share, weight }, index) => ({
    claimed,
    share,
    tokenId: tokenIds[index],
    weight,
  }));
};
