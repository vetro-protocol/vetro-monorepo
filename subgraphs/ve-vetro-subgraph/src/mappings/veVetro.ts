import { Address, BigInt, log } from "@graphprotocol/graph-ts";

import { PositionTransfer, VeVetroPosition } from "../../generated/schema";
import {
  Deposit,
  Lock,
  Transfer,
  Withdraw,
} from "../../generated/VeVetro/VeVetro";
import { getUnlockTime } from "../utils/lockTime";

// createLock emits Deposit before Lock, so a Deposit of an unknown position is
// part of its mint and Lock sets the values. Later ones come from
// increaseAmount and increaseUnlockTime.
export function handleDeposit(event: Deposit): void {
  const position = VeVetroPosition.load(event.params.tokenId.toString());
  if (position === null) {
    return;
  }
  position.amount = position.amount.plus(event.params.amount);
  position.unlockTime = event.params.lockTime;
  position.save();
}

export function handleLock(event: Lock): void {
  const unlockTime = getUnlockTime({
    lockTime: event.params.lockTime,
    start: event.params.start,
  });

  const position = new VeVetroPosition(event.params.tokenId.toString());
  position.amount = event.params.amount;
  position.blockNumber = event.block.number;
  position.blockTimestamp = event.block.timestamp;
  position.owner = event.params.account;
  position.start = event.params.start;
  position.status = "active";
  position.transactionHash = event.transaction.hash;
  // The flag goes stale: a non-transferable position becomes transferable at
  // its first unlock time, with no event, and increaseUnlockTime doesn't move it
  position.transferableAfter = event.params.transferable
    ? BigInt.zero()
    : unlockTime;
  position.unlockTime = unlockTime;
  position.save();
}

export function handleTransfer(event: Transfer): void {
  const from = event.params.from;
  const to = event.params.to;
  if (from.equals(Address.zero()) || to.equals(Address.zero())) {
    return;
  }
  if (from.equals(to)) {
    return;
  }

  const position = VeVetroPosition.load(event.params.tokenId.toString());
  if (position === null) {
    log.warning("Transfer of unknown position {} in transaction {}", [
      event.params.tokenId.toString(),
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  position.owner = to;
  position.save();

  const transfer = new PositionTransfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  );
  transfer.blockNumber = event.block.number;
  transfer.blockTimestamp = event.block.timestamp;
  transfer.from = from;
  transfer.position = position.id;
  transfer.to = to;
  transfer.transactionHash = event.transaction.hash;
  transfer.save();
}

// forfeit also emits Withdraw
export function handleWithdraw(event: Withdraw): void {
  const position = VeVetroPosition.load(event.params.tokenId.toString());
  if (position === null) {
    log.warning("Withdraw of unknown position {} in transaction {}", [
      event.params.tokenId.toString(),
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  position.status = "withdrawn";
  position.save();
}
