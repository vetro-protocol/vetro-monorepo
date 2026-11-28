import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";

import {
  Deposit,
  Lock,
  Transfer,
  Withdraw,
} from "../generated/VeVetro/VeVetro";
import {
  Claimed,
  PositionClaimed,
} from "../generated/VeVetroDistributor/VeVetroDistributor";

const addressParam = (name: string, value: Address): ethereum.EventParam =>
  new ethereum.EventParam(name, ethereum.Value.fromAddress(value));

const boolParam = (name: string, value: boolean): ethereum.EventParam =>
  new ethereum.EventParam(name, ethereum.Value.fromBoolean(value));

const uintParam = (name: string, value: BigInt): ethereum.EventParam =>
  new ethereum.EventParam(name, ethereum.Value.fromUnsignedBigInt(value));

// AssemblyScript has no object types: an object literal needs a class whose
// fields all have an initial value
class ClaimedParams {
  amount: BigInt = BigInt.zero();
  claimant: Address = Address.zero();
  logIndex: i32 = 0;
  recipient: Address = Address.zero();
  targetTokenId: BigInt = BigInt.zero();
}

export function createClaimedEvent(params: ClaimedParams): Claimed {
  const event = changetype<Claimed>(newMockEvent());
  event.logIndex = BigInt.fromI32(params.logIndex);
  event.parameters = [
    addressParam("claimant", params.claimant),
    addressParam("recipient", params.recipient),
    uintParam("amount", params.amount),
    uintParam("targetTokenId", params.targetTokenId),
  ];
  return event;
}

class DepositParams {
  amount: BigInt = BigInt.zero();
  lockTime: BigInt = BigInt.zero();
  tokenId: BigInt = BigInt.zero();
}

export function createDepositEvent(params: DepositParams): Deposit {
  const event = changetype<Deposit>(newMockEvent());
  event.parameters = [
    addressParam("provider", Address.zero()),
    uintParam("tokenId", params.tokenId),
    uintParam("amount", params.amount),
    uintParam("lockTime", params.lockTime),
    uintParam("timestamp", event.block.timestamp),
  ];
  return event;
}

class LockParams {
  account: Address = Address.zero();
  amount: BigInt = BigInt.zero();
  lockTime: BigInt = BigInt.zero();
  start: BigInt = BigInt.zero();
  tokenId: BigInt = BigInt.zero();
  transferable: boolean = false;
}

export function createLockEvent(params: LockParams): Lock {
  const event = changetype<Lock>(newMockEvent());
  event.parameters = [
    addressParam("provider", params.account),
    addressParam("account", params.account),
    uintParam("tokenId", params.tokenId),
    uintParam("amount", params.amount),
    uintParam("start", params.start),
    uintParam("lockTime", params.lockTime),
    uintParam("extraData", BigInt.zero()),
    boolParam("transferable", params.transferable),
    boolParam("forfeitable", false),
  ];
  return event;
}

class PositionClaimedParams {
  claimant: Address = Address.zero();
  share: BigInt = BigInt.zero();
  tokenId: BigInt = BigInt.zero();
  weight: BigInt = BigInt.zero();
}

export function createPositionClaimedEvent(
  params: PositionClaimedParams,
): PositionClaimed {
  const event = changetype<PositionClaimed>(newMockEvent());
  event.parameters = [
    uintParam("tokenId", params.tokenId),
    addressParam("claimant", params.claimant),
    new ethereum.EventParam("bucket", ethereum.Value.fromI32(0)),
    uintParam("weight", params.weight),
    uintParam("share", params.share),
  ];
  return event;
}

class TransferParams {
  from: Address = Address.zero();
  logIndex: i32 = 0;
  to: Address = Address.zero();
  tokenId: BigInt = BigInt.zero();
}

export function createTransferEvent(params: TransferParams): Transfer {
  const event = changetype<Transfer>(newMockEvent());
  event.logIndex = BigInt.fromI32(params.logIndex);
  event.parameters = [
    addressParam("from", params.from),
    addressParam("to", params.to),
    uintParam("tokenId", params.tokenId),
  ];
  return event;
}

export function createWithdrawEvent(tokenId: BigInt): Withdraw {
  const event = changetype<Withdraw>(newMockEvent());
  event.parameters = [
    addressParam("provider", Address.zero()),
    uintParam("tokenId", tokenId),
    uintParam("amount", BigInt.zero()),
    uintParam("timestamp", event.block.timestamp),
  ];
  return event;
}
