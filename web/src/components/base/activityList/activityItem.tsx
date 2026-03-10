import { useTranslation } from "react-i18next";

import { formatShortDate } from "../../../utils/date";
import { BorrowIcon } from "../../navbar/borrowIcon";
import { EarnIcon } from "../../navbar/earnIcon";
import { SwapIcon } from "../../navbar/swapIcon";
import { ExternalLink } from "../externalLink";

import { CompletedBadgeIcon } from "./icons/completedBadgeIcon";
import { FailedBadgeIcon } from "./icons/failedBadgeIcon";
import { PendingBadgeIcon } from "./icons/pendingBadgeIcon";
import type { Activity } from "./types";

const pageIcons = {
  borrow: BorrowIcon,
  earn: EarnIcon,
  swap: SwapIcon,
} as const;

const statusBadgeIcons = {
  completed: CompletedBadgeIcon,
  failed: FailedBadgeIcon,
  pending: PendingBadgeIcon,
} as const;

type Props = Activity & { href?: string };

export function ActivityItem({ date, href, page, status, text, title }: Props) {
  const { i18n } = useTranslation();

  const PageIcon = pageIcons[page];
  const StatusBadgeIcon = statusBadgeIcons[status];

  const formattedDate = formatShortDate(date, i18n.language);

  const className =
    "flex items-center gap-3 overflow-hidden rounded-lg p-3 transition-colors hover:bg-gray-100 hover:shadow-bs";

  const innerContent = (
    <>
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
        <PageIcon className="size-5 text-blue-600" />
        <div className="absolute -right-0.5 -bottom-0.5 size-4 rounded-full bg-white">
          <StatusBadgeIcon />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className="text-xsm text-gray-500">{title}</span>
          <span className="text-xsm shrink-0 text-gray-500">
            {formattedDate}
          </span>
        </div>
        <p className="text-xsm font-medium text-gray-900">{text}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <ExternalLink className={className} href={href}>
        {innerContent}
      </ExternalLink>
    );
  }

  return <div className={className}>{innerContent}</div>;
}
