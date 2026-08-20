import type { Address, Chain } from "viem";

export type Gateway = {
  address: Address;
  // Portal-API symbol used to convert this gateway's peg unit into USD.
  // "USD" is treated as identity (no conversion needed). Whitelisted-token
  // oracles are denominated in this peg unit (e.g. WBTC/BTC for the vetBTC
  // gateway, USDT/USD for the VUSD gateway), so the USD price for any
  // whitelisted token is `oracle × portal[pegBaseSymbol]`. See
  // `web/src/fetchers/fetchPrices.ts` for the merge.
  pegBaseSymbol: string;
  peggedToken: Address;
  // A gateway can be deployed without a staking vault
  stakingVault?: Address;
  treasury: Address;
  whitelistedTokens: Address[];
};

export type Token = {
  address: Address;
  chainId: Chain["id"];
  decimals: number;
  extensions?: {
    allowanceSlot?: bigint;
    balanceSlot?: number;
    // When true, the token's fiat value is computed by converting shares to
    // the vault's underlying asset (ERC-4626 convertToAssets) on the chain
    // where the staking vault lives, then pricing the resulting asset.
    isVaultShare?: boolean;
    // Use this to map which symbol should be used to map prices
    priceSymbol?: string;
  };
  logoURI: string;
  name: string;
  symbol: string;
};
