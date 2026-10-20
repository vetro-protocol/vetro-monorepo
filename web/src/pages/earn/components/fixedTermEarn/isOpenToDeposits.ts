type EntryState = {
  entryWindow: { end: bigint; start: bigint };
  isPaused: boolean;
  isShutdown: boolean;
  isTerminated: boolean;
  now: bigint;
};

export const isEntryWindowOpen = ({
  entryWindow,
  isPaused,
  isShutdown,
  isTerminated,
  now,
}: EntryState) =>
  !isPaused &&
  !isShutdown &&
  !isTerminated &&
  now >= entryWindow.start &&
  now < entryWindow.end;

export const isOpenToDeposits = ({
  deposits,
  maxDeposits,
  ...entryState
}: EntryState & {
  deposits: bigint;
  maxDeposits: bigint;
}) => deposits < maxDeposits && isEntryWindowOpen(entryState);
