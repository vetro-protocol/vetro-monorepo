import { Button } from "components/base/button";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { type Step, VerticalStepper } from "components/base/verticalStepper";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { TokenLogo } from "components/tokenLogo";
import { useAnimatedVisibility } from "hooks/useAnimatedVisibility";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

import { OutputLabel } from "./outputLabel";

type Props = {
  fromAmount: string;
  fromToken: Token;
  networkFee: string;
  onRetry?: VoidFunction;
  outputValue?: string;
  protocolFee: string;
  steps: Step[];
  subtitle?: ReactNode;
  totalFees: string;
  toToken?: Token;
};

export function SwapProgressDrawer({
  fromAmount,
  fromToken,
  networkFee,
  onRetry,
  outputValue,
  protocolFee,
  steps,
  subtitle,
  totalFees,
  toToken,
}: Props) {
  const { t } = useTranslation();
  const { render: renderRetry, show: showRetry } =
    useAnimatedVisibility(!!onRetry);

  return (
    <>
      <div className="flex h-full flex-col">
        <DrawerTitle>{t("pages.swap.progress.title")}</DrawerTitle>

        <div className="flex flex-col gap-10 border-y border-gray-200 bg-gray-50 p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xsm text-gray-500">
              {t("pages.swap.form.you-are-swapping")}
            </p>
            <div className="flex items-center gap-3">
              <p className="flex items-center gap-x-2 text-4xl leading-10 font-semibold tracking-tight text-gray-900">
                <span>{fromAmount}</span>
                <span className="text-gray-500">{fromToken.symbol}</span>
              </p>
              <TokenLogo {...fromToken} size="large" />
            </div>
            <p className="text-xsm text-gray-500">${fromAmount}</p>
            {subtitle && (
              <p className="text-base font-semibold text-gray-500">
                {subtitle}
              </p>
            )}
          </div>

          {toToken && outputValue !== undefined && (
            <div className="flex flex-col gap-2">
              <p className="text-xsm text-gray-500">
                {t("pages.swap.form.you-will-receive")}
              </p>
              <div className="flex items-center gap-3">
                <p className="flex items-center gap-x-2 text-4xl leading-10 font-semibold tracking-tight text-gray-900">
                  <span>{outputValue}</span>
                  <span className="text-gray-500">{toToken.symbol}</span>
                </p>
                <TokenLogo {...toToken} size="large" />
              </div>
              <p className="text-xsm text-gray-500">${outputValue}</p>
            </div>
          )}
        </div>

        <FeesContainer
          label={
            toToken && outputValue !== undefined ? (
              <OutputLabel
                fromInputValue={fromAmount}
                fromToken={fromToken}
                outputValue={outputValue}
                toToken={toToken}
              />
            ) : undefined
          }
          totalFees={totalFees}
        >
          <FeeDetails
            label={t("pages.swap.fees.network-fee")}
            value={networkFee}
          />
          <FeeDetails
            label={t("pages.swap.fees.fixed-protocol-fee")}
            value={protocolFee}
          />
        </FeesContainer>

        <div className="flex-1" />

        {steps.length > 0 && (
          <div className="flex flex-col gap-2 px-6 pb-6">
            <p className="text-[11px] leading-4 font-medium tracking-wide text-gray-500">
              {t("pages.swap.progress.swap-progress")}
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
                  {t("pages.swap.progress.retry")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
