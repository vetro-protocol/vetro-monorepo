import type { QueryClient } from "@tanstack/react-query";
import { previewBridgeQueryOptions } from "hooks/usePreviewBridge";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { weiToUsd } from "utils/fees";
import type { Address, Chain, Client } from "viem";

/**
 * Returns the LayerZero native messaging fee for a bridge send, priced in
 * USD using the source chain's native currency price.
 */
export const fetchBridgeLayerZeroFee = async function ({
  amount,
  client,
  destinationChainId,
  oftAddress,
  queryClient,
  recipient,
  sourceChainId,
}: {
  amount: bigint;
  client: Client;
  destinationChainId: Chain["id"];
  oftAddress: Address;
  queryClient: QueryClient;
  recipient: Address;
  sourceChainId: Chain["id"];
}) {
  const sourceChain = client.chain;
  if (!sourceChain) {
    throw new Error("Client is missing a chain");
  }

  const [fee, prices] = await Promise.all([
    queryClient.ensureQueryData(
      previewBridgeQueryOptions({
        amount,
        client,
        destinationChainId,
        oftAddress,
        recipient,
        sourceChainId,
      }),
    ),
    queryClient.ensureQueryData(tokenPricesOptions()),
  ]);

  const nativeSymbol = sourceChain.nativeCurrency.symbol.toUpperCase();
  const rawPrice = prices[nativeSymbol];
  const nativePrice = typeof rawPrice === "string" ? parseFloat(rawPrice) : NaN;
  if (!Number.isFinite(nativePrice)) {
    throw new Error(`Invalid ${nativeSymbol} price received from API`);
  }

  return weiToUsd({ ethPrice: nativePrice, wei: fee.nativeFee });
};
