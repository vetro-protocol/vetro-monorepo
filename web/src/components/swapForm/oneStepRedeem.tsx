import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import type { FetchStatus, QueryStatus } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { ApproveSection } from "components/approveSection";
import { RenderFiatValue } from "components/base/fiatValue";
import { Toast } from "components/base/toast";
import { FormSection, FormSectionItem } from "components/feesContainer";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenDropdown } from "components/tokenDropdown";
import { TokenInput } from "components/tokenInput";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useMainnet } from "hooks/useMainnet";
import { useMaxWithdraw } from "hooks/useMaxWithdraw";
import { usePreviewRedeem } from "hooks/usePreviewRedeem";
import { useRedeem } from "hooks/useRedeem";
import { useRedeemFee } from "hooks/useRedeemFee";
import { useSwapRedeemFees } from "hooks/useSwapRedeemFees";
import { useTotalRedeemFees } from "hooks/useTotalRedeemFees";
import { type FormEvent, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { applyBps } from "utils/fees";
import { formatAmount } from "utils/token";
import { parseUnits } from "viem";

import { Form } from "./form";
import { OutputLabel } from "./outputLabel";
import { RedeemQueueSection } from "./redeemQueueSection";
import { SubmitButton } from "./submitButton";
import { SwapFees } from "./swapFees";
import { type RedeemFlowStatus, SwapRedeemDrawer } from "./swapRedeemDrawer";
import { ToTokenBalance } from "./toTokenBalance";
import { TreasuryReserves } from "./treasuryReserves";
import { getSwapErrors } from "./validation";

type Props = {
  amountBigInt: bigint;
  approve10x: boolean;
  approveAmount: bigint | undefined;
  fromInputValue: string;
  fromToken: Token;
  onInputChange: (value: string) => void;
  onMaxClick: (maxValue: string) => void;
  onToggle: VoidFunction;
  onTokenChange: (token: Token) => void;
  onToggleApprove10x: VoidFunction;
  toToken: Token;
  whitelistedTokens: Token[];
};

export function OneStepRedeem({
  amountBigInt,
  approve10x,
  approveAmount,
  fromInputValue,
  fromToken,
  onInputChange,
  onMaxClick,
  onToggle,
  onToggleApprove10x,
  onTokenChange,
  toToken,
  whitelistedTokens,
}: Props) {
  const ethereumChain = useMainnet();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const handleDrawerClose = useCallback(() => setIsDrawerOpen(false), []);
  const [flowStatus, setFlowStatus] = useState<RedeemFlowStatus>("idle");
  const [showToast, setShowToast] = useState(false);
  const [startedWithApproval, setStartedWithApproval] = useState(false);

  const { data: fromTokenBalance } = useTokenBalance({
    address: fromToken.address,
    chainId: ethereumChain.id,
  });

  const { data: nativeBalanceData } = useNativeBalance(ethereumChain.id);
  const nativeBalance = nativeBalanceData?.value;

  const { data: needsApproval } = useNeedsApproval({
    amount: amountBigInt,
    spender: getGatewayAddress(ethereumChain.id),
    token: fromToken,
  });

  const { data: maxWithdraw } = useMaxWithdraw(toToken.address);

  const { data: redeemPreview, isError: isPreviewError } = usePreviewRedeem({
    peggedTokenIn: amountBigInt,
    tokenOut: toToken.address,
  });

  const unitRedeemPreview = usePreviewRedeem({
    peggedTokenIn: parseUnits("1", fromToken.decimals),
    tokenOut: toToken.address,
  });

  const outputValue = formatAmount({
    amount: redeemPreview,
    decimals: toToken.decimals,
    isError: isPreviewError,
  });

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "swap",
      text: t("pages.swap.activity.swap-text", {
        fromAmount: fromInputValue,
        fromSymbol: fromToken.symbol,
        toAmount: outputValue,
        toSymbol: toToken.symbol,
      }),
      title: t("nav.swap"),
    });

  const redeemMutation = useRedeem({
    approveAmount,
    onEmitter(emitter) {
      emitter.on("user-signed-approval", () => setFlowStatus("approving"));
      emitter.on("approve-transaction-succeeded", () =>
        setFlowStatus("approved"),
      );
      emitter.on("approve-transaction-reverted", () =>
        setFlowStatus("approve-error"),
      );
      emitter.on("user-signing-approval-error", () =>
        setFlowStatus("approve-error"),
      );
      emitter.on("pre-redeem", () => setFlowStatus("redeem-ready"));
      emitter.on("user-signed-redeem", function (hash) {
        onTransactionHash(hash);
        onPending();
        setFlowStatus("redeeming");
      });
      emitter.on("redeem-transaction-succeeded", function () {
        onCompleted();
        setFlowStatus("redeemed");
        setShowToast(true);
      });
      emitter.on("redeem-transaction-reverted", function () {
        onFailed();
        setFlowStatus("redeem-error");
      });
      emitter.on("user-signing-redeem-error", function () {
        onFailed();
        setFlowStatus("redeem-error");
      });
      emitter.on("redeem-failed-validation", function () {
        onFailed();
        setFlowStatus("redeem-error");
      });
    },
    peggedTokenIn: amountBigInt,
    tokenOut: toToken.address,
  });

  const inputError = getSwapErrors({
    amount: amountBigInt,
    maxWithdraw,
    nativeBalance,
    redeemPreview,
    tokenBalance: fromTokenBalance,
  });

  const networkFeeQueryData = useSwapRedeemFees({
    amount: amountBigInt,
    approveAmount,
    fromToken,
    minAmountOut: redeemPreview,
    tokenOut: toToken.address,
  });

  const protocolFeeQueryData = useRedeemFee(toToken.address, {
    select: (fee) => applyBps(amountBigInt, fee),
  });

  const totalRedeemFeesQueryData = useTotalRedeemFees({
    amount: amountBigInt,
    approveAmount,
    fromToken,
    minAmountOut: redeemPreview,
    tokenOut: toToken.address,
  });

  const networkFee = {
    data: networkFeeQueryData.fees,
    fetchStatus: (amountBigInt > 0n ? "fetching" : "idle") as FetchStatus,
    status: (networkFeeQueryData.isError ? "error" : "pending") as QueryStatus,
  };

  const balancesLoaded =
    nativeBalance !== undefined && fromTokenBalance !== undefined;

  const handleRetry = function () {
    setFlowStatus(startedWithApproval ? "approving" : "redeem-ready");
    redeemMutation.mutate();
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      setStartedWithApproval(!!needsApproval);
      setFlowStatus(needsApproval ? "approving" : "redeem-ready");
      redeemMutation.mutate();
      setIsDrawerOpen(true);
    }
  }

  return (
    <>
      <Form
        amountBigInt={amountBigInt}
        errorKey={balancesLoaded ? inputError : undefined}
        fromInputValue={fromInputValue}
        fromToken={fromToken}
        fromTokenSelector={
          <TokenSelectorReadOnly
            logoURI={fromToken.logoURI}
            symbol={fromToken.symbol}
          />
        }
        maxButton={
          <SetMaxErc20Balance onClick={onMaxClick} token={fromToken} />
        }
        onInputChange={onInputChange}
        onSubmit={handleSubmit}
        onToggle={onToggle}
        toSection={
          <TokenInput
            balance={<ToTokenBalance token={toToken} />}
            disabled
            fiatValue={
              <RenderFiatValue token={toToken} value={redeemPreview} />
            }
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
        }
      >
        <SubmitButton
          actionText={t("pages.swap.form.redeem")}
          inputError={inputError}
          isPreviewError={isPreviewError}
          previewValue={redeemPreview}
          token={fromToken}
        />
      </Form>
      <FormSection show={amountBigInt !== 0n}>
        <FormSectionItem>
          <ApproveSection active={approve10x} onToggle={onToggleApprove10x} />
        </FormSectionItem>
        <FormSectionItem>
          <TreasuryReserves />
        </FormSectionItem>
        <SwapFees
          fromToken={fromToken}
          networkFee={networkFee}
          outputLabel={
            <OutputLabel
              fromToken={fromToken}
              oracleToken={toToken.address}
              toToken={toToken}
              unitPreview={unitRedeemPreview}
            />
          }
          protocolFee={protocolFeeQueryData}
          sectionClassName="max-md:px-4 md:px-2"
          totalFees={totalRedeemFeesQueryData}
        />
      </FormSection>
      <RedeemQueueSection whitelistedTokens={whitelistedTokens} />
      {isDrawerOpen && flowStatus !== "idle" && (
        <SwapRedeemDrawer
          flowStatus={flowStatus}
          fromAmount={fromInputValue}
          fromToken={fromToken}
          networkFee={networkFee}
          onClose={handleDrawerClose}
          onRetry={handleRetry}
          oracleToken={toToken.address}
          outputValue={outputValue}
          protocolFee={protocolFeeQueryData}
          showApproveStep={startedWithApproval}
          toToken={toToken}
          totalFees={totalRedeemFeesQueryData}
          unitPreview={unitRedeemPreview}
        />
      )}
      {showToast && (
        <Toast
          closable
          description={t("pages.swap.toast.deposit-description")}
          onClose={() => setShowToast(false)}
          title={t("pages.swap.toast.deposit-title")}
        />
      )}
    </>
  );
}
