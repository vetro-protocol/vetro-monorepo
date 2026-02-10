import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { ApproveSection } from "components/approveSection";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenDropdown } from "components/tokenDropdown";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useDeposit } from "hooks/useDeposit";
import { useEstimateDepositGas } from "hooks/useEstimateDepositGas";
import { useMainnet } from "hooks/useMainnet";
import { useMintFee } from "hooks/useMintFee";
import { usePreviewDeposit } from "hooks/usePreviewDeposit";
import { type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";

import { Form } from "./form";
import { SubmitButton } from "./submitButton";
import { SwapFees } from "./swapFees";
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
  const { t } = useTranslation();

  const { data: fromTokenBalance } = useTokenBalance({
    address: fromToken.address,
    chainId: ethereumChain.id,
  });

  const { data: nativeBalanceData } = useNativeBalance(ethereumChain.id);
  const nativeBalance = nativeBalanceData?.value;

  const { data: depositPreview, isError: isDepositPreviewError } =
    usePreviewDeposit({
      amountIn: amountBigInt,
      tokenIn: fromToken.address,
    });

  const protocolFee = useMintFee();

  const operationGasEstimation = useEstimateDepositGas({
    amountIn: amountBigInt,
    minPeggedTokenOut: depositPreview,
    token: fromToken,
  });

  const depositMutation = useDeposit({
    amountIn: amountBigInt,
    approveAmount,
    tokenIn: fromToken.address,
  });

  const inputError = getSwapErrors({
    amount: amountBigInt,
    nativeBalance,
    tokenBalance: fromTokenBalance,
  });

  const outputValue = formatAmount({
    amount: depositPreview,
    decimals: toToken.decimals,
    isError: isDepositPreviewError,
  });

  const balancesLoaded =
    nativeBalance !== undefined && fromTokenBalance !== undefined;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      depositMutation.mutate();
    }
  }
  return (
    <>
      <Form
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
        outputValue={outputValue}
        toToken={toToken}
        toTokenSelector={<TokenSelectorReadOnly {...toToken} />}
      >
        <SubmitButton
          actionText={t("pages.swap.form.deposit")}
          inputError={inputError}
          isPreviewError={isDepositPreviewError}
          previewValue={depositPreview}
          token={fromToken}
        />
      </Form>
      <ApproveSection active={approve10x} onToggle={onToggleApprove10x} />
      <SwapFees
        amountBigInt={amountBigInt}
        approveAmount={approveAmount}
        fromInputValue={fromInputValue}
        fromToken={fromToken}
        operationGasEstimation={operationGasEstimation}
        outputValue={outputValue}
        protocolFee={protocolFee}
        toToken={toToken}
      />
    </>
  );
}
