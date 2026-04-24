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
  handleDeposit,
  handleTransfer,
  handleWithdrawCancelled,
  handleWithdrawClaimed,
  handleWithdrawRequested,
} from "../src/earn";

import {
  createDepositEvent,
  createMockBlock,
  createTransferEvent,
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

function mockBalanceOf(balance: BigInt): void {
  createMockedFunction(
    vaultAddress,
    "balanceOf",
    "balanceOf(address):(uint256)",
  )
    .withArgs([ethereum.Value.fromAddress(ownerAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(balance)]);
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
    const id = `${vaultAddressString}-${dayTimestamp.toString()}`;
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
    assert.fieldEquals(
      "VaultHistory",
      id,
      "stakingVaultAddress",
      vaultAddressString,
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
    const id = `${vaultAddressString}-${dayTimestamp.toString()}`;
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

describe("handleDeposit", function () {
  beforeEach(function () {
    clearStore();
    dataSourceMock.setAddress(vaultAddressString);
  });

  test("sets average price on first deposit", function () {
    // t0: Deposit 100 VUSD, get 100 sVUSD. Price = 1.0
    const assets = BigInt.fromString("100000000000000000000"); // 100e18
    const shares = BigInt.fromString("100000000000000000000"); // 100e18
    const balanceAfter = BigInt.fromString("100000000000000000000"); // 100e18

    mockBalanceOf(balanceAfter);
    const event = createDepositEvent(
      assets,
      ownerAddress,
      ownerAddress,
      shares,
    );
    handleDeposit(event);

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.entityCount("UserStakingPosition", 1);
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "averagePrice",
      "1000000000000000000",
    );
    assert.fieldEquals("UserStakingPosition", id, "owner", ownerAddressString);
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "stakingVaultAddress",
      vaultAddressString,
    );
  });

  test("updates average price on subsequent deposit", function () {
    // t0: 100 VUSD -> 100 sVUSD, price = 1.0
    mockBalanceOf(BigInt.fromString("100000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("100000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t1: 110 VUSD -> 100 sVUSD, balanceOf = 200, price = 1.05
    mockBalanceOf(BigInt.fromString("200000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("110000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "averagePrice",
      "1050000000000000000",
    );
  });

  test("average price unchanged by withdrawal, updates on next deposit", function () {
    // t0: 100 VUSD -> 100 sVUSD
    mockBalanceOf(BigInt.fromString("100000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("100000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t1: 110 VUSD -> 100 sVUSD, balance = 200
    mockBalanceOf(BigInt.fromString("200000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("110000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t2: withdrawal of 50 sVUSD happens on-chain (not handled by subgraph)
    // t3: 120 VUSD -> 100 sVUSD, balanceOf = 250 (150 old + 100 new)
    mockBalanceOf(BigInt.fromString("250000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    // (150 * 1.05 + 100 * 1.2) / 250 = 1.11
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "averagePrice",
      "1110000000000000000",
    );
  });

  test("tracks average price across multiple deposits and withdrawals", function () {
    // Full sequence: t0, t1, t2 (withdrawal), t3, t4
    // t0: 100 VUSD -> 100 sVUSD
    mockBalanceOf(BigInt.fromString("100000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("100000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t1: 110 VUSD -> 100 sVUSD, balance = 200
    mockBalanceOf(BigInt.fromString("200000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("110000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t2: withdrawal (not tracked), balance goes from 200 to 150
    // t3: 120 VUSD -> 100 sVUSD, balance = 250
    mockBalanceOf(BigInt.fromString("250000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t4: 75 VUSD -> 50 sVUSD, balance = 300
    mockBalanceOf(BigInt.fromString("300000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("75000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    // (250 * 1.11 + 50 * 1.5) / 300 = 1.175
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "averagePrice",
      "1175000000000000000",
    );
  });
});

describe("handleWithdrawRequested", function () {
  beforeEach(function () {
    clearStore();
    dataSourceMock.setAddress(vaultAddressString);
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

    const id = `${vaultAddressString}-${requestId.toString()}`;
    assert.entityCount("ExitTicket", 1);
    assert.fieldEquals("ExitTicket", id, "owner", ownerAddress.toHexString());
    assert.fieldEquals("ExitTicket", id, "assets", assets.toString());
    assert.fieldEquals("ExitTicket", id, "claimableAt", claimableAt.toString());
    assert.fieldEquals("ExitTicket", id, "requestId", requestId.toString());
    assert.fieldEquals("ExitTicket", id, "shares", shares.toString());
    assert.fieldEquals(
      "ExitTicket",
      id,
      "stakingVaultAddress",
      vaultAddressString,
    );
    assert.fieldEquals(
      "ExitTicket",
      id,
      "requestTxHash",
      event.transaction.hash.toHexString(),
    );
    assert.fieldEquals(
      "ExitTicketQueueSummary",
      vaultAddressString,
      "openTickets",
      "1",
    );
    assert.fieldEquals(
      "ExitTicketQueueSummary",
      vaultAddressString,
      "shares",
      shares.toString(),
    );
    assert.fieldEquals(
      "ExitTicketQueueSummary",
      vaultAddressString,
      "stakingVaultAddress",
      vaultAddressString,
    );
  });
});

describe("handleWithdrawCancelled", function () {
  beforeEach(function () {
    clearStore();
    dataSourceMock.setAddress(vaultAddressString);
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

    const id = `${vaultAddressString}-${requestId.toString()}`;
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
    assert.fieldEquals(
      "ExitTicketQueueSummary",
      vaultAddressString,
      "openTickets",
      "0",
    );
    assert.fieldEquals(
      "ExitTicketQueueSummary",
      vaultAddressString,
      "shares",
      "0",
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
    dataSourceMock.setAddress(vaultAddressString);
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

    const id = `${vaultAddressString}-${requestId.toString()}`;
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
    assert.fieldEquals(
      "ExitTicketQueueSummary",
      vaultAddressString,
      "openTickets",
      "0",
    );
    assert.fieldEquals(
      "ExitTicketQueueSummary",
      vaultAddressString,
      "shares",
      "0",
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

describe("handleTransfer", function () {
  beforeEach(function () {
    clearStore();
    dataSourceMock.setAddress(vaultAddressString);
  });

  test("updates average price on transfer-in", function () {
    // t0: Deposit 120 VUSD -> 100 sVUSD, price = 1.2
    mockBalanceOf(BigInt.fromString("100000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t1: Receive 50 sVUSD via transfer, balance = 150
    mockBalanceOf(BigInt.fromString("150000000000000000000"));
    handleTransfer(
      createTransferEvent(
        receiverAddress,
        ownerAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    // 1.2 * 100 / 150 = 0.8
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "averagePrice",
      "800000000000000000",
    );
  });

  test("handles two consecutive transfers", function () {
    // t0: Deposit 120 VUSD -> 100 sVUSD, price = 1.2
    mockBalanceOf(BigInt.fromString("100000000000000000000"));
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t1: Receive 50 sVUSD, balance = 150, price = 0.8
    mockBalanceOf(BigInt.fromString("150000000000000000000"));
    handleTransfer(
      createTransferEvent(
        receiverAddress,
        ownerAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    // t2: Receive 150 sVUSD, balance = 300, price = 0.4
    mockBalanceOf(BigInt.fromString("300000000000000000000"));
    handleTransfer(
      createTransferEvent(
        receiverAddress,
        ownerAddress,
        BigInt.fromString("150000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    // 0.8 * 150 / 300 = 0.4
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "averagePrice",
      "400000000000000000",
    );
  });

  test("sets average price to 0 for new user receiving a transfer", function () {
    // User with no prior position receives 100 sVUSD
    mockBalanceOf(BigInt.fromString("100000000000000000000"));
    handleTransfer(
      createTransferEvent(
        receiverAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.entityCount("UserStakingPosition", 1);
    assert.fieldEquals("UserStakingPosition", id, "averagePrice", "0");
    assert.fieldEquals("UserStakingPosition", id, "owner", ownerAddressString);
  });

  test("skips mint transfers", function () {
    const zeroAddress = Address.fromString(
      "0x0000000000000000000000000000000000000000",
    );
    mockBalanceOf(BigInt.fromString("100000000000000000000"));
    handleTransfer(
      createTransferEvent(
        zeroAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    assert.entityCount("UserStakingPosition", 0);
  });
});
