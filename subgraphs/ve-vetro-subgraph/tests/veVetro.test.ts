import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  assert,
  beforeEach,
  clearStore,
  describe,
  newMockEvent,
  test,
} from "matchstick-as/assembly/index";

import { VeVetroPosition } from "../generated/schema";
import {
  handleDeposit,
  handleLock,
  handleTransfer,
  handleWithdraw,
} from "../src/mappings/veVetro";

import {
  createDepositEvent,
  createLockEvent,
  createTransferEvent,
  createWithdrawEvent,
} from "./utils";

const ownerString = "0x1111111111111111111111111111111111111111";
const owner = Address.fromString(ownerString);
const receiverString = "0x2222222222222222222222222222222222222222";
const receiver = Address.fromString(receiverString);

const amount = BigInt.fromString("1000000000000000000");
const lockTime = BigInt.fromI32(31557600); // 1 year
const start = BigInt.fromI32(1793577600);
const tokenId = BigInt.fromI32(7);
const id = "7";
// floor((start + lockTime) / SIX_DAYS) * SIX_DAYS, SIX_DAYS = 525960
const roundedUnlockTime = "1825081200";

// Every mock event has the same transaction hash
const transactionHash = newMockEvent().transaction.hash;

const transferId = (logIndex: i32): string =>
  transactionHash.concatI32(logIndex).toHexString();

function lock(transferable: boolean): void {
  handleLock(
    createLockEvent({
      account: owner,
      amount,
      lockTime,
      start,
      tokenId,
      transferable,
    }),
  );
}

describe("veVETRO", function () {
  beforeEach(function () {
    clearStore();
  });

  describe("handleLock", function () {
    test("creates a transferable position", function () {
      lock(true);

      assert.entityCount("VeVetroPosition", 1);
      assert.fieldEquals("VeVetroPosition", id, "amount", amount.toString());
      assert.fieldEquals("VeVetroPosition", id, "owner", ownerString);
      assert.fieldEquals("VeVetroPosition", id, "start", start.toString());
      assert.fieldEquals("VeVetroPosition", id, "status", "active");
      assert.fieldEquals("VeVetroPosition", id, "transferableAfter", "0");
      assert.fieldEquals(
        "VeVetroPosition",
        id,
        "unlockTime",
        roundedUnlockTime,
      );
      assert.assertTrue(!VeVetroPosition.load(id)!.isSet("claim"));
    });

    test("sets transferableAfter of a non-transferable position to its rounded unlock time", function () {
      lock(false);

      assert.fieldEquals(
        "VeVetroPosition",
        id,
        "transferableAfter",
        roundedUnlockTime,
      );
    });
  });

  describe("handleDeposit", function () {
    test("ignores the Deposit of a mint, which comes before its Lock", function () {
      handleDeposit(
        createDepositEvent({ amount, lockTime: start.plus(lockTime), tokenId }),
      );

      assert.entityCount("VeVetroPosition", 0);
    });

    test("adds the amount and stores the emitted lock end", function () {
      lock(false);
      // Deposit emits a lock end already rounded to SIX_DAYS
      const newEnd = BigInt.fromString(roundedUnlockTime).plus(
        BigInt.fromI32(525960),
      );

      handleDeposit(createDepositEvent({ amount, lockTime: newEnd, tokenId }));

      assert.fieldEquals(
        "VeVetroPosition",
        id,
        "amount",
        amount.times(BigInt.fromI32(2)).toString(),
      );
      assert.fieldEquals(
        "VeVetroPosition",
        id,
        "unlockTime",
        newEnd.toString(),
      );
      // increaseUnlockTime doesn't move it
      assert.fieldEquals(
        "VeVetroPosition",
        id,
        "transferableAfter",
        roundedUnlockTime,
      );
    });
  });

  describe("handleTransfer", function () {
    test("changes the owner and records the transfer", function () {
      lock(true);

      handleTransfer(
        createTransferEvent({
          from: owner,
          logIndex: 3,
          to: receiver,
          tokenId,
        }),
      );

      assert.fieldEquals("VeVetroPosition", id, "owner", receiverString);
      assert.entityCount("PositionTransfer", 1);
      const transfer = transferId(3);
      assert.fieldEquals("PositionTransfer", transfer, "from", ownerString);
      assert.fieldEquals("PositionTransfer", transfer, "position", id);
      assert.fieldEquals("PositionTransfer", transfer, "to", receiverString);
    });

    test("skips mints, burns and self-transfers", function () {
      lock(true);

      handleTransfer(
        createTransferEvent({
          from: Address.zero(),
          logIndex: 1,
          to: owner,
          tokenId,
        }),
      );
      handleTransfer(
        createTransferEvent({ from: owner, logIndex: 2, to: owner, tokenId }),
      );
      handleTransfer(
        createTransferEvent({
          from: owner,
          logIndex: 3,
          to: Address.zero(),
          tokenId,
        }),
      );

      assert.fieldEquals("VeVetroPosition", id, "owner", ownerString);
      assert.entityCount("PositionTransfer", 0);
    });

    test("skips unknown positions", function () {
      handleTransfer(
        createTransferEvent({
          from: owner,
          logIndex: 3,
          to: receiver,
          tokenId,
        }),
      );

      assert.entityCount("PositionTransfer", 0);
      assert.entityCount("VeVetroPosition", 0);
    });
  });

  describe("handleWithdraw", function () {
    test("marks the position as withdrawn", function () {
      lock(true);

      handleWithdraw(createWithdrawEvent(tokenId));

      assert.fieldEquals("VeVetroPosition", id, "status", "withdrawn");
      assert.fieldEquals("VeVetroPosition", id, "owner", ownerString);
    });
  });
});
