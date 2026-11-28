import { useQuery } from "@tanstack/react-query";
import { useHemiClient } from "hooks/useHemiClient";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";

export function useVeVetroClaimEnd() {
  const client = useHemiClient();
  return useQuery({
    ...veVetroConfigOptions(client),
    select: ({ claimEnd }) => claimEnd,
  });
}
