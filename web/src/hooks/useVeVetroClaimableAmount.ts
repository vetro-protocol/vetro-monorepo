import { useQuery } from "@tanstack/react-query";
import { useHemiClient } from "hooks/useHemiClient";
import { veVetroClaimableSubsetOptions } from "hooks/useVeVetroClaimableSubset";
import { useAccount } from "wagmi";

export function useVeVetroClaimableAmount() {
  const { address: account } = useAccount();
  const client = useHemiClient();
  return useQuery({
    ...veVetroClaimableSubsetOptions({ account, client }),
    select: ({ amount }) => amount,
  });
}
