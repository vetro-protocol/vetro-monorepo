import { type Address } from "viem";

export type RatePoint = { denominator: string; numerator: string };

export type CostBasisEvent =
  | { kind: "DEPOSIT"; share: string; shares: string; staked: string | null }
  | { kind: "REDEEM"; share: string; shares: string }
  | {
      kind: "TRANSFER_IN";
      rate: RatePoint | null;
      share: string;
      value: string;
    }
  | { kind: "TRANSFER_OUT"; share: string; value: string };

type Position = { costBasis: bigint; shares: bigint };

export const WAD_DECIMALS = 18;
const WAD = 10n ** BigInt(WAD_DECIMALS);

const emptyPosition: Position = { costBasis: 0n, shares: 0n };

const priceTransferIn = ({ rate, value }: { rate: RatePoint; value: string }) =>
  (BigInt(value) * BigInt(rate.numerator) * WAD) / BigInt(rate.denominator);

const acquire = ({
  cost,
  position,
  shares,
}: {
  cost: bigint;
  position: Position;
  shares: bigint;
}): Position => ({
  costBasis: position.costBasis + cost,
  shares: position.shares + shares,
});

function dispose({
  position,
  shares,
}: {
  position: Position;
  shares: bigint;
}): Position {
  if (shares >= position.shares) {
    return emptyPosition;
  }
  return {
    costBasis:
      (position.costBasis * (position.shares - shares)) / position.shares,
    shares: position.shares - shares,
  };
}

function applyEvent({
  event,
  position,
}: {
  event: CostBasisEvent;
  position: Position;
}) {
  if (event.kind === "DEPOSIT") {
    return acquire({
      cost: event.staked === null ? 0n : BigInt(event.staked) * WAD,
      position,
      shares: BigInt(event.shares),
    });
  }
  if (event.kind === "TRANSFER_IN") {
    return acquire({
      cost:
        event.rate === null
          ? 0n
          : priceTransferIn({ rate: event.rate, value: event.value }),
      position,
      shares: BigInt(event.value),
    });
  }
  if (event.kind === "REDEEM") {
    return dispose({ position, shares: BigInt(event.shares) });
  }
  return dispose({ position, shares: BigInt(event.value) });
}

/**
 * Replay the events of a holder, oldest first, and return the WAD-scaled cost
 * basis and the shares of each share token. Acquisitions (deposits, transfers
 * in) add their cost and shares. Disposals (redeems, transfers out) reduce the
 * cost basis in proportion to the shares that leave, and a full exit zeroes the
 * position.
 */
export function replayCostBasis(events: CostBasisEvent[]) {
  const positions = new Map<Address, Position>();
  for (const event of events) {
    const share = event.share as Address;
    positions.set(
      share,
      applyEvent({ event, position: positions.get(share) ?? emptyPosition }),
    );
  }
  return positions;
}
