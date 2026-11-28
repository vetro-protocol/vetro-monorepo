import { type QueryStatus } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { usePrices } from "hooks/usePrices";
import { type ComponentProps } from "react";
import Skeleton from "react-loading-skeleton";
import type { NativeToken } from "types";
import { formatFiatNumber } from "utils/format";
import { getTokenPrice } from "utils/token";
import { formatUnits, parseUnits } from "viem";

import { ErrorBoundary } from "./errorBoundary";

const priceDecimals = 18;

const tokenAmountToUsdString = ({
  amount,
  decimals,
  price,
}: {
  amount: bigint;
  decimals: number;
  price: string;
}) =>
  formatUnits(
    amount * parseUnits(price, priceDecimals),
    decimals + priceDecimals,
  );

const RenderFiatValueUnsafe = function ({
  customFormatter = formatFiatNumber,
  queryStatus = "success",
  token,
  value,
}: {
  customFormatter?: (amount: string) => string;
  queryStatus?: QueryStatus;
  token: NativeToken | Token | undefined;
  value: bigint | undefined;
}) {
  const { data: pricesData, status: pricesStatus } = usePrices();

  if (value !== undefined && pricesData !== undefined && token !== undefined) {
    return (
      <>
        {customFormatter(
          tokenAmountToUsdString({
            amount: value,
            decimals: token.decimals,
            price: getTokenPrice(token, pricesData),
          }),
        )}
      </>
    );
  }

  // Check for errors from either source
  if (queryStatus === "error" || pricesStatus === "error") {
    return <>-</>;
  }

  // Loading state (either balance or prices are loading)
  return <Skeleton inline width={32} />;
};

export const RenderFiatValue = (
  props: ComponentProps<typeof RenderFiatValueUnsafe>,
) => (
  // Prevent crashing if a price is missing or wrongly mapped
  <ErrorBoundary fallback="-">
    <RenderFiatValueUnsafe {...props} />
  </ErrorBoundary>
);
