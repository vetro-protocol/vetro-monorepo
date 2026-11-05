import { useQuery } from "@tanstack/react-query";
import { useHemiClient } from "hooks/useHemiClient";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";

export function useVeVetroUnlockTimestamp() {
  const client = useHemiClient();
  return useQuery({
    ...veVetroConfigOptions(client),
    select: ({ unlockTimestamp }) => unlockTimestamp,
  });
}
