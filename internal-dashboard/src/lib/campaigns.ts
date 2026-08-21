const day = 24 * 60 * 60;
const endingSoonThresholdDays = 7;

export const endingSoonThresholdSeconds = endingSoonThresholdDays * day;

export const endingSoonTooltip = `Ends in less than ${endingSoonThresholdDays} days`;

export const endsSoon = (secondsLeft: number) =>
  secondsLeft < endingSoonThresholdSeconds;
