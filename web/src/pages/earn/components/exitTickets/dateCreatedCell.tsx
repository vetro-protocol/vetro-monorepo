import { QueryResult } from "components/base/queryResult";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatDate, SECONDS_PER_DAY } from "utils/date";

import { useCooldownDuration } from "../../hooks/useCooldownDuration";
import type { ExitTicket } from "../../types";

type Props = {
  ticket: ExitTicket;
};

export function DateCreatedCell({ ticket }: Props) {
  const { i18n } = useTranslation();
  const cooldownDurationQuery = useCooldownDuration(ticket.stakingVaultAddress);

  return (
    <QueryResult
      data={(data) => (
        <span className="text-xsm font-normal text-gray-500">
          {formatDate(
            Number(ticket.claimableAt) - data * SECONDS_PER_DAY,
            i18n.language,
          )}
        </span>
      )}
      error={<span className="text-xsm font-normal text-gray-500">-</span>}
      loading={<Skeleton width={100} />}
      query={cooldownDurationQuery}
    />
  );
}
