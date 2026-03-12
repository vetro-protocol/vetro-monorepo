import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getGatewayAddress } from "@vetro/gateway";
import { ApproveSection } from "components/approveSection";
import { Toast } from "components/base/toast";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenDropdown } from "components/tokenDropdown";
import { TokenInput } from "components/tokenInput";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useDeposit } from "hooks/useDeposit";
import { useEstimateDepositGas } from "hooks/useEstimateDepositGas";
import { useMainnet } from "hooks/useMainnet";
import { useMintFee } from "hooks/useMintFee";
import { usePreviewDeposit } from "hooks/usePreviewDeposit";
import { useSwapFeesDisplay } from "hooks/useSwapFeesDisplay";
import { type FormEvent, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";

import { Form } from "./form";
import { OutputLabel } from "./outputLabel";
import { SubmitButton } from "./submitButton";
import { type DepositFlowStatus, SwapDepositDrawer } from "./swapDepositDrawer";
import { SwapFees } from "./swapFees";
import { ToTokenBalance } from "./toTokenBalance";
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

export function Deposit({
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
  const [flowStatus, setFlowStatus] = useState<DepositFlowStatus>("idle");
  const [showToast, setShowToast] = useState(false);
  // Captures whether approval was needed when the flow started, because
  // useNeedsApproval flips to false after a successful approval tx.
  const [startedWithApproval, setStartedWithApproval] = useState(false);

  const { data: fromTokenBalance } = useTokenBalance({
    address: fromToken.address,
    chainId: ethereumChain.id,
  });

  const { data: nativeBalanceData } = useNativeBalance(ethereumChain.id);

  const { data: needsApproval } = useNeedsApproval({
    amount: amountBigInt,
    spender: getGatewayAddress(ethereumChain.id),
    token: fromToken,
  });

  const { data: depositPreview, isError: isDepositPreviewError } =
    usePreviewDeposit({
      amountIn: amountBigInt,
      tokenIn: fromToken.address,
    });

  const outputValue = formatAmount({
    amount: depositPreview,
    decimals: toToken.decimals,
    isError: isDepositPreviewError,
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

  const protocolFee = useMintFee();

  const operationGasEstimation = useEstimateDepositGas({
    amountIn: amountBigInt,
    minPeggedTokenOut: depositPreview,
    token: fromToken,
  });

  const depositMutation = useDeposit({
    amountIn: amountBigInt,
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
      emitter.on("pre-deposit", () => setFlowStatus("deposit-ready"));
      emitter.on("user-signed-deposit", function (hash) {
        onTransactionHash(hash);
        onPending();
        setFlowStatus("depositing");
      });
      emitter.on("deposit-failed", function () {
        onFailed();
        setFlowStatus("deposit-error");
      });
      emitter.on("deposit-transaction-succeeded", function () {
        onCompleted();
        setFlowStatus("deposited");
        setShowToast(true);
      });
      emitter.on("deposit-transaction-reverted", function () {
        onFailed();
        setFlowStatus("deposit-error");
      });
      emitter.on("user-signing-deposit-error", function () {
        onFailed();
        setFlowStatus("deposit-error");
      });
      emitter.on("deposit-failed-validation", function () {
        onFailed();
        setFlowStatus("deposit-error");
      });
    },
    tokenIn: fromToken.address,
  });

  const nativeBalance = nativeBalanceData?.value;

  const inputError = getSwapErrors({
    amount: amountBigInt,
    nativeBalance,
    tokenBalance: fromTokenBalance,
  });

  const { networkFeeDisplay, protocolFeeDisplay, totalFeesDisplay } =
    useSwapFeesDisplay({
      amountBigInt,
      approveAmount,
      fromToken,
      operationGasEstimation,
      protocolFee,
    });

  const balancesLoaded =
    nativeBalance !== undefined && fromTokenBalance !== undefined;

  const handleRetry = function () {
    setFlowStatus(startedWithApproval ? "approving" : "deposit-ready");
    depositMutation.mutate();
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      setStartedWithApproval(!!needsApproval);
      setFlowStatus(needsApproval ? "approving" : "deposit-ready");
      depositMutation.mutate();
      setIsDrawerOpen(true);
    }
  }

  return (
    <>
      <Form
        errorKey={balancesLoaded ? inputError : undefined}
        fromInputValue={fromInputValue}
        fromToken={fromToken}
        fromTokenSelector={
          <TokenDropdown
            onChange={onTokenChange}
            tokens={whitelistedTokens}
            value={fromToken}
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
            label={t("pages.swap.form.you-will-receive")}
            tokenSelector={<TokenSelectorReadOnly {...toToken} />}
            value={outputValue}
          />
        }
      >
        <SubmitButton
          actionText={t("pages.swap.form.swap")}
          inputError={inputError}
          isPreviewError={isDepositPreviewError}
          previewValue={depositPreview}
          token={fromToken}
        />
      </Form>
      <ApproveSection active={approve10x} onToggle={onToggleApprove10x} />
      <SwapFees
        amountBigInt={amountBigInt}
        approveAmount={approveAmount}
        fromToken={fromToken}
        operationGasEstimation={operationGasEstimation}
        outputLabel={
          <OutputLabel
            fromInputValue={fromInputValue}
            fromToken={fromToken}
            outputValue={outputValue}
            toToken={toToken}
          />
        }
        protocolFee={protocolFee}
      />
      {isDrawerOpen && flowStatus !== "idle" && (
        <SwapDepositDrawer
          flowStatus={flowStatus}
          fromAmount={fromInputValue}
          fromToken={fromToken}
          networkFee={networkFeeDisplay}
          onClose={handleDrawerClose}
          onRetry={handleRetry}
          outputValue={outputValue}
          protocolFee={protocolFeeDisplay}
          showApproveStep={startedWithApproval}
          toToken={toToken}
          totalFees={totalFeesDisplay}
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
