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
const distributorAddressString = "0x3333333333333333333333333333333333333333";
const distributorAddress = Address.fromString(distributorAddressString);

const daySeconds = BigInt.fromI32(86400);
const secondsPerYear = BigInt.fromI32(31536000);

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

// Mock the reads handleDailyApy performs: yieldDistributor() on the vault, then
// rewardRate()/periodFinish() on the distributor. totalAssets() is mocked separately
// (mockVaultCalls / each test) since the VaultHistory path reads it too.
function mockDistributorCalls(rewardRate: BigInt, periodFinish: BigInt): void {
  createMockedFunction(
    vaultAddress,
    "yieldDistributor",
    "yieldDistributor():(address)",
  )
    .withArgs([])
    .returns([ethereum.Value.fromAddress(distributorAddress)]);
  createMockedFunction(
    distributorAddress,
    "rewardRate",
    "rewardRate():(uint256)",
  )
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(rewardRate)]);
  createMockedFunction(
    distributorAddress,
    "periodFinish",
    "periodFinish():(uint256)",
  )
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(periodFinish)]);
}

describe("handleBlock", function () {
  beforeEach(function () {
    clearStore();
    dataSourceMock.setAddress(vaultAddressString);
  });

  test("creates VaultHistory for previous day timestamp", function () {
    const decimals = 18;
    const currentShareValue = BigInt.fromString("1050000000000000000"); // 1.05 assets per share
    const currentTotalAssets = BigInt.fromString("5000000000000000000000"); // 5000 assets
    const timestamp = BigInt.fromI32(1769731200); // 2026-01-30 00:00:00 UTC

    mockVaultCalls(decimals, currentShareValue, currentTotalAssets);
    mockDistributorCalls(BigInt.fromI32(0), BigInt.fromI32(0));
    const block = createMockBlock(BigInt.fromI32(100), timestamp);
    handleBlock(block);

    // Entity is stored under the previous day's timestamp
    const dayTimestamp = timestamp.div(daySeconds).times(daySeconds);
    const previousDayTimestamp = dayTimestamp.minus(daySeconds);
    const id = `${vaultAddressString}-${previousDayTimestamp.toString()}`;
    assert.entityCount("VaultHistory", 1);
    assert.fieldEquals(
      "VaultHistory",
      id,
      "timestamp",
      previousDayTimestamp.toString(),
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

  test("skips subsequent blocks on the same day", function () {
    const decimals = 18;
    const initialShareValue = BigInt.fromString("1050000000000000000");
    const initialTotalAssets = BigInt.fromString("5000000000000000000000");
    const timestamp1 = BigInt.fromI32(1769734800); // 2026-01-30 01:00:00 UTC
    const timestamp2 = BigInt.fromI32(1769774400); // 2026-01-30 12:00:00 UTC

    mockVaultCalls(decimals, initialShareValue, initialTotalAssets);
    mockDistributorCalls(BigInt.fromI32(0), BigInt.fromI32(0));
    const block1 = createMockBlock(BigInt.fromI32(100), timestamp1);
    handleBlock(block1);

    const dayTimestamp = timestamp1.div(daySeconds).times(daySeconds);
    const previousDayTimestamp = dayTimestamp.minus(daySeconds);
    const id = `${vaultAddressString}-${previousDayTimestamp.toString()}`;
    assert.entityCount("VaultHistory", 1);

    // Re-mock with different values so that if the handler skips the
    // early-return and re-runs RPC calls, it would overwrite the entity and
    // break the assertions below.
    const oneShare = BigInt.fromI32(10).pow(<u8>decimals);
    createMockedFunction(
      vaultAddress,
      "convertToAssets",
      "convertToAssets(uint256):(uint256)",
    )
      .withArgs([ethereum.Value.fromUnsignedBigInt(oneShare)])
      .returns([
        ethereum.Value.fromUnsignedBigInt(
          BigInt.fromString("1100000000000000000"),
        ),
      ]);
    createMockedFunction(vaultAddress, "totalAssets", "totalAssets():(uint256)")
      .withArgs([])
      .returns([
        ethereum.Value.fromUnsignedBigInt(
          BigInt.fromString("6000000000000000000000"),
        ),
      ]);

    // Second block on the same day: early-returns without RPC calls
    const block2 = createMockBlock(BigInt.fromI32(200), timestamp2);
    handleBlock(block2);

    // Still only one entity with the original values
    assert.entityCount("VaultHistory", 1);
    assert.fieldEquals(
      "VaultHistory",
      id,
      "shareValue",
      initialShareValue.toString(),
    );
    assert.fieldEquals(
      "VaultHistory",
      id,
      "totalAssets",
      initialTotalAssets.toString(),
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
    // An empty vault reports zero totalAssets, so handleDailyApy records apr 0.
    createMockedFunction(vaultAddress, "totalAssets", "totalAssets():(uint256)")
      .withArgs([])
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0))]);
    mockDistributorCalls(BigInt.fromI32(0), BigInt.fromI32(0));

    const block = createMockBlock(BigInt.fromI32(100), timestamp);
    handleBlock(block);

    assert.entityCount("VaultHistory", 0);
  });

  test("creates VaultConfig on first block and reuses it on subsequent blocks", function () {
    const decimals = 18;
    const shareValue = BigInt.fromString("1050000000000000000");
    const totalAssets = BigInt.fromString("5000000000000000000000");
    // Two timestamps on different days so both produce a VaultHistory entity
    const timestamp1 = BigInt.fromI32(1769731200); // 2026-01-30 00:00:00 UTC
    const timestamp2 = BigInt.fromI32(1769817600); // 2026-01-31 00:00:00 UTC

    mockVaultCalls(decimals, shareValue, totalAssets);
    mockDistributorCalls(BigInt.fromI32(0), BigInt.fromI32(0));
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

    // Second block on a new day: VaultConfig is reused from the store.
    // Override the existing decimals() mock to revert; if handleBlock calls
    // decimals() again instead of using the cached VaultConfig, the test fails.
    createMockedFunction(vaultAddress, "decimals", "decimals():(uint8)")
      .withArgs([])
      .reverts();
    const updatedShareValue = BigInt.fromString("1060000000000000000");
    const updatedTotalAssets = BigInt.fromString("6000000000000000000000");
    const oneShare = BigInt.fromI32(10).pow(<u8>decimals);
    createMockedFunction(
      vaultAddress,
      "convertToAssets",
      "convertToAssets(uint256):(uint256)",
    )
      .withArgs([ethereum.Value.fromUnsignedBigInt(oneShare)])
      .returns([ethereum.Value.fromUnsignedBigInt(updatedShareValue)]);
    createMockedFunction(vaultAddress, "totalAssets", "totalAssets():(uint256)")
      .withArgs([])
      .returns([ethereum.Value.fromUnsignedBigInt(updatedTotalAssets)]);
    const block2 = createMockBlock(BigInt.fromI32(200), timestamp2);
    handleBlock(block2);

    // Still only one VaultConfig entity, two VaultHistory entities (one per day)
    assert.entityCount("VaultConfig", 1);
    assert.entityCount("VaultHistory", 2);
  });
});

describe("handleDailyApy", function () {
  beforeEach(function () {
    clearStore();
    dataSourceMock.setAddress(vaultAddressString);
  });

  test("records the daily maximum APR across same-day blocks", function () {
    const decimals = 18;
    const shareValue = BigInt.fromString("1050000000000000000");
    const totalAssets = BigInt.fromString("5000000000000000000000"); // 5000e18
    const rewardRateLow = BigInt.fromString("10000000000000000000000000000"); // 1e28
    const rewardRateMid = BigInt.fromString("20000000000000000000000000000"); // 2e28
    const rewardRateHigh = BigInt.fromString("30000000000000000000000000000"); // 3e28
    // Three timestamps on the same UTC day (2026-01-30).
    const timestamp1 = BigInt.fromI32(1769734800); // 01:00
    const timestamp2 = BigInt.fromI32(1769745600); // 04:00
    const timestamp3 = BigInt.fromI32(1769760000); // 08:00
    const dayTimestamp = timestamp1.div(daySeconds).times(daySeconds);
    const periodFinish = dayTimestamp.plus(daySeconds); // active all day
    const id = `${vaultAddressString}-${dayTimestamp.toString()}`;

    mockVaultCalls(decimals, shareValue, totalAssets);

    // Block 1: mid reward rate establishes the record.
    mockDistributorCalls(rewardRateMid, periodFinish);
    handleBlock(createMockBlock(BigInt.fromI32(100), timestamp1));
    const expectedMid = rewardRateMid.times(secondsPerYear).div(totalAssets);
    assert.entityCount("VaultApyHistory", 1);
    assert.fieldEquals("VaultApyHistory", id, "apr", expectedMid.toString());
    assert.fieldEquals(
      "VaultApyHistory",
      id,
      "timestamp",
      dayTimestamp.toString(),
    );
    assert.fieldEquals(
      "VaultApyHistory",
      id,
      "stakingVaultAddress",
      vaultAddressString,
    );

    // Block 2: a lower reward rate the same day is ignored (max kept).
    mockDistributorCalls(rewardRateLow, periodFinish);
    handleBlock(createMockBlock(BigInt.fromI32(200), timestamp2));
    assert.entityCount("VaultApyHistory", 1);
    assert.fieldEquals("VaultApyHistory", id, "apr", expectedMid.toString());

    // Block 3: a higher reward rate the same day overwrites the max.
    mockDistributorCalls(rewardRateHigh, periodFinish);
    handleBlock(createMockBlock(BigInt.fromI32(300), timestamp3));
    const expectedHigh = rewardRateHigh.times(secondsPerYear).div(totalAssets);
    assert.entityCount("VaultApyHistory", 1);
    assert.fieldEquals("VaultApyHistory", id, "apr", expectedHigh.toString());
  });

  test("records apr 0 when the reward period has finished", function () {
    const decimals = 18;
    const shareValue = BigInt.fromString("1050000000000000000");
    const totalAssets = BigInt.fromString("5000000000000000000000");
    const rewardRate = BigInt.fromString("20000000000000000000000000000");
    const timestamp = BigInt.fromI32(1769734800);
    const dayTimestamp = timestamp.div(daySeconds).times(daySeconds);
    // periodFinish in the past -> no active drip -> apr 0.
    const periodFinish = timestamp.minus(BigInt.fromI32(1));
    const id = `${vaultAddressString}-${dayTimestamp.toString()}`;

    mockVaultCalls(decimals, shareValue, totalAssets);
    mockDistributorCalls(rewardRate, periodFinish);
    handleBlock(createMockBlock(BigInt.fromI32(100), timestamp));

    assert.entityCount("VaultApyHistory", 1);
    assert.fieldEquals("VaultApyHistory", id, "apr", "0");
  });

  test("records apr 0 when the vault has no yield distributor", function () {
    const decimals = 18;
    const shareValue = BigInt.fromString("1050000000000000000");
    const totalAssets = BigInt.fromString("5000000000000000000000");
    const timestamp = BigInt.fromI32(1769734800);
    const dayTimestamp = timestamp.div(daySeconds).times(daySeconds);
    const id = `${vaultAddressString}-${dayTimestamp.toString()}`;

    mockVaultCalls(decimals, shareValue, totalAssets);
    // yieldDistributor() returns the zero address -> no drip configured. The reward
    // rate / period finish are intentionally left unmocked: the handler must not read
    // them for a zero distributor.
    createMockedFunction(
      vaultAddress,
      "yieldDistributor",
      "yieldDistributor():(address)",
    )
      .withArgs([])
      .returns([ethereum.Value.fromAddress(Address.zero())]);

    handleBlock(createMockBlock(BigInt.fromI32(100), timestamp));

    assert.entityCount("VaultApyHistory", 1);
    assert.fieldEquals("VaultApyHistory", id, "apr", "0");
  });

  test("creates a separate record per UTC day", function () {
    const decimals = 18;
    const shareValue = BigInt.fromString("1050000000000000000");
    const totalAssets = BigInt.fromString("5000000000000000000000");
    const rewardRate = BigInt.fromString("20000000000000000000000000000");
    const periodFinish = BigInt.fromI32(1900000000); // far future
    const timestamp1 = BigInt.fromI32(1769734800); // 2026-01-30 01:00
    const timestamp2 = BigInt.fromI32(1769821200); // 2026-01-31 01:00

    mockVaultCalls(decimals, shareValue, totalAssets);
    mockDistributorCalls(rewardRate, periodFinish);
    handleBlock(createMockBlock(BigInt.fromI32(100), timestamp1));
    handleBlock(createMockBlock(BigInt.fromI32(200), timestamp2));

    assert.entityCount("VaultApyHistory", 2);
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
