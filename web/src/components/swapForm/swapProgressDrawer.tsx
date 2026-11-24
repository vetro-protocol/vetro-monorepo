import { RenderCryptoValue } from "components/base/cryptoValue";
import { DollarSign } from "components/base/dollarSign";
import { DrawerRetryFooter } from "components/base/drawer/drawerRetryFooter";
import { RenderFiatValue } from "components/base/fiatValue";
import {
  TokenInteraction,
  TokenInteractionList,
} from "components/base/tokenInteraction";
import { type Step, VerticalStepper } from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { useVaultPreviewDeposit } from "hooks/useVaultPreviewDeposit";
import type { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { formatFiatNumberRoundDown } from "utils/format";
import { parseTokenUnits } from "utils/token";
import type { Address } from "viem";

import { OutputLabel, type StakeTarget, type UnitPreview } from "./outputLabel";
import { SwapFees } from "./swapFees";

export type StakeOutput = StakeTarget & { assets: bigint };

type SwapProgressDrawerProps = {
  fromAmount: string;
  fromToken: TokenWithGateway;
  isOutputError?: boolean;
  onRetry?: VoidFunction;
  oracleToken?: Address;
  outputAmount?: bigint;
  outputValue?: string;
  stakeOutput?: StakeOutput;
  steps: Step[];
  subtitle?: ReactNode;
  toToken?: TokenWithGateway;
  unitPreview?: UnitPreview;
} & Pick<
  ComponentProps<typeof SwapFees>,
  "networkFee" | "protocolFee" | "totalFees"
>;

function StakeOutputAmount({
  assets,
  shareToken,
  stakingVaultAddress,
}: StakeOutput) {
  const { data: shares, status } = useVaultPreviewDeposit({
    assets,
    stakingVaultAddress,
  });

  return (
    <RenderCryptoValue status={status} token={shareToken} value={shares} />
  );
}

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
  stakeOutput,
  steps,
  subtitle,
  totalFees,
  toToken,
  unitPreview,
}: SwapProgressDrawerProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <TokenInteractionList>
            <TokenInteraction
              amount={fromAmount}
              detail={
                <>
                  <DollarSign />
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
                amount={
                  stakeOutput ? (
                    <StakeOutputAmount {...stakeOutput} />
                  ) : (
                    outputValue
                  )
                }
                detail={
                  <>
                    <DollarSign />
                    <RenderFiatValue
                      customFormatter={formatFiatNumberRoundDown}
                      queryStatus={isOutputError ? "error" : "success"}
                      token={toToken}
                      value={outputAmount}
                    />
                  </>
                }
                label={t("pages.swap.form.you-will-receive-estimated")}
                token={stakeOutput?.shareToken ?? toToken}
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
                    stakeTarget={stakeOutput}
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
              <p className="text-xss leading-4 font-medium tracking-wide text-gray-500">
                {t("pages.swap.progress.swap-progress")}
              </p>
              <div className="border-t border-gray-200">
                <VerticalStepper steps={steps} />
              </div>
            </div>
          )}
        </div>

        <DrawerRetryFooter onRetry={onRetry} />
      </div>
    </>
  );
}
