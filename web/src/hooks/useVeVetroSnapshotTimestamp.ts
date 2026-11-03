import { useQuery } from "@tanstack/react-query";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";

export const useVeVetroSnapshotTimestamp = () =>
  useQuery({
    ...veVetroConfigOptions(),
    select: ({ snapshotTimestamp }) => snapshotTimestamp,
  });
