import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import type { QueryClient } from "@tanstack/react-query";
import { parseEthPrice } from "hooks/useEthPrice";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { config } from "providers/web3Provider";
import { weiToUsd } from "utils/fees";
import type { Chain } from "viem";

/**
 * Converts gas units to total network fees in USD.
 * Shared by all operation-specific fetchTotal*Fees functions.
 */
export const fetchTotalNetworkFees = async function ({
  chain,
  gasUnits,
  queryClient,
}: {
  chain: Chain;
  gasUnits: bigint;
  queryClient: QueryClient;
}) {
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
