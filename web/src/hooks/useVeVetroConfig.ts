import { queryOptions } from "@tanstack/react-query";
import { fetchVeVetroConfig } from "fetchers/fetchVeVetroConfig";

export const veVetroConfigOptions = () =>
  queryOptions({
    queryFn: fetchVeVetroConfig,
    queryKey: ["ve-vetro-config"],
    staleTime: Infinity,
  });
