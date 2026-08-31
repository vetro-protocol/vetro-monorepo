import { Button } from "components/base/button";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { RenderFiatValue } from "components/base/fiatValue";
import {
  TokenInteraction,
  TokenInteractionList,
} from "components/base/tokenInteraction";
import { type Step, VerticalStepper } from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { useAnimatedVisibility } from "hooks/useAnimatedVisibility";
import type { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { parseTokenUnits } from "utils/token";
import type { Address } from "viem";

import { OutputLabel, type UnitPreview } from "./outputLabel";
import { SwapFees } from "./swapFees";

type Props = {
  fromAmount: string;
  fromToken: TokenWithGateway;
  isOutputError?: boolean;
  onRetry?: VoidFunction;
  oracleToken?: Address;
  outputAmount?: bigint;
  outputValue?: string;
  steps: Step[];
  subtitle?: ReactNode;
  toToken?: TokenWithGateway;
  unitPreview?: UnitPreview;
} & Pick<
  ComponentProps<typeof SwapFees>,
  "networkFee" | "protocolFee" | "totalFees"
>;

export function SwapProgressDrawer({
  fromAmount,
  fromToken,
  isOutputError,
  networkFee,
  onRetry,
  oracleToken,
  outputAmount,
  outputValue,
  protocolFee,
  steps,
  subtitle,
  totalFees,
  toToken,
  unitPreview,
}: Props) {
  const { t } = useTranslation();
  const { render: renderRetry, show: showRetry } =
    useAnimatedVisibility(!!onRetry);

  return (
    <>
      <div className="flex h-full flex-col">
        <DrawerTitle>{t("pages.swap.progress.title")}</DrawerTitle>

        <TokenInteractionList>
          <TokenInteraction
            amount={fromAmount}
            detail={
              <>
                <span className="mr-1">$</span>
                <RenderFiatValue
                  token={fromToken}
                  value={parseTokenUnits(fromAmount, fromToken)}
                />
              </>
            }
            label={t("pages.swap.form.you-are-swapping")}
            subtitle={subtitle}
            token={fromToken}
          />

          {toToken && outputValue !== undefined && (
            <TokenInteraction
              amount={outputValue}
              detail={
                <>
                  <span className="mr-1">$</span>
                  <RenderFiatValue
                    queryStatus={isOutputError ? "error" : "success"}
                    token={toToken}
                    value={outputAmount}
                  />
                </>
              }
              label={t("pages.swap.form.you-will-receive-estimated")}
              token={toToken}
            />
          )}
        </TokenInteractionList>
        <DrawerFeesContainer>
          <SwapFees
            fromToken={fromToken}
            networkFee={networkFee}
            outputLabel={
              toToken !== undefined &&
              oracleToken !== undefined &&
              unitPreview !== undefined ? (
                <OutputLabel
                  fromToken={fromToken}
                  oracleToken={oracleToken}
                  toToken={toToken}
                  unitPreview={unitPreview}
                />
              ) : null
            }
            protocolFee={protocolFee}
            totalFees={totalFees}
          />
        </DrawerFeesContainer>
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
