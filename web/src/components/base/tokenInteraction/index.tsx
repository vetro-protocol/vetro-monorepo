import type { Token } from "@vetro-protocol/core";
import { TokenLogo } from "components/tokenLogo";
import type { ReactNode } from "react";

type TokenInteractionProps = {
  amount: ReactNode;
  detail: ReactNode;
  label?: string;
  logo?: ReactNode;
  subtitle?: ReactNode;
  token: Pick<Token, "logoURI" | "symbol">;
};

type TokenInteractionListProps = {
  children: ReactNode;
};

export const TokenInteraction = ({
  amount,
  detail,
  label,
  logo,
  subtitle,
  token,
}: TokenInteractionProps) => (
  <div className="flex flex-col gap-2">
    {label && <p className="text-b-regular text-gray-500">{label}</p>}
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-x-2 text-4xl leading-10 font-semibold tracking-tight text-gray-900">
        <span>{amount}</span>
        <span className="text-gray-500">{token.symbol}</span>
      </div>
      {logo || <TokenLogo {...token} size="large" />}
    </div>
    <p className="text-b-regular text-gray-500">{detail}</p>
    {subtitle && <p className="text-h4 text-gray-500">{subtitle}</p>}
  </div>
);

export const TokenInteractionList = ({
  children,
}: TokenInteractionListProps) => (
  <div className="flex flex-col gap-10 border-y border-gray-200 bg-gray-50 p-6">
    {children}
  </div>
);
