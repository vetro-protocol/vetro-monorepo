import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { ApproveSection } from "components/approveSection";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenDropdown } from "components/tokenDropdown";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useMainnet } from "hooks/useMainnet";
import { usePreviewRedeem } from "hooks/usePreviewRedeem";
import { useRedeem } from "hooks/useRedeem";
import { type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";

import { Form } from "./form";
import { SubmitButton } from "./submitButton";
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

export function Redeem({
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

  const { data: redeemPreview, isError: isPreviewError } = usePreviewRedeem({
    peggedTokenIn: amountBigInt,
    tokenOut: toToken.address,
  });

  const redeemMutation = useRedeem({
    approveAmount,
    peggedTokenIn: amountBigInt,
    tokenOut: toToken.address,
  });

  const inputError = getSwapErrors({
    amount: amountBigInt,
    nativeBalance,
    tokenBalance: fromTokenBalance,
  });

  const outputValue = formatAmount({
    amount: redeemPreview,
    decimals: toToken.decimals,
    isError: isPreviewError,
  });

  const balancesLoaded =
    nativeBalance !== undefined && fromTokenBalance !== undefined;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      redeemMutation.mutate();
    }
  }

  return (
    <>
      <Form
        errorKey={balancesLoaded ? inputError : undefined}
        fromInputValue={fromInputValue}
        fromToken={fromToken}
        fromTokenSelector={
          <TokenSelectorReadOnly
            logoURI={fromToken.logoURI}
            symbol={fromToken.symbol}
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
        toTokenSelector={
          <TokenDropdown
            onChange={onTokenChange}
            tokens={whitelistedTokens}
            value={toToken}
          />
        }
      >
        <SubmitButton
          actionText={t("pages.swap.form.redeem")}
          inputError={inputError}
          isPreviewError={isPreviewError}
          previewValue={redeemPreview}
          token={fromToken}
        />
      </Form>
      <ApproveSection active={approve10x} onToggle={onToggleApprove10x} />
    </>
  );
}
