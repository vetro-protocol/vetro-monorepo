import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import { oftAbi } from "@vetro-protocol/bridge";
import { encodeSend } from "@vetro-protocol/bridge/actions";
import { previewBridgeQueryOptions } from "hooks/usePreviewBridge";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { config } from "providers/web3Provider";
import type { BridgeableToken } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { weiToUsd } from "utils/fees";
import { type Address, type Chain, type Client } from "viem";
import { estimateGas, readContract } from "viem/actions";

import { estimateApprovalGasUnits } from "./estimateApprovalGasUnits";

/**
 * Returns the on-chain network fee for a bridge send (approval gas if the
 * OFT requires it plus send gas), priced in USD using the source chain's
 * native currency price. Throws if the amount exceeds the user's balance.
 */
export const fetchBridgeNetworkFee = async function ({
  amount,
  approveAmount,
  client,
  destinationChainId,
  oftAddress,
  owner,
  queryClient,
  recipient,
  sourceChainId,
  sourceToken,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  client: Client;
  destinationChainId: Chain["id"];
  oftAddress: Address;
  owner: Address;
  queryClient: QueryClient;
  recipient: Address;
  sourceChainId: Chain["id"];
  sourceToken: BridgeableToken;
}) {
  const sourceChain = client.chain;
  if (!sourceChain) {
    throw new Error("Client is missing a chain");
  }

  const balance = await queryClient.ensureQueryData(
    tokenBalanceQueryOptions({
      account: owner,
      client,
      token: sourceToken,
    }),
  );

  if (amount > balance) {
    throw new Error("Insufficient token balance");
  }

  const [fee, approvalRequired] = await Promise.all([
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
    readContract(client, {
      abi: oftAbi,
      address: oftAddress,
      functionName: "approvalRequired",
    }),
  ]);

  const approvalGasPromise = approvalRequired
    ? estimateApprovalGasUnits({
        amount,
        approveAmount,
        client,
        owner,
        queryClient,
        spender: oftAddress,
        token: sourceToken,
      })
    : Promise.resolve(0n);

  const sendGasPromise = estimateGas(client, {
    account: owner,
    data: encodeSend({
      amount,
      destinationChainId,
      fee,
      recipient,
      refundAddress: owner,
    }),
    stateOverride: approvalRequired
      ? createErc20AllowanceStateOverride({
          owner,
          spender: oftAddress,
          token: sourceToken,
        })
      : undefined,
    to: oftAddress,
    value: fee.nativeFee,
  });

  const [approvalGas, sendGas] = await Promise.all([
    approvalGasPromise,
    sendGasPromise,
  ]);

  const [networkFeeWei, prices] = await Promise.all([
    queryClient.ensureQueryData(
      estimateFeesQueryOptions({
        chainId: sourceChain.id,
        config,
        gasUnits: approvalGas + sendGas,
        queryClient,
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

  return weiToUsd({ ethPrice: nativePrice, wei: networkFeeWei });
};
