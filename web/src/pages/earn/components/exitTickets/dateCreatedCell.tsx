import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatDate } from "utils/date";

import { useCooldownDuration } from "../../hooks/useCooldownDuration";
import type { ExitTicket } from "../../types";

type Props = {
  ticket: ExitTicket;
};

export function DateCreatedCell({ ticket }: Props) {
  const { i18n } = useTranslation();
  const { data, isError, isLoading } = useCooldownDuration(
    ticket.stakingVaultAddress,
  );

  if (isLoading) {
    return <Skeleton width={100} />;
  }

  if (isError || data === undefined) {
    return <span className="text-xsm font-normal text-gray-500">-</span>;
  }

  return (
    <span className="text-xsm font-normal text-gray-500">
      {formatDate(Number(ticket.claimableAt) - data * 86400, i18n.language)}
    </span>
  );
}
