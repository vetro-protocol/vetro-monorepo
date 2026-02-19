import { Toast } from "components/base/toast";
import { useEstimateRedeemGas } from "hooks/useEstimateRedeemGas";
import { useGetRedeemRequest } from "hooks/useGetRedeemRequest";
import { usePreviewRedeem } from "hooks/usePreviewRedeem";
import { useRedeem } from "hooks/useRedeem";
import { useRedeemFee } from "hooks/useRedeemFee";
import { useSwapFeesDisplay } from "hooks/useSwapFeesDisplay";
import { useVusd } from "hooks/useVusd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount, parseTokenUnits } from "utils/token";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { ClaimRedeemDrawer } from "./claimRedeemDrawer";
import { type ClaimRedeemFlowStatus } from "./claimRedeemProgressDrawer";
import { RedeemVaultEmptyState } from "./redeemVaultEmptyState";
import { VaultTable } from "./vaultTable";

type Props = {
  whitelistedTokens: Token[];
};

export function RedeemVault({ whitelistedTokens }: Props) {
  const { address } = useAccount();
  const { t } = useTranslation();
  const { data: vusd } = useVusd();
  const { data: redeemRequest } = useGetRedeemRequest();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [flowStatus, setFlowStatus] = useState<ClaimRedeemFlowStatus>("idle");
  const [showToast, setShowToast] = useState(false);
  const [fromInputValue, setFromInputValue] = useState("0");
  const [toToken, setToToken] = useState(whitelistedTokens[0]);

  const amountLocked = redeemRequest?.[0] ?? 0n;
  const claimableAt = redeemRequest?.[1] ?? 0n;
  const hasRequest = amountLocked > 0n;

  const amountBigInt = fromInputValue
    ? parseTokenUnits(fromInputValue, vusd)
    : 0n;

  const { data: redeemPreview, isError: isPreviewError } = usePreviewRedeem({
    peggedTokenIn: amountBigInt,
    tokenOut: toToken.address,
  });

  const operationGasEstimation = useEstimateRedeemGas({
    enabled: amountBigInt > 0n && !!redeemPreview && !!address,
    minAmountOut: redeemPreview ?? 0n,
    peggedToken: vusd,
    peggedTokenIn: amountBigInt,
    receiver: address,
    tokenOut: toToken.address,
  });

  const protocolFee = useRedeemFee();

  const { networkFeeDisplay, protocolFeeDisplay, totalFeesDisplay } =
    useSwapFeesDisplay({
      amountBigInt,
      approveAmount: undefined,
      fromToken: vusd,
      operationGasEstimation,
      protocolFee,
    });

  const redeemMutation = useRedeem({
    onEmitter(emitter) {
      emitter.on("pre-redeem", () => setFlowStatus("redeem-ready"));
      emitter.on("user-signed-redeem", () => setFlowStatus("redeeming"));
      emitter.on("redeem-transaction-succeeded", function () {
        setFlowStatus("redeemed");
        setShowToast(true);
      });
      emitter.on("redeem-transaction-reverted", () =>
        setFlowStatus("redeem-error"),
      );
      emitter.on("user-signing-redeem-error", () =>
        setFlowStatus("redeem-error"),
      );
      emitter.on("redeem-failed-validation", () =>
        setFlowStatus("redeem-error"),
      );
    },
    peggedTokenIn: amountBigInt,
    tokenOut: toToken.address,
  });

  const outputValue = formatAmount({
    amount: redeemPreview,
    decimals: toToken.decimals,
    isError: isPreviewError,
  });

  const handleMaxClick = () =>
    setFromInputValue(formatUnits(amountLocked, vusd.decimals));

  const handleRetry = function () {
    setFlowStatus("redeem-ready");
    redeemMutation.mutate();
  };

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
      {/* Title */}
      <div className="flex w-full items-center border-b border-gray-200 bg-gray-100 px-16 py-6">
        <h4 className="text-gray-900">{t("pages.swap.redeem-vault.title")}</h4>
      </div>
      {hasRequest ? (
        <VaultTable
          amountLocked={amountLocked}
          claimableAt={claimableAt}
          onRedeem={() => setIsDrawerOpen(true)}
          vusd={vusd}
        />
      ) : (
        <RedeemVaultEmptyState whitelistedTokens={whitelistedTokens} />
      )}
      {isDrawerOpen && (
        <ClaimRedeemDrawer
          amountLocked={amountLocked}
          flowStatus={flowStatus}
          fromAmount={fromInputValue}
          fromToken={vusd}
          networkFee={networkFeeDisplay}
          onClose={handleClose}
          onInputChange={setFromInputValue}
          onMaxClick={handleMaxClick}
          onRetry={handleRetry}
          onSubmit={handleSubmit}
          onTokenChange={setToToken}
          outputValue={outputValue}
          protocolFee={protocolFeeDisplay}
          toToken={toToken}
          totalFees={totalFeesDisplay}
          whitelistedTokens={whitelistedTokens}
        />
      )}
      {showToast && (
        <Toast
          closable
          description={t("pages.swap.redeem-vault.swap-confirmed-description", {
            symbol: toToken.symbol,
          })}
          onClose={() => setShowToast(false)}
          title={t("pages.swap.redeem-vault.redeem-confirmed")}
        />
      )}
    </>
  );
}
