import { useQuery } from "@tanstack/react-query";
import { veVetroClaimableSubsetOptions } from "hooks/useVeVetroClaimableSubset";
import { useAccount } from "wagmi";

export function useVeVetroClaimablePositionCount() {
  const { address: account } = useAccount();
  return useQuery({
    ...veVetroClaimableSubsetOptions(account),
    select: ({ ids }) => ids.length,
  });
}
