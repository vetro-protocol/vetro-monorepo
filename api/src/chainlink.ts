import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

const aggregatorV3Abi = [
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const getDecimals = (client: Client, address: Address) =>
  readContract(client, {
    abi: aggregatorV3Abi,
    address,
    functionName: "decimals",
  });

/**
 * Read the oracle's latest price along with when it was last updated. It never
 * judges the price, so callers decide what to do with a stale, non-positive or
 * depegged one.
 */
export async function getLatestPrice({
  address,
  client,
}: {
  address: Address;
  client: Client;
}) {
  const [[, price, , updatedAt], decimals] = await Promise.all([
    readContract(client, {
      abi: aggregatorV3Abi,
      address,
      functionName: "latestRoundData",
    }),
    getDecimals(client, address),
  ]);
  return { decimals, price, updatedAt };
}
