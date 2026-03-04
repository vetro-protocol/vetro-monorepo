import type { QueryStatus } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import Skeleton from "react-loading-skeleton";
import type { Token } from "types";

import { DisplayAmount } from "./displayAmount";

export const RenderCryptoValue = function ({
  amountContainer,
  container,
  showSymbol = false,
  status,
  token,
  value,
}: {
  amountContainer?: ComponentType<{
    children?: ReactNode;
  }>;
  container?: ComponentType<{
    children?: ReactNode;
  }>;
  showSymbol?: boolean;
  status: QueryStatus;
  token: Token;
  value: bigint | undefined;
}) {
  if (value !== undefined) {
    return (
      <DisplayAmount
        amountContainer={amountContainer}
        container={container}
        amount={value}
        showSymbol={showSymbol}
        token={token}
      />
    );
  }
  if (status === "error") {
    return <>-</>;
  }
  // Loading state
  return <Skeleton className="h-full" containerClassName="basis-1/3" />;
};
