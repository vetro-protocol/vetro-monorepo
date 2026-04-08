import { Button } from "components/base/button";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { RenderFiatValue } from "components/base/fiatValue";
import { MaxButton } from "components/base/maxButton";
import { type Step, VerticalStepper } from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { TokenDropdown } from "components/tokenDropdown";
import { TokenInput } from "components/tokenInput";
import { Balance } from "components/tokenInput/balance";
import type { InputError } from "components/tokenInput/utils";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";
import type { Address } from "viem";

import { OutputLabel, type UnitPreview } from "./outputLabel";
import { SwapFees } from "./swapFees";
import { ToTokenBalance } from "./toTokenBalance";
import { TreasuryReserves } from "./treasuryReserves";

export type ClaimRedeemFlowStatus =
  | "idle"
  | "redeem-error"
  | "redeem-ready"
  | "redeemed"
  | "redeeming";

type Props = {
  amountBigInt: bigint;
  amountLocked: bigint;
  flowStatus: ClaimRedeemFlowStatus;
  fromAmount: string;
  fromToken: Token;
  inputError: InputError | undefined;
  onInputChange: (value: string) => void;
  onMaxClick: VoidFunction;
  onRetry?: VoidFunction;
  onSubmit: VoidFunction;
  onTokenChange: (token: Token) => void;
  oracleToken: Address;
  outputBigInt: bigint | undefined;
  unitPreview: UnitPreview;
  outputValue: string;
  steps: Step[];
  toToken: Token;
  whitelistedTokens: Token[];
} & Pick<
  ComponentProps<typeof SwapFees>,
  "networkFee" | "protocolFee" | "totalFees"
>;

export function ClaimRedeemProgressDrawer({
  amountBigInt,
  amountLocked,
  flowStatus,
  fromAmount,
  fromToken,
  inputError,
  networkFee,
  onInputChange,
  onMaxClick,
  onRetry,
  onSubmit,
  onTokenChange,
  oracleToken,
  outputBigInt,
  outputValue,
  protocolFee,
  steps,
  totalFees,
  toToken,
  unitPreview,
  whitelistedTokens,
}: Props) {
  const { t } = useTranslation();

  const renderRetry = flowStatus === "redeem-error";
  const isDisabled =
    !!inputError ||
    (flowStatus !== "idle" &&
      flowStatus !== "redeem-ready" &&
      flowStatus !== "redeem-error");

  return (
    <div className="flex h-full flex-col">
      <DrawerTitle>
        {t("pages.swap.redeem-queue.drawer-title", {
          symbol: fromToken.symbol,
        })}
      </DrawerTitle>
      <div className="flex flex-col gap-1 border-t border-gray-200 p-6">
        <TokenInput
          balance={
            <Balance
              label={t("pages.swap.redeem-queue.available-to-redeem")}
              value={formatAmount({
                amount: amountLocked,
                decimals: fromToken.decimals,
                isError: false,
              })}
            />
          }
          fiatValue={<RenderFiatValue token={fromToken} value={amountBigInt} />}
          label={t("pages.swap.redeem-queue.enter-amount-to-redeem")}
          maxButton={<MaxButton onClick={onMaxClick} />}
          onChange={onInputChange}
          tokenSelector={<TokenSelectorReadOnly {...fromToken} />}
          value={fromAmount}
        />
        <TokenInput
          balance={<ToTokenBalance token={toToken} />}
          disabled
          fiatValue={<RenderFiatValue token={toToken} value={outputBigInt} />}
          label={t("pages.swap.form.you-will-receive")}
          tokenSelector={
            <TokenDropdown
              onChange={onTokenChange}
              tokens={whitelistedTokens}
              value={toToken}
            />
          }
          value={outputValue}
        />
      </div>
      <div className="border-y border-gray-200 bg-gray-50 px-6 py-3 *:w-full">
        <Button
          disabled={isDisabled}
          onClick={renderRetry ? onRetry : onSubmit}
          size="small"
          variant="primary"
        >
          {inputError
            ? t(`pages.swap.form.${inputError}`)
            : renderRetry
              ? t("pages.swap.progress.retry")
              : t("pages.swap.redeem-queue.redeem")}
        </Button>
      </div>
      <DrawerFeesContainer>
        <TreasuryReserves />
      </DrawerFeesContainer>
      <DrawerFeesContainer>
        <SwapFees
          fromToken={fromToken}
          networkFee={networkFee}
          outputLabel={
            <OutputLabel
              fromToken={fromToken}
              oracleToken={oracleToken}
              toToken={toToken}
              unitPreview={unitPreview}
            />
          }
          protocolFee={protocolFee}
          totalFees={totalFees}
        />
      </DrawerFeesContainer>
      {steps.length > 0 && (
        <div className="mt-auto flex flex-col gap-2 px-6 pb-6">
          <p className="text-[11px] leading-4 font-medium tracking-wide text-gray-500">
            {t("pages.swap.progress.swap-progress")}
          </p>
          <div className="border-t border-gray-200">
            <VerticalStepper steps={steps} />
          </div>
        </div>
      )}
    </div>
  );
}
