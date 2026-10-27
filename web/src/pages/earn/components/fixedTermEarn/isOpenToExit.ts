export const isOpenToExit = ({
  exitWindow,
  isShutdown,
  isTerminated,
  now,
}: {
  exitWindow: { end: bigint; start: bigint };
  isShutdown: boolean;
  isTerminated: boolean;
  now: bigint;
}) =>
  !isShutdown &&
  (isTerminated || (now >= exitWindow.start && now < exitWindow.end));
