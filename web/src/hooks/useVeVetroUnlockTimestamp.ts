import { useQuery } from "@tanstack/react-query";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";

export const useVeVetroUnlockTimestamp = () =>
  useQuery({
    ...veVetroConfigOptions(),
    select: ({ unlockTimestamp }) => unlockTimestamp,
  });
