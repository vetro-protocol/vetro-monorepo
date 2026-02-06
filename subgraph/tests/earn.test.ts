import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  assert,
  beforeEach,
  clearStore,
  createMockedFunction,
  dataSourceMock,
  describe,
  test,
} from "matchstick-as/assembly/index";

import {
  handleBlock,
  handleWithdrawCancelled,
  handleWithdrawClaimed,
  handleWithdrawRequested,
} from "../src/earn";

import {
  createMockBlock,
  createWithdrawCancelledEvent,
  createWithdrawClaimedEvent,
  createWithdrawRequestedEvent,
} from "./earn-utils";

const vaultAddressString = "0x1234567890123456789012345678901234567890";
const vaultAddress = Address.fromString(vaultAddressString);
const ownerAddressString = "0x1111111111111111111111111111111111111111";
const ownerAddress = Address.fromString(ownerAddressString);
const receiverAddressString = "0x2222222222222222222222222222222222222222";
const receiverAddress = Address.fromString(receiverAddressString);

const daySeconds = BigInt.fromI32(86400);

function mockVaultCalls(decimals: i32, shareValue: BigInt): void {
  createMockedFunction(vaultAddress, "decimals", "decimals():(uint8)")
    .withArgs([])
    .returns([ethereum.Value.fromI32(decimals)]);

  const oneShare = BigInt.fromI32(10).pow(<u8>decimals);
  createMockedFunction(
    vaultAddress,
    "convertToAssets",
    "convertToAssets(uint256):(uint256)",
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(oneShare)])
    .returns([ethereum.Value.fromUnsignedBigInt(shareValue)]);
}

describe("handleBlock", function () {
  beforeEach(function () {
    clearStore();
    dataSourceMock.setAddress(vaultAddressString);
  });

  test("creates VaultHistory for day timestamp", function () {
    const decimals = 18;
    const currentShareValue = BigInt.fromString("1050000000000000000"); // 1.05 assets per share
    const timestamp = BigInt.fromI32(1769731200); // 2026-01-30 00:00:00 UTC

    mockVaultCalls(decimals, currentShareValue);
    const block = createMockBlock(BigInt.fromI32(100), timestamp);
    handleBlock(block);

    const dayTimestamp = timestamp.div(daySeconds).times(daySeconds);
    const id = dayTimestamp.toString();
    assert.entityCount("VaultHistory", 1);
    assert.fieldEquals(
      "VaultHistory",
      id,
      "timestamp",
      dayTimestamp.toString(),
    );
    assert.fieldEquals(
      "VaultHistory",
      id,
      "shareValue",
      currentShareValue.toString(),
    );
  });

  test("updates VaultHistory on same day", function () {
    const decimals = 18;
    const initialShareValue = BigInt.fromString("1050000000000000000");
    const updatedShareValue = BigInt.fromString("1060000000000000000");
    const timestamp1 = BigInt.fromI32(1769734800); // 2026-01-30 01:00:00 UTC
    const timestamp2 = BigInt.fromI32(1769774400); // 2026-01-30 12:00:00 UTC

    mockVaultCalls(decimals, initialShareValue);
    const block1 = createMockBlock(BigInt.fromI32(100), timestamp1);
    handleBlock(block1);

    const dayTimestamp = timestamp1.div(daySeconds).times(daySeconds);
    const id = dayTimestamp.toString();
    assert.entityCount("VaultHistory", 1);

    mockVaultCalls(decimals, updatedShareValue);
    const block2 = createMockBlock(BigInt.fromI32(200), timestamp2);
    handleBlock(block2);

    assert.entityCount("VaultHistory", 1);
    assert.fieldEquals(
      "VaultHistory",
      id,
      "shareValue",
      updatedShareValue.toString(),
    );
    assert.fieldEquals(
      "VaultHistory",
      id,
      "timestamp",
      dayTimestamp.toString(),
    );
  });
});

describe("handleWithdrawRequested", function () {
  beforeEach(function () {
    clearStore();
  });

  test("creates ExitTicket from event", function () {
    const assets = BigInt.fromString("1000000000000000000");
    const claimableAt = BigInt.fromI32(1769817600);
    const requestId = BigInt.fromI32(1);
    const shares = BigInt.fromString("950000000000000000");

    const event = createWithdrawRequestedEvent(
      assets,
      claimableAt,
      ownerAddress,
      requestId,
      shares,
    );
    handleWithdrawRequested(event);

    const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}`;
    assert.entityCount("ExitTicket", 1);
    assert.fieldEquals("ExitTicket", id, "owner", ownerAddress.toHexString());
    assert.fieldEquals("ExitTicket", id, "assets", assets.toString());
    assert.fieldEquals("ExitTicket", id, "claimableAt", claimableAt.toString());
    assert.fieldEquals("ExitTicket", id, "requestId", requestId.toString());
    assert.fieldEquals("ExitTicket", id, "shares", shares.toString());
    assert.fieldEquals(
      "ExitTicket",
      id,
      "requestTxHash",
      event.transaction.hash.toHexString(),
    );
  });
});

describe("handleWithdrawCancelled", function () {
  beforeEach(function () {
    clearStore();
  });

  test("updates ExitTicket when cancelled", function () {
    const assets = BigInt.fromString("1000000000000000000");
    const claimableAt = BigInt.fromI32(1769817600);
    const requestId = BigInt.fromI32(1);
    const shares = BigInt.fromString("950000000000000000");

    const requestEvent = createWithdrawRequestedEvent(
      assets,
      claimableAt,
      ownerAddress,
      requestId,
      shares,
    );
    handleWithdrawRequested(requestEvent);

    const id = `${requestEvent.transaction.hash.toHex()}-${requestEvent.logIndex.toString()}`;
    assert.entityCount("ExitTicket", 1);

    const cancelEvent = createWithdrawCancelledEvent(
      assets,
      ownerAddress,
      requestId,
      shares,
    );
    handleWithdrawCancelled(cancelEvent);

    assert.entityCount("ExitTicket", 1);
    assert.fieldEquals(
      "ExitTicket",
      id,
      "cancelTxHash",
      cancelEvent.transaction.hash.toHexString(),
    );
  });

  test("ignores missing ExitTicket on cancel", function () {
    const assets = BigInt.fromString("1000000000000000000");
    const requestId = BigInt.fromI32(999);
    const shares = BigInt.fromString("950000000000000000");

    const cancelEvent = createWithdrawCancelledEvent(
      assets,
      ownerAddress,
      requestId,
      shares,
    );
    handleWithdrawCancelled(cancelEvent);

    assert.entityCount("ExitTicket", 0);
  });
});

describe("handleWithdrawClaimed", function () {
  beforeEach(function () {
    clearStore();
  });

  test("updates ExitTicket when claimed", function () {
    const assets = BigInt.fromString("1000000000000000000");
    const claimableAt = BigInt.fromI32(1769817600);
    const requestId = BigInt.fromI32(1);
    const shares = BigInt.fromString("950000000000000000");

    const requestEvent = createWithdrawRequestedEvent(
      assets,
      claimableAt,
      ownerAddress,
      requestId,
      shares,
    );
    handleWithdrawRequested(requestEvent);

    const id = `${requestEvent.transaction.hash.toHex()}-${requestEvent.logIndex.toString()}`;
    assert.entityCount("ExitTicket", 1);

    const claimEvent = createWithdrawClaimedEvent(
      assets,
      ownerAddress,
      receiverAddress,
      requestId,
    );
    handleWithdrawClaimed(claimEvent);

    assert.entityCount("ExitTicket", 1);
    assert.fieldEquals(
      "ExitTicket",
      id,
      "claimTxHash",
      claimEvent.transaction.hash.toHexString(),
    );
  });

  test("ignores missing ExitTicket on claim", function () {
    const assets = BigInt.fromString("1000000000000000000");
    const requestId = BigInt.fromI32(999);

    const claimEvent = createWithdrawClaimedEvent(
      assets,
      ownerAddress,
      receiverAddress,
      requestId,
    );
    handleWithdrawClaimed(claimEvent);

    assert.entityCount("ExitTicket", 0);
  });
});
