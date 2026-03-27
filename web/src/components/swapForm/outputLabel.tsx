import { OracleTooltip } from "components/oracleTooltip";
import { useOraclePrice } from "hooks/useOraclePrice";
import { useTokenConfig } from "hooks/useTokenConfig";
import Skeleton from "react-loading-skeleton";
import type { Token } from "types";
import { type Address, formatUnits, isAddressEqual, zeroAddress } from "viem";

type Props = {
  fromToken: Token;
  oracleToken: Address;
  toToken: Token;
};

export const OutputLabel = function ({
  fromToken,
  oracleToken,
  toToken,
}: Props) {
  const { data: tokenConfig, isError: isTokenConfigError } =
    useTokenConfig(oracleToken);
  const { data: oraclePriceData, isError: isOraclePriceError } =
    useOraclePrice(oracleToken);
  const isError = isTokenConfigError || isOraclePriceError;

  // unitPrice from Treasury.getPrice() is 10^oracle.decimals(), so counting
  // its digits minus 1 gives the Chainlink oracle's decimal count.
  const oraclePrice = oraclePriceData
    ? formatUnits(oraclePriceData[0], oraclePriceData[1].toString().length - 1)
    : undefined;

  if (!tokenConfig?.oracle || isAddressEqual(tokenConfig.oracle, zeroAddress)) {
    return null;
  }

  return (
    <span className="flex items-center gap-x-1">
      {isError ? (
        "-"
      ) : oraclePrice ? (
        `1 ${fromToken.symbol} = ${oraclePrice} ${toToken.symbol}`
      ) : (
        <Skeleton className="h-full" containerClassName="w-24" />
      )}
      <OracleTooltip oracle={tokenConfig.oracle} variant="oracle" />
    </span>
  );
};
