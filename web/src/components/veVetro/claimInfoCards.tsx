import { DisplayAmount } from "components/base/displayAmount";
import { InfoCard } from "components/base/infoCard";
import { CardRow } from "components/earn/cardRow";
import { Subtitle } from "components/earn/subtitle";
import { BoltIcon } from "components/icons/boltIcon";
import { ExitCooldownIcon } from "components/icons/exitCooldownIcon";
import { useVeVetroClaimableAmount } from "hooks/useVeVetroClaimableAmount";
import { useVeVetroClaimEnd } from "hooks/useVeVetroClaimEnd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatMediumDate } from "utils/date";
import { vToken } from "utils/veVetro";

const timeZone = "UTC";

const AmountContainer = ({ children }: { children?: ReactNode }) => (
  <span>
    {children} ${vToken.symbol}
  </span>
);

const ClaimableAmountCard = function () {
  const { t } = useTranslation();
  const { data, isLoading } = useVeVetroClaimableAmount();

  return (
    <InfoCard
      data={data}
      icon={<BoltIcon className="text-blue-500" />}
      isLoading={isLoading}
      label={t("pages.ve-vetro.claim.claimable-amount", {
        symbol: vToken.symbol,
      })}
      render={(amount) => (
        <DisplayAmount
          amount={amount}
          container={AmountContainer}
          showSymbol={false}
          token={vToken}
        />
      )}
    />
  );
};

const ClaimEndCard = function () {
  const { i18n, t } = useTranslation();
  const { data, isLoading } = useVeVetroClaimEnd();

  function renderSubtitle() {
    if (data !== undefined) {
      return (
        <Subtitle>{t("pages.ve-vetro.claim.claim-end-time-zone")}</Subtitle>
      );
    }
    return isLoading ? (
      <Subtitle>
        <Skeleton width={140} />
      </Subtitle>
    ) : undefined;
  }

  return (
    <InfoCard
      data={data}
      icon={<ExitCooldownIcon className="text-blue-500" />}
      isLoading={isLoading}
      label={t("pages.ve-vetro.claim.claim-end")}
      render={(claimEnd) =>
        formatMediumDate(Number(claimEnd), i18n.language, timeZone)
      }
      subtitle={renderSubtitle()}
    />
  );
};

export const ClaimInfoCards = () => (
  <div className="border-b border-gray-200">
    <CardRow left={<ClaimableAmountCard />} right={<ClaimEndCard />} />
  </div>
);
