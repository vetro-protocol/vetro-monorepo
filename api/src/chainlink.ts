import { type Address, type PublicClient } from "viem";

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
] as const;

const getDecimals = (client: PublicClient, address: Address) =>
  client.readContract({
    abi: aggregatorV3Abi,
    address,
    functionName: "decimals",
  });

const getLatestAnswer = (client: PublicClient, address: Address) =>
  client.readContract({
    abi: aggregatorV3Abi,
    address,
    functionName: "latestAnswer",
  });

export const getPrice = (client: PublicClient, address: Address) =>
  Promise.all([getLatestAnswer(client, address), getDecimals(client, address)]);
