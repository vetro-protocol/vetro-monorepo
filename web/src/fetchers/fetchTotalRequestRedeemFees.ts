import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import type { QueryClient } from "@tanstack/react-query";
import { parseEthPrice } from "hooks/useEthPrice";
import { requestRedeemGasUnitsOptions } from "hooks/useSwapRequestRedeemFees";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { config } from "providers/web3Provider";
import type { Token } from "types";
import { weiToUsd } from "utils/fees";
import { type Address, type Chain, type Client } from "viem";

/**
 * Calculates the total fees in USD for requesting a redeem. Does not include
 * protocol fees, as requesting a redeem only incurs network fees.
 */
export const fetchTotalRequestRedeemFees = async function ({
  amount,
  approveAmount,
  chain,
  client,
  fromToken,
  owner,
  queryClient,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chain: Chain;
  client: Client;
  fromToken: Token;
  owner: Address;
  queryClient: QueryClient;
}) {
  const gasUnits = await queryClient.ensureQueryData(
    requestRedeemGasUnitsOptions({
      amount,
      approveAmount,
      chainId: chain.id,
      client,
      fromToken,
      owner,
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
    queryClient.ensureQueryData(tokenPricesOptions()),
  ]);

  return weiToUsd({ ethPrice: parseEthPrice(prices), wei: networkFeeWei });
};
