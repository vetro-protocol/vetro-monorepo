import { type Address } from "viem";

// Uniswap's V3 factory on Ethereum mainnet.
export const uniswapV3FactoryAddress: Address =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984";

// The fee tiers enabled on mainnet, in hundredths of a bip: 0.01%, 0.05%, 0.3%
// and 1%. A pool exists per pair *and* tier, so discovery asks for all four.
export const uniswapV3FeeTiers = [100, 500, 3000, 10000];
