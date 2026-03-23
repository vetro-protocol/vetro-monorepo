import type { ReactNode } from "react";

import { getTextColor } from "./utils";

type Props = {
  balance?: ReactNode;
  disabled?: boolean;
  errorKey?: string;
  fiatValue?: ReactNode;
  label: string;
  maxButton?: ReactNode;
  onChange?: (value: string) => void;
  tokenSelector: ReactNode;
  value: string;
};

export const TokenInput = ({
  balance,
  disabled = false,
  errorKey,
  fiatValue,
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
      {fiatValue && (
        <span className="text-xsm text-gray-500">${fiatValue}</span>
      )}
      {balance || maxButton ? (
        <div className="text-xsm flex items-center gap-1">
          {balance}
          {maxButton}
        </div>
      ) : null}
    </div>
  </div>
);
