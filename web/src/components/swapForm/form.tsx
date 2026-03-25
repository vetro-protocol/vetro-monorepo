import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { RenderFiatValue } from "components/base/fiatValue";
import { TokenInput } from "components/tokenInput";
import { Balance } from "components/tokenInput/balance";
import { useMainnet } from "hooks/useMainnet";
import type { FormEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";

import { SwapToggleButton } from "./swapToggleButton";

type Props = {
  amountBigInt: bigint;
  children: ReactNode;
  errorKey?: string;
  fromInputValue: string;
  fromToken: Token;
  fromTokenSelector: ReactNode;
  maxButton?: ReactNode;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onToggle: VoidFunction;
  toSection: ReactNode;
};

export function Form({
  amountBigInt,
  children,
  errorKey,
  fromInputValue,
  fromToken,
  fromTokenSelector,
  maxButton,
  onInputChange,
  onSubmit,
  onToggle,
  toSection,
}: Props) {
  const ethereumChain = useMainnet();
  const { t } = useTranslation();

  const { data: fromTokenBalance, isError: isFromTokenBalanceError } =
    useTokenBalance({
      address: fromToken.address,
      chainId: ethereumChain.id,
    });

  return (
    <div className="flex w-full justify-center border-y border-gray-200 bg-gray-100">
      <form
        className="xs:border-x flex w-full max-w-md flex-col gap-0.5 border-gray-200 bg-white pt-2"
        onSubmit={onSubmit}
      >
        <div className="px-2">
          <TokenInput
            balance={
              <Balance
                label={t("pages.swap.form.balance")}
                value={formatAmount({
                  amount: fromTokenBalance,
                  decimals: fromToken.decimals,
                  isError: isFromTokenBalanceError,
                })}
              />
            }
            errorKey={errorKey}
            fiatValue={
              <RenderFiatValue token={fromToken} value={amountBigInt} />
            }
            label={t("pages.swap.form.you-are-swapping")}
            maxButton={maxButton}
            onChange={onInputChange}
            tokenSelector={fromTokenSelector}
            value={fromInputValue}
          />
        </div>

        <div className="relative flex h-0 items-center justify-center">
          <SwapToggleButton onClick={onToggle} />
        </div>
        <div className="px-2">{toSection}</div>
        {children}
      </form>
    </div>
  );
}
