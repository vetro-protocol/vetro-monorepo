const secondsPerBlock = 12;

export const secondsToBlocks = (seconds: bigint) =>
  Math.ceil(Number(seconds) / secondsPerBlock);
