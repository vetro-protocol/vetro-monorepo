import type { UseQueryResult } from "@tanstack/react-query";
import { OracleTooltip } from "components/oracleTooltip";
import { useTokenConfig } from "hooks/useTokenConfig";
import Skeleton from "react-loading-skeleton";
import type { Token } from "types";
import { type Address, formatUnits, isAddressEqual, zeroAddress } from "viem";

export type UnitPreview = Pick<
  UseQueryResult<bigint>,
  "data" | "fetchStatus" | "status"
>;

type Props = {
  fromToken: Token;
  oracleToken: Address;
  toToken: Token;
  unitPreview: UnitPreview;
};

export const OutputLabel = function ({
  fromToken,
  oracleToken,
  toToken,
  unitPreview,
}: Props) {
  const { data: tokenConfig, isError: isTokenConfigError } =
    useTokenConfig(oracleToken);

  if (!tokenConfig?.oracle || isAddressEqual(tokenConfig.oracle, zeroAddress)) {
    return null;
  }

  return (
    <span className="flex items-center gap-x-1">
      {isTokenConfigError || unitPreview.status === "error" ? (
        "-"
      ) : unitPreview.data !== undefined ? (
        `1 ${fromToken.symbol} = ${formatUnits(unitPreview.data, toToken.decimals)} ${toToken.symbol}`
      ) : (
        <Skeleton className="h-full" containerClassName="w-24" />
      )}
      <OracleTooltip
        oracle={tokenConfig.oracle}
        useParentContainer
        variant="oracle"
      />
    </span>
  );
};
