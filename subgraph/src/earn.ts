import { Address, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";

import {
  ExitTicket,
  ExitTicketQueueSummary,
  UserStakingPosition,
  VaultApyHistory,
  VaultConfig,
  VaultHistory,
} from "../generated/schema";
import {
  Deposit,
  StakingVault,
  Transfer,
  WithdrawCancelled,
  WithdrawClaimed,
  WithdrawRequested,
  // The code generated is the same for both vaults
} from "../generated/sVusdStakingVault/StakingVault";
import { YieldDistributor } from "../generated/sVusdStakingVault/YieldDistributor";

const buildId = (vaultAddress: Address, suffix: string): string =>
  `${vaultAddress.toHexString()}-${suffix}`;

const WAD = BigInt.fromI32(10).pow(18);
const SECONDS_PER_YEAR = BigInt.fromI32(31536000); // 365 days

/**
 * Read the vault's current forward-looking APR: apr = rewardRate * SECONDS_PER_YEAR /
 * totalAssets, where rewardRate is the YieldDistributor's WAD-scaled reward-per-second,
 * so apr is itself WAD-scaled (the WAD cancels rewardRate's own scaling). Returns 0
 * when there is no active drip — no distributor configured, period ended, zero rate, or
 * empty vault — matching the API's getApy. Returns null when a required on-chain read
 * reverts, so the caller skips this block's update rather than recording a bogus value.
 * All reads use try_* so a single failure never aborts the handler.
 */
function readVaultApr(
  vault: StakingVault,
  block: ethereum.Block,
): BigInt | null {
  const distributorResult = vault.try_yieldDistributor();
  if (distributorResult.reverted) {
    return null;
  }
  if (distributorResult.value.equals(Address.zero())) {
    return BigInt.fromI32(0);
  }

  const distributor = YieldDistributor.bind(distributorResult.value);
  const rewardRateResult = distributor.try_rewardRate();
  const periodFinishResult = distributor.try_periodFinish();
  const totalAssetsResult = vault.try_totalAssets();
  if (
    rewardRateResult.reverted ||
    periodFinishResult.reverted ||
    totalAssetsResult.reverted
  ) {
    return null;
  }

  const rewardRate = rewardRateResult.value;
  const periodFinish = periodFinishResult.value;
  const totalAssets = totalAssetsResult.value;
  if (periodFinish.lt(block.timestamp) || totalAssets.le(BigInt.fromI32(0))) {
    return BigInt.fromI32(0);
  }
  return rewardRate.times(SECONDS_PER_YEAR).div(totalAssets);
}

/**
 * Record the daily maximum APR in VaultApyHistory. Continuous-compounding APY is a
 * strictly increasing function of APR, so tracking the daily maximum APR captures the
 * daily maximum APY; the API converts apr -> apy. Runs on every polling block (no early
 * return) so intra-day fluctuations are captured.
 */
function handleDailyApr(
  vaultAddress: Address,
  vault: StakingVault,
  block: ethereum.Block,
): void {
  const apr = readVaultApr(vault, block);
  if (apr === null) {
    return;
  }

  const daySeconds = BigInt.fromI32(86400);
  const dayTimestamp = block.timestamp.div(daySeconds).times(daySeconds);
  const id = buildId(vaultAddress, dayTimestamp.toString());
  let entity = VaultApyHistory.load(id);
  if (entity == null) {
    entity = new VaultApyHistory(id);
    entity.timestamp = dayTimestamp;
    entity.stakingVaultAddress = vaultAddress;
    entity.apr = apr;
    entity.save();
  } else if (apr.gt(entity.apr)) {
    entity.apr = apr;
    entity.save();
  }
}

function loadOrCreateQueueSummary(
  vaultAddress: Address,
): ExitTicketQueueSummary {
  const id = vaultAddress.toHexString();
  let summary = ExitTicketQueueSummary.load(id);
  if (summary == null) {
    summary = new ExitTicketQueueSummary(id);
    summary.shares = BigInt.fromI32(0);
    summary.openTickets = 0;
    summary.stakingVaultAddress = vaultAddress;
  }
  return summary;
}

export function handleBlock(block: ethereum.Block): void {
  const vaultAddress = dataSource.address();
  const vault = StakingVault.bind(vaultAddress);

  // Record the daily-maximum APR. Runs on every polling block (no early return) so
  // intra-day APR changes are captured; see handleDailyApr.
  handleDailyApr(vaultAddress, vault, block);

  // To speed up the sync process, minimize RPC calls and entity writes, only
  // save one history record per day (the first time this handler runs for that
  // day). Return early if the record for the current day already exists.
  // Use integer-divide then re-multiply to snap block.timestamp to the start of
  // the UTC day (00:00:00).
  const daySeconds = BigInt.fromI32(86400);
  const dayTimestamp = block.timestamp.div(daySeconds).times(daySeconds);
  // Then to keep the records aligned with the prior implementation which saved
  // the entity at the end of each day, compute the previous day's timestamp.
  const previousDayTimestamp = dayTimestamp.minus(daySeconds);
  const id = buildId(vaultAddress, previousDayTimestamp.toString());
  if (VaultHistory.load(id) != null) {
    return;
  }

  // Calling decimals() on the StakingVault contract will always result in the
  // same value. It is set on initialize() and cannot be changed afterwards.
  // Caching it in its own entity avoids calling decimals() on every block,
  // speeding up the handler and reducing sync time. The contract is upgradeable
  // but changing the decimals is highly unlikely as it would break many other
  // things downstream.
  let vaultConfig = VaultConfig.load(vaultAddress);
  if (vaultConfig == null) {
    vaultConfig = new VaultConfig(vaultAddress);
    vaultConfig.decimals = vault.decimals();
    vaultConfig.save();
  }

  const oneShare = BigInt.fromI32(10).pow(<u8>vaultConfig.decimals);
  const shareValueResult = vault.try_convertToAssets(oneShare);
  // Empty vault (zero total supply): convertToAssets reverts with a divide-by-zero
  // panic. Skip recording history for this block rather than aborting the handler.
  if (shareValueResult.reverted) {
    return;
  }

  const entity = new VaultHistory(id);
  entity.timestamp = previousDayTimestamp;
  entity.stakingVaultAddress = vaultAddress;
  entity.shareValue = shareValueResult.value;
  entity.totalAssets = vault.totalAssets();

  entity.save();
}

export function handleDeposit(event: Deposit): void {
  const vaultAddress = dataSource.address();
  const owner = event.params.owner;
  const id = buildId(vaultAddress, owner.toHexString());

  let entity = UserStakingPosition.load(id);
  if (entity == null) {
    entity = new UserStakingPosition(id);
    entity.owner = owner;
    entity.shares = BigInt.fromI32(0);
    entity.stakingVaultAddress = vaultAddress;
    entity.totalCostBasis = BigInt.fromI32(0);
  }

  entity.shares = entity.shares.plus(event.params.shares);
  entity.totalCostBasis = entity.totalCostBasis.plus(
    event.params.assets.times(WAD),
  );

  entity.save();
}

export function handleTransfer(event: Transfer): void {
  // Skip mints as those are already handled by the Deposit event handler.
  if (event.params.from.equals(Address.zero())) {
    return;
  }
  // Self-transfers do not affect balances.
  if (event.params.from.equals(event.params.to)) {
    return;
  }
  // Zero-value transfers are no-ops.
  if (event.params.value.equals(BigInt.fromI32(0))) {
    return;
  }

  const vaultAddress = dataSource.address();
  const value = event.params.value;

  // Update the sending party: decrement shares and totalCostBasis proportionally.
  const fromId = buildId(vaultAddress, event.params.from.toHexString());
  const fromEntity = UserStakingPosition.load(fromId)!;

  if (fromEntity.shares.le(value)) {
    // All shares transferred out (or tracked shares already at/below the
    // transferred amount): reset to zero. Guarding with `<=` also keeps the
    // proportional branch below from dividing by a zero `fromEntity.shares`.
    fromEntity.shares = BigInt.fromI32(0);
    fromEntity.totalCostBasis = BigInt.fromI32(0);
  } else {
    // Decrement totalCostBasis proportionally before decrementing shares.
    const newShares = fromEntity.shares.minus(value);
    fromEntity.totalCostBasis = fromEntity.totalCostBasis
      .times(newShares)
      .div(fromEntity.shares);
    fromEntity.shares = newShares;
  }

  fromEntity.save();

  // Burns (to zero address) only affect the sending party.
  if (event.params.to.equals(Address.zero())) {
    return;
  }

  // Update the receiving party: increment shares, keep totalCostBasis unchanged.
  // Received shares are valued at 0, diluting the average price proportionally.
  const toId = buildId(vaultAddress, event.params.to.toHexString());
  let toEntity = UserStakingPosition.load(toId);
  if (toEntity == null) {
    toEntity = new UserStakingPosition(toId);
    toEntity.owner = event.params.to;
    toEntity.shares = BigInt.fromI32(0);
    toEntity.stakingVaultAddress = vaultAddress;
    toEntity.totalCostBasis = BigInt.fromI32(0);
  }

  toEntity.shares = toEntity.shares.plus(value);

  toEntity.save();
}

export function handleWithdrawRequested(event: WithdrawRequested): void {
  const vaultAddress = dataSource.address();
  const id = buildId(vaultAddress, event.params.requestId.toString());
  const entity = new ExitTicket(id);

  entity.owner = event.params.owner;
  entity.assets = event.params.assets;
  entity.claimableAt = event.params.claimableAt;
  entity.requestId = event.params.requestId;
  entity.shares = event.params.shares;
  entity.stakingVaultAddress = vaultAddress;

  entity.requestTxHash = event.transaction.hash;

  entity.save();

  const summary = loadOrCreateQueueSummary(vaultAddress);

  summary.shares = summary.shares.plus(event.params.shares);
  summary.openTickets = summary.openTickets + 1;

  summary.save();
}

export function handleWithdrawCancelled(event: WithdrawCancelled): void {
  const vaultAddress = dataSource.address();
  const id = buildId(vaultAddress, event.params.requestId.toString());
  const entity = ExitTicket.load(id);
  if (entity == null) {
    return;
  }

  entity.cancelTxHash = event.transaction.hash;

  entity.save();

  const summary = loadOrCreateQueueSummary(vaultAddress);

  summary.shares = summary.shares.minus(entity.shares);
  summary.openTickets = summary.openTickets - 1;

  summary.save();
}

export function handleWithdrawClaimed(event: WithdrawClaimed): void {
  const vaultAddress = dataSource.address();
  const id = buildId(vaultAddress, event.params.requestId.toString());
  const entity = ExitTicket.load(id);
  if (entity == null) {
    return;
  }

  entity.claimTxHash = event.transaction.hash;

  entity.save();

  const summary = loadOrCreateQueueSummary(vaultAddress);

  summary.shares = summary.shares.minus(entity.shares);
  summary.openTickets = summary.openTickets - 1;

  summary.save();
}
