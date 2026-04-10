import { DisplayAmount } from "components/base/displayAmount";
import { TokenLogo } from "components/tokenLogo";
import { useTreasuryReserves } from "hooks/useTreasuryReserves";
import { Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { Token } from "types";

const tokenContainer = (token: Token) =>
  Object.assign(
    ({ children }: { children?: ReactNode }) => (
      <span className="flex items-center gap-1">
        <TokenLogo {...token} />
        {children}
      </span>
    ),
    { displayName: "TokenContainer" },
  );

export const TreasuryReserves = function () {
  const { t } = useTranslation();
  const { data: treasuryTokens, isError } = useTreasuryReserves();

  return (
    <div className="mx-auto flex w-full items-center justify-between py-3 md:max-w-md">
      <span className="text-h5 text-gray-900">
        {t("pages.swap.treasury-reserves")}
      </span>
      {isError ? (
        <span className="text-h5 text-gray-500">-</span>
      ) : treasuryTokens !== undefined ? (
        <span className="text-h5 flex items-center gap-x-3 text-gray-500">
          {treasuryTokens.map(({ amount, token }, index) => (
            <Fragment key={token.address}>
              {index > 0 && (
                <span className="h-2 w-0.5 rounded-full border border-gray-300" />
              )}
              <DisplayAmount
                amount={amount}
                container={tokenContainer(token)}
                token={token}
              />
            </Fragment>
          ))}
        </span>
      ) : (
        <Skeleton height={16} width={120} />
      )}
    </div>
  );
};
