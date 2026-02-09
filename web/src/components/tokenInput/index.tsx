import type { ReactNode } from "react";

import { Balance } from "./balance";
import { getTextColor } from "./utils";

type Props = {
  balanceLabel: string;
  balanceValue: string;
  disabled?: boolean;
  errorKey?: string;
  label: string;
  maxButton?: ReactNode;
  onChange?: (value: string) => void;
  tokenSelector: ReactNode;
  value: string;
};

export const TokenInput = ({
  balanceLabel,
  balanceValue,
  disabled = false,
  errorKey,
  label,
  maxButton,
  onChange,
  tokenSelector,
  value,
}: Props) => (
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
      <div className="text-xsm flex items-center gap-1">
        <Balance label={balanceLabel} value={balanceValue} />
        {maxButton}
      </div>
    </div>
  </div>
);
