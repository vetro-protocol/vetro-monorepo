import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";

import {
  WithdrawCancelled,
  WithdrawClaimed,
  WithdrawRequested,
} from "../generated/sVusdStakingVault/StakingVault";

export function createMockBlock(
  number: BigInt,
  timestamp: BigInt,
): ethereum.Block {
  const event = newMockEvent();
  const block = event.block;
  block.number = number;
  block.timestamp = timestamp;
  return block;
}

export function createWithdrawCancelledEvent(
  assets: BigInt,
  owner: Address,
  requestId: BigInt,
  shares: BigInt,
): WithdrawCancelled {
  const event = changetype<WithdrawCancelled>(newMockEvent());
  event.parameters = [];
  event.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "requestId",
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "assets",
      ethereum.Value.fromUnsignedBigInt(assets),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "shares",
      ethereum.Value.fromUnsignedBigInt(shares),
    ),
  );
  return event;
}

export function createWithdrawClaimedEvent(
  assets: BigInt,
  owner: Address,
  receiver: Address,
  requestId: BigInt,
): WithdrawClaimed {
  const event = changetype<WithdrawClaimed>(newMockEvent());
  event.parameters = [];
  event.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
  );
  event.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "requestId",
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "assets",
      ethereum.Value.fromUnsignedBigInt(assets),
    ),
  );
  return event;
}

// eslint-disable-next-line max-params
export function createWithdrawRequestedEvent(
  assets: BigInt,
  claimableAt: BigInt,
  owner: Address,
  requestId: BigInt,
  shares: BigInt,
): WithdrawRequested {
  const event = changetype<WithdrawRequested>(newMockEvent());
  event.parameters = [];
  event.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "requestId",
      ethereum.Value.fromUnsignedBigInt(requestId),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "shares",
      ethereum.Value.fromUnsignedBigInt(shares),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "assets",
      ethereum.Value.fromUnsignedBigInt(assets),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "claimableAt",
      ethereum.Value.fromUnsignedBigInt(claimableAt),
    ),
  );
  return event;
}
