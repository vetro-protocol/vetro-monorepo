import { useTranslation } from "react-i18next";

import { formatShortDate } from "../../../utils/date";
import { BorrowIcon } from "../../navbar/borrowIcon";
import { EarnIcon } from "../../navbar/earnIcon";
import { SwapIcon } from "../../navbar/swapIcon";

import { ConcludedBadgeIcon } from "./icons/concludedBadgeIcon";
import { FailedBadgeIcon } from "./icons/failedBadgeIcon";
import { PendingBadgeIcon } from "./icons/pendingBadgeIcon";
import type { Activity, ActivityAction, ActivityPage } from "./types";

const activityActionKeys = {
  borrowMore: "pages.wallet.activity.borrow-more",
  deposit: "pages.wallet.activity.deposit",
  openLoan: "pages.wallet.activity.open-loan",
  redeem: "pages.wallet.activity.redeem",
  repayPosition: "pages.wallet.activity.repay-position",
  supplyPosition: "pages.wallet.activity.supply-position",
  withdraw: "pages.wallet.activity.withdraw",
} as const satisfies Record<ActivityAction, string>;

const pageIcons = {
  borrow: BorrowIcon,
  earn: EarnIcon,
  swap: SwapIcon,
} as const;

const pageNavKeys = {
  borrow: "nav.borrow",
  earn: "nav.earn",
  swap: "nav.swap",
} as const satisfies Record<ActivityPage, string>;

const statusBadgeIcons = {
  concluded: ConcludedBadgeIcon,
  failed: FailedBadgeIcon,
  pending: PendingBadgeIcon,
} as const;

type Props = Activity;

export function ActivityItem({
  action,
  collateral,
  date,
  label,
  page,
  status,
  symbol,
}: Props) {
  const { i18n, t } = useTranslation();

  const PageIcon = pageIcons[page];
  const StatusBadgeIcon = statusBadgeIcons[status];

  const formattedDate = formatShortDate(date, i18n.language);

  return (
    <div className="flex items-center gap-3 rounded-lg p-3">
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
        <PageIcon className="size-5 text-blue-600" />
        <div className="absolute right-[-2px] bottom-[-2px] size-4 rounded-full bg-white">
          <StatusBadgeIcon />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xsm text-gray-500">
              {t(pageNavKeys[page])}
            </span>
            {action && (
              <>
                <span className="text-xsm text-gray-500">·</span>
                <span className="text-xsm text-gray-500">
                  {t(activityActionKeys[action], { collateral, symbol })}
                </span>
              </>
            )}
          </div>
          <span className="text-xsm shrink-0 text-gray-500">
            {formattedDate}
          </span>
        </div>
        <p className="text-xsm font-medium text-gray-900">{label}</p>
      </div>
    </div>
  );
}
