import { useEffect, useMemo } from "react";
import { useAccount } from "wagmi";

import { updateActivity, useActivities } from "../stores/activityStore";
import { getPendingActivityStatus } from "../utils/reconcilePendingActivity";

import { useEthereumClient } from "./useEthereumClient";

const pendingActivityPollInterval = 10_000;

export function usePendingActivityReconciliation() {
  const { address } = useAccount();
  const activities = useActivities(address);
  const client = useEthereumClient();

  // Bridge transactions can start on several chains, and source confirmation
  // does not mean that the bridged funds have arrived. They need separate
  // delivery tracking.
  const pendingActivities = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.status === "pending" && activity.page !== "bridge",
      ),
    [activities],
  );

  useEffect(
    function reconcilePendingActivities() {
      if (!address || !client || pendingActivities.length === 0) {
        return undefined;
      }

      const account = address;
      const publicClient = client;
      let isActive = true;
      let isChecking = false;

      async function reconcile() {
        if (!isActive || isChecking) {
          return;
        }

        isChecking = true;
        try {
          await Promise.all(
            pendingActivities.map(async function reconcileActivity(activity) {
              const status = await getPendingActivityStatus({
                activity,
                getReceipt: (hash) =>
                  publicClient.getTransactionReceipt({ hash }),
              });

              if (isActive && status) {
                updateActivity(account, activity.txHash, { status });
              }
            }),
          );
        } finally {
          isChecking = false;
        }
      }

      void reconcile();
      const interval = setInterval(
        () => void reconcile(),
        pendingActivityPollInterval,
      );

      return function cleanup() {
        isActive = false;
        clearInterval(interval);
      };
    },
    [address, client, pendingActivities],
  );
}
