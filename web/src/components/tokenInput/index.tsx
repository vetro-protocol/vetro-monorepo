import type { ReactNode } from "react";
import { useAccount } from "wagmi";

import { getTextColor } from "./utils";

type BaseProps = {
  disabled?: boolean;
  errorKey?: string;
  label: string;
  onChange?: (value: string) => void;
  tokenSelector: ReactNode;
  value: string;
};

type PropsWithBalance = BaseProps & {
  balanceLabel: string;
  balanceValue: string;
  maxButton: ReactNode;
};

type PropsWithoutBalance = BaseProps & {
  balanceLabel?: never;
  balanceValue?: never;
  maxButton?: never;
};

type Props = PropsWithBalance | PropsWithoutBalance;

export const TokenInput = function ({
  balanceLabel,
  balanceValue,
  disabled = false,
  errorKey,
  label,
  maxButton,
  onChange,
  tokenSelector,
  value,
}: Props) {
  const { address } = useAccount();
  return (
    <div className="hover:shadow-bs h-32 rounded-lg bg-gray-50 p-4">
      <span className="text-xsm text-gray-500">{label}</span>
      <div className="mt-1 flex items-center justify-between gap-2">
        <input
          className={`min-w-0 flex-1 bg-transparent text-4xl font-semibold outline-none ${getTextColor({ errorKey, value })}`}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          type="text"
          value={value}
        />
        <div className="shrink-0">{tokenSelector}</div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xsm text-gray-500">${value}</span>
        {balanceLabel !== undefined && (
          <div className="text-xsm flex items-center gap-1">
            <span className="text-gray-500">{balanceLabel}:</span>
            <span className="mr-1 text-gray-900">
              {address ? balanceValue : "-"}
            </span>
            {maxButton}
          </div>
        )}
      </div>
    </div>
  );
};
