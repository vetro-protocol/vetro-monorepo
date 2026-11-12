import type { UseQueryResult } from "@tanstack/react-query";
import { QueryResult } from "components/base/queryResult";
import { OracleTooltip } from "components/oracleTooltip";
import { useTokenConfig } from "hooks/useTokenConfig";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import { type Address, formatUnits, isAddressEqual, zeroAddress } from "viem";

export type UnitPreview = Pick<
  UseQueryResult<bigint>,
  "data" | "fetchStatus" | "status"
>;

type Props = {
  fromToken: TokenWithGateway;
  oracleToken: Address;
  toToken: TokenWithGateway;
  unitPreview: UnitPreview;
};

export const OutputLabel = function ({
  fromToken,
  oracleToken,
  toToken,
  unitPreview,
}: Props) {
  const { data: tokenConfig, isError: isTokenConfigError } = useTokenConfig({
    gatewayAddress: fromToken.gatewayAddress,
    token: oracleToken,
  });

  if (!tokenConfig?.oracle || isAddressEqual(tokenConfig.oracle, zeroAddress)) {
    return null;
  }

  return (
    <span className="flex items-center gap-x-1">
      <QueryResult
        data={(data) =>
          `1 ${fromToken.symbol} = ${formatUnits(data, toToken.decimals)} ${toToken.symbol}`
        }
        error="-"
        loading={<Skeleton className="h-full" containerClassName="w-24" />}
        query={{
          data: unitPreview.data,
          fetchStatus: unitPreview.fetchStatus,
          isError: isTokenConfigError || unitPreview.status === "error",
        }}
      />
      <OracleTooltip
        oracle={tokenConfig.oracle}
        useParentContainer
        variant="oracle"
      />
    </span>
  );
};
