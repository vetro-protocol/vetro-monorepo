import { Tooltip } from "components/tooltip";
import { useTranslation } from "react-i18next";
import { formatDate } from "utils/date";

import type { ExitTicket } from "../../types";

import { getTicketStatus } from "./getTicketStatus";

function getCooldownValues(claimableAt: string) {
  const now = Math.floor(Date.now() / 1000);
  const remaining = Number(claimableAt) - now;

  if (remaining <= 0) {
    return { count: 0, unit: "minutes" as const };
  }

  const days = Math.floor(remaining / 86400);
  if (days > 0) {
    return { count: days, unit: "days" as const };
  }

  const hours = Math.floor(remaining / 3600);
  if (hours > 0) {
    return { count: hours, unit: "hours" as const };
  }

  const minutes = Math.max(1, Math.floor(remaining / 60));
  return { count: minutes, unit: "minutes" as const };
}

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
  const status = getTicketStatus(ticket);
  const { count, unit } = getCooldownValues(ticket.claimableAt);
  const text = t(unitKeys[unit], { count });

  if (status === "cooldown") {
    return (
      <Tooltip
        content={t("pages.earn.exit-tickets.cooldown-ends", {
          date: formatDate(ticket.claimableAt, i18n.language),
          interpolation: { escapeValue: false },
        })}
      >
        <span className="text-xsm font-medium text-gray-900">{text}</span>
      </Tooltip>
    );
  }

  return <span className="text-xsm font-medium text-gray-900">{text}</span>;
}
