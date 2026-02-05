import { TokenInput } from "components/tokenInput";
import type { FormEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { SwapToggleButton } from "./swapToggleButton";

type Props = {
  balanceValue: string;
  children: ReactNode;
  errorKey?: string;
  fromInputValue: string;
  fromTokenSelector: ReactNode;
  maxButton?: ReactNode;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onToggle: VoidFunction;
  outputValue: string;
  toTokenSelector: ReactNode;
};

export function Form({
  balanceValue,
  children,
  errorKey,
  fromInputValue,
  fromTokenSelector,
  maxButton,
  onInputChange,
  onSubmit,
  onToggle,
  outputValue,
  toTokenSelector,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full justify-center border-y border-gray-200 bg-gray-100">
      <form
        className="flex w-full max-w-md flex-col gap-0.5 border-x border-gray-200 bg-white pt-2"
        onSubmit={onSubmit}
      >
        <div className="px-2">
          <TokenInput
            balanceLabel={t("pages.swap.form.balance")}
            balanceValue={balanceValue}
            errorKey={errorKey}
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
        <div className="px-2">
          <TokenInput
            disabled
            label={t("pages.swap.form.you-will-receive")}
            tokenSelector={toTokenSelector}
            value={outputValue}
          />
        </div>
        {children}
      </form>
    </div>
  );
}
