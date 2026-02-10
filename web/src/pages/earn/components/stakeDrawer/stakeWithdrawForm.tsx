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
import { useWithdrawFees } from "pages/earn/hooks/useWithdrawFees";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";

import { HowWithdrawalsWork } from "./howWithdrawalsWork";
import { StakeSubmitButton } from "./stakeSubmitButton";

type Props = {
  inputValue: string;
  onClose: VoidFunction;
  onInputChange: (value: string) => void;
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

export function StakeWithdrawForm({
  inputValue,
  onClose,
  onInputChange,
}: Props) {
  const { address: account, isConnected } = useAccount();
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

  const { data: networkFee, isError: isFeeError } = useWithdrawFees({
    account,
    amount: amountBigInt,
    isConnected,
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

  function handleMaxClick(maxValue: string) {
    onInputChange(maxValue);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      withdrawMutation.mutate(undefined, {
        onSuccess: onClose,
      });
    }
  }

  return (
    <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
      <div className="p-6">
        <TokenInput
          balanceLabel={t("pages.earn.stake.available-to-withdraw")}
          balanceValue={formattedBalance}
          errorKey={balancesLoaded ? inputError : undefined}
          label={t("pages.earn.stake.you-will-withdraw")}
          maxButton={
            <SetMaxStakedBalance
              decimals={vusd!.decimals}
              onClick={handleMaxClick}
            />
          }
          onChange={onInputChange}
          tokenSelector={<TokenSelectorReadOnly {...vusd} />}
          value={inputValue}
        />
      </div>

      <div className="flex border-y border-gray-200 bg-gray-50 px-6 py-3 *:flex-1">
        <StakeSubmitButton
          actionText={t("pages.earn.stake.request-withdrawal")}
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
          isError={isFeeError}
          label={t("pages.earn.stake.withdrawing-fees-label", {
            amount: inputValue,
            token: vusd.symbol,
          })}
          totalFees={networkFee}
        >
          <FeeDetails
            isError={isFeeError}
            label={t("pages.swap.fees.network-fee")}
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
