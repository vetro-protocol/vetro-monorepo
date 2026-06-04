import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { useClaimWithdrawBatch } from "hooks/useClaimWithdrawBatch";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { addActivity, updateActivity } from "stores/activityStore";
import { unixNowTimestamp } from "utils/date";
import { formatAmount } from "utils/token";
import { type Address, isAddressEqual } from "viem";
import { useAccount } from "wagmi";

import type { VaultStatus } from "./withdrawAllProgressDrawer";

const WithdrawAllProgressDrawer = lazy(() =>
  import("./withdrawAllProgressDrawer").then((m) => ({
    default: m.WithdrawAllProgressDrawer,
  })),
);

export type VaultWithdrawal = {
  amount: bigint;
  requestIds: bigint[];
  stakingVaultAddress: Address;
};

type Props = {
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  withdrawals: VaultWithdrawal[];
};

export function WithdrawAllDrawer({ onClose, onSuccess, withdrawals }: Props) {
  const { address: account } = useAccount();
  const { t } = useTranslation();

  // Snapshot the vaults once: as each transaction succeeds it optimistically
  // drops its tickets from the ready list (shrinking the parent's array), but
  // the drawer must keep showing every vault until the flow ends.
  const [vaults] = useState(withdrawals);

  const [statuses, setStatuses] = useState<Record<Address, VaultStatus>>(() =>
    Object.fromEntries(
      vaults.map((vault) => [vault.stakingVaultAddress, "pending"]),
    ),
  );

  // Maps each vault to the hash of its in-flight transaction so the matching
  // activity entry can be updated when it settles. Mirrors the single tx hash
  // ref in useActivityTracking, but keyed per vault: the entry is cleared once
  // the vault reaches a terminal state, so a retry starts from a fresh hash.
  const txHashes = useRef<Record<Address, string>>({});

  const { mutate } = useClaimWithdrawBatch({
    onStatusChange({ peggedToken, stakingVaultAddress, status }) {
      setStatuses((prev) => ({ ...prev, [stakingVaultAddress]: status }));

      const txHash = txHashes.current[stakingVaultAddress];
      if (!account || !txHash) {
        return;
      }

      if (status === "claiming") {
        const amount = vaults.find((vault) =>
          isAddressEqual(vault.stakingVaultAddress, stakingVaultAddress),
        )!.amount;
        addActivity(account, {
          date: unixNowTimestamp(),
          page: "earn",
          status: "pending",
          text: t("pages.earn.activity.claim-withdraw-text", {
            amount: formatAmount({
              amount,
              decimals: peggedToken.decimals,
              isError: false,
            }),
            symbol: peggedToken.symbol,
          }),
          title: `${t("nav.earn")} · ${t("pages.earn.exit-tickets.withdraw-all")}`,
          txHash,
        });
      } else if (status === "completed") {
        updateActivity(account, txHash, { status: "completed" });
        delete txHashes.current[stakingVaultAddress];
      } else if (status === "failed") {
        updateActivity(account, txHash, { status: "failed" });
        delete txHashes.current[stakingVaultAddress];
      }
    },
    onSuccess,
    onTransactionHash({ hash, stakingVaultAddress }) {
      txHashes.current[stakingVaultAddress] = hash;
    },
  });

  // Start the flow once on mount. mirrors how the swap form fires its mutation;
  // the ref guards against React StrictMode's double effect invocation.
  const started = useRef(false);
  useEffect(
    function start() {
      if (started.current) {
        return;
      }
      started.current = true;
      mutate(vaults);
    },
    [mutate, vaults],
  );

  const allCompleted = vaults.every(
    (vault) => statuses[vault.stakingVaultAddress] === "completed",
  );
  const hasFailure = vaults.some(
    (vault) => statuses[vault.stakingVaultAddress] === "failed",
  );

  useCloseOnSuccess({ onClose, success: allCompleted });

  function handleRetry() {
    const remaining = vaults.filter(
      (vault) => statuses[vault.stakingVaultAddress] !== "completed",
    );
    setStatuses(function (prev) {
      const next = { ...prev };
      remaining.forEach(function (vault) {
        next[vault.stakingVaultAddress] = "pending";
      });
      return next;
    });
    mutate(remaining);
  }

  return (
    <Drawer onClose={onClose}>
      <Suspense fallback={<DrawerLoader />}>
        <WithdrawAllProgressDrawer
          onRetry={hasFailure ? handleRetry : undefined}
          statuses={statuses}
          vaults={vaults}
        />
      </Suspense>
    </Drawer>
  );
}
