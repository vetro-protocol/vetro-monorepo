import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenInput } from "components/tokenInput";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useMainnet } from "hooks/useMainnet";
import { useStakeDeposit } from "hooks/useStakeDeposit";
import { useVusd } from "hooks/useVusd";
import type { Dispatch, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";

import type { StakeAction } from "./stakeReducer";
import { StakeSubmitButton } from "./stakeSubmitButton";

type Props = {
  dispatch: Dispatch<StakeAction>;
  inputValue: string;
  onClose: VoidFunction;
};

function getStakeErrors({
  amount,
  nativeBalance,
  tokenBalance,
}: {
  amount: bigint;
  nativeBalance: bigint | undefined;
  tokenBalance: bigint | undefined;
}) {
  if (amount === 0n) {
    return "enter-amount";
  }
  if (tokenBalance !== undefined && amount > tokenBalance) {
    return "insufficient-balance";
  }
  if (nativeBalance !== undefined && nativeBalance === 0n) {
    return "insufficient-gas";
  }
  return undefined;
}

export function StakeDepositForm({ dispatch, inputValue, onClose }: Props) {
  const { isConnected } = useAccount();
  const chain = useMainnet();
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslation();
  const { data: vusd } = useVusd();

  const { data: vusdBalance, isError: isVusdBalanceError } = useTokenBalance({
    address: vusd?.address,
    chainId: chain.id,
  });

  const { data: nativeBalanceData } = useNativeBalance(chain.id);
  const nativeBalance = nativeBalanceData?.value;

  const amountBigInt = vusd ? parseUnits(inputValue, vusd.decimals) : 0n;

  const depositMutation = useStakeDeposit({
    assets: amountBigInt,
  });

  const inputError = getStakeErrors({
    amount: amountBigInt,
    nativeBalance,
    tokenBalance: vusdBalance,
  });

  const formattedBalance = formatAmount({
    amount: vusdBalance,
    decimals: vusd?.decimals ?? 18,
    isError: isVusdBalanceError,
  });

  const balancesLoaded =
    nativeBalance !== undefined && vusdBalance !== undefined;

  function handleInputChange(value: string) {
    dispatch({ payload: value, type: "SET_INPUT_VALUE" });
  }

  function handleMaxClick(maxValue: string) {
    dispatch({ payload: maxValue, type: "SET_INPUT_VALUE" });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      depositMutation.mutate(undefined, {
        onSuccess: onClose,
      });
    }
  }

  // TODO: implement real gas estimation
  const networkFee = "$0.40";

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      <div className="p-6">
        <TokenInput
          balanceLabel={t("pages.earn.stake.available-to-deposit")}
          balanceValue={formattedBalance}
          errorKey={balancesLoaded ? inputError : undefined}
          label={t("pages.earn.stake.you-will-stake")}
          maxButton={
            <SetMaxErc20Balance onClick={handleMaxClick} token={vusd!} />
          }
          onChange={handleInputChange}
          tokenSelector={<TokenSelectorReadOnly {...vusd} />}
          value={inputValue}
        />
      </div>

      <div className="flex border-y border-gray-200 bg-gray-50 px-6 py-3 *:flex-1">
        <StakeSubmitButton
          actionText={t("pages.earn.stake.deposit")}
          balancesLoaded={balancesLoaded}
          inputError={inputError}
          isConnected={isConnected}
          isPending={depositMutation.isPending}
          onConnectWallet={openConnectModal}
          pendingText={t("pages.earn.stake.depositing")}
        />
      </div>

      <div className="px-6">
        <FeesContainer
          label={t("pages.earn.stake.fees-label", {
            amount: inputValue,
            token: vusd.symbol,
          })}
          totalFees={networkFee}
        >
          <FeeDetails
            label={t("pages.swap.fees.network-fee")}
            value={networkFee}
          />
        </FeesContainer>
      </div>
    </form>
  );
}
