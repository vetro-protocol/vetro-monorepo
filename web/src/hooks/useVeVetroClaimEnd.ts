import { useQuery } from "@tanstack/react-query";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";

export const useVeVetroClaimEnd = () =>
  useQuery({
    ...veVetroConfigOptions(),
    select: ({ claimEnd }) => claimEnd,
  });
