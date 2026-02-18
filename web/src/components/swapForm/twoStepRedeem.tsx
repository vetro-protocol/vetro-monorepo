import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getGatewayAddress } from "@vetro/gateway";
import { ApproveSection } from "components/approveSection";
import { Toast } from "components/base/toast";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useEstimateRequestRedeemGas } from "hooks/useEstimateRequestRedeemGas";
import { useMainnet } from "hooks/useMainnet";
import { usePreviewRedeem } from "hooks/usePreviewRedeem";
import { useRedeemFee } from "hooks/useRedeemFee";
import { useRequestRedeem } from "hooks/useRequestRedeem";
import { useSwapFeesDisplay } from "hooks/useSwapFeesDisplay";
import { type FormEvent, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";
import { useAccount } from "wagmi";

import { Form } from "./form";
import { SubmitButton } from "./submitButton";
import { SwapFees } from "./swapFees";
import {
  type RequestRedeemFlowStatus,
  SwapRequestRedeemDrawer,
} from "./swapRequestRedeemDrawer";
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

export function TwoStepRedeem({
  amountBigInt,
  approve10x,
  approveAmount,
  fromInputValue,
  fromToken,
  onInputChange,
  onMaxClick,
  onToggle,
  onToggleApprove10x,
  toToken,
  whitelistedTokens,
}: Props) {
  const { address } = useAccount();
  const ethereumChain = useMainnet();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const handleDrawerClose = useCallback(() => setIsDrawerOpen(false), []);
  const [flowStatus, setFlowStatus] = useState<RequestRedeemFlowStatus>("idle");
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

  const { data: redeemPreview, isError: isPreviewError } = usePreviewRedeem({
    peggedTokenIn: amountBigInt,
    tokenOut: toToken.address,
  });

  const operationGasEstimation = useEstimateRequestRedeemGas({
    enabled: amountBigInt > 0n && !!address,
    owner: address,
    peggedToken: fromToken,
    peggedTokenIn: amountBigInt,
  });

  const protocolFee = useRedeemFee();

  const requestRedeemMutation = useRequestRedeem({
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
      emitter.on("pre-request-redeem", () =>
        setFlowStatus("request-redeem-ready"),
      );
      emitter.on("user-signed-request-redeem", () =>
        setFlowStatus("request-redeeming"),
      );
      emitter.on("request-redeem-transaction-succeeded", function () {
        setFlowStatus("request-redeemed");
        setShowToast(true);
      });
      emitter.on("request-redeem-transaction-reverted", () =>
        setFlowStatus("request-redeem-error"),
      );
      emitter.on("user-signing-request-redeem-error", () =>
        setFlowStatus("request-redeem-error"),
      );
      emitter.on("request-redeem-failed-validation", () =>
        setFlowStatus("request-redeem-error"),
      );
    },
    peggedTokenAmount: amountBigInt,
  });

  const inputError = getSwapErrors({
    amount: amountBigInt,
    nativeBalance,
    tokenBalance: fromTokenBalance,
  });

  const outputValue = formatAmount({
    amount: redeemPreview,
    decimals: toToken.decimals,
    isError: isPreviewError,
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

  const redeemableForText = t("pages.swap.form.redeemable-for", {
    allButLast: whitelistedTokens
      .slice(0, -1)
      .map((tk) => tk.symbol)
      .join(", "),
    count: whitelistedTokens.length,
    last: whitelistedTokens.at(-1)!.symbol,
    symbol: whitelistedTokens[0]?.symbol,
  });

  const handleRetry = function () {
    setFlowStatus(startedWithApproval ? "approving" : "request-redeem-ready");
    requestRedeemMutation.mutate();
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      setStartedWithApproval(!!needsApproval);
      setFlowStatus(needsApproval ? "approving" : "request-redeem-ready");
      requestRedeemMutation.mutate();
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
        outputValue={outputValue}
        toLabel={t("pages.swap.form.you-will-receive-approximately")}
        toTokenSelector={
          <span className="text-sm font-semibold">{redeemableForText}</span>
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
      <SwapFees
        amountBigInt={amountBigInt}
        approveAmount={approveAmount}
        fromToken={fromToken}
        operationGasEstimation={operationGasEstimation}
        protocolFee={protocolFee}
      />
      {isDrawerOpen && flowStatus !== "idle" && (
        <SwapRequestRedeemDrawer
          flowStatus={flowStatus}
          fromAmount={fromInputValue}
          fromToken={fromToken}
          networkFee={networkFeeDisplay}
          onClose={handleDrawerClose}
          onRetry={handleRetry}
          protocolFee={protocolFeeDisplay}
          showApproveStep={startedWithApproval}
          subtitle={redeemableForText}
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
