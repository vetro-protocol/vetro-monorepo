import { queryOptions } from "@tanstack/react-query";
import { quoteSend } from "@vetro-protocol/bridge/actions";
import type { Address, Chain, Client } from "viem";

export const previewBridgeQueryKey = ({
  amount,
  destinationChainId,
  oftAddress,
  recipient,
  sourceChainId,
}: {
  amount: bigint;
  destinationChainId: Chain["id"];
  oftAddress: Address;
  recipient: Address;
  sourceChainId: Chain["id"];
}) => [
  "preview-bridge",
  sourceChainId,
  destinationChainId,
  oftAddress,
  recipient,
  amount.toString(),
];

export const previewBridgeQueryOptions = ({
  amount,
  client,
  destinationChainId,
  oftAddress,
  recipient,
  sourceChainId,
}: {
  amount: bigint;
  client: Client;
  destinationChainId: Chain["id"];
  oftAddress: Address;
  recipient: Address;
  sourceChainId: Chain["id"];
}) =>
  queryOptions({
    enabled: !!client && amount > 0n && !!recipient,
    queryFn: () =>
      quoteSend(client, {
        amount,
        destinationChainId,
        oftAddress,
        recipient,
      }),
    queryKey: previewBridgeQueryKey({
      amount,
      destinationChainId,
      oftAddress,
      recipient,
      sourceChainId,
    }),
  });
