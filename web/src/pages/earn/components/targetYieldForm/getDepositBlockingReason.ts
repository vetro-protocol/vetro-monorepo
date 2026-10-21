import { isEntryWindowOpen } from "pages/earn/components/fixedTermEarn/isOpenToDeposits";

type DepositState = Omit<Parameters<typeof isEntryWindowOpen>[0], "now"> & {
  deposits: bigint;
  maxDeposits: bigint;
};

export function getDepositBlockingReason({
  canEntry,
  depositState,
  hasPendingRequest,
  maxRequestDeposit,
  now,
}: {
  canEntry: boolean;
  depositState: DepositState | null;
  hasPendingRequest: boolean;
  maxRequestDeposit: bigint;
  now: bigint;
}) {
  if (
    depositState === null ||
    !isEntryWindowOpen({ ...depositState, now }) ||
    !canEntry
  ) {
    return "deposits-closed";
  }
  if (depositState.deposits >= depositState.maxDeposits) {
    return "cap-reached";
  }
  if (maxRequestDeposit === 0n && hasPendingRequest) {
    return "earlier-request-pending";
  }
  return undefined;
}
