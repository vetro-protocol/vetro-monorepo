import { useAddTokenToWallet } from "@hemilabs/react-hooks/useAddTokenToWallet";
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
import { useDeposit } from "hooks/useDeposit";
import { useMainnet } from "hooks/useMainnet";
import { useMintFee } from "hooks/useMintFee";
import { usePreviewDeposit } from "hooks/usePreviewDeposit";
import { useSwapMintFees } from "hooks/useSwapMintFees";
import { useTotalMintFees } from "hooks/useTotalMintFees";
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
import { type DepositFlowStatus, SwapDepositDrawer } from "./swapDepositDrawer";
import { SwapFees } from "./swapFees";
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
  const { mutate: watchToken } = useAddTokenToWallet({
    token: {
      address: toToken.address,
      chainId: toToken.chainId,
      extensions: { logoURI: toToken.logoURI },
    },
  });
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

  const unitDepositPreview = usePreviewDeposit({
    amountIn: parseUnits("1", fromToken.decimals),
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
        watchToken();
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

  // This is measured in ETH - paid to the network for operating
  const networkFeeQueryData = useSwapMintFees({
    amount: amountBigInt,
    approveAmount,
    fromToken,
    minPeggedTokenOut: depositPreview,
  });

  // This is measured in {token} units - paid to the Vetro contracts
  const protocolFeeQueryData = useMintFee(fromToken.address, {
    select: (fee) => applyBps(amountBigInt, fee),
  });

  // Total fees converted to USD (network + protocol)
  const totalMintFeesQueryData = useTotalMintFees({
    amount: amountBigInt,
    approveAmount,
    fromToken,
    minPeggedTokenOut: depositPreview,
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

  const networkFee = {
    data: networkFeeQueryData.fees,
    fetchStatus: (amountBigInt > 0n ? "fetching" : "idle") as FetchStatus,
    status: (networkFeeQueryData.isError ? "error" : "pending") as QueryStatus,
  };

  return (
    <>
      <Form
        amountBigInt={amountBigInt}
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
            fiatValue={
              <RenderFiatValue token={toToken} value={depositPreview} />
            }
            label={t("pages.swap.form.you-will-receive-estimated")}
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
              oracleToken={fromToken.address}
              toToken={toToken}
              unitPreview={unitDepositPreview}
            />
          }
          protocolFee={protocolFeeQueryData}
          sectionClassName="max-md:px-4 md:px-2"
          totalFees={totalMintFeesQueryData}
        />
      </FormSection>
      <RedeemQueueSection whitelistedTokens={whitelistedTokens} />
      {isDrawerOpen && flowStatus !== "idle" && (
        <SwapDepositDrawer
          flowStatus={flowStatus}
          fromAmount={fromInputValue}
          fromToken={fromToken}
          networkFee={networkFee}
          onClose={handleDrawerClose}
          onRetry={handleRetry}
          oracleToken={fromToken.address}
          outputValue={outputValue}
          protocolFee={protocolFeeQueryData}
          showApproveStep={startedWithApproval}
          toToken={toToken}
          totalFees={totalMintFeesQueryData}
          unitPreview={unitDepositPreview}
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
