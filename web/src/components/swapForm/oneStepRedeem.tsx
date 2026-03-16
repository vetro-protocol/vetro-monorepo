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
import { useEstimateRedeemGas } from "hooks/useEstimateRedeemGas";
import { useMainnet } from "hooks/useMainnet";
import { useMaxWithdraw } from "hooks/useMaxWithdraw";
import { usePreviewRedeem } from "hooks/usePreviewRedeem";
import { useRedeem } from "hooks/useRedeem";
import { useRedeemFee } from "hooks/useRedeemFee";
import { useSwapFeesDisplay } from "hooks/useSwapFeesDisplay";
import { type FormEvent, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";
import { useAccount } from "wagmi";

import { Form } from "./form";
import { OutputLabel } from "./outputLabel";
import { RedeemVaultSection } from "./redeemVaultSection";
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
  const { address } = useAccount();
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

  const operationGasEstimation = useEstimateRedeemGas({
    enabled: !!address,
    minAmountOut: redeemPreview ?? 0n,
    peggedToken: fromToken,
    peggedTokenIn: amountBigInt,
    receiver: address!,
    tokenOut: toToken.address,
  });

  const protocolFee = useRedeemFee();

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
      <ApproveSection active={approve10x} onToggle={onToggleApprove10x} />
      <TreasuryReserves />
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
      <RedeemVaultSection whitelistedTokens={whitelistedTokens} />
      {isDrawerOpen && flowStatus !== "idle" && (
        <SwapRedeemDrawer
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
