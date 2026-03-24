import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import type { QueryClient } from "@tanstack/react-query";
import { parseEthPrice } from "hooks/useEthPrice";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { depositGasUnitsOptions } from "pages/earn/hooks/useDepositFees";
import { config } from "providers/web3Provider";
import type { Token } from "types";
import { weiToUsd } from "utils/fees";
import { type Address, type Chain, type Client } from "viem";

/**
 * Calculates the total fees in USD for an earn deposit.
 * Network fees only (no protocol fees).
 */
export const fetchTotalDepositFees = async function ({
  amount,
  approveAmount,
  chain,
  client,
  owner,
  queryClient,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chain: Chain;
  client: Client;
  owner: Address;
  queryClient: QueryClient;
  token: Token;
}) {
  const pricesPromise = queryClient.ensureQueryData(tokenPricesOptions());

  const gasUnits = await queryClient.ensureQueryData(
    depositGasUnitsOptions({
      amount,
      approveAmount,
      chainId: chain.id,
      client,
      owner,
      queryClient,
      token,
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
