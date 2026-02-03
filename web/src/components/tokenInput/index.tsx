import { MaxButton } from "components/base/maxButton";
import type { ReactNode } from "react";

import { getTextColor } from "./utils";

type Props = {
  balanceLabel: string;
  balanceValue: string;
  errorKey?: string;
  label: string;
  onChange: (value: string) => void;
  onClickMax: () => void;
  tokenSelector: ReactNode;
  value: string;
};

export const TokenInput = ({
  balanceLabel,
  balanceValue,
  errorKey,
  label,
  onChange,
  onClickMax,
  tokenSelector,
  value,
}: Props) => (
  <div className="hover:shadow-bs rounded-lg bg-gray-50 p-4">
    <span className="text-xsm text-gray-500">{label}</span>
    <div className="mt-1 flex items-center justify-between gap-2">
      <input
        className={`min-w-0 flex-1 bg-transparent text-4xl font-semibold outline-none ${getTextColor({ errorKey, value })}`}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        value={value}
      />
      <div className="shrink-0">{tokenSelector}</div>
    </div>
    <div className="mt-1 flex items-center justify-between">
      <span className="text-xsm text-gray-500">${value}</span>
      <div className="text-xsm flex items-center gap-1">
        <span className="text-gray-500">{balanceLabel}:</span>
        <span className="text-gray-900">{balanceValue}</span>
        <MaxButton onClick={onClickMax} />
      </div>
    </div>
  </div>
);
