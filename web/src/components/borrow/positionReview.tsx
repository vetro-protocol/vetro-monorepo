import { DisplayAmount } from "components/base/displayAmount";
import { TokenLogo } from "components/tokenLogo";
import { Tooltip } from "components/tooltip";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatFiatNumber, formatPercentage } from "utils/format";

import { HealthFactor } from "./healthFactor";

type PositionMetrics = {
  borrowAssets: bigint;
  collateral: bigint;
  dailyInterestCost: number | null;
  healthFactor: number | null;
  liquidationPrice: number | null;
  ltv: number | null;
};

type Props = {
  borrowApy: number;
  collateralToken: Token;
  current: PositionMetrics;
  lltv: number;
  loanToken: Token;
  updated: PositionMetrics | null;
};

const QuestionIcon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M15 8C15 9.85652 14.2625 11.637 12.9497 12.9497C11.637 14.2625 9.85652 15 8 15C6.14348 15 4.36301 14.2625 3.05025 12.9497C1.7375 11.637 1 9.85652 1 8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8ZM9 11.5C9 11.7652 8.89464 12.0196 8.70711 12.2071C8.51957 12.3946 8.26522 12.5 8 12.5C7.73478 12.5 7.48043 12.3946 7.29289 12.2071C7.10536 12.0196 7 11.7652 7 11.5C7 11.2348 7.10536 10.9804 7.29289 10.7929C7.48043 10.6054 7.73478 10.5 8 10.5C8.26522 10.5 8.51957 10.6054 8.70711 10.7929C8.89464 10.9804 9 11.2348 9 11.5ZM7.293 5.293C7.4008 5.18552 7.53171 5.10407 7.67576 5.05486C7.81981 5.00565 7.97319 4.98997 8.12421 5.00902C8.27524 5.02808 8.41992 5.08136 8.54723 5.1648C8.67455 5.24825 8.78113 5.35966 8.85886 5.49054C8.93659 5.62142 8.98341 5.76832 8.99576 5.92004C9.0081 6.07176 8.98565 6.2243 8.93011 6.36603C8.87457 6.50776 8.78741 6.63493 8.67526 6.73787C8.56312 6.8408 8.42896 6.91678 8.283 6.96C7.824 7.094 7.25 7.526 7.25 8.25V8.5C7.25 8.69891 7.32902 8.88968 7.46967 9.03033C7.61032 9.17098 7.80109 9.25 8 9.25C8.19891 9.25 8.38968 9.17098 8.53033 9.03033C8.67098 8.88968 8.75 8.69891 8.75 8.5V8.385C9.11137 8.2712 9.44215 8.07676 9.71734 7.81637C9.99254 7.55598 10.205 7.23645 10.3385 6.88192C10.4721 6.52739 10.5234 6.14713 10.4884 5.76988C10.4535 5.39263 10.3333 5.02826 10.1369 4.70429C9.94043 4.38033 9.67295 4.10524 9.35461 3.89982C9.03627 3.6944 8.67541 3.56402 8.29929 3.51852C7.92316 3.47303 7.54162 3.51362 7.18349 3.63722C6.82536 3.76082 6.5 3.9642 6.232 4.232C6.1604 4.30122 6.1033 4.384 6.06404 4.47553C6.02478 4.56705 6.00414 4.66547 6.00332 4.76506C6.0025 4.86464 6.02152 4.96339 6.05928 5.05554C6.09703 5.1477 6.15276 5.23141 6.22321 5.3018C6.29366 5.37218 6.37743 5.42783 6.46962 5.4655C6.56181 5.50317 6.66058 5.5221 6.76016 5.52119C6.85974 5.52027 6.95815 5.49954 7.04963 5.46019C7.14112 5.42084 7.22385 5.36366 7.293 5.292V5.293Z"
      fill="#99A1AF"
      fillRule="evenodd"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM7.29289 5.29289C7.68342 4.90237 8.31658 4.90237 8.70711 5.29289L11.2071 7.79289C11.5976 8.18342 11.5976 8.81658 11.2071 9.20711L8.70711 11.7071C8.31658 12.0976 7.68342 12.0976 7.29289 11.7071C6.90237 11.3166 6.90237 10.6834 7.29289 10.2929L8.58579 9H5.5C4.94772 9 4.5 8.55228 4.5 8C4.5 7.44772 4.94772 7 5.5 7H8.58579L7.29289 5.70711C6.90237 5.31658 6.90237 4.68342 7.29289 5.29289Z"
      fill="#99A1AF"
      fillRule="evenodd"
    />
  </svg>
);

const formatDailyCost = (value: number | null, perDay: string) =>
  value !== null ? `$${formatFiatNumber(value)} ${perDay}` : "-";

const formatLtvValue = (value: number | null) =>
  value !== null ? formatPercentage(value * 100) : "-";

const formatPrice = (value: number | null) =>
  value !== null ? `$${formatFiatNumber(value)}` : "-";

const PositionReviewRow = ({
  children,
  hasChanges,
  label,
  tooltip,
  updatedChildren,
}: {
  children: React.ReactNode;
  hasChanges: boolean;
  label: string;
  tooltip: string;
  updatedChildren: React.ReactNode;
}) => (
  <div className="flex items-center justify-between border-b border-gray-200 py-3.5 text-gray-900">
    <div className="flex h-5.5 items-center gap-1.5">
      <Tooltip content={tooltip}>
        <QuestionIcon />
      </Tooltip>
      <span className="text-b-medium">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className={`text-h4 w-26 ${hasChanges ? "opacity-50" : ""}`}>
        {children}
      </span>
      <ArrowIcon />
      <span className="text-h4 w-26 text-right">
        {hasChanges ? updatedChildren : "-"}
      </span>
    </div>
  </div>
);

export function PositionReview({
  borrowApy,
  collateralToken,
  current,
  lltv,
  loanToken,
  updated,
}: Props) {
  const { t } = useTranslation();

  const hasChanges = updated !== null;
  const perDay = t("pages.borrow.per-day");
  const aprText = t("pages.borrow.apr", {
    value: formatPercentage(borrowApy * 100),
  });

  const CollateralContainer = ({
    children,
  }: {
    children?: React.ReactNode;
  }) => (
    <span className="flex items-center justify-end gap-2">
      <TokenLogo {...collateralToken} />
      {children}
    </span>
  );

  const LoanContainer = ({ children }: { children?: React.ReactNode }) => (
    <span className="flex items-center justify-end gap-2">
      <TokenLogo {...loanToken} />
      {children}
    </span>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 py-3.5">
        <span className="text-b-medium text-gray-500">
          {t("pages.borrow.position-review")}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-b-medium w-26 text-gray-500">
            {t("pages.borrow.current")}
          </span>
          <span className="size-4" />
          <span className="text-b-medium w-26 text-right text-gray-500">
            {t("pages.borrow.updated")}
          </span>
        </div>
      </div>
      <PositionReviewRow
        hasChanges={hasChanges}
        label={t("pages.borrow.collateral")}
        tooltip={t("pages.borrow.ltv-tooltip")}
        updatedChildren={
          updated && (
            <span className="*:w-full">
              <DisplayAmount
                amount={updated.collateral}
                container={CollateralContainer}
                showSymbol={false}
                token={collateralToken}
              />
            </span>
          )
        }
      >
        <DisplayAmount
          amount={current.collateral}
          container={CollateralContainer}
          showSymbol={false}
          token={collateralToken}
        />
      </PositionReviewRow>
      <PositionReviewRow
        hasChanges={hasChanges}
        label={t("pages.borrow.loan")}
        tooltip={t("pages.borrow.ltv-tooltip")}
        updatedChildren={
          updated && (
            <span className="*:w-full">
              <DisplayAmount
                amount={updated.borrowAssets}
                container={LoanContainer}
                showSymbol={false}
                token={loanToken}
              />
            </span>
          )
        }
      >
        <DisplayAmount
          amount={current.borrowAssets}
          container={LoanContainer}
          showSymbol={false}
          token={loanToken}
        />
      </PositionReviewRow>
      <PositionReviewRow
        hasChanges={hasChanges}
        label={t("pages.borrow.health-factor")}
        tooltip={t("pages.borrow.health-factor-tooltip")}
        updatedChildren={
          updated && (
            <HealthFactor
              lltv={lltv}
              ltv={updated.ltv !== null ? updated.ltv * 100 : null}
              value={updated.healthFactor}
            />
          )
        }
      >
        <HealthFactor
          lltv={lltv}
          ltv={current.ltv !== null ? current.ltv * 100 : null}
          value={current.healthFactor}
        />
      </PositionReviewRow>
      <PositionReviewRow
        hasChanges={hasChanges}
        label={t("pages.borrow.ltv")}
        tooltip={t("pages.borrow.ltv-tooltip")}
        updatedChildren={updated ? formatLtvValue(updated.ltv) : "-"}
      >
        {formatLtvValue(current.ltv)}
      </PositionReviewRow>
      <PositionReviewRow
        hasChanges={hasChanges}
        label={t("pages.borrow.liquidation-price")}
        tooltip={t("pages.borrow.liquidation-price-tooltip")}
        updatedChildren={updated ? formatPrice(updated.liquidationPrice) : "-"}
      >
        {formatPrice(current.liquidationPrice)}
      </PositionReviewRow>
      <PositionReviewRow
        hasChanges={hasChanges}
        label={t("pages.borrow.daily-interest-cost")}
        tooltip={t("pages.borrow.daily-interest-cost-tooltip")}
        updatedChildren={
          updated ? formatDailyCost(updated.dailyInterestCost, perDay) : "-"
        }
      >
        {formatDailyCost(current.dailyInterestCost, perDay)}
      </PositionReviewRow>
      <PositionReviewRow
        hasChanges={hasChanges}
        label={t("pages.borrow.effective-interest")}
        tooltip={t("pages.borrow.effective-interest-tooltip")}
        updatedChildren={aprText}
      >
        {aprText}
      </PositionReviewRow>
    </>
  );
}
