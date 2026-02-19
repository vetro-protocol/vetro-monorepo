import { useEffect, useState } from "react";
import { unixNowTimestamp } from "utils/date";

export function useCountdown(targetTimestamp: bigint) {
  const targetSeconds = Number(targetTimestamp);

  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, targetSeconds - unixNowTimestamp()),
  );

  useEffect(
    function () {
      const diff = targetSeconds - unixNowTimestamp();
      setRemainingSeconds(Math.max(0, diff));

      if (diff <= 0) {
        return undefined;
      }

      const interval = setInterval(function () {
        const remaining = Math.max(0, targetSeconds - unixNowTimestamp());
        setRemainingSeconds(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    },
    [targetSeconds],
  );

  return remainingSeconds;
}
