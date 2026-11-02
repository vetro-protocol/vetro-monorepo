import { isAddressValid } from "@vetro-protocol/core";
import type { Address, Client } from "viem";
import { readContract } from "viem/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";
import type { RequestKind, RequestStatus } from "../../types.ts";

export type Request = {
  amountOutMin: bigint;
  asset: Address;
  assets: bigint;
  automatic: boolean;
  kind: RequestKind;
  // Authorized to call Router.cancel for cooldown redeems.
  operator: Address;
  receiver: Address;
  share: Address;
  shares: bigint;
  status: RequestStatus;
};

export const getRequest = async function (
  client: Client,
  {
    address = hemiEarnRouterAddress,
    requestId,
  }: {
    address?: Address;
    requestId: bigint;
  },
): Promise<Request> {
  if (!client) {
    throw new Error("Client is not defined");
  }
  if (!isAddressValid(address)) {
    throw new Error("Router address is invalid");
  }
  // Router IDs start at 1; reject 0n so we don't read a zero-initialized struct.
  if (requestId <= BigInt(0)) {
    throw new Error("Request ID must be greater than zero");
  }

  const result = await readContract(client, {
    abi: hemiEarnRouterAbi,
    address,
    args: [requestId],
    functionName: "requests",
  });

  return {
    ...result,
    kind: result.kind as RequestKind,
    status: result.status as RequestStatus,
  };
};
