import { QueryResult } from "components/base/queryResult";
import { useTokenInfo } from "hooks/useTokenInfo";
import { Fragment } from "react";
import Skeleton from "react-loading-skeleton";
import { formatEvmAddress } from "utils/format";
import type { Address } from "viem";

type CoinSymbolProps = {
  address: Address;
  chainId: number;
};

const CoinSymbol = function ({ address, chainId }: CoinSymbolProps) {
  const tokenInfoQuery = useTokenInfo({ address, chainId });
  return (
    <QueryResult
      data={(token) => token.symbol}
      error={formatEvmAddress(address)}
      loading={<Skeleton inline width={40} />}
      query={tokenInfoQuery}
    />
  );
};

type CoinSymbolsProps = {
  coins: CoinSymbolProps[];
  separator: string;
};

export const CoinSymbols = ({ coins, separator }: CoinSymbolsProps) =>
  coins.map(({ address, chainId }, index) => (
    <Fragment key={address}>
      {index > 0 && separator}
      <CoinSymbol address={address} chainId={chainId} />
    </Fragment>
  ));
