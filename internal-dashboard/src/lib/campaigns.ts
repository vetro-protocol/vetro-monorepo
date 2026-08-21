const day = 24 * 60 * 60;

export const endingSoonThresholdSeconds = 7 * day;

export const endingSoonTooltip = `Ends in less than ${endingSoonThresholdSeconds / day} days`;

export const endsSoon = (secondsLeft: number) =>
  secondsLeft < endingSoonThresholdSeconds;
