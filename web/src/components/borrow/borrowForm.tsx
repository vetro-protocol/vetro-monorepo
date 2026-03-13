import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getChainAddresses } from "@morpho-org/blue-sdk";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "components/base/button";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { MaxButton } from "components/base/maxButton";
import { Toast } from "components/base/toast";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenInput } from "components/tokenInput";
import { Balance } from "components/tokenInput/balance";
import type { InputError } from "components/tokenInput/utils";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import type { MarketData } from "hooks/borrow/useMarketData";
import { useMorphoMarket } from "hooks/borrow/useMorphoMarket";
import { useSupplyAndBorrow } from "hooks/borrow/useSupplyAndBorrow";
import { useSupplyAndBorrowFees } from "hooks/borrow/useSupplyAndBorrowFees";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useMainnet } from "hooks/useMainnet";
import {
  type FormEvent,
  type SetStateAction,
  useCallback,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { type Address, formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";

import { BorrowDrawer, type BorrowFlowStatus } from "./borrowDrawer";
import { BorrowingReview } from "./borrowingReview";

type SubmitButtonProps = {
  address: Address | undefined;
  balancesLoaded: boolean;
  inputError: InputError | undefined;
  openConnectModal: (() => void) | undefined;
};

function SubmitButton({
  address,
  balancesLoaded,
  inputError,
  openConnectModal,
}: SubmitButtonProps) {
  const { t } = useTranslation();

  if (!address) {
    return (
      <Button
        onClick={() => openConnectModal?.()}
        size="small"
        type="button"
        variant="primary"
      >
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
      {t("pages.borrow.supply-collateral-and-borrow")}
    </Button>
  );
}

function getInputError({
  borrowAmount,
  collateralAmount,
  collateralBalance,
  maxBorrowable,
  nativeBalance,
}: {
  borrowAmount: bigint;
  collateralAmount: bigint;
  collateralBalance: bigint | undefined;
  maxBorrowable: bigint | undefined;
  nativeBalance: bigint | undefined;
}) {
  if (collateralAmount === 0n || borrowAmount === 0n) {
    return "enter-amount" as const;
  }
  if (collateralBalance !== undefined && collateralAmount > collateralBalance) {
    return "insufficient-balance" as const;
  }
  if (maxBorrowable !== undefined && borrowAmount > maxBorrowable) {
    return "insufficient-collateral" as const;
  }
  if (nativeBalance !== undefined && nativeBalance === 0n) {
    return "insufficient-gas" as const;
  }
  return undefined;
}

type Props = {
  borrowInput: string;
  collateralInput: string;
  isDrawerOpen: boolean;
  market: MarketData;
  onBorrowChange: (value: string) => void;
  onCollateralChange: (value: string) => void;
  onDrawerOpenChange: (value: SetStateAction<boolean>) => void;
};

export function BorrowForm({
  borrowInput,
  collateralInput,
  isDrawerOpen,
  market,
  onBorrowChange,
  onCollateralChange,
  onDrawerOpenChange,
}: Props) {
  const { t } = useTranslation();
  const ethereumChain = useMainnet();
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [flowStatus, setFlowStatus] = useState<BorrowFlowStatus>("idle");
  const [showToast, setShowToast] = useState(false);
  const [startedWithApproval, setStartedWithApproval] = useState(false);
  const handleDrawerClose = useCallback(
    () => onDrawerOpenChange(false),
    [onDrawerOpenChange],
  );

  const { collateralToken, loanToken, marketId } = market;

  const collateralAmountBigInt = parseUnits(
    collateralInput,
    collateralToken.decimals,
  );
  const borrowAmountBigInt = parseUnits(borrowInput, loanToken.decimals);

  const { data: collateralBalance, status: balanceStatus } = useTokenBalance({
    address: collateralToken.address,
    chainId: collateralToken.chainId,
  });

  const { data: nativeBalanceData } = useNativeBalance(ethereumChain.id);

  const { data: needsApproval } = useNeedsApproval({
    amount: collateralAmountBigInt,
    spender: getChainAddresses(ethereumChain.id).morpho,
    token: collateralToken,
  });

  const { data: morphoMarket, status: morphoMarketStatus } =
    useMorphoMarket(marketId);

  const maxBorrowable = morphoMarket?.getMaxBorrowAssets(
    collateralAmountBigInt,
  );

  const networkFee = useSupplyAndBorrowFees({
    borrowAmount: borrowAmountBigInt,
    collateralAmount: collateralAmountBigInt,
    collateralToken,
    marketId,
    maxBorrowable,
  });

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "borrow",
      text: t("pages.borrow.activity.open-position-text", {
        amount: borrowInput,
        symbol: loanToken.symbol,
      }),
      title: `${t("nav.borrow")} · ${t("pages.borrow.activity.open-position-title", { symbol: loanToken.symbol })}`,
    });

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
      emitter.on("supply-collateral-transaction-succeeded", () =>
        setFlowStatus("supplied-collateral"),
      );
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
      emitter.on("borrow-assets-transaction-succeeded", function () {
        onCompleted();
        setFlowStatus("borrowed");
        setShowToast(true);
      });
      emitter.on("borrow-assets-transaction-reverted", function () {
        onFailed();
        setFlowStatus("borrow-error");
      });
      emitter.on("borrow-assets-failed", function () {
        onFailed();
        setFlowStatus("borrow-error");
      });
      emitter.on("borrow-assets-failed-validation", function () {
        onFailed();
        setFlowStatus("borrow-error");
      });
      emitter.on("user-signing-borrow-assets-error", function () {
        onFailed();
        setFlowStatus("borrow-error");
      });
    },
  });

  const nativeBalance = nativeBalanceData?.value;

  const inputError = getInputError({
    borrowAmount: borrowAmountBigInt,
    collateralAmount: collateralAmountBigInt,
    collateralBalance,
    maxBorrowable,
    nativeBalance,
  });

  const balancesLoaded =
    nativeBalance !== undefined && collateralBalance !== undefined;

  const handleRetry = function () {
    setFlowStatus(
      startedWithApproval ? "approving" : "supply-collateral-ready",
    );
    borrowMutation.mutate();
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      setStartedWithApproval(!!needsApproval);
      setFlowStatus(needsApproval ? "approving" : "supply-collateral-ready");
      borrowMutation.mutate();
      onDrawerOpenChange(true);
    }
  }

  return (
    <>
      <form className="flex flex-col bg-white" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1 p-2 md:px-1.5 xl:px-2">
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
            address={address}
            balancesLoaded={balancesLoaded}
            inputError={inputError}
            openConnectModal={openConnectModal}
          />
        </div>
        <FeesContainer isError={networkFee.isError} totalFees={networkFee.data}>
          <FeeDetails
            isError={networkFee.isError}
            label={t("pages.swap.fees.network-fee")}
            value={networkFee.data}
          />
        </FeesContainer>
        <div className="border-t border-gray-200 px-4 py-1">
          <BorrowingReview
            borrowApy={market.borrowApy}
            borrowInput={borrowInput}
            collateralInput={collateralInput}
            collateralToken={collateralToken}
            loanToken={loanToken}
            morphoMarket={morphoMarket}
          />
        </div>
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
    </>
  );
}
