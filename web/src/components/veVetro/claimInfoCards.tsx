import { minClaimAmount } from "@vetro-protocol/ve-vetro";
import { DisplayAmount } from "components/base/displayAmount";
import { InfoCard } from "components/base/infoCard";
import { QueryResult } from "components/base/queryResult";
import { CardRow } from "components/earn/cardRow";
import { Subtitle } from "components/earn/subtitle";
import { BoltIcon } from "components/icons/boltIcon";
import { ExitCooldownIcon } from "components/icons/exitCooldownIcon";
import { useVeVetroClaimableAmount } from "hooks/useVeVetroClaimableAmount";
import { useVeVetroClaimEnd } from "hooks/useVeVetroClaimEnd";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatMediumDate } from "utils/date";
import { isBelowMinClaim, vToken } from "utils/veVetro";
import { formatUnits } from "viem";

import { VAmountContainer } from "./vAmountContainer";

const timeZone = "UTC";

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
          container={VAmountContainer}
          showSymbol={false}
          token={vToken}
        />
      )}
      subtitle={
        data !== undefined && isBelowMinClaim(data) ? (
          <Subtitle>
            {t("pages.ve-vetro.claim.claim-button-below-minimum", {
              amount: formatUnits(minClaimAmount, vToken.decimals),
              symbol: vToken.symbol,
            })}
          </Subtitle>
        ) : undefined
      }
    />
  );
};

const ClaimEndCard = function () {
  const { i18n, t } = useTranslation();
  const claimEndQuery = useVeVetroClaimEnd();
  const { data, isLoading } = claimEndQuery;

  return (
    <InfoCard
      data={data}
      icon={<ExitCooldownIcon className="text-blue-500" />}
      isLoading={isLoading}
      label={t("pages.ve-vetro.claim.claim-end")}
      render={(claimEnd) =>
        formatMediumDate(Number(claimEnd), i18n.language, timeZone)
      }
      subtitle={
        <QueryResult
          data={() => (
            <Subtitle>{t("pages.ve-vetro.claim.claim-end-time-zone")}</Subtitle>
          )}
          error={null}
          loading={
            <Subtitle>
              <Skeleton width={140} />
            </Subtitle>
          }
          query={claimEndQuery}
        />
      }
    />
  );
};

export const ClaimInfoCards = () => (
  <div className="border-b border-gray-200">
    <CardRow left={<ClaimableAmountCard />} right={<ClaimEndCard />} />
  </div>
);
