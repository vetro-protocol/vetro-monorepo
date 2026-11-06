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
    name: "latestAnswer",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
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

const getLatestAnswer = (client: Client, address: Address) =>
  readContract(client, {
    abi: aggregatorV3Abi,
    address,
    functionName: "latestAnswer",
  });

export const getPrice = (client: Client, address: Address) =>
  Promise.all([getLatestAnswer(client, address), getDecimals(client, address)]);

/**
 * Read the price like the Treasury's `reserve()` does: it only checks that the
 * price is fresh, and not that it is close to par, so a depegged token doesn't
 * make the read fail. Throws if the last update is older than `stalePeriod`
 * seconds, or if the price is not positive.
 */
export async function getFreshPrice({
  address,
  client,
  stalePeriod,
}: {
  address: Address;
  client: Client;
  stalePeriod: bigint;
}) {
  const [[, answer, , updatedAt], priceDecimals] = await Promise.all([
    readContract(client, {
      abi: aggregatorV3Abi,
      address,
      functionName: "latestRoundData",
    }),
    getDecimals(client, address),
  ]);
  if (answer <= 0n) {
    throw new Error(`Invalid oracle price from ${address}`);
  }
  if (updatedAt + stalePeriod < BigInt(Math.floor(Date.now() / 1000))) {
    throw new Error(`Stale oracle price from ${address}`);
  }
  return { decimals: priceDecimals, price: answer };
}
