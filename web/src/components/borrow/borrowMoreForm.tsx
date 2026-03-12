import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { Button } from "components/base/button";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { MaxButton } from "components/base/maxButton";
import { Toast } from "components/base/toast";
import {
  type Step,
  VerticalStepper,
  stepStatus,
} from "components/base/verticalStepper";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { TokenInput } from "components/tokenInput";
import { Balance } from "components/tokenInput/balance";
import type { InputError } from "components/tokenInput/utils";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useBorrowMoreAssets } from "hooks/borrow/useBorrowMoreAssets";
import { useBorrowMoreFees } from "hooks/borrow/useBorrowMoreFees";
import { useBorrowMoreReview } from "hooks/borrow/useBorrowMoreReview";
import type { MarketData } from "hooks/borrow/useMarketData";
import { useMorphoMarket } from "hooks/borrow/useMorphoMarket";
import { usePositionInfo } from "hooks/borrow/usePositionInfo";
import { useAmount } from "hooks/useAmount";
import { useAnimatedVisibility } from "hooks/useAnimatedVisibility";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { useMainnet } from "hooks/useMainnet";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatLtvAsPercentage } from "utils/borrowReview";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";

import { PositionReview } from "./positionReview";

type BorrowMoreFlowStatus =
  | "borrow-error"
  | "borrow-ready"
  | "borrowed"
  | "borrowing"
  | "idle";

const getBorrowStepStatus = function (
  status: Exclude<BorrowMoreFlowStatus, "idle">,
): Step["status"] {
  const exceptions: Partial<
    Record<Exclude<BorrowMoreFlowStatus, "idle">, Step["status"]>
  > = {
    "borrow-error": stepStatus.failed,
    "borrow-ready": stepStatus.ready,
    borrowing: stepStatus.progress,
  };
  return exceptions[status] ?? stepStatus.completed;
};

type SubmitButtonProps = {
  address: string | undefined;
  balancesLoaded: boolean;
  inputError: InputError | undefined;
};

function SubmitButton({
  address,
  balancesLoaded,
  inputError,
}: SubmitButtonProps) {
  const { t } = useTranslation();

  if (!address) {
    return (
      <Button disabled size="small" type="button" variant="primary">
        {t("pages.swap.form.connect-wallet")}
      </Button>
    );
  }
  if (balancesLoaded && inputError) {
    return (
      <Button disabled size="small" type="button" variant="primary">
        {t(`pages.swap.form.${inputError}`)}
      </Button>
    );
  }
  return (
    <Button size="small" type="submit" variant="primary">
      {t("pages.borrow.borrow-more-progress.submit")}
    </Button>
  );
}

function getInputError({
  borrowAmount,
  maxBorrowable,
  nativeBalance,
}: {
  borrowAmount: bigint;
  maxBorrowable: bigint | undefined;
  nativeBalance: bigint | undefined;
}) {
  if (borrowAmount === 0n) {
    return "enter-amount" as const;
  }
  if (maxBorrowable !== undefined && borrowAmount > maxBorrowable) {
    return "insufficient-balance" as const;
  }
  if (nativeBalance !== undefined && nativeBalance === 0n) {
    return "insufficient-gas" as const;
  }
  return undefined;
}

type StepperOverlayProps = {
  isError: boolean;
  onDismiss: VoidFunction;
  onRetry: VoidFunction;
  showStepper: boolean;
  steps: Step[];
};

function StepperOverlay({
  isError,
  onDismiss,
  onRetry,
  showStepper,
  steps,
}: StepperOverlayProps) {
  const { t } = useTranslation();
  const { render: renderRetry, show: showRetry } =
    useAnimatedVisibility(isError);

  return (
    <>
      <div
        className={`fixed inset-0 z-20 bg-gray-900/10 transition-opacity duration-300 ${
          showStepper ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={isError ? onDismiss : undefined}
      />
      <div
        className={`fixed right-0 bottom-0 z-30 w-full rounded-t-lg rounded-bl-lg bg-white shadow-md transition-transform duration-300 ease-out md:w-md ${
          showStepper ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col gap-2 px-6 pt-4 pb-6">
          <p className="text-caption text-gray-500">
            {t("pages.borrow.borrow-more-progress.borrow-progress")}
          </p>
          <div className="border-t border-gray-200">
            <VerticalStepper steps={steps} />
          </div>
        </div>
        {renderRetry && (
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              showRetry ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full">
                <Button onClick={onRetry} size="small" variant="primary">
                  {t("pages.borrow.borrow-more-progress.retry")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

type Props = {
  market: MarketData;
  onClose: VoidFunction;
};

export function BorrowMoreForm({ market, onClose }: Props) {
  const { t } = useTranslation();
  const ethereumChain = useMainnet();
  const { address } = useAccount();

  const [borrowInput, onBorrowChange] = useAmount();
  const [flowStatus, setFlowStatus] = useState<BorrowMoreFlowStatus>("idle");
  const [showToast, setShowToast] = useState(false);

  const isActive = flowStatus !== "idle";
  const isError = flowStatus === "borrow-error";
  const { show: showStepper } = useAnimatedVisibility(isActive);

  useCloseOnSuccess({
    onClose,
    success: flowStatus === "borrowed",
  });

  const { collateralToken, loanToken, marketId } = market;

  const borrowAmountBigInt = parseUnits(borrowInput, loanToken.decimals);

  const { data: nativeBalanceData } = useNativeBalance(ethereumChain.id);

  const { data: positionInfo } = usePositionInfo(marketId);

  const { data: morphoMarket, status: morphoMarketStatus } =
    useMorphoMarket(marketId);

  const currentBorrowAssets =
    positionInfo && morphoMarket
      ? morphoMarket.toBorrowAssets(positionInfo.borrowShares)
      : undefined;

  const maxBorrowFromCollateral =
    positionInfo && morphoMarket
      ? morphoMarket.getMaxBorrowAssets(positionInfo.collateral)
      : undefined;

  const maxBorrowable =
    maxBorrowFromCollateral !== undefined
      ? maxBorrowFromCollateral - (currentBorrowAssets ?? 0n)
      : undefined;

  const networkFee = useBorrowMoreFees({
    borrowAmount: borrowAmountBigInt,
    marketId,
    maxBorrowable,
  });

  const borrowMutation = useBorrowMoreAssets({
    borrowAmount: borrowAmountBigInt,
    marketId,
    onEmitter(emitter) {
      emitter.on("pre-borrow-assets", () => setFlowStatus("borrow-ready"));
      emitter.on("user-signed-borrow-assets", () => setFlowStatus("borrowing"));
      emitter.on("borrow-assets-transaction-succeeded", function () {
        setFlowStatus("borrowed");
        setShowToast(true);
      });
      emitter.on("borrow-assets-transaction-reverted", () =>
        setFlowStatus("borrow-error"),
      );
      emitter.on("borrow-assets-failed", () => setFlowStatus("borrow-error"));
      emitter.on("borrow-assets-failed-validation", () =>
        setFlowStatus("borrow-error"),
      );
      emitter.on("user-signing-borrow-assets-error", () =>
        setFlowStatus("borrow-error"),
      );
    },
  });

  const nativeBalance = nativeBalanceData?.value;

  const inputError = getInputError({
    borrowAmount: borrowAmountBigInt,
    maxBorrowable,
    nativeBalance,
  });

  const { current, updated } = useBorrowMoreReview({
    borrowApy: market.borrowApy,
    borrowInput,
    collateralToken,
    loanToken,
    position: positionInfo,
  });

  const handleRetry = function () {
    setFlowStatus("borrow-ready");
    borrowMutation.mutate();
  };

  const steps: Step[] = [];
  if (flowStatus !== "idle") {
    steps.push({
      description: t("pages.borrow.borrow-more-progress.borrow-description"),
      status: getBorrowStepStatus(flowStatus),
      title: t("pages.borrow.borrow-more-progress.borrow-title"),
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      setFlowStatus("borrow-ready");
      borrowMutation.mutate();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <form className="flex flex-col bg-white" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1 border-t border-gray-200 p-6">
          <TokenInput
            balance={
              <Balance
                label={t("pages.borrow.max-available")}
                value={
                  <RenderCryptoValue
                    status={morphoMarketStatus}
                    token={loanToken}
                    value={maxBorrowable}
                  />
                }
              />
            }
            label={t("pages.borrow.borrow-more-progress.you-will-borrow")}
            maxButton={
              <MaxButton
                disabled={maxBorrowable === undefined}
                onClick={() =>
                  onBorrowChange(
                    formatUnits(maxBorrowable!, loanToken.decimals),
                  )
                }
              />
            }
            onChange={onBorrowChange}
            tokenSelector={<TokenSelectorReadOnly {...loanToken} />}
            value={borrowInput}
          />
        </div>
        <div className="border-y border-gray-200 bg-gray-50 px-6 py-3 *:w-full">
          <SubmitButton
            address={address}
            balancesLoaded={nativeBalance !== undefined}
            inputError={inputError}
          />
        </div>
        <FeesContainer isError={networkFee.isError} totalFees={networkFee.data}>
          <FeeDetails
            isError={networkFee.isError}
            label={t("pages.swap.fees.network-fee")}
            value={networkFee.data}
          />
        </FeesContainer>
        <div className="border-t border-gray-200 px-6 py-2">
          <PositionReview
            borrowApy={market.borrowApy}
            collateralToken={collateralToken}
            current={current}
            lltv={formatLtvAsPercentage(market.lltv)}
            loanToken={loanToken}
            updated={updated}
          />
        </div>
      </form>
      <StepperOverlay
        isError={isError}
        onDismiss={() => setFlowStatus("idle")}
        onRetry={handleRetry}
        showStepper={showStepper}
        steps={steps}
      />
      {showToast && (
        <Toast
          closable
          description={t("pages.borrow.toast.description", {
            amount: borrowInput,
            symbol: loanToken.symbol,
          })}
          onClose={() => setShowToast(false)}
          title={t("pages.borrow.toast.title")}
        />
      )}
    </div>
  );
}
