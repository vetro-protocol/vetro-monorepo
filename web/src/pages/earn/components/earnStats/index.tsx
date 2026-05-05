import { useTranslation } from "react-i18next";

import { SparklesIcon } from "../../icons/sparklesIcon";
import { EarnedAmountStat } from "../earnedAmountStat";
import { StakedBalanceStat } from "../stakedBalanceStat";
import { StatCard } from "../statCard";

export function EarnStats() {
  const { t } = useTranslation();

  return (
    <>
      <StakedBalanceStat />
      <EarnedAmountStat />
      {/* TODO - Rewards should be implemented as soon we have the API available */}
      {/* See https://github.com/vetro-protocol/vetro-monorepo/issues/69 */}
      <StatCard
        icon={<SparklesIcon />}
        label={t("pages.earn.stats.rewards")}
        value="-"
      />
    </>
  );
}
