import { queryOptions } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const averagePurchasePriceQueryKey = (address: Address | undefined) => [
  "average-purchase-price",
  address,
];

export const averagePurchasePriceQueryOptions = ({
  address,
}: {
  address: Address | undefined;
}) =>
  queryOptions({
    enabled:
      apiUrl !== undefined && isValidUrl(apiUrl) && address !== undefined,
    async queryFn() {
      const data = (await fetch(
        `${apiUrl}/variable-stake/average-purchase-price/${address}`,
      )) as Record<Address, string>;
      return Object.fromEntries(
        Object.entries(data).map(
          ([vault, price]) => [vault as Address, BigInt(price)] as const,
        ),
      ) as Record<Address, bigint>;
    },
    queryKey: averagePurchasePriceQueryKey(address),
  });
