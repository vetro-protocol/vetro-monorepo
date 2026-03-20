import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import type { QueryStatus } from "@tanstack/react-query";
import { TopSection } from "components/base/table/topSection";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useGetRedeemRequest } from "hooks/useGetRedeemRequest";
import { useMainnet } from "hooks/useMainnet";
import { useMaxWithdraw } from "hooks/useMaxWithdraw";
import { usePreviewRedeem } from "hooks/usePreviewRedeem";
import { useRedeem } from "hooks/useRedeem";
import { useRedeemFee } from "hooks/useRedeemFee";
import { useSwapRedeemFees } from "hooks/useSwapRedeemFees";
import { useTotalRedeemFees } from "hooks/useTotalRedeemFees";
import { useVusd } from "hooks/useVusd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { applyBps } from "utils/fees";
import { formatAmount, parseTokenUnits } from "utils/token";
import { formatUnits } from "viem";

import { CancelRedeemModal } from "./cancelRedeemModal";
import { ClaimRedeemDrawer } from "./claimRedeemDrawer";
import { type ClaimRedeemFlowStatus } from "./claimRedeemProgressDrawer";
import { RedeemVaultEmptyState } from "./redeemVaultEmptyState";
import { RedeemVaultToasts } from "./redeemVaultToasts";
import { getSwapErrors } from "./validation";
import { VaultTable } from "./vaultTable";

type Props = {
  whitelistedTokens: Token[];
};

export function RedeemVault({ whitelistedTokens }: Props) {
  const ethereumChain = useMainnet();
  const { t } = useTranslation();
  const { data: vusd } = useVusd();
  const { data: nativeBalanceData } = useNativeBalance(ethereumChain.id);
  const nativeBalance = nativeBalanceData?.value;
  const { data: redeemRequest, isLoading } = useGetRedeemRequest();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCancelRedeemModalOpen, setIsCancelRedeemModalOpen] = useState(false);
  const [flowStatus, setFlowStatus] = useState<ClaimRedeemFlowStatus>("idle");
  const [toastType, setToastType] = useState<"cancel" | "redeem">();
  const [fromInputValue, setFromInputValue] = useState("0");
  const [toToken, setToToken] = useState(whitelistedTokens[0]);

  const amountLocked = redeemRequest?.[0] ?? 0n;
  const claimableAt = redeemRequest?.[1] ?? 0n;
  const hasRequest = amountLocked > 0n;

  const amountBigInt = fromInputValue
    ? parseTokenUnits(fromInputValue, vusd)
    : 0n;

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

  const inputError = getSwapErrors({
    amount: amountBigInt,
    maxWithdraw,
    nativeBalance,
    redeemPreview,
    tokenBalance: amountLocked,
  });

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "swap",
      text: t("pages.swap.activity.claim-redeem-text", {
        fromAmount: fromInputValue,
        fromSymbol: vusd.symbol,
        toAmount: outputValue,
        toSymbol: toToken.symbol,
      }),
      title: `${t("nav.swap")} · ${t("pages.swap.redeem-vault.redeem")}`,
    });

  const networkFeeQueryData = useSwapRedeemFees({
    amount: amountBigInt,
    approveAmount: undefined,
    fromToken: vusd,
    minAmountOut: redeemPreview,
    tokenOut: toToken.address,
  });

  const networkFee = {
    data: networkFeeQueryData.fees,
    status: (networkFeeQueryData.isError ? "error" : "pending") as QueryStatus,
  };

  const protocolFeeQueryData = useRedeemFee(toToken.address, {
    select: (fee) => applyBps(amountBigInt, fee),
  });

  const totalRedeemFeesQueryData = useTotalRedeemFees({
    amount: amountBigInt,
    // no approval is needed when redeeming from the vault
    approveAmount: undefined,
    fromToken: vusd,
    minAmountOut: redeemPreview,
    tokenOut: toToken.address,
  });

  const redeemMutation = useRedeem({
    onEmitter(emitter) {
      emitter.on("pre-redeem", () => setFlowStatus("redeem-ready"));
      emitter.on("user-signed-redeem", function (hash) {
        onTransactionHash(hash);
        onPending();
        setFlowStatus("redeeming");
      });
      emitter.on("redeem-transaction-succeeded", function () {
        onCompleted();
        setFlowStatus("redeemed");
        setToastType("redeem");
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

  const handleMaxClick = () =>
    setFromInputValue(formatUnits(amountLocked, vusd.decimals));

  const handleSubmit = function () {
    setFlowStatus("redeem-ready");
    redeemMutation.mutate();
  };

  function handleClose() {
    setIsDrawerOpen(false);
    setFlowStatus("idle");
  }

  return (
    <>
      <TopSection title={t("pages.swap.redeem-vault.title")} />
      <VaultTable
        data={hasRequest ? [{ amountLocked, claimableAt }] : []}
        loading={isLoading}
        onCancelRedeem={() => setIsCancelRedeemModalOpen(true)}
        onRedeem={() => setIsDrawerOpen(true)}
        placeholder={
          <RedeemVaultEmptyState whitelistedTokens={whitelistedTokens} />
        }
        vusd={vusd}
      />
      {isDrawerOpen && (
        <ClaimRedeemDrawer
          amountLocked={amountLocked}
          flowStatus={flowStatus}
          fromAmount={fromInputValue}
          fromToken={vusd}
          networkFee={networkFee}
          onClose={handleClose}
          onInputChange={setFromInputValue}
          onMaxClick={handleMaxClick}
          onSubmit={handleSubmit}
          onTokenChange={setToToken}
          outputValue={outputValue}
          protocolFee={protocolFeeQueryData}
          toToken={toToken}
          totalFees={totalRedeemFeesQueryData}
          inputError={inputError}
          whitelistedTokens={whitelistedTokens}
        />
      )}
      {isCancelRedeemModalOpen && (
        <CancelRedeemModal
          onClose={() => setIsCancelRedeemModalOpen(false)}
          onSuccess={() => setToastType("cancel")}
          redeemableAmount={amountLocked}
        />
      )}
      <RedeemVaultToasts
        onClose={() => setToastType(undefined)}
        toastType={toastType}
        toToken={toToken}
        vusd={vusd}
      />
    </>
  );
}
