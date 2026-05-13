import type { Address, Chain } from "viem";

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

export type TokenWithGateway = Token & { gatewayAddress: Address };

export type BridgeableToken = Token & {
  oftAdapterAddress?: Address;
  sharedDecimals: number;
};
