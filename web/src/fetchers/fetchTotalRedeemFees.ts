import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { parseEthPrice } from "hooks/useEthPrice";
import { redeemFeeOptions } from "hooks/useRedeemFee";
import { redeemGasUnitsOptions } from "hooks/useSwapRedeemFees";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { whitelistedTokensOptions } from "hooks/useWhitelistedTokens";
import { config } from "providers/web3Provider";
import type { Token } from "types";
import { applyBps } from "utils/fees";
import { getTokenPrice } from "utils/token";
import {
  type Address,
  type Chain,
  type Client,
  formatUnits,
  isAddressEqual,
} from "viem";

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

  const [networkFeeWei, protocolFeeAmount, prices, toToken] = await Promise.all(
    [
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
      queryClient
        .ensureQueryData(
          whitelistedTokensOptions({
            client,
            queryClient,
          }),
        )
        .then(
          (whitelistedTokens) =>
            whitelistedTokens.find((token) =>
              isAddressEqual(token.address, tokenOut),
            )!,
        ),
    ],
  );

  const ethPrice = parseEthPrice(prices);
  const networkFeeUsd =
    parseFloat(
      formatUnits(networkFeeWei ?? 0n, chain.nativeCurrency.decimals),
    ) * ethPrice;

  const tokenPrice = parseFloat(getTokenPrice(toToken, prices));
  const protocolFeeUsd =
    parseFloat(formatUnits(protocolFeeAmount, fromToken.decimals)) * tokenPrice;

  return networkFeeUsd + protocolFeeUsd;
};
