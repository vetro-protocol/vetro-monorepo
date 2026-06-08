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

function mockVaultCalls(
  decimals: i32,
  shareValue: BigInt,
  totalAssets: BigInt,
): void {
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

  createMockedFunction(vaultAddress, "totalAssets", "totalAssets():(uint256)")
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(totalAssets)]);
}

describe("handleBlock", function () {
  beforeEach(function () {
    clearStore();
    dataSourceMock.setAddress(vaultAddressString);
  });

  test("creates VaultHistory for day timestamp", function () {
    const decimals = 18;
    const currentShareValue = BigInt.fromString("1050000000000000000"); // 1.05 assets per share
    const currentTotalAssets = BigInt.fromString("5000000000000000000000"); // 5000 assets
    const timestamp = BigInt.fromI32(1769731200); // 2026-01-30 00:00:00 UTC

    mockVaultCalls(decimals, currentShareValue, currentTotalAssets);
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
      "totalAssets",
      currentTotalAssets.toString(),
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
    const initialTotalAssets = BigInt.fromString("5000000000000000000000");
    const updatedTotalAssets = BigInt.fromString("6000000000000000000000");
    const timestamp1 = BigInt.fromI32(1769734800); // 2026-01-30 01:00:00 UTC
    const timestamp2 = BigInt.fromI32(1769774400); // 2026-01-30 12:00:00 UTC

    mockVaultCalls(decimals, initialShareValue, initialTotalAssets);
    const block1 = createMockBlock(BigInt.fromI32(100), timestamp1);
    handleBlock(block1);

    const dayTimestamp = timestamp1.div(daySeconds).times(daySeconds);
    const id = `${vaultAddressString}-${dayTimestamp.toString()}`;
    assert.entityCount("VaultHistory", 1);

    mockVaultCalls(decimals, updatedShareValue, updatedTotalAssets);
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
      "totalAssets",
      updatedTotalAssets.toString(),
    );
    assert.fieldEquals(
      "VaultHistory",
      id,
      "timestamp",
      dayTimestamp.toString(),
    );
  });

  test("skips the block when convertToAssets reverts (empty vault)", function () {
    // An empty vault (zero total supply) makes convertToAssets revert with a
    // divide-by-zero panic. The handler must skip the block, not abort.
    const decimals = 18;
    const oneShare = BigInt.fromI32(10).pow(<u8>decimals);
    const timestamp = BigInt.fromI32(1769731200); // 2026-01-30 00:00:00 UTC

    createMockedFunction(vaultAddress, "decimals", "decimals():(uint8)")
      .withArgs([])
      .returns([ethereum.Value.fromI32(decimals)]);
    createMockedFunction(
      vaultAddress,
      "convertToAssets",
      "convertToAssets(uint256):(uint256)",
    )
      .withArgs([ethereum.Value.fromUnsignedBigInt(oneShare)])
      .reverts();

    const block = createMockBlock(BigInt.fromI32(100), timestamp);
    handleBlock(block);

    assert.entityCount("VaultHistory", 0);
  });

  test("creates VaultConfig on first block and reuses it on subsequent blocks", function () {
    const decimals = 18;
    const shareValue = BigInt.fromString("1050000000000000000");
    const totalAssets = BigInt.fromString("5000000000000000000000");
    const timestamp1 = BigInt.fromI32(1769731200); // day 1
    const timestamp2 = BigInt.fromI32(1769817600); // day 2

    mockVaultCalls(decimals, shareValue, totalAssets);
    const block1 = createMockBlock(BigInt.fromI32(100), timestamp1);
    handleBlock(block1);

    // VaultConfig entity should be created with the correct decimals
    assert.entityCount("VaultConfig", 1);
    assert.fieldEquals(
      "VaultConfig",
      vaultAddressString,
      "decimals",
      decimals.toString(),
    );

    // Second block: decimals() mock is not needed anymore since VaultConfig is cached.
    // Re-mock only convertToAssets and totalAssets for the second block.
    const updatedShareValue = BigInt.fromString("1060000000000000000");
    const updatedTotalAssets = BigInt.fromString("6000000000000000000000");
    mockVaultCalls(decimals, updatedShareValue, updatedTotalAssets);
    const block2 = createMockBlock(BigInt.fromI32(200), timestamp2);
    handleBlock(block2);

    // Still only one VaultConfig entity
    assert.entityCount("VaultConfig", 1);
    assert.entityCount("VaultHistory", 2);
  });
});

describe("handleDeposit", function () {
  beforeEach(function () {
    clearStore();
    dataSourceMock.setAddress(vaultAddressString);
  });

  test("creates position with shares and totalCostBasis on first deposit", function () {
    // 100 VUSD -> 100 sVUSD. averagePrice = 100e36 / 100e18 = 1e18
    const assets = BigInt.fromString("100000000000000000000"); // 100e18
    const shares = BigInt.fromString("100000000000000000000"); // 100e18

    handleDeposit(
      createDepositEvent(assets, ownerAddress, ownerAddress, shares),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.entityCount("UserStakingPosition", 1);
    assert.fieldEquals("UserStakingPosition", id, "owner", ownerAddressString);
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "100000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "stakingVaultAddress",
      vaultAddressString,
    );
    // totalCostBasis = 100e18 * WAD = 100e36
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "100000000000000000000000000000000000000",
    );
  });

  test("accumulates shares and totalCostBasis on subsequent deposit", function () {
    // t0: 100 VUSD -> 100 sVUSD
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("100000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t1: 110 VUSD -> 100 sVUSD
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("110000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    // shares = 200e18, totalCostBasis = 210e36
    // averagePrice = 210e36 / 200e18 = 1.05e18
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "200000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "210000000000000000000000000000000000000",
    );
  });

  test("average price unchanged by burn, updates correctly on next deposit", function () {
    // t0: 100 VUSD -> 100 sVUSD
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("100000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t1: 110 VUSD -> 100 sVUSD. shares=200e18, totalCostBasis=210e36
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("110000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t2: burn 50 sVUSD (Transfer to zero). totalCostBasis = 210e36 * 150/200 = 157.5e36, shares=150e18
    const zeroAddress = Address.fromString(
      "0x0000000000000000000000000000000000000000",
    );
    handleTransfer(
      createTransferEvent(
        ownerAddress,
        zeroAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    // t3: 120 VUSD -> 100 sVUSD. shares=250e18, totalCostBasis=277.5e36
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    // averagePrice = 277.5e36 / 250e18 = 1.11e18
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "250000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "277500000000000000000000000000000000000",
    );
  });

  test("tracks shares and totalCostBasis across multiple deposits and burns", function () {
    // Full sequence from 336.md: t0, t1, t2 (burn), t3, t4
    // t0: 100 VUSD -> 100 sVUSD
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("100000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t1: 110 VUSD -> 100 sVUSD. shares=200e18, totalCostBasis=210e36
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("110000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t2: burn 50 sVUSD. totalCostBasis=157.5e36, shares=150e18
    const zeroAddress = Address.fromString(
      "0x0000000000000000000000000000000000000000",
    );
    handleTransfer(
      createTransferEvent(
        ownerAddress,
        zeroAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    // t3: 120 VUSD -> 100 sVUSD. shares=250e18, totalCostBasis=277.5e36
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // t4: 75 VUSD -> 50 sVUSD. shares=300e18, totalCostBasis=352.5e36
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("75000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    // averagePrice = 352.5e36 / 300e18 = 1.175e18
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "300000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "352500000000000000000000000000000000000",
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

  test("updates shares on transfer-in, keeps totalCostBasis unchanged", function () {
    // t0: Deposit 120 VUSD -> 100 sVUSD. shares=100e18, totalCostBasis=120e36
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // Give receiverAddress shares so it can transfer them
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("50000000000000000000"),
        receiverAddress,
        receiverAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    // t1: Receive 50 sVUSD via transfer. shares=150e18, totalCostBasis=120e36 (unchanged)
    // averagePrice = 120e36 / 150e18 = 0.8e18
    handleTransfer(
      createTransferEvent(
        receiverAddress,
        ownerAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "150000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "120000000000000000000000000000000000000",
    );
  });

  test("handles two consecutive transfers-in", function () {
    // t0: Deposit 120 VUSD -> 100 sVUSD. shares=100e18, totalCostBasis=120e36
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // Give receiverAddress shares so it can transfer them
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("200000000000000000000"),
        receiverAddress,
        receiverAddress,
        BigInt.fromString("200000000000000000000"),
      ),
    );

    // t1: Receive 50 sVUSD. shares=150e18, totalCostBasis=120e36. avg=0.8e18
    handleTransfer(
      createTransferEvent(
        receiverAddress,
        ownerAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    // t2: Receive 150 sVUSD. shares=300e18, totalCostBasis=120e36. avg=0.4e18
    handleTransfer(
      createTransferEvent(
        receiverAddress,
        ownerAddress,
        BigInt.fromString("150000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "300000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "120000000000000000000000000000000000000",
    );
  });

  test("sets shares to transferred amount and totalCostBasis to 0 for new user", function () {
    // Give receiverAddress shares so it can transfer them
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("100000000000000000000"),
        receiverAddress,
        receiverAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // User with no prior position receives 100 sVUSD
    handleTransfer(
      createTransferEvent(
        receiverAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.entityCount("UserStakingPosition", 2);
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "100000000000000000000",
    );
    assert.fieldEquals("UserStakingPosition", id, "totalCostBasis", "0");
    assert.fieldEquals("UserStakingPosition", id, "owner", ownerAddressString);
  });

  test("decrements shares and totalCostBasis proportionally on transfer-out (invariant: average price unchanged)", function () {
    // Setup: owner has 100e18 shares, totalCostBasis=120e36, avg=1.2e18
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // Transfer 30 sVUSD out. Remaining: 70e18 shares.
    // totalCostBasis = 120e36 * 70/100 = 84e36. avg = 84e36/70e18 = 1.2e18 (unchanged)
    handleTransfer(
      createTransferEvent(
        ownerAddress,
        receiverAddress,
        BigInt.fromString("30000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "70000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "84000000000000000000000000000000000000",
    );

    // Receiver gets shares with totalCostBasis unchanged (0 for new user)
    const receiverId = `${vaultAddressString}-${receiverAddressString}`;
    assert.fieldEquals(
      "UserStakingPosition",
      receiverId,
      "shares",
      "30000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      receiverId,
      "totalCostBasis",
      "0",
    );
  });

  test("sets shares and totalCostBasis to 0 when all shares transferred out", function () {
    // Setup: owner has 100e18 shares, totalCostBasis=120e36
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // Transfer all 100 sVUSD out.
    handleTransfer(
      createTransferEvent(
        ownerAddress,
        receiverAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.fieldEquals("UserStakingPosition", id, "shares", "0");
    assert.fieldEquals("UserStakingPosition", id, "totalCostBasis", "0");
  });

  test("keeps shares at 0 on transfer-out from a zero-share position (no divide-by-zero)", function () {
    // Setup: owner deposits then transfers everything out, leaving a position
    // with shares=0. A further non-zero transfer-out (tracked shares diverged
    // from on-chain balance) must reset to zero instead of dividing by zero.
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );
    handleTransfer(
      createTransferEvent(
        ownerAddress,
        receiverAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.fieldEquals("UserStakingPosition", id, "shares", "0");

    // Transfer-out of 30 while tracked shares are 0.
    handleTransfer(
      createTransferEvent(
        ownerAddress,
        receiverAddress,
        BigInt.fromString("30000000000000000000"),
      ),
    );

    assert.fieldEquals("UserStakingPosition", id, "shares", "0");
    assert.fieldEquals("UserStakingPosition", id, "totalCostBasis", "0");
  });

  test("decrements shares and totalCostBasis proportionally on burn (invariant: average price unchanged)", function () {
    // Setup: owner has 100e18 shares, totalCostBasis=120e36, avg=1.2e18
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // Burn 40 sVUSD (Transfer to zero). Remaining: 60e18 shares.
    // totalCostBasis = 120e36 * 60/100 = 72e36. avg = 72e36/60e18 = 1.2e18 (unchanged)
    const zeroAddress = Address.fromString(
      "0x0000000000000000000000000000000000000000",
    );
    handleTransfer(
      createTransferEvent(
        ownerAddress,
        zeroAddress,
        BigInt.fromString("40000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "60000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "72000000000000000000000000000000000000",
    );
  });

  test("sets shares and totalCostBasis to 0 when all shares burned", function () {
    // Setup: owner has 100e18 shares, totalCostBasis=120e36
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    // Burn all 100 sVUSD.
    const zeroAddress = Address.fromString(
      "0x0000000000000000000000000000000000000000",
    );
    handleTransfer(
      createTransferEvent(
        ownerAddress,
        zeroAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    assert.fieldEquals("UserStakingPosition", id, "shares", "0");
    assert.fieldEquals("UserStakingPosition", id, "totalCostBasis", "0");
  });

  test("skips mint transfers", function () {
    const zeroAddress = Address.fromString(
      "0x0000000000000000000000000000000000000000",
    );
    handleTransfer(
      createTransferEvent(
        zeroAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    assert.entityCount("UserStakingPosition", 0);
  });

  test("skips zero-value transfers", function () {
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    handleTransfer(
      createTransferEvent(ownerAddress, receiverAddress, BigInt.fromI32(0)),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    // Shares and totalCostBasis unchanged
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "100000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "120000000000000000000000000000000000000",
    );
  });

  test("skips self-transfers", function () {
    handleDeposit(
      createDepositEvent(
        BigInt.fromString("120000000000000000000"),
        ownerAddress,
        ownerAddress,
        BigInt.fromString("100000000000000000000"),
      ),
    );

    handleTransfer(
      createTransferEvent(
        ownerAddress,
        ownerAddress,
        BigInt.fromString("50000000000000000000"),
      ),
    );

    const id = `${vaultAddressString}-${ownerAddressString}`;
    // Shares and totalCostBasis unchanged
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "shares",
      "100000000000000000000",
    );
    assert.fieldEquals(
      "UserStakingPosition",
      id,
      "totalCostBasis",
      "120000000000000000000000000000000000000",
    );
  });
});
