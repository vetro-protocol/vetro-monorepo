import { type Address } from "viem";
import { multicall } from "viem/actions";

import { client } from "./client";
import { type TickLiquidity } from "./v3PositionMath";

// The Uniswap-v3 pool surface the band views need (SushiSwap V3 is a fork of it):
// the current price and liquidity, plus the liquidity deltas of the initialized
// ticks the band spans. No data API publishes the per-tick distribution, so this
// is the one part of a Sushi pool read on-chain.
const poolAbi = [
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "wordPosition", type: "int16" }],
    name: "tickBitmap",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tickSpacing",
    outputs: [{ name: "", type: "int24" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tick", type: "int24" }],
    name: "ticks",
    outputs: [
      { name: "liquidityGross", type: "uint128" },
      { name: "liquidityNet", type: "int128" },
      { name: "feeGrowthOutside0X128", type: "uint256" },
      { name: "feeGrowthOutside1X128", type: "uint256" },
      { name: "tickCumulativeOutside", type: "int56" },
      { name: "secondsPerLiquidityOutsideX128", type: "uint160" },
      { name: "secondsOutside", type: "uint32" },
      { name: "initialized", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const BITS_PER_WORD = 256;

// A pool records which ticks are initialized in 256-bit words, indexed by the
// tick divided by the pool's spacing.
const wordPosition = ({ spacing, tick }: { spacing: number; tick: number }) =>
  Math.floor(Math.floor(tick / spacing) / BITS_PER_WORD);

const setBits = function (bitmap: bigint) {
  const bits: number[] = [];
  for (let bit = 0; bit < BITS_PER_WORD; bit++) {
    if (((bitmap >> BigInt(bit)) & 1n) === 1n) {
      bits.push(bit);
    }
  }
  return bits;
};

// The pool state a price band is valued from. Only ticks within the range asked
// for are read, so the result is valid for bands inside that range and no wider.
// The range is widened to the current tick when the price sits outside it: the
// walk that spreads liquidity across a band starts from the pool's reported
// liquidity, which is the liquidity at the current tick.
export const fetchV3PoolState = async function ({
  lowerTick,
  poolAddress,
  upperTick,
}: {
  lowerTick: number;
  poolAddress: Address;
  upperTick: number;
}) {
  const [[sqrtPriceX96, currentTick], liquidity, spacing] = await multicall(
    client,
    {
      allowFailure: false,
      contracts: [
        { abi: poolAbi, address: poolAddress, functionName: "slot0" },
        { abi: poolAbi, address: poolAddress, functionName: "liquidity" },
        { abi: poolAbi, address: poolAddress, functionName: "tickSpacing" },
      ],
    },
  );

  const firstWord = wordPosition({
    spacing,
    tick: Math.min(lowerTick, currentTick),
  });
  const lastWord = wordPosition({
    spacing,
    tick: Math.max(upperTick, currentTick),
  });
  const words = Array.from(
    { length: lastWord - firstWord + 1 },
    (_, index) => firstWord + index,
  );

  const bitmaps = await multicall(client, {
    allowFailure: false,
    // One aggregate3 for the whole set, matching findPools: viem's default
    // byte-size batching would split these across concurrent eth_calls that the
    // keyless public RPC rate-limits.
    batchSize: 0,
    contracts: words.map((word) => ({
      abi: poolAbi,
      address: poolAddress,
      args: [word] as const,
      functionName: "tickBitmap" as const,
    })),
  });

  const ticks = words.flatMap((word, index) =>
    setBits(bitmaps[index]).map(
      (bit) => (word * BITS_PER_WORD + bit) * spacing,
    ),
  );

  const tickData = await multicall(client, {
    allowFailure: false,
    batchSize: 0,
    contracts: ticks.map((tick) => ({
      abi: poolAbi,
      address: poolAddress,
      args: [tick] as const,
      functionName: "ticks" as const,
    })),
  });

  return {
    currentTick,
    initializedTicks: ticks.map(
      (tick, index): TickLiquidity => ({
        liquidityNet: tickData[index][1],
        tick,
      }),
    ),
    liquidity,
    sqrtPriceX96,
  };
};
