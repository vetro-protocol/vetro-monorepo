import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type UserReward = {
  token: {
    address: Address;
    symbol: string;
  };
};

export function useUserRewards() {
  const { address } = useAccount();

  return useQuery({
    enabled:
      apiUrl !== undefined && isValidUrl(apiUrl) && address !== undefined,
    queryFn: () =>
      fetch(`${apiUrl}/variable-stake/rewards/${address}`) as Promise<
        UserReward[]
      >,
    queryKey: ["user-rewards", address],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
