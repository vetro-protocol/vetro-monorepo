import { useEffect, useMemo, useRef } from "react";
import { getTransactionReceipt } from "viem/actions";
import { useAccount } from "wagmi";

import { updateActivity, useActivities } from "../stores/activityStore";
import { SECONDS_PER_DAY, unixNowTimestamp } from "../utils/date";
import { getPendingActivityStatus } from "../utils/reconcilePendingActivity";

import { useEthereumClient } from "./useEthereumClient";

const pendingActivityPollInterval = 10_000;
const pendingActivityMaxAge = SECONDS_PER_DAY;

export function usePendingActivityReconciliation() {
  const { address } = useAccount();
  const activities = useActivities(address);
  const client = useEthereumClient();

  // Bridge transactions can start on several chains, and source confirmation
  // does not mean that the bridged funds have arrived. They need separate
  // delivery tracking.
  const pendingActivities = useMemo(
    function getPendingActivities() {
      const now = unixNowTimestamp();
      return activities.filter(
        (activity) =>
          activity.status === "pending" &&
          activity.page !== "bridge" &&
          now - activity.date < pendingActivityMaxAge,
      );
    },
    [activities],
  );
  const pendingActivitiesRef = useRef(pendingActivities);
  pendingActivitiesRef.current = pendingActivities;
  const pendingActivityHashes = useMemo(
    () => pendingActivities.map(({ txHash }) => txHash).join(","),
    [pendingActivities],
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
          const reconciledActivities = await Promise.all(
            pendingActivitiesRef.current.map(
              async function reconcileActivity(activity) {
                const status = await getPendingActivityStatus({
                  activity,
                  getReceipt: (hash) =>
                    getTransactionReceipt(publicClient, { hash }),
                });

                return { activity, status };
              },
            ),
          );

          if (isActive) {
            reconciledActivities.forEach(function updateReconciledActivity({
              activity,
              status,
            }) {
              if (status) {
                updateActivity(account, activity.txHash, { status });
              }
            });
          }
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
    [address, client, pendingActivityHashes],
  );
}
