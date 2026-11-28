import { useAddTokenToWallet } from "@hemilabs/react-hooks/useAddTokenToWallet";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { type AccrualPosition, getChainAddresses } from "@morpho-org/blue-sdk";
import { Button } from "components/base/button";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { RenderFiatValue } from "components/base/fiatValue";
import { MaxButton } from "components/base/maxButton";
import type { ToastContent } from "components/base/toast";
import { OracleLabel } from "components/borrow/oracleLabel";
import { FormSection, FormSectionItem } from "components/feesContainer";
import { ExclamationTriangleIcon } from "components/icons/exclamationTriangleIcon";
import { NetworkFees } from "components/networkFees";
import { RequireWalletConnected } from "components/requireWalletConnected";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenInput } from "components/tokenInput";
import { Balance } from "components/tokenInput/balance";
import type { InputError } from "components/tokenInput/utils";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useBorrowMoreAssets } from "hooks/borrow/useBorrowMoreAssets";
import type { MarketData } from "hooks/borrow/useMarketData";
import { useMorphoMarket } from "hooks/borrow/useMorphoMarket";
import { useSupplyAndBorrow } from "hooks/borrow/useSupplyAndBorrow";
import { useTotalSupplyAndBorrowFees } from "hooks/borrow/useSupplyAndBorrowFees";
import { useSupplyAndBorrowReview } from "hooks/borrow/useSupplyAndBorrowReview";
import { useActivityTracking } from "hooks/useActivityTracking";
import { mainnet } from "networks/mainnet";
import {
  type FormEvent,
  type SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { getMaxBorrowable } from "utils/borrowLimit";
import { getBorrowRetryState } from "utils/borrowRetry";
import { formatLtvAsPercentage } from "utils/borrowReview";
import { formatNumber } from "utils/format";
import { isGeoRestricted } from "utils/geoRestriction";
import { formatUnits, parseUnits } from "viem";

import { BorrowDrawer, type BorrowFlowStatus } from "./borrowDrawer";
import { BorrowingReview } from "./borrowingReview";
import { PositionReview } from "./positionReview";

type SubmitButtonProps = {
  balancesLoaded: boolean;
  inputError: InputError | undefined;
};

function SubmitButton({ balancesLoaded, inputError }: SubmitButtonProps) {
  const { t } = useTranslation();

  if (isGeoRestricted()) {
    return (
      <Button disabled size="small" type="submit" variant="primary">
        <ExclamationTriangleIcon />
        {t("common.geo-restriction-title")}
      </Button>
    );
  }

  return (
    <RequireWalletConnected size="small">
      {balancesLoaded && inputError ? (
        <Button disabled size="small" type="button" variant="primary">
          {t(`common.${inputError}`)}
        </Button>
      ) : (
        <Button size="small" type="submit" variant="primary">
          {t("pages.borrow.supply-collateral-and-borrow")}
        </Button>
      )}
    </RequireWalletConnected>
  );
}

function getInputError({
  borrowAmount,
  collateralAmount,
  collateralBalance,
  liquidity,
  maxBorrowable,
  nativeBalance,
}: {
  borrowAmount: bigint;
  collateralAmount: bigint;
  collateralBalance: bigint | undefined;
  liquidity: bigint;
  maxBorrowable: bigint | undefined;
  nativeBalance: bigint | undefined;
}) {
  if (collateralAmount === 0n || borrowAmount === 0n) {
    return "enter-amount" as const;
  }
  if (collateralBalance !== undefined && collateralAmount > collateralBalance) {
    return "insufficient-balance" as const;
  }
  if (borrowAmount > liquidity) {
    return "insufficient-liquidity" as const;
  }
  if (maxBorrowable !== undefined && borrowAmount > maxBorrowable) {
    return "insufficient-collateral" as const;
  }
  if (nativeBalance !== undefined && nativeBalance === 0n) {
    return "insufficient-gas" as const;
  }
  return undefined;
}

const getActivityType = (position?: AccrualPosition) =>
  position ? "borrow-more" : "open-position";

const getInputContainerClassName = (position?: AccrualPosition) =>
  `flex flex-col gap-1 ${position ? "border-t border-gray-200 p-6" : "p-2 md:px-1.5 xl:px-2"}`;

type Props = {
  borrowInput: string;
  collateralInput: string;
  isDrawerOpen: boolean;
  market: MarketData;
  onBorrowChange: (value: string) => void;
  onClose?: VoidFunction;
  onCollateralChange: (value: string) => void;
  onDrawerOpenChange: (value: SetStateAction<boolean>) => void;
  onSuccess: (toast: ToastContent) => void;
  position?: AccrualPosition;
};

export function BorrowForm({
  borrowInput,
  collateralInput,
  isDrawerOpen,
  market,
  onBorrowChange,
  onClose,
  onCollateralChange,
  onDrawerOpenChange,
  onSuccess,
  position,
}: Props) {
  const { t } = useTranslation();
  const [flowStatus, setFlowStatus] = useState<BorrowFlowStatus>("idle");
  const [startedWithApproval, setStartedWithApproval] = useState(false);
  const supplyCollateralSucceeded = useRef(false);
  const handleDrawerClose = useCallback(
    function () {
      onDrawerOpenChange(false);
      if (flowStatus === "borrowed") {
        onClose?.();
      }
    },
    [flowStatus, onClose, onDrawerOpenChange],
  );

  const { collateralToken, loanToken, marketId } = market;
  const { mutate: watchToken } = useAddTokenToWallet({
    token: {
      address: loanToken.address,
      chainId: loanToken.chainId,
      extensions: { logoURI: loanToken.logoURI },
    },
  });

  const collateralAmountBigInt = parseUnits(
    collateralInput,
    collateralToken.decimals,
  );
  const borrowAmountBigInt = parseUnits(borrowInput, loanToken.decimals);

  const { data: collateralBalance, status: balanceStatus } = useTokenBalance({
    address: collateralToken.address,
    chainId: collateralToken.chainId,
  });

  const { data: nativeBalanceData } = useNativeBalance(mainnet.id);

  const { data: needsApproval } = useNeedsApproval({
    amount: collateralAmountBigInt,
    spender: getChainAddresses(mainnet.id).blue,
    token: collateralToken,
  });

  const { data: morphoMarket, status: morphoMarketStatus } =
    useMorphoMarket(marketId);

  const maxBorrowable = morphoMarket
    ? getMaxBorrowable({
        borrowShares: position?.borrowShares,
        collateral: (position?.collateral ?? 0n) + collateralAmountBigInt,
        market: morphoMarket,
      })
    : undefined;

  const networkFee = useTotalSupplyAndBorrowFees({
    approveAmount: undefined,
    borrowAmount: borrowAmountBigInt,
    collateralAmount: collateralAmountBigInt,
    collateralToken,
    marketId,
  });
  const activityType = getActivityType(position);

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "borrow",
      text: t(`pages.borrow.activity.${activityType}-text`, {
        amount: borrowInput,
        symbol: loanToken.symbol,
      }),
      title: `${t("nav.borrow")} · ${t(`pages.borrow.activity.${activityType}-title`, { symbol: loanToken.symbol })}`,
    });

  const handleBorrowSuccess = function () {
    onCompleted();
    setFlowStatus("borrowed");
    onSuccess({
      description: t("pages.borrow.toast.description", {
        amount: formatNumber(borrowInput),
        symbol: loanToken.symbol,
      }),
      title: t("pages.borrow.toast.title"),
    });
    watchToken();
  };

  const handleBorrowFailure = function () {
    onFailed();
    setFlowStatus(
      supplyCollateralSucceeded.current
        ? "borrow-error"
        : "supply-collateral-error",
    );
  };

  const borrowMutation = useSupplyAndBorrow({
    borrowAmount: borrowAmountBigInt,
    collateralAmount: collateralAmountBigInt,
    marketId,
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
      emitter.on("pre-supply-collateral", () =>
        setFlowStatus("supply-collateral-ready"),
      );
      emitter.on("user-signed-supply-collateral", () =>
        setFlowStatus("supplying-collateral"),
      );
      emitter.on("supply-collateral-transaction-succeeded", function () {
        supplyCollateralSucceeded.current = true;
        setFlowStatus("supplied-collateral");
      });
      emitter.on("supply-collateral-transaction-reverted", () =>
        setFlowStatus("supply-collateral-error"),
      );
      emitter.on("supply-collateral-failed", () =>
        setFlowStatus("supply-collateral-error"),
      );
      emitter.on("supply-collateral-failed-validation", () =>
        setFlowStatus("supply-collateral-error"),
      );
      emitter.on("user-signing-supply-collateral-error", () =>
        setFlowStatus("supply-collateral-error"),
      );
      emitter.on("pre-borrow-assets", () => setFlowStatus("borrowing"));
      emitter.on("user-signed-borrow-assets", function (hash) {
        onTransactionHash(hash);
        onPending();
        setFlowStatus("borrowing");
      });
      emitter.on("borrow-assets-transaction-succeeded", handleBorrowSuccess);
      emitter.on("borrow-assets-transaction-reverted", handleBorrowFailure);
      emitter.on("borrow-assets-failed", handleBorrowFailure);
      emitter.on("borrow-assets-failed-validation", handleBorrowFailure);
      emitter.on("user-signing-borrow-assets-error", handleBorrowFailure);
      emitter.on("unexpected-error", handleBorrowFailure);
    },
  });

  const borrowMoreMutation = useBorrowMoreAssets({
    borrowAmount: borrowAmountBigInt,
    marketId,
    onEmitter(emitter) {
      emitter.on("pre-borrow-assets", () => setFlowStatus("borrowing"));
      emitter.on("user-signed-borrow-assets", function (hash) {
        onTransactionHash(hash);
        onPending();
        setFlowStatus("borrowing");
      });
      emitter.on("borrow-assets-transaction-succeeded", handleBorrowSuccess);
      emitter.on("borrow-assets-transaction-reverted", handleBorrowFailure);
      emitter.on("borrow-assets-failed", handleBorrowFailure);
      emitter.on("borrow-assets-failed-validation", handleBorrowFailure);
      emitter.on("user-signing-borrow-assets-error", handleBorrowFailure);
      emitter.on("unexpected-error", handleBorrowFailure);
    },
  });

  const nativeBalance = nativeBalanceData?.value;

  const inputError = getInputError({
    borrowAmount: borrowAmountBigInt,
    collateralAmount: collateralAmountBigInt,
    collateralBalance,
    liquidity: market.liquidity,
    maxBorrowable,
    nativeBalance,
  });

  const balancesLoaded =
    nativeBalance !== undefined && collateralBalance !== undefined;

  const { current, updated } = useSupplyAndBorrowReview({
    borrowApy: market.borrowApy,
    borrowInput,
    collateralInput,
    collateralToken,
    frozen: isDrawerOpen,
    loanToken,
    position,
  });

  const handleRetry = function () {
    const { action, flowStatus: retryFlowStatus } = getBorrowRetryState({
      startedWithApproval,
      supplyCollateralSucceeded: supplyCollateralSucceeded.current,
    });

    setFlowStatus(retryFlowStatus);
    if (action === "borrow-more") {
      borrowMoreMutation.mutate();
      return;
    }
    borrowMutation.mutate();
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      if (supplyCollateralSucceeded.current) {
        handleRetry();
        onDrawerOpenChange(true);
        return;
      }

      supplyCollateralSucceeded.current = false;
      setStartedWithApproval(!!needsApproval);
      setFlowStatus(needsApproval ? "approving" : "supply-collateral-ready");
      borrowMutation.mutate();
      onDrawerOpenChange(true);
    }
  }

  return (
    <>
      <form className="flex flex-col bg-white" onSubmit={handleSubmit}>
        <div className={getInputContainerClassName(position)}>
          <TokenInput
            balance={
              <Balance
                label={t("pages.swap.form.balance")}
                value={
                  <RenderCryptoValue
                    status={balanceStatus}
                    token={collateralToken}
                    value={collateralBalance}
                  />
                }
              />
            }
            fiatValue={
              <RenderFiatValue
                token={collateralToken}
                value={collateralAmountBigInt}
              />
            }
            label={t("pages.borrow.you-are-depositing")}
            maxButton={
              <SetMaxErc20Balance
                onClick={onCollateralChange}
                token={collateralToken}
              />
            }
            onChange={onCollateralChange}
            tokenSelector={<TokenSelectorReadOnly {...collateralToken} />}
            value={collateralInput}
          />
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
            fiatValue={
              <RenderFiatValue token={loanToken} value={borrowAmountBigInt} />
            }
            label={t("pages.borrow.you-are-borrowing")}
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
        <div className="flex items-center justify-center border-y border-gray-200 p-3 *:w-full">
          <SubmitButton
            balancesLoaded={balancesLoaded}
            inputError={inputError}
          />
        </div>
        <FormSection
          show={borrowAmountBigInt !== 0n && collateralAmountBigInt !== 0n}
        >
          <FormSectionItem>
            <NetworkFees
              label={<OracleLabel oracle={market.oracle} />}
              networkFee={networkFee}
              sectionClassName="max-md:px-4 md:px-2"
            />
          </FormSectionItem>
          <FormSectionItem>
            <div className="py-1">
              {position ? (
                <PositionReview
                  borrowApy={market.borrowApy}
                  collateralToken={collateralToken}
                  current={current}
                  lltv={formatLtvAsPercentage(market.lltv)}
                  loanToken={loanToken}
                  updated={inputError ? null : updated}
                />
              ) : (
                <BorrowingReview
                  borrowApy={market.borrowApy}
                  borrowInput={borrowInput}
                  collateralInput={collateralInput}
                  collateralToken={collateralToken}
                  loanToken={loanToken}
                  morphoMarket={morphoMarket}
                />
              )}
            </div>
          </FormSectionItem>
        </FormSection>
      </form>
      {isDrawerOpen && flowStatus !== "idle" && (
        <BorrowDrawer
          borrowAmount={borrowInput}
          borrowToken={loanToken}
          collateralAmount={collateralInput}
          collateralToken={collateralToken}
          flowStatus={flowStatus}
          marketId={marketId}
          onClose={handleDrawerClose}
          onRetry={handleRetry}
          showApproveStep={startedWithApproval}
        />
      )}
    </>
  );
}
