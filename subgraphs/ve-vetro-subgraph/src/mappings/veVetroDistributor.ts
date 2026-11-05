import { log, store } from "@graphprotocol/graph-ts";

import {
  Claim,
  ClaimedVeHemiPosition,
  PendingClaim,
  VeVetroPosition,
} from "../../generated/schema";
import {
  Claimed,
  PositionClaimed,
} from "../../generated/VeVetroDistributor/VeVetroDistributor";

// A claim emits a PositionClaimed for each veHEMI id it pays, then its Claimed,
// which doesn't list the ids. A Safe or EIP-7702 batch can carry several claims
// in one transaction, so the ids of a claim are the ones since the previous
// Claimed of the transaction.
export function handlePositionClaimed(event: PositionClaimed): void {
  let pending = PendingClaim.load(event.transaction.hash);
  if (pending === null) {
    pending = new PendingClaim(event.transaction.hash);
    pending.shares = [];
    pending.tokenIds = [];
    pending.weights = [];
  }
  const shares = pending.shares;
  shares.push(event.params.share);
  pending.shares = shares;
  const tokenIds = pending.tokenIds;
  tokenIds.push(event.params.tokenId);
  pending.tokenIds = tokenIds;
  const weights = pending.weights;
  weights.push(event.params.weight);
  pending.weights = weights;
  pending.save();
}

export function handleClaimed(event: Claimed): void {
  const claimId = event.transaction.hash.concatI32(event.logIndex.toI32());

  const claim = new Claim(claimId);
  claim.amount = event.params.amount;
  claim.blockNumber = event.block.number;
  claim.blockTimestamp = event.block.timestamp;
  claim.claimant = event.params.claimant;
  claim.position = event.params.targetTokenId.toString();
  claim.recipient = event.params.recipient;
  claim.transactionHash = event.transaction.hash;
  claim.save();

  const pending = PendingClaim.load(event.transaction.hash);
  if (pending === null) {
    log.warning("Claim without claimed positions in transaction {}", [
      event.transaction.hash.toHexString(),
    ]);
  } else {
    const shares = pending.shares;
    const tokenIds = pending.tokenIds;
    const weights = pending.weights;
    for (let i = 0; i < tokenIds.length; i++) {
      const claimed = new ClaimedVeHemiPosition(tokenIds[i].toString());
      claimed.claim = claimId;
      claimed.claimant = event.params.claimant;
      claimed.share = shares[i];
      claimed.weight = weights[i];
      claimed.save();
    }
    store.remove("PendingClaim", pending.id.toHexString());
  }

  // The distributor mints the position before it emits Claimed
  const position = VeVetroPosition.load(claim.position);
  if (position === null) {
    log.warning("Claim of unknown position {} in transaction {}", [
      claim.position,
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  position.claim = claimId;
  position.save();
}
