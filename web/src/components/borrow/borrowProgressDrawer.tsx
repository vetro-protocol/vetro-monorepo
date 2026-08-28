import type { Token } from "@vetro-protocol/core";
import { Button } from "components/base/button";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { RenderFiatValue } from "components/base/fiatValue";
import {
  TokenInteraction,
  TokenInteractionList,
} from "components/base/tokenInteraction";
import { type Step, VerticalStepper } from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { NetworkFees } from "components/networkFees";
import { useTotalSupplyAndBorrowFees } from "hooks/borrow/useSupplyAndBorrowFees";
import { useAnimatedVisibility } from "hooks/useAnimatedVisibility";
import { useTranslation } from "react-i18next";
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

  const parsedBorrowAmount = parseUnits(borrowAmount, borrowToken.decimals);
  const parsedCollateralAmount = parseUnits(
    collateralAmount,
    collateralToken.decimals,
  );

  const networkFee = useTotalSupplyAndBorrowFees({
    approveAmount: undefined,
    borrowAmount: parsedBorrowAmount,
    collateralAmount: parsedCollateralAmount,
    collateralToken,
    marketId,
  });

  const { render: renderRetry, show: showRetry } =
    useAnimatedVisibility(!!onRetry);

  return (
    <div className="flex h-full flex-col">
      <DrawerTitle>{t("pages.borrow.progress.title")}</DrawerTitle>

      <TokenInteractionList>
        <TokenInteraction
          amount={collateralAmount}
          detail={
            <>
              <span className="mr-1">$</span>
              <RenderFiatValue
                token={collateralToken}
                value={parsedCollateralAmount}
              />
            </>
          }
          label={t("pages.borrow.you-are-depositing")}
          token={collateralToken}
        />

        <TokenInteraction
          amount={borrowAmount}
          detail={
            <>
              <span className="mr-1">$</span>
              <RenderFiatValue token={borrowToken} value={parsedBorrowAmount} />
            </>
          }
          label={t("pages.borrow.you-are-borrowing")}
          token={borrowToken}
        />
      </TokenInteractionList>
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
