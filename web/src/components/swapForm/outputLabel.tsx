import type { UseQueryResult } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { QueryResult } from "components/base/queryResult";
import { OracleTooltip } from "components/oracleTooltip";
import { useTokenConfig } from "hooks/useTokenConfig";
import { useVaultPreviewDeposit } from "hooks/useVaultPreviewDeposit";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import { type Address, formatUnits, isAddressEqual, zeroAddress } from "viem";

export type UnitPreview = Pick<
  UseQueryResult<bigint>,
  "data" | "fetchStatus" | "status"
>;

export type StakeTarget = {
  shareToken: Token;
  stakingVaultAddress: Address;
};

type OutputLabelProps = {
  fromToken: TokenWithGateway;
  oracleToken: Address;
  stakeTarget?: StakeTarget;
  toToken: TokenWithGateway;
  unitPreview: UnitPreview;
};

const ShareRate = function ({
  assets,
  shareToken,
  stakingVaultAddress,
}: StakeTarget & { assets: bigint }) {
  const { data: shares, status } = useVaultPreviewDeposit({
    assets,
    stakingVaultAddress,
  });

  return (
    <RenderCryptoValue
      showSymbol
      status={status}
      token={shareToken}
      value={shares}
    />
  );
};

export const OutputLabel = function ({
  fromToken,
  oracleToken,
  stakeTarget,
  toToken,
  unitPreview,
}: OutputLabelProps) {
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
        data={(data) => (
          <span className="flex flex-wrap items-center gap-x-1">
            <span className="whitespace-nowrap">{`1 ${fromToken.symbol} = ${formatUnits(data, toToken.decimals)} ${toToken.symbol}`}</span>
            {stakeTarget && (
              <span className="flex items-center gap-x-1 whitespace-nowrap">
                =
                <ShareRate
                  assets={data}
                  shareToken={stakeTarget.shareToken}
                  stakingVaultAddress={stakeTarget.stakingVaultAddress}
                />
              </span>
            )}
          </span>
        )}
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
