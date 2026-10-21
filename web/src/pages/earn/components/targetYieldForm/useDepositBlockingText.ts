import { useQueries } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useNowTickingPast } from "hooks/useNowTickingPast";
import { isEntryWindowOpen } from "pages/earn/components/fixedTermEarn/isOpenToDeposits";
import { canEntryOptions } from "pages/earn/hooks/targetYieldPool/useCanEntry";
import { depositRequestOptions } from "pages/earn/hooks/targetYieldPool/useDepositRequest";
import { useDepositState } from "pages/earn/hooks/targetYieldPool/useDepositState";
import { maxRequestDepositOptions } from "pages/earn/hooks/targetYieldPool/useMaxRequestDeposit";
import { useTranslation } from "react-i18next";
import { combineQueryResults } from "utils/queries";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { getDepositBlockingReason } from "./getDepositBlockingReason";

const reasonKeys = {
  "cap-reached": "pages.earn.fixed-term.cap-reached",
  "deposits-closed": "pages.earn.fixed-term.deposits-closed",
  "earlier-request-pending": "pages.earn.fixed-term.earlier-request-pending",
} as const;

export function useDepositBlockingText(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const client = useEthereumClient();
  const { t } = useTranslation();
  const depositState = useDepositState(stakingVaultAddress);
  const now = BigInt(
    useNowTickingPast(
      depositState.data
        ? [
            depositState.data.entryWindow.start,
            depositState.data.entryWindow.end,
          ]
        : undefined,
      (timestamp) => Number(timestamp),
    ),
  );

  const isWindowOpen =
    depositState.data === undefined
      ? undefined
      : depositState.data !== null &&
        isEntryWindowOpen({ ...depositState.data, now });

  return useQueries({
    combine: ([canEntry, depositRequest, maxRequestDeposit]) =>
      combineQueryResults({
        results: [canEntry, depositRequest, depositState, maxRequestDeposit],
        select([canEntryData, depositRequestData, depositStateData, max]) {
          const reason = getDepositBlockingReason({
            canEntry: canEntryData,
            depositState: depositStateData,
            hasPendingRequest: depositRequestData.state === "pending",
            maxRequestDeposit: max,
            now,
          });
          return {
            blockingText: reason ? t(reasonKeys[reason]) : undefined,
            maxRequestDeposit: max,
          };
        },
      }),
    queries: [
      canEntryOptions({ client, owner: account, stakingVaultAddress }),
      depositRequestOptions({
        client,
        controller: account,
        isEntryWindowOpen: isWindowOpen,
        stakingVaultAddress,
      }),
      maxRequestDepositOptions({
        account,
        client,
        isEntryWindowOpen: isWindowOpen,
        stakingVaultAddress,
      }),
    ],
  });
}
