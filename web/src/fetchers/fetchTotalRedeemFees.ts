import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { parseEthPrice } from "hooks/useEthPrice";
import { redeemFeeOptions } from "hooks/useRedeemFee";
import { redeemGasUnitsOptions } from "hooks/useSwapRedeemFees";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { config } from "providers/web3Provider";
import type { Token } from "types";
import { applyBps, weiToUsd } from "utils/fees";
import { getTokenPrice } from "utils/token";
import { type Address, type Chain, type Client, formatUnits } from "viem";

/**
 * Calculates the total fees in USD for redeeming. Includes both network fees
 * and protocol fees.
 */
export const fetchTotalRedeemFees = async function ({
  amount,
  approveAmount,
  chain,
  client,
  fromToken,
  minAmountOut,
  owner,
  queryClient,
  tokenOut,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chain: Chain;
  client: Client;
  fromToken: Token;
  minAmountOut: bigint;
  owner: Address;
  queryClient: QueryClient;
  tokenOut: Address;
}) {
  const gatewayAddress = getGatewayAddress(chain.id);

  const gasUnitsPromise = queryClient.ensureQueryData(
    redeemGasUnitsOptions({
      amount,
      approveAmount,
      chainId: chain.id,
      client,
      fromToken,
      minAmountOut,
      owner,
      queryClient,
      tokenOut,
    }),
  );

  const [networkFeeWei, protocolFeeAmount, prices] = await Promise.all([
    gasUnitsPromise.then((gasUnits) =>
      queryClient.ensureQueryData(
        estimateFeesQueryOptions({
          chainId: chain.id,
          config,
          gasUnits,
          queryClient,
        }),
      ),
    ),
    queryClient
      .ensureQueryData(
        redeemFeeOptions({
          chainId: chain.id,
          client,
          gatewayAddress,
          token: tokenOut,
        }),
      )
      .then((protocolFeeBps) => applyBps(amount, protocolFeeBps)),
    queryClient.ensureQueryData(tokenPricesOptions()),
  ]);

  const ethPrice = parseEthPrice(prices);
  const networkFeeUsd = weiToUsd({ ethPrice, wei: networkFeeWei });

  const tokenPrice = parseFloat(getTokenPrice(fromToken, prices));
  const protocolFeeUsd = parseFloat(
    (
      parseFloat(formatUnits(protocolFeeAmount, fromToken.decimals)) *
      tokenPrice
    ).toFixed(2),
  );

  return networkFeeUsd + protocolFeeUsd;
};
