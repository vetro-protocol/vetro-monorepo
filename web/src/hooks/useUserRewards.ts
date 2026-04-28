import { queryOptions, useQuery } from "@tanstack/react-query";
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

const emptyRewards: UserReward[] = [];

const userRewardsOptions = ({
  address,
  stakingVaultAddress,
}: {
  address: Address | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled:
      apiUrl !== undefined && isValidUrl(apiUrl) && address !== undefined,
    queryFn: () =>
      fetch(`${apiUrl}/variable-stake/rewards/${address}`) as Promise<
        Record<Address, UserReward[]>
      >,
    queryKey: ["user-rewards", address],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    select: (data) => data[stakingVaultAddress] ?? emptyRewards,
  });

export function useUserRewards(stakingVaultAddress: Address) {
  const { address } = useAccount();

  return useQuery(userRewardsOptions({ address, stakingVaultAddress }));
}
