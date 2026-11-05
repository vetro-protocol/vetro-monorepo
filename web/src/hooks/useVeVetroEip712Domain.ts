import { queryOptions } from "@tanstack/react-query";
import { fetchVeVetroEip712Domain } from "fetchers/fetchVeVetroEip712Domain";

export const veVetroEip712DomainOptions = () =>
  queryOptions({
    queryFn: fetchVeVetroEip712Domain,
    queryKey: ["ve-vetro-eip712-domain"],
    staleTime: Infinity,
  });
