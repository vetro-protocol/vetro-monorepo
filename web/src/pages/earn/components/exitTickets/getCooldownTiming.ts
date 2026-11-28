export function getCooldownValues({
  claimableAt,
  now,
}: {
  claimableAt: string;
  now: number;
}) {
  const remaining = Number(claimableAt) - now;

  if (remaining <= 0) {
    return { count: 0, unit: "minutes" as const };
  }

  const days = Math.floor(remaining / 86400);
  if (days > 0) {
    return { count: days, unit: "days" as const };
  }

  const hours = Math.floor(remaining / 3600);
  if (hours > 0) {
    return { count: hours, unit: "hours" as const };
  }

  const minutes = Math.max(1, Math.floor(remaining / 60));
  return { count: minutes, unit: "minutes" as const };
}

export function getNextChangeTime({
  claimableAt,
  now,
}: {
  claimableAt: string;
  now: number;
}) {
  const remaining = Number(claimableAt) - now;
  if (remaining <= 0) {
    return undefined;
  }

  let unitSeconds = 60;
  if (remaining >= 86400) {
    unitSeconds = 86400;
  } else if (remaining >= 3600) {
    unitSeconds = 3600;
  }

  const count = Math.floor(remaining / unitSeconds);
  if (unitSeconds === 60 && count <= 1) {
    return Number(claimableAt);
  }

  // Floored counts change one second below the current unit boundary.
  return Number(claimableAt) - count * unitSeconds + 1;
}
