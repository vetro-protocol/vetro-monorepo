import { Button } from "components/base/button";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { RenderFiatValue } from "components/base/fiatValue";
import { type Step, VerticalStepper } from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { NetworkFees } from "components/networkFees";
import { TokenLogo } from "components/tokenLogo";
import { useTotalSupplyAndBorrowFees } from "hooks/borrow/useSupplyAndBorrowFees";
import { useAnimatedVisibility } from "hooks/useAnimatedVisibility";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { type Hash, parseUnits } from "viem";

type Props = {
  borrowAmount: string;
  borrowToken: Token;
  collateralAmount: string;
  collateralToken: Token;
  marketId: Hash;
  onRetry?: VoidFunction;
  steps: Step[];
};

export function BorrowProgressDrawer({
  borrowAmount,
  borrowToken,
  collateralAmount,
  collateralToken,
  marketId,
  onRetry,
  steps,
}: Props) {
  const { t } = useTranslation();

  const networkFee = useTotalSupplyAndBorrowFees({
    approveAmount: undefined,
    borrowAmount: parseUnits(borrowAmount, borrowToken.decimals),
    collateralAmount: parseUnits(collateralAmount, collateralToken.decimals),
    collateralToken,
    marketId,
  });

  const { render: renderRetry, show: showRetry } =
    useAnimatedVisibility(!!onRetry);

  return (
    <div className="flex h-full flex-col">
      <DrawerTitle>{t("pages.borrow.progress.title")}</DrawerTitle>

      <div className="flex flex-col gap-10 border-y border-gray-200 bg-gray-50 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-xsm text-gray-500">
            {t("pages.borrow.you-are-depositing")}
          </p>
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-x-2 text-4xl leading-10 font-semibold tracking-tight text-gray-900">
              <span>{collateralAmount}</span>
              <span className="text-gray-500">{collateralToken.symbol}</span>
            </p>
            <TokenLogo {...collateralToken} size="large" />
          </div>
          <p className="text-xsm text-gray-500">
            <span className="mr-1">$</span>
            <RenderFiatValue
              token={collateralToken}
              value={parseUnits(collateralAmount, collateralToken.decimals)}
            />
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xsm text-gray-500">
            {t("pages.borrow.you-are-borrowing")}
          </p>
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-x-2 text-4xl leading-10 font-semibold tracking-tight text-gray-900">
              <span>{borrowAmount}</span>
              <span className="text-gray-500">{borrowToken.symbol}</span>
            </p>
            <TokenLogo {...borrowToken} size="large" />
          </div>
          <p className="text-xsm text-gray-500">
            <span className="mr-1">$</span>
            <RenderFiatValue
              token={borrowToken}
              value={parseUnits(borrowAmount, borrowToken.decimals)}
            />
          </p>
        </div>
      </div>
      <DrawerFeesContainer>
        <NetworkFees networkFee={networkFee} />
      </DrawerFeesContainer>

      <div className="flex-1" />

      {steps.length > 0 && (
        <div className="flex flex-col gap-2 px-6 pb-6">
          <p className="text-caption text-gray-500">
            {t("pages.borrow.progress.borrow-progress")}
          </p>
          <div className="border-t border-gray-200">
            <VerticalStepper steps={steps} />
          </div>
        </div>
      )}

      {renderRetry && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            showRetry ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full">
              <Button onClick={onRetry} size="small" variant="primary">
                {t("pages.borrow.progress.retry")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
