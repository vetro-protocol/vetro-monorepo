import { Tooltip } from "components/tooltip";
import { useNowTickingPast } from "hooks/useNowTickingPast";
import { useTranslation } from "react-i18next";
import { formatDate, unixNowTimestamp } from "utils/date";

import type { ExitTicket } from "../../types";

import { getCooldownValues, getNextChangeTime } from "./getCooldownTiming";
import { getTicketStatus } from "./getTicketStatus";

const unitKeys = {
  days: "pages.earn.exit-tickets.days",
  hours: "pages.earn.exit-tickets.hours",
  minutes: "pages.earn.exit-tickets.minutes",
} as const;

type Props = {
  ticket: ExitTicket;
};

export function CooldownCell({ ticket }: Props) {
  const { i18n, t } = useTranslation();
  const now = useNowTickingPast([ticket], () =>
    getNextChangeTime({
      claimableAt: ticket.claimableAt,
      now: unixNowTimestamp(),
    }),
  );
  const status = getTicketStatus({ now, ticket });
  const { count, unit } = getCooldownValues({
    claimableAt: ticket.claimableAt,
    now: unixNowTimestamp(),
  });
  const text = t(unitKeys[unit], { count });

  if (status === "cooldown") {
    return (
      <Tooltip
        content={t("pages.earn.exit-tickets.cooldown-ends", {
          date: formatDate(ticket.claimableAt, i18n.language),
        })}
      >
        <span className="text-xsm font-medium text-gray-900">{text}</span>
      </Tooltip>
    );
  }

  return <span className="text-xsm font-medium text-gray-900">{text}</span>;
}
