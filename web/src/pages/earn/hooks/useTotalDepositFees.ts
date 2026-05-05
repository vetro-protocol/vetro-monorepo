import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchTotalDepositFees } from "fetchers/fetchTotalDepositFees";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import type { Token } from "types";
import { type Address, type Chain, type Client } from "viem";
import { useAccount } from "wagmi";

const totalDepositFeesOptions = ({
  amount,
  approveAmount,
  chain,
  client,
  owner,
  queryClient,
  stakingVaultAddress,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chain: Chain;
  client: Client | undefined;
  owner: Address | undefined;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
  token: Token | undefined;
}) =>
  queryOptions({
    enabled: !!client && !!owner && !!token && amount > 0n,
    queryFn: () =>
      fetchTotalDepositFees({
        amount,
        approveAmount,
        chain,
        client: client!,
        owner: owner!,
        queryClient,
        stakingVaultAddress,
        token: token!,
      }),
    queryKey: [
      "total-deposit-fees",
      chain.id,
      token?.address,
      owner,
      amount.toString(),
      stakingVaultAddress,
    ],
  });

export const useTotalDepositFees = function ({
  amount,
  approveAmount,
  stakingVaultAddress,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  stakingVaultAddress: Address;
  token: Token | undefined;
}) {
  const { address: owner } = useAccount();
  const client = useEthereumClient();
  const ethereumChain = useMainnet();
  const queryClient = useQueryClient();

  return useQuery(
    totalDepositFeesOptions({
      amount,
      approveAmount,
      chain: ethereumChain,
      client,
      owner,
      queryClient,
      stakingVaultAddress,
      token,
    }),
  );
};
