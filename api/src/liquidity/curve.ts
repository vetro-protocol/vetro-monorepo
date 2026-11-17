import { knownTokens, type DexPool } from "@vetro-protocol/core";
import fetchJson from "tiny-fetch-json";
import {
  type Address,
  checksumAddress,
  type Client,
  formatUnits,
  isAddressEqual,
  zeroAddress,
} from "viem";
import { mainnet } from "viem/chains";

import { getLiquidityUsdPrices } from "./oracle-usd-prices.ts";
import { poolTvlUsd } from "./pool-metrics.ts";
import { portalUsdPrice } from "./portal-usd-price.ts";
import { isTrackedToken } from "./tracked-tokens.ts";

export const crvAddress = knownTokens.find(
  (token) => token.chainId === mainnet.id && token.symbol === "CRV",
)!.address;

const curveApiUrl = "https://api.curve.finance/api";

type CurveCoin = {
  address: Address;
  decimals: string;
  poolBalance: string;
  usdPrice: number | null;
};

type CurveApiPool = {
  address: Address;
  coins: CurveCoin[];
  gaugeAddress?: Address;
  gaugeCrvApy: (number | null)[] | null;
  id: string;
  lpTokenAddress?: Address;
  usdTotal: number;
};

type CurveVolume = {
  address: Address;
  latestDailyApyPcent: number;
  volumeUSD: number;
};

const toGaugeAddress = (address: Address | undefined) =>
  address && !isAddressEqual(address, zeroAddress)
    ? checksumAddress(address)
    : undefined;

const coinAmount = (coin: CurveCoin) =>
  Number(formatUnits(BigInt(coin.poolBalance), Number(coin.decimals)));

const buildPool = function ({
  pool,
  prices,
  volume,
}: {
  pool: CurveApiPool;
  prices: Record<string, string>;
  volume: CurveVolume | undefined;
}): DexPool {
  const hasUnpricedCoin = pool.coins.some(
    (coin) => coin.usdPrice === null && BigInt(coin.poolBalance) > 0n,
  );
  const tvlUsd = hasUnpricedCoin
    ? poolTvlUsd(
        pool.coins.map((coin) => ({
          amount: coinAmount(coin),
          usdPrice:
            coin.usdPrice ??
            portalUsdPrice({
              address: coin.address,
              chainId: mainnet.id,
              prices,
            }) ??
            (BigInt(coin.poolBalance) > 0n ? undefined : 0),
        })),
      )
    : pool.usdTotal;
  const gaugeAddress = toGaugeAddress(pool.gaugeAddress);
  const gaugeApr = pool.gaugeCrvApy?.[0] ?? 0;
  const hasGaugeReward = gaugeAddress !== undefined && gaugeApr > 0;
  return {
    address: checksumAddress(pool.address),
    apr: tvlUsd === null ? null : (volume?.latestDailyApyPcent ?? 0),
    chainId: mainnet.id,
    coins: pool.coins.map((coin) => ({
      address: checksumAddress(coin.address),
      amount: coinAmount(coin),
    })),
    dex: "curve",
    dexMetadata: {
      gaugeAddress,
      lpTokenAddress:
        pool.lpTokenAddress && checksumAddress(pool.lpTokenAddress),
      poolId: pool.id,
    },
    rewards: hasGaugeReward
      ? [
          {
            apr: gaugeApr,
            aprMax: pool.gaugeCrvApy?.[1] ?? gaugeApr,
            source: "curveGauge",
            sourceMetadata: { gaugeAddress },
            tokens: [{ address: crvAddress, chainId: mainnet.id }],
          },
        ]
      : [],
    tvlUsd,
    volumeUsd24h: volume?.volumeUSD ?? 0,
  };
};

// The Curve API cannot filter pools by token, so this loads every pool.
export async function getCurvePools({
  client,
  portalApiUrl,
}: {
  client: Client;
  portalApiUrl: string;
}) {
  const [poolsResponse, volumesResponse, prices] = await Promise.all([
    fetchJson(`${curveApiUrl}/getPools/all/ethereum`) as Promise<{
      data: { poolData: CurveApiPool[] };
    }>,
    fetchJson(`${curveApiUrl}/getVolumes/ethereum`) as Promise<{
      data: { pools: CurveVolume[] };
    }>,
    getLiquidityUsdPrices({ client, portalApiUrl }),
  ]);
  const volumes = new Map(
    volumesResponse.data.pools.map((volume) => [
      volume.address.toLowerCase(),
      volume,
    ]),
  );
  return poolsResponse.data.poolData
    .filter((pool) => pool.coins.some((coin) => isTrackedToken(coin.address)))
    .map((pool) =>
      buildPool({
        pool,
        prices,
        volume: volumes.get(pool.address.toLowerCase()),
      }),
    );
}
