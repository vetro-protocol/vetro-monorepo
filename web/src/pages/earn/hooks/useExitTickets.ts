import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { getVetroApiUrl, isValidUrl } from "utils/url";
import { useAccount } from "wagmi";

import type { ExitTicket } from "../types";

const apiUrl = getVetroApiUrl();

export const exitTicketsQueryKey = (address: string | undefined) =>
  ["exit-tickets", address] as const;

export function useExitTickets() {
  const { address } = useAccount();

  return useQuery({
    enabled:
      apiUrl !== undefined && isValidUrl(apiUrl) && address !== undefined,
    queryFn: () =>
      fetch(`${apiUrl}/variable-stake/exit-tickets/${address}`) as Promise<
        ExitTicket[]
      >,
    queryKey: exitTicketsQueryKey(address),
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
}
