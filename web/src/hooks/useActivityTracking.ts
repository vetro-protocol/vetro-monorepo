import { useCallback, useRef } from "react";

import type { ActivityPage } from "../components/base/activityList/types";
import { addActivity, updateActivity } from "../stores/activityStore";

type Params = {
  account: string | undefined;
  page: ActivityPage;
  text: string;
  title: string;
};

export function useActivityTracking({ account, page, text, title }: Params) {
  const activityIdRef = useRef<string | undefined>(undefined);
  const txHashRef = useRef<string | undefined>(undefined);

  const onPending = useCallback(
    function onPending() {
      if (!account) {
        return;
      }
      activityIdRef.current = addActivity(account, {
        date: Math.floor(Date.now() / 1000),
        page,
        status: "pending",
        text,
        title,
      });
    },
    [account, page, text, title],
  );

  const onConcluded = useCallback(
    function onConcluded() {
      if (!activityIdRef.current || !account) {
        return;
      }
      updateActivity(account, activityIdRef.current, {
        status: "concluded",
        txHash: txHashRef.current,
      });
      activityIdRef.current = undefined;
    },
    [account],
  );

  const onFailed = useCallback(
    function onFailed() {
      if (!activityIdRef.current || !account) {
        return;
      }
      updateActivity(account, activityIdRef.current, {
        status: "failed",
        txHash: txHashRef.current,
      });
      activityIdRef.current = undefined;
    },
    [account],
  );

  const onTransactionHash = useCallback(function onTransactionHash(
    hash: string,
  ) {
    txHashRef.current = hash;
  }, []);

  return { onConcluded, onFailed, onPending, onTransactionHash };
}
