import type { Market } from "@morpho-org/blue-sdk";
import { DisplayAmount } from "components/base/displayAmount";
import { Tooltip } from "components/tooltip";
import { useBorrowReview } from "hooks/borrow/useBorrowReview";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatFiatNumber, formatPercentage } from "utils/format";
import { parseUnits } from "viem";

import { HealthFactor, HealthFactorBar } from "./healthFactor";
import { QuestionIcon } from "./questionIcon";

type Props = {
  borrowApy: number;
  borrowInput: string;
  collateralInput: string;
  collateralToken: Token;
  loanToken: Token;
  morphoMarket: Market | undefined;
};

const ReviewRow = ({
  children,
  label,
  tooltip,
}: {
  children: React.ReactNode;
  label: string;
  tooltip: string;
}) => (
  <div className="text-b-medium flex items-center justify-between border-t border-gray-200 py-3.5 text-gray-900">
    <div className="flex h-5.5 items-center gap-1.5">
      <Tooltip content={tooltip}>
        <QuestionIcon />
      </Tooltip>
      <span>{label}</span>
    </div>
    <>{children}</>
  </div>
);

export function BorrowingReview({
  borrowApy,
  borrowInput,
  collateralInput,
  collateralToken,
  loanToken,
  morphoMarket,
}: Props) {
  const { t } = useTranslation();

  const { dailyInterestCost, healthFactor, liquidationPrice, lltv, ltv } =
    useBorrowReview({
      borrowApy,
      borrowInput,
      collateralInput,
      collateralToken,
      loanToken,
      morphoMarket,
    });

  return (
    <>
      <h3 className="text-b-medium box-content h-5.5 py-3.5 text-gray-500">
        {t("pages.borrow.borrowing-review")}
      </h3>
      <ReviewRow
        label={t("pages.borrow.health-factor")}
        tooltip={t("pages.borrow.health-factor-tooltip")}
      >
        <div className="mr-auto ml-2">
          <HealthFactorBar
            lltv={lltv ?? 0}
            ltv={ltv !== null ? ltv * 100 : null}
          />
        </div>
        <span className="text-h4">
          <HealthFactor
            lltv={lltv ?? 0}
            ltv={ltv !== null ? ltv * 100 : null}
            value={healthFactor}
          />
        </span>
      </ReviewRow>
      <ReviewRow
        label={t("pages.borrow.ltv")}
        tooltip={t("pages.borrow.ltv-tooltip", { symbol: loanToken.symbol })}
      >
        <span className="text-h4">
          {ltv !== null ? formatPercentage(ltv * 100) : "-"}
        </span>
      </ReviewRow>
      <ReviewRow
        label={t("pages.borrow.liquidation-price")}
        tooltip={t("pages.borrow.liquidation-price-tooltip")}
      >
        <span className="text-h4">
          {liquidationPrice !== null
            ? `$${formatFiatNumber(liquidationPrice)}`
            : "-"}
        </span>
      </ReviewRow>
      <ReviewRow
        label={t("pages.borrow.daily-interest-cost")}
        tooltip={t("pages.borrow.daily-interest-cost-tooltip")}
      >
        <span className="text-h4">
          {dailyInterestCost !== null ? (
            <DisplayAmount
              amount={parseUnits(
                dailyInterestCost.toFixed(loanToken.decimals),
                loanToken.decimals,
              )}
              token={loanToken}
            />
          ) : (
            "-"
          )}
        </span>
      </ReviewRow>
      <ReviewRow
        label={t("pages.borrow.effective-interest")}
        tooltip={t("pages.borrow.effective-interest-tooltip")}
      >
        <span className="text-h4">
          {t("pages.borrow.apr", { value: formatPercentage(borrowApy * 100) })}
        </span>
      </ReviewRow>
    </>
  );
}
