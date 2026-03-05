import { type QueryStatus } from "@tanstack/react-query";
import { useTokenPrices } from "hooks/useTokenPrices";
import { type ComponentProps } from "react";
import Skeleton from "react-loading-skeleton";
import type { Token } from "types";
import { formatFiatNumber } from "utils/format";
import { getTokenPrice } from "utils/token";
import { formatUnits } from "viem";

import { ErrorBoundary } from "./errorBoundary";

const RenderFiatValueUnsafe = function ({
  customFormatter = formatFiatNumber,
  queryStatus = "success",
  token,
  value,
}: {
  customFormatter?: (amount: string) => string;
  queryStatus?: QueryStatus;
  token: Token;
  value: bigint | undefined;
}) {
  const { data: pricesData, status: pricesStatus } = useTokenPrices({
    retryOnMount: false,
  });

  if (value !== undefined && pricesData !== undefined) {
    const stringBalance = formatUnits(value, token.decimals);
    const price = getTokenPrice(token, pricesData);

    return (
      <>
        {customFormatter(
          (parseFloat(stringBalance) * parseFloat(price)).toFixed(
            token.decimals,
          ),
        )}
      </>
    );
  }

  // Check for errors from either source
  if (queryStatus === "error" || pricesStatus === "error") {
    return <>-</>;
  }

  // Loading state (either balance or prices are loading)
  return <Skeleton className="h-full" containerClassName="w-8" />;
};

export const RenderFiatValue = (
  props: ComponentProps<typeof RenderFiatValueUnsafe>,
) => (
  // Prevent crashing if a price is missing or wrongly mapped
  <ErrorBoundary fallback="-">
    <RenderFiatValueUnsafe {...props} />
  </ErrorBoundary>
);
