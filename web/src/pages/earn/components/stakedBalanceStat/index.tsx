import { useTotalStakedUsd } from "hooks/useTotalStakedUsd";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";

import { BoltIcon } from "../../icons/boltIcon";
import { StatCard } from "../statCard";

export function StakedBalanceStat() {
  const { t } = useTranslation();
  const { data, isLoading } = useTotalStakedUsd();

  return (
    <StatCard
      icon={<BoltIcon />}
      isLoading={isLoading}
      label={t("pages.earn.stats.staked-balance")}
      value={data !== undefined ? formatUsd(data) : ""}
    />
  );
}
