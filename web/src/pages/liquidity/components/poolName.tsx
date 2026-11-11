import type { DexPool } from "@vetro-protocol/core";
import { QueryResult } from "components/base/queryResult";
import { DefaultTokenLogo } from "components/defaultTokenLogo";
import { TokenLogo } from "components/tokenLogo";
import { useTokenInfo } from "hooks/useTokenInfo";
import Skeleton from "react-loading-skeleton";
import type { Address } from "viem";

import { dexNames } from "../utils";

import { CoinSymbols } from "./coinSymbols";
import { VenueLogo } from "./venueLogo";

type CoinLogoProps = {
  address: Address;
  chainId: number;
};

const CoinLogo = function ({ address, chainId }: CoinLogoProps) {
  const tokenInfoQuery = useTokenInfo({ address, chainId });
  return (
    <QueryResult
      data={(token) => <TokenLogo {...token} size="medium" />}
      error={<DefaultTokenLogo size="medium" symbol="?" />}
      loading={<Skeleton circle height={24} width={24} />}
      query={tokenInfoQuery}
    />
  );
};

type PoolNameProps = {
  pool: DexPool;
};

export const PoolName = ({ pool }: PoolNameProps) => (
  <div className="group flex items-center gap-2.5">
    <div className="flex shrink-0">
      {pool.coins.map(({ address }, index) => (
        <span
          className={`relative flex rounded-full ${index > 0 ? "transition-margin -ml-1.5 duration-300 ease-in-out group-hover:ml-0 motion-reduce:transition-none" : ""} ${index < pool.coins.length - 1 ? "ring-2 ring-white" : ""}`}
          key={address}
          style={{ zIndex: pool.coins.length - index }}
        >
          <CoinLogo address={address} chainId={pool.chainId} />
        </span>
      ))}
    </div>
    <div className="flex flex-col">
      <span className="text-b-medium text-gray-900">
        <CoinSymbols
          coins={pool.coins.map(({ address }) => ({
            address,
            chainId: pool.chainId,
          }))}
          separator="/"
        />
      </span>
      <span className="text-caption flex items-center gap-1 text-gray-500">
        <VenueLogo dex={pool.dex} />
        {dexNames[pool.dex]}
      </span>
    </div>
  </div>
);
