import { type Address, type PublicClient } from "viem";

// Gateway
const gatewayAddress = "0xDaD503f8B9d42bb7af3AfC588358D30163e4416F";

const gatewayAbi = [
  {
    inputs: [],
    name: "treasury",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

export const getTreasury = (client: PublicClient) =>
  client.readContract({
    abi: gatewayAbi,
    address: gatewayAddress,
    functionName: "treasury",
  }) as Promise<Address>;

// PeggedToken
export const vusdAddress = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3";

// StakedVault
export const sVusdAddress = "0x476310E34D2810f7d79C43A74E4D79405bd7a925";

// Treasury
const treasuryAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "token_",
        type: "address",
      },
    ],
    name: "getPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "_latestPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_unitPrice",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "tokenConfig",
    outputs: [
      {
        internalType: "address",
        name: "vault",
        type: "address",
      },
      {
        internalType: "address",
        name: "oracle",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "stalePeriod",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "depositActive",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "withdrawActive",
        type: "bool",
      },
      {
        internalType: "uint8",
        name: "decimals",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "whitelistedTokens",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token_",
        type: "address",
      },
    ],
    name: "withdrawable",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const getPrice = (
  client: PublicClient,
  address: Address,
  token_: Address,
) =>
  client.readContract({
    abi: treasuryAbi,
    address,
    args: [token_],
    functionName: "getPrice",
  }) as Promise<bigint[]>;

export const getTokenConfig = (
  client: PublicClient,
  address: Address,
  token: Address,
) =>
  client.readContract({
    abi: treasuryAbi,
    address,
    args: [token],
    functionName: "tokenConfig",
  }) as Promise<[Address, Address, bigint, boolean, boolean, number]>;

export const getWithdrawable = (
  client: PublicClient,
  address: Address,
  token_: Address,
) =>
  client.readContract({
    abi: treasuryAbi,
    address,
    args: [token_],
    functionName: "withdrawable",
  }) as Promise<bigint>;

export const getWhitelistedTokens = (client: PublicClient, address: Address) =>
  client.readContract({
    abi: treasuryAbi,
    address,
    functionName: "whitelistedTokens",
  }) as Promise<Address[]>;
