import { Address, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";

import {
  ExitTicket,
  ExitTicketQueueSummary,
  UserStakingPosition,
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

const buildId = (vaultAddress: Address, suffix: string): string =>
  `${vaultAddress.toHexString()}-${suffix}`;

const WAD = BigInt.fromI32(10).pow(18);

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
  const daySeconds = BigInt.fromI32(86400);
  // Integer-divide then re-multiply to snap block.timestamp to the start of the UTC day (00:00:00).
  const dayTimestamp = block.timestamp.div(daySeconds).times(daySeconds);

  const vaultAddress = dataSource.address();
  const id = buildId(vaultAddress, dayTimestamp.toString());
  let entity = VaultHistory.load(id);
  if (entity == null) {
    entity = new VaultHistory(id);
    entity.timestamp = dayTimestamp;
    entity.stakingVaultAddress = vaultAddress;
  }

  const vault = StakingVault.bind(vaultAddress);
  const decimals = vault.decimals();
  const oneShare = BigInt.fromI32(10).pow(<u8>decimals);
  const shareValue = vault.convertToAssets(oneShare);
  entity.shareValue = shareValue;

  entity.save();
}

export function handleDeposit(event: Deposit): void {
  const vaultAddress = dataSource.address();
  const owner = event.params.owner;
  const id = buildId(vaultAddress, owner.toHexString());

  let entity = UserStakingPosition.load(id);
  if (entity == null) {
    entity = new UserStakingPosition(id);
    entity.averagePrice = BigInt.fromI32(0);
    entity.owner = owner;
    entity.stakingVaultAddress = vaultAddress;
  }

  const vault = StakingVault.bind(vaultAddress);
  const currentShares = vault.balanceOf(owner);
  const newShares = event.params.shares;
  const oldShares = currentShares.minus(newShares);

  const calculatedAssets = oldShares
    .times(entity.averagePrice)
    .plus(event.params.assets.times(WAD));
  entity.averagePrice = calculatedAssets.div(currentShares);

  entity.save();
}

export function handleTransfer(event: Transfer): void {
  // Skip mints as those are already handled by the Deposit event handler.
  if (event.params.from.equals(Address.zero())) {
    return;
  }
  // Self-transfer will cause incorrect average price dilution. Skip those.
  if (event.params.from.equals(event.params.to)) {
    return;
  }
  // Zero-value transfer will also cause incorrect average price dilution.
  if (event.params.value.equals(BigInt.fromI32(0))) {
    return;
  }

  const vaultAddress = dataSource.address();
  const to = event.params.to;
  const id = buildId(vaultAddress, to.toHexString());

  let entity = UserStakingPosition.load(id);
  if (entity == null) {
    entity = new UserStakingPosition(id);
    entity.averagePrice = BigInt.fromI32(0);
    entity.owner = to;
    entity.stakingVaultAddress = vaultAddress;
  }

  const vault = StakingVault.bind(vaultAddress);
  const currentShares = vault.balanceOf(to);
  const oldShares = currentShares.minus(event.params.value);

  // Transferred-in shares are valued at 0, diluting the average price proportionally.
  entity.averagePrice = entity.averagePrice.times(oldShares).div(currentShares);

  entity.save();
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
