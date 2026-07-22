export const keeperBehindThresholdSeconds = 3600;

export type CooldownRequest = {
  assets: bigint;
  claimableAt: bigint;
  requestId: bigint;
};

type Bucket = {
  assets: bigint;
  count: number;
};

const sumBucket = (requests: CooldownRequest[]): Bucket => ({
  assets: requests.reduce((total, request) => total + request.assets, 0n),
  count: requests.length,
});

export const summarizeCooldown = function ({
  nowSeconds,
  requests,
}: {
  nowSeconds: number;
  requests: CooldownRequest[];
}) {
  const now = BigInt(nowSeconds);
  const ready = requests.filter((request) => request.claimableAt <= now);
  const inCooldown = requests.filter((request) => request.claimableAt > now);

  const oldestReadySeconds =
    ready.length > 0
      ? Number(
          now -
            ready.reduce(
              (oldest, request) =>
                request.claimableAt < oldest ? request.claimableAt : oldest,
              ready[0].claimableAt,
            ),
        )
      : undefined;

  return {
    inCooldown: sumBucket(inCooldown),
    isKeeperBehind:
      oldestReadySeconds !== undefined &&
      oldestReadySeconds > keeperBehindThresholdSeconds,
    oldestReadySeconds,
    ready: sumBucket(ready),
  };
};
