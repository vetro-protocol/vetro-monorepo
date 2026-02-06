import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { ApproveSection } from "components/approveSection";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenDropdown } from "components/tokenDropdown";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useDeposit } from "hooks/useDeposit";
import { useMainnet } from "hooks/useMainnet";
import { usePreviewDeposit } from "hooks/usePreviewDeposit";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";

import { Form } from "./form";
import { SubmitButton } from "./submitButton";
import { getSwapErrors } from "./validation";

type Props = {
  amountBigInt: bigint;
  fromInputValue: string;
  fromToken: Token;
  onInputChange: (value: string) => void;
  onMaxClick: (maxValue: string) => void;
  onToggle: VoidFunction;
  onTokenChange: (token: Token) => void;
  toToken: Token;
  whitelistedTokens: Token[];
};

export function Deposit({
  amountBigInt,
  fromInputValue,
  fromToken,
  onInputChange,
  onMaxClick,
  onToggle,
  onTokenChange,
  toToken,
  whitelistedTokens,
}: Props) {
  const [approve10x, setApprove10x] = useState(false);
  const ethereumChain = useMainnet();
  const { t } = useTranslation();

  const approveAmount = approve10x ? amountBigInt * 10n : undefined;

  const { data: fromTokenBalance, isError: isFromTokenBalanceError } =
    useTokenBalance({
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

  const formattedBalance = formatAmount({
    amount: fromTokenBalance,
    decimals: fromToken.decimals,
    isError: isFromTokenBalanceError,
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
        balanceValue={formattedBalance}
        errorKey={balancesLoaded ? inputError : undefined}
        fromInputValue={fromInputValue}
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
      <ApproveSection
        active={approve10x}
        onToggle={() => setApprove10x((prev) => !prev)}
      />
    </>
  );
}
