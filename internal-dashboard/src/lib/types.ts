import { type Address } from "viem";

import { type Dex } from "../config/dexes";

// Normalized, venue-agnostic shapes the UI consumes. Each DEX source (Curve
// today) maps its own API onto these, so the rest of the app stays venue-neutral.

export type PoolCoin = {
  address: Address;
  // Raw on-chain balance in the token's smallest unit. Convert for display with
  // formatUnits(balance, decimals); USD value is balance * usdPrice, derived
  // where needed rather than stored.
  balance: bigint;
  decimals: number;
  symbol: string;
  usdPrice: number;
};

export type TrackedPool = {
  address: Address;
  baseApy: number; // % from trading fees
  coins: PoolCoin[];
  dex: Dex; // venue this pool belongs to
  // Contract distributing incentives (a Curve gauge). Venue-specific and
  // optional — not every DEX exposes one.
  gaugeAddress: Address | undefined;
  // Unique key for routing/list keys. Usually the address, but a pool can appear
  // more than once (e.g. a Sushi pool listed both full-range and for a price band),
  // so the id disambiguates those entries while `address` stays the real pool.
  id: string;
  // A derived sub-range view of another entry (e.g. liquidity within a price band).
  // Excluded from token-distribution stats so its liquidity isn't double-counted.
  isRangeView?: boolean;
  lpTokenAddress: Address | undefined;
  name: string;
  poolType: string; // venue's own classification (e.g. Curve registry id)
  rangeLabel?: string; // short label for the view (e.g. "Full range", "$0.96–$1.04")
  rewardApy: number; // % from incentive emissions, unboosted (range minimum)
  rewardApyMax: number; // % from incentive emissions, max boost (range maximum)
  totalApy: number; // baseApy + rewardApy
  tvlUsd: number;
  url: string; // the pool's page on its DEX
  virtualPrice: number;
  volumeUsd24h: number;
};

// Tokens whose DEX liquidity we track. Discovered on-chain from the gateway and
// staking-vault packages (see fetchers/fetchTrackedTokens) rather than hardcoded.
// Mirrors web's `Token` shape (nested `extensions`), trimmed to the fields this
// dashboard uses.
export type TrackedToken = {
  address: Address;
  decimals: number;
  extensions?: {
    // ERC4626 share tokens (the address is the vault itself). Valued by
    // converting shares to the underlying via the vault's live share value,
    // then pricing the underlying by its price symbol.
    isVaultShare?: boolean;
    // Symbol used to derive this token's USD price. For pegged tokens it's the
    // gateway's peg base ("USD" is identity at $1, otherwise a portal spot
    // price); share tokens inherit their underlying pegged token's.
    priceSymbol?: string;
  };
  symbol: string;
};

export type GaugeEmission = {
  estCrvPerDay: number; // estimated CRV directed to this gauge per day
  inflationRate: number; // network-wide CRV emitted per second
  relativeWeight: number; // 0..1 share of emissions assigned to this gauge
};
