import { TokenLogo } from "components/tokenLogo";
import { Tooltip } from "components/tooltip";
import { usePrices } from "hooks/usePrices";
import { useTreasuryReserves } from "hooks/useTreasuryReserves";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatUsd, tokenAmountToUsd } from "utils/currency";
import { formatNumber } from "utils/format";
import { type Address, formatUnits } from "viem";

type Props = {
  gatewayAddress: Address;
};

export const TreasuryReserves = function ({ gatewayAddress }: Props) {
  const { t } = useTranslation();
  const { data: treasuryTokens, isError: isReservesError } =
    useTreasuryReserves(gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = isReservesError || isPricesError;

  const value =
    treasuryTokens && prices
      ? formatUsd(
          treasuryTokens.reduce(
            (total, { amount, token }) =>
              total + tokenAmountToUsd({ amount, prices, token }),
            0,
          ),
        )
      : undefined;

  return (
    <div className="mx-auto flex w-full items-center justify-between py-3 md:max-w-md">
      <span className="text-h5 text-gray-900">
        {t("pages.swap.treasury-reserves")}
      </span>
      {isError ? (
        <span className="text-h5 text-gray-500">-</span>
      ) : value !== undefined && treasuryTokens !== undefined ? (
        <Tooltip
          content={
            <div className="flex flex-col gap-1">
              {treasuryTokens.map(({ amount, token }) => (
                <div
                  className="flex items-center gap-1 sm:min-w-40"
                  key={token.address}
                >
                  <TokenLogo
                    logoURI={token.logoURI}
                    size="small"
                    symbol={token.symbol}
                  />
                  <span className="text-xsm ml-auto font-medium text-white">
                    {formatNumber(formatUnits(amount, token.decimals))}{" "}
                    {token.symbol}
                  </span>
                </div>
              ))}
            </div>
          }
        >
          <span className="text-h5 text-gray-500">{value}</span>
        </Tooltip>
      ) : (
        <Skeleton height={16} width={80} />
      )}
    </div>
  );
};
