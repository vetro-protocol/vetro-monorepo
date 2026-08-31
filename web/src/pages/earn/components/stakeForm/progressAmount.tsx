import type { Token } from "@vetro-protocol/core";
import { TokenLogo } from "components/tokenLogo";
import type { ReactNode } from "react";

type Props = {
  amount: ReactNode;
  fiatValue: ReactNode;
  label: string;
  subtitle?: ReactNode;
  token: Token;
};

// TODO this should be extracted into a common component, see
// https://github.com/vetro-protocol/vetro-monorepo/issues/765
export const ProgressAmount = ({
  amount,
  fiatValue,
  label,
  subtitle,
  token,
}: Props) => (
  <div className="flex flex-col gap-2">
    <p className="text-xsm text-gray-500">{label}</p>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-x-2 text-4xl leading-10 font-semibold tracking-tight text-gray-900">
        <span>{amount}</span>
        <span className="text-gray-500">{token.symbol}</span>
      </div>
      <TokenLogo {...token} size="large" />
    </div>
    <p className="text-xsm text-gray-500">${fiatValue}</p>
    {subtitle && (
      <p className="text-base font-semibold text-gray-500">{subtitle}</p>
    )}
  </div>
);
