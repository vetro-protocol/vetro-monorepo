import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import type { FetchStatus, QueryStatus } from "@tanstack/react-query";
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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { applyBps } from "utils/fees";
import { formatAmount, parseTokenUnits } from "utils/token";
import { formatUnits, isAddressEqual, parseUnits } from "viem";

import { CancelRedeemModal } from "./cancelRedeemModal";
import { ClaimRedeemDrawer } from "./claimRedeemDrawer";
import { type ClaimRedeemFlowStatus } from "./claimRedeemProgressDrawer";
import { RedeemQueueEmptyState } from "./redeemQueueEmptyState";
import { RedeemQueueTable } from "./redeemQueueTable";
import { RedeemQueueToasts } from "./redeemQueueToasts";
import { getSwapErrors } from "./validation";

type Props = {
  peggedTokens: TokenWithGateway[];
  whitelistedTokens: TokenWithGateway[];
};

export function RedeemQueue({ peggedTokens, whitelistedTokens }: Props) {
  const ethereumChain = useMainnet();
  const { t } = useTranslation();

  const { data: nativeBalanceData } = useNativeBalance(ethereumChain.id);
  const nativeBalance = nativeBalanceData?.value;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCancelRedeemModalOpen, setIsCancelRedeemModalOpen] = useState(false);
  const [flowStatus, setFlowStatus] = useState<ClaimRedeemFlowStatus>("idle");
  const [toastType, setToastType] = useState<"cancel" | "redeem">();
  const [fromInputValue, setFromInputValue] = useState("0");
  const [toToken, setToToken] = useState(whitelistedTokens[0]);

  const { data: redeemRequest, isLoading } = useGetRedeemRequest(
    toToken.gatewayAddress,
  );

  const peggedToken = peggedTokens.find((pt) =>
    isAddressEqual(pt.gatewayAddress, toToken.gatewayAddress),
  );

  if (!peggedToken) {
    throw new Error(
      `PeggedToken not found for gateway address ${toToken.gatewayAddress}`,
    );
  }

  const amountLocked = redeemRequest?.[0] ?? 0n;
  const claimableAt = redeemRequest?.[1] ?? 0n;
  const hasRequest = amountLocked > 0n;

  const amountBigInt = fromInputValue
    ? parseTokenUnits(fromInputValue, peggedToken)
    : 0n;

  const { data: maxWithdraw } = useMaxWithdraw({
    gatewayAddress: peggedToken.gatewayAddress,
    tokenOut: toToken.address,
  });

  const { data: redeemPreview, isError: isPreviewError } = usePreviewRedeem({
    gatewayAddress: peggedToken.gatewayAddress,
    peggedTokenIn: amountBigInt,
    tokenOut: toToken.address,
  });

  const unitRedeemPreview = usePreviewRedeem({
    gatewayAddress: peggedToken.gatewayAddress,
    peggedTokenIn: parseUnits("1", peggedToken.decimals),
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
        fromSymbol: peggedToken.symbol,
        toAmount: outputValue,
        toSymbol: toToken.symbol,
      }),
      title: `${t("nav.swap")} · ${t("pages.swap.redeem-queue.redeem")}`,
    });

  const networkFeeQueryData = useSwapRedeemFees({
    amount: amountBigInt,
    approveAmount: undefined,
    fromToken: peggedToken,
    minAmountOut: redeemPreview,
    tokenOut: toToken.address,
  });

  const networkFee = {
    data: networkFeeQueryData.fees,
    fetchStatus: (amountBigInt > 0n ? "fetching" : "idle") as FetchStatus,
    status: (networkFeeQueryData.isError ? "error" : "pending") as QueryStatus,
  };

  const protocolFeeQueryData = useRedeemFee({
    gatewayAddress: peggedToken.gatewayAddress,
    select: (fee) => applyBps(amountBigInt, fee),
    token: toToken.address,
  });

  const totalRedeemFeesQueryData = useTotalRedeemFees({
    amount: amountBigInt,
    // no approval is needed when redeeming from the queue
    approveAmount: undefined,
    fromToken: peggedToken,
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
    peggedToken,
    peggedTokenIn: amountBigInt,
    tokenOut: toToken.address,
  });

  const handleMaxClick = () =>
    setFromInputValue(formatUnits(amountLocked, peggedToken?.decimals ?? 18));

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
      <TopSection title={t("pages.swap.redeem-queue.title")} />
      <RedeemQueueTable
        data={hasRequest ? [{ amountLocked, claimableAt }] : []}
        loading={isLoading}
        onCancelRedeem={() => setIsCancelRedeemModalOpen(true)}
        onRedeem={() => setIsDrawerOpen(true)}
        placeholder={
          <RedeemQueueEmptyState
            peggedToken={peggedToken}
            whitelistedTokens={whitelistedTokens.filter((wt) =>
              isAddressEqual(wt.gatewayAddress, peggedToken.gatewayAddress),
            )}
          />
        }
        vusd={peggedToken}
      />
      {isDrawerOpen && (
        <ClaimRedeemDrawer
          amountBigInt={amountBigInt}
          amountLocked={amountLocked}
          flowStatus={flowStatus}
          fromAmount={fromInputValue}
          fromToken={peggedToken}
          inputError={inputError}
          networkFee={networkFee}
          onClose={handleClose}
          onInputChange={setFromInputValue}
          onMaxClick={handleMaxClick}
          onSubmit={handleSubmit}
          onTokenChange={setToToken}
          oracleToken={toToken.address}
          outputBigInt={redeemPreview}
          outputValue={outputValue}
          protocolFee={protocolFeeQueryData}
          toToken={toToken}
          totalFees={totalRedeemFeesQueryData}
          unitPreview={unitRedeemPreview}
          whitelistedTokens={whitelistedTokens}
        />
      )}
      {isCancelRedeemModalOpen && (
        <CancelRedeemModal
          onClose={() => setIsCancelRedeemModalOpen(false)}
          onSuccess={() => setToastType("cancel")}
          peggedToken={peggedToken}
          redeemableAmount={amountLocked}
        />
      )}
      <RedeemQueueToasts
        onClose={() => setToastType(undefined)}
        peggedToken={peggedToken}
        toToken={toToken}
        toastType={toastType}
      />
    </>
  );
}
