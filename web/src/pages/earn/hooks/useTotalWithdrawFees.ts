import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchTotalWithdrawFees } from "fetchers/fetchTotalWithdrawFees";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { type Address, type Chain, type Client } from "viem";
import { useAccount } from "wagmi";

const totalWithdrawFeesOptions = ({
  amount,
  chain,
  client,
  owner,
  queryClient,
}: {
  amount: bigint;
  chain: Chain;
  client: Client | undefined;
  owner: Address | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client && !!owner && amount > 0n,
    queryFn: () =>
      fetchTotalWithdrawFees({
        amount,
        chain,
        client: client!,
        owner: owner!,
        queryClient,
      }),
    queryKey: ["total-withdraw-fees", chain.id, owner, amount.toString()],
  });

export const useTotalWithdrawFees = function ({ amount }: { amount: bigint }) {
  const { address: owner } = useAccount();
  const client = useEthereumClient();
  const ethereumChain = useMainnet();
  const queryClient = useQueryClient();

  return useQuery(
    totalWithdrawFeesOptions({
      amount,
      chain: ethereumChain,
      client,
      owner,
      queryClient,
    }),
  );
};
