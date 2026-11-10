import type { FetchStatus } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { QueryResult } from "components/base/queryResult";
import { TokenLogo } from "components/tokenLogo";
import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

export type FeeDetailsProps = {
  className?: string;
  fetchStatus?: FetchStatus;
  isError?: boolean;
  label: string;
  token?: Pick<Token, "logoURI" | "symbol">;
  value?: ReactNode;
};

export const FeeDetails = ({
  className = "",
  fetchStatus,
  isError = false,
  label,
  token,
  value,
}: FeeDetailsProps) => (
  <div
    className={`text-xsm flex cursor-default items-center justify-between border-t border-gray-200 py-3 ${className}`}
  >
    <span className="text-gray-500">{label}</span>
    <span className="flex items-center gap-1 font-semibold text-gray-900">
      <QueryResult
        data={(data) => (
          <>
            {token && <TokenLogo {...token} size="small" />}
            {data}
          </>
        )}
        error="-"
        loading={<Skeleton width={50} />}
        query={{ data: value, fetchStatus, isError }}
      />
    </span>
  </div>
);
