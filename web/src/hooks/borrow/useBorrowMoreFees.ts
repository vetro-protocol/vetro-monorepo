import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchBorrowGasUnits } from "fetchers/fetchBorrowGasUnits";
import { fetchTotalBorrowFees } from "fetchers/fetchTotalBorrowFees";
import { useEthereumClient } from "hooks/useEthereumClient";
import { mainnet } from "networks/mainnet";
import { type Address, type Chain, type Client, type Hash } from "viem";
import { useAccount } from "wagmi";

const borrowGasUnitsQueryKey = ({
  amount,
  chainId,
  marketId,
  owner,
}: {
  amount: bigint;
  chainId: Chain["id"];
  marketId: Hash;
  owner: Address | undefined;
}) => ["borrow-gas-units", chainId, marketId, owner, amount.toString()];

export const borrowGasUnitsOptions = ({
  amount,
  chainId,
  client,
  marketId,
  owner,
}: {
  amount: bigint;
  chainId: Chain["id"];
  client: Client | undefined;
  marketId: Hash;
  owner: Address | undefined;
}) =>
  queryOptions({
    enabled: !!client && !!owner && amount > 0n,
    queryFn: ({ client: queryClient }) =>
      fetchBorrowGasUnits({
        amount,
        client: client!,
        marketId,
        owner: owner!,
        queryClient,
      }),
    queryKey: borrowGasUnitsQueryKey({ amount, chainId, marketId, owner }),
  });

const totalBorrowFeesQueryKey = ({
  amount,
  chainId,
  marketId,
  owner,
}: {
  amount: bigint;
  chainId: Chain["id"];
  marketId: Hash;
  owner: Address | undefined;
}) => ["total-borrow-fees", chainId, marketId, owner, amount.toString()];

const totalBorrowFeesOptions = ({
  amount,
  chain,
  client,
  marketId,
  owner,
}: {
  amount: bigint;
  chain: Chain;
  client: Client | undefined;
  marketId: Hash;
  owner: Address | undefined;
}) =>
  queryOptions({
    enabled: !!client && !!owner && amount > 0n,
    queryFn: ({ client: queryClient }) =>
      fetchTotalBorrowFees({
        amount,
        chain,
        client: client!,
        marketId,
        owner: owner!,
        queryClient,
      }),
    queryKey: totalBorrowFeesQueryKey({
      amount,
      chainId: chain.id,
      marketId,
      owner,
    }),
  });

export const useTotalBorrowMoreFees = function ({
  amount,
  marketId,
}: {
  amount: bigint;
  marketId: Hash;
}) {
  const { address: owner } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    totalBorrowFeesOptions({
      amount,
      chain: mainnet,
      client,
      marketId,
      owner,
    }),
  );
};
