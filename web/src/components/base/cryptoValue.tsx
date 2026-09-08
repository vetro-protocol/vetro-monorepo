import type { QueryStatus } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import type { ComponentType, ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

import { DisplayAmount } from "./displayAmount";

export const RenderCryptoValue = function ({
  amountContainer,
  container,
  showSymbol = false,
  status = "success",
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
  status?: QueryStatus;
  token: Token;
  value: bigint | undefined;
}) {
  if (value !== undefined) {
    return (
      <DisplayAmount
        amount={value}
        amountContainer={amountContainer}
        container={container}
        showSymbol={showSymbol}
        token={token}
      />
    );
  }
  if (status === "error") {
    return <>-</>;
  }
  // Loading state
  return <Skeleton inline width={80} />;
};
