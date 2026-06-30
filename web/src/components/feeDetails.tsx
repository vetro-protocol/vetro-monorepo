import { TokenLogo } from "components/tokenLogo";
import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";
import type { Token } from "types";

export type FeeDetailsProps = {
  className?: string;
  isError?: boolean;
  isIdle?: boolean;
  label: string;
  token?: Pick<Token, "logoURI" | "symbol">;
  value?: ReactNode;
};

export function FeeDetails({
  className = "",
  isError,
  isIdle,
  label,
  token,
  value,
}: FeeDetailsProps) {
  const renderedValue =
    value !== undefined ? (
      value
    ) : isError || isIdle ? (
      "-"
    ) : (
      <Skeleton width={50} />
    );

  return (
    <div
      className={`text-xsm flex cursor-default items-center justify-between border-t border-gray-200 py-3 ${className}`}
    >
      <span className="text-gray-500">{label}</span>
      <span className="flex items-center gap-1 font-semibold text-gray-900">
        {token && value !== undefined && <TokenLogo {...token} size="small" />}
        {renderedValue}
      </span>
    </div>
  );
}
