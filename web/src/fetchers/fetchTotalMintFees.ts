import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { parseEthPrice } from "hooks/useEthPrice";
import { mintFeeOptions } from "hooks/useMintFee";
import { pricesOptions } from "hooks/usePrices";
import { mintGasUnitsOptions } from "hooks/useSwapMintFees";
import { config } from "providers/web3Provider";
import type { Token } from "types";
import { applyBps, weiToUsd } from "utils/fees";
import { getTokenPrice } from "utils/token";
import { type Address, type Chain, type Client, formatUnits } from "viem";

/**
 * Calculates the total fees in USD for minting. Includes both network fees
 * and protocol fees.
 */
export const fetchTotalMintFees = async function ({
  amount,
  approveAmount,
  chain,
  client,
  fromToken,
  minPeggedTokenOut,
  owner,
  queryClient,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chain: Chain;
  client: Client;
  fromToken: Token;
  minPeggedTokenOut: bigint;
  owner: Address;
  queryClient: QueryClient;
}) {
  const gatewayAddress = getGatewayAddress(chain.id);

  const gasUnits = await queryClient.ensureQueryData(
    mintGasUnitsOptions({
      amount,
      approveAmount,
      chainId: chain.id,
      client,
      fromToken,
      minPeggedTokenOut,
      owner,
      queryClient,
    }),
  );

  const [networkFeeWei, protocolFeeAmount, prices] = await Promise.all([
    queryClient.ensureQueryData(
      estimateFeesQueryOptions({
        chainId: chain.id,
        config,
        gasUnits,
        queryClient,
      }),
    ),
    queryClient
      .ensureQueryData(
        mintFeeOptions({
          chainId: chain.id,
          client,
          gatewayAddress,
          token: fromToken.address,
        }),
      )
      .then((protocolFeeBps) => applyBps(amount, protocolFeeBps)),
    queryClient.ensureQueryData(pricesOptions({ client, queryClient })),
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
