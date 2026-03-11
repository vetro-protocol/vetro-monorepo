import { useTranslation } from "react-i18next";
import type { Token } from "types";
import {
  calculatePriceDropPercentage,
  formatOraclePrice,
} from "utils/borrowReview";
import { formatFiatNumber, formatPercentage } from "utils/format";
import { getTokenPrice } from "utils/token";

type Props = {
  collateralToken: Token;
  liquidationPrice: bigint | null;
  loanToken: Token;
  prices: Record<string, string> | undefined;
};

export function LiquidationPriceCell({
  collateralToken,
  liquidationPrice,
  loanToken,
  prices,
}: Props) {
  const { t } = useTranslation();

  const loanUsdPrice = Number(getTokenPrice(loanToken, prices));
  const collateralUsd = Number(getTokenPrice(collateralToken, prices));

  if (liquidationPrice === null || loanUsdPrice <= 0 || collateralUsd <= 0) {
    return <span className="text-b-medium self-start text-gray-900">$ -</span>;
  }
  const liqPriceUsd =
    formatOraclePrice({
      collateralTokenDecimals: collateralToken.decimals,
      loanTokenDecimals: loanToken.decimals,
      value: liquidationPrice,
    }) * loanUsdPrice;

  const drop = calculatePriceDropPercentage({
    collateralUsd,
    liquidationUsd: liqPriceUsd,
  });

  return (
    <div className="flex flex-col items-start">
      <span className="text-b-medium text-gray-900">
        ${formatFiatNumber(liqPriceUsd)}
      </span>
      {drop !== null && (
        <span className="text-caption text-gray-500">
          {t("pages.borrow.drop-from-price", {
            percentage: formatPercentage(drop),
            price: formatFiatNumber(collateralUsd),
          })}
        </span>
      )}
    </div>
  );
}
