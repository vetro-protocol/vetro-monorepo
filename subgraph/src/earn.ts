import { Address, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";

import {
  ExitTicket,
  ExitTicketQueueSummary,
  VaultHistory,
} from "../generated/schema";
import {
  StakingVault,
  WithdrawCancelled,
  WithdrawClaimed,
  WithdrawRequested,
} from "../generated/StakingVault/StakingVault";

const buildId = (vaultAddress: Address, suffix: string): string =>
  `${vaultAddress.toHexString()}-${suffix}`;

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
