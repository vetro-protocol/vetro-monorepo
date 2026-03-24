import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import type { QueryClient } from "@tanstack/react-query";
import { parseEthPrice } from "hooks/useEthPrice";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { withdrawGasUnitsOptions } from "pages/earn/hooks/useWithdrawFees";
import { config } from "providers/web3Provider";
import { weiToUsd } from "utils/fees";
import { type Address, type Chain, type Client } from "viem";

/**
 * Calculates the total fees in USD for an earn withdraw.
 * Network fees only (no protocol fees).
 */
export const fetchTotalWithdrawFees = async function ({
  amount,
  chain,
  client,
  owner,
  queryClient,
}: {
  amount: bigint;
  chain: Chain;
  client: Client;
  owner: Address;
  queryClient: QueryClient;
}) {
  const pricesPromise = queryClient.ensureQueryData(tokenPricesOptions());

  const gasUnits = await queryClient.ensureQueryData(
    withdrawGasUnitsOptions({
      account: owner,
      amount,
      chainId: chain.id,
      client,
      queryClient,
    }),
  );

  const [networkFeeWei, prices] = await Promise.all([
    queryClient.ensureQueryData(
      estimateFeesQueryOptions({
        chainId: chain.id,
        config,
        gasUnits,
        queryClient,
      }),
    ),
    pricesPromise,
  ]);

  return weiToUsd({ ethPrice: parseEthPrice(prices), wei: networkFeeWei });
};
