import { queryOptions } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { getVetroApiUrl, isValidUrl } from "utils/url";
import type { Address } from "viem";

const apiUrl = getVetroApiUrl();

export const costBasisQueryKey = (address: Address | undefined) => [
  "cost-basis",
  address,
];

export const costBasisQueryOptions = ({
  address,
}: {
  address: Address | undefined;
}) =>
  queryOptions({
    enabled:
      apiUrl !== undefined && isValidUrl(apiUrl) && address !== undefined,
    async queryFn() {
      const data = (await fetch(
        `${apiUrl}/variable-stake/cost-basis/${address}`,
      )) as Record<Address, string>;
      return Object.fromEntries(
        Object.entries(data).map(
          ([vault, costBasis]) =>
            [vault as Address, BigInt(costBasis)] as const,
        ),
      ) as Record<Address, bigint>;
    },
    queryKey: costBasisQueryKey(address),
  });
