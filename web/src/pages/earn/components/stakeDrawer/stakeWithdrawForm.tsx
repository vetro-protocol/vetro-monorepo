import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { SetMaxStakedBalance } from "components/setMaxStakedBalance";
import { TokenInput } from "components/tokenInput";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useMainnet } from "hooks/useMainnet";
import { useStakedBalance } from "hooks/useStakedBalance";
import { useStakeWithdraw } from "hooks/useStakeWithdraw";
import { useVusd } from "hooks/useVusd";
import type { Dispatch, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";

import { HowWithdrawalsWork } from "./howWithdrawalsWork";
import type { StakeAction } from "./stakeReducer";
import { StakeSubmitButton } from "./stakeSubmitButton";

type Props = {
  dispatch: Dispatch<StakeAction>;
  inputValue: string;
  onClose: VoidFunction;
};

function getWithdrawErrors({
  amount,
  nativeBalance,
  stakedBalance,
}: {
  amount: bigint;
  nativeBalance: bigint | undefined;
  stakedBalance: bigint | undefined;
}) {
  if (amount === 0n) {
    return "enter-amount";
  }
  if (stakedBalance !== undefined && amount > stakedBalance) {
    return "insufficient-balance";
  }
  if (nativeBalance !== undefined && nativeBalance === 0n) {
    return "insufficient-gas";
  }
  return undefined;
}

export function StakeWithdrawForm({ dispatch, inputValue, onClose }: Props) {
  const { isConnected } = useAccount();
  const chain = useMainnet();
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslation();
  const { data: vusd } = useVusd();

  const { data: stakedBalance, isError: isStakedBalanceError } =
    useStakedBalance();

  const { data: nativeBalanceData } = useNativeBalance(chain.id);
  const nativeBalance = nativeBalanceData?.value;

  const amountBigInt = vusd ? parseUnits(inputValue, vusd.decimals) : 0n;

  const withdrawMutation = useStakeWithdraw({
    assets: amountBigInt,
  });

  const inputError = getWithdrawErrors({
    amount: amountBigInt,
    nativeBalance,
    stakedBalance,
  });

  const formattedBalance = formatAmount({
    amount: stakedBalance,
    decimals: vusd?.decimals ?? 18,
    isError: isStakedBalanceError,
  });

  const balancesLoaded =
    nativeBalance !== undefined && stakedBalance !== undefined;

  function handleInputChange(value: string) {
    dispatch({ payload: value, type: "SET_INPUT_VALUE" });
  }

  function handleMaxClick(maxValue: string) {
    dispatch({ payload: maxValue, type: "SET_INPUT_VALUE" });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      withdrawMutation.mutate(undefined, {
        onSuccess: onClose,
      });
    }
  }

  // TODO: implement real gas estimation
  const networkFee = "$0.40";

  return (
    <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
      <div className="p-6">
        <TokenInput
          balanceLabel={t("pages.earn.stake.availableToWithdraw")}
          balanceValue={formattedBalance}
          errorKey={balancesLoaded ? inputError : undefined}
          label={t("pages.earn.stake.youWillWithdraw")}
          maxButton={
            vusd ? (
              <SetMaxStakedBalance
                decimals={vusd.decimals}
                onClick={handleMaxClick}
              />
            ) : null
          }
          onChange={handleInputChange}
          tokenSelector={
            vusd ? (
              <TokenSelectorReadOnly
                logoURI={vusd.logoURI}
                symbol={vusd.symbol}
              />
            ) : null
          }
          value={inputValue}
        />
      </div>

      <div className="flex border-t border-b border-gray-200 bg-gray-50 px-6 py-3 *:flex-1">
        <StakeSubmitButton
          actionText={t("pages.earn.stake.requestWithdrawal")}
          balancesLoaded={balancesLoaded}
          inputError={inputError}
          isConnected={isConnected}
          isPending={withdrawMutation.isPending}
          onConnectWallet={openConnectModal}
          pendingText={t("pages.earn.stake.requesting")}
        />
      </div>

      <div className="px-6">
        <FeesContainer
          label={t("pages.earn.stake.withdrawingFeesLabel", {
            amount: inputValue,
            token: "VUSD",
          })}
          totalFees={networkFee}
        >
          <FeeDetails
            label={t("pages.swap.fees.networkFee")}
            value={networkFee}
          />
        </FeesContainer>
      </div>

      <div className="mt-auto">
        <HowWithdrawalsWork />
      </div>
    </form>
  );
}
