import { useCallback, useRef } from "react";
import { useAccount } from "wagmi";

import type { ActivityPage } from "../components/base/activityList/types";
import { addActivity, updateActivity } from "../stores/activityStore";
import { unixNowTimestamp } from "../utils/date";

type Params = {
  page: ActivityPage;
  text: string;
  title: string;
};

export function useActivityTracking({ page, text, title }: Params) {
  const { address: account } = useAccount();
  const txHashRef = useRef<string | undefined>(undefined);

  const onPending = useCallback(
    function onPending() {
      if (!account || !txHashRef.current) {
        return;
      }
      addActivity(account, {
        date: unixNowTimestamp(),
        page,
        status: "pending",
        text,
        title,
        txHash: txHashRef.current,
      });
    },
    [account, page, text, title],
  );

  const onCompleted = useCallback(
    function onCompleted() {
      if (!txHashRef.current || !account) {
        return;
      }
      updateActivity(account, txHashRef.current, {
        status: "completed",
      });
      txHashRef.current = undefined;
    },
    [account],
  );

  const onFailed = useCallback(
    function onFailed() {
      if (!txHashRef.current || !account) {
        return;
      }
      updateActivity(account, txHashRef.current, {
        status: "failed",
      });
      txHashRef.current = undefined;
    },
    [account],
  );

  const onTransactionHash = useCallback(function onTransactionHash(
    hash: string,
  ) {
    txHashRef.current = hash;
  }, []);

  return { onCompleted, onFailed, onPending, onTransactionHash };
}
