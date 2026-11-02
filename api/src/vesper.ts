import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

// ERC4626Vault
// See https://github.com/vesperfi/vesper-strategies/blob/main/contracts/strategies/ERC4626Vault.sol

const vesperErc4626VaultAbi = [
  {
    inputs: [],
    name: "NAME",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "receiptToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const getReceiptToken = (
  client: Client,
  { address }: { address: Address },
) =>
  readContract(client, {
    abi: vesperErc4626VaultAbi,
    address,
    functionName: "receiptToken",
  }) as Promise<Address>;

export const getVaultName = (
  client: Client,
  { address }: { address: Address },
) =>
  readContract(client, {
    abi: vesperErc4626VaultAbi,
    address,
    functionName: "NAME",
  }) as Promise<string>;

// WhitelistedYieldVault
// See https://github.com/vesperfi/yield-vault/blob/main/src/WhitelistedYieldVault.sol

const whitelistedYieldVaultAbi = [
  {
    inputs: [],
    name: "getStrategies",
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
        name: "strategy_",
        type: "address",
      },
    ],
    name: "getStrategyConfig",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "active",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "totalDebt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalLoss",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalProfit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "debtRatio",
            type: "uint256",
          },
        ],
        internalType: "struct YieldVault.StrategyConfig",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDebt",
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

export const getStrategies = (
  client: Client,
  { address }: { address: Address },
) =>
  readContract(client, {
    abi: whitelistedYieldVaultAbi,
    address,
    functionName: "getStrategies",
  }) as Promise<Address[]>;

export const getStrategyConfig = (
  client: Client,
  { address, strategy }: { address: Address; strategy: Address },
) =>
  readContract(client, {
    abi: whitelistedYieldVaultAbi,
    address,
    args: [strategy],
    functionName: "getStrategyConfig",
  }) as Promise<{
    active: boolean;
    totalDebt: bigint;
    totalLoss: bigint;
    totalProfit: bigint;
    debtRatio: bigint;
  }>;

export const getTotalDebt = (
  client: Client,
  { address }: { address: Address },
) =>
  readContract(client, {
    abi: whitelistedYieldVaultAbi,
    address,
    functionName: "totalDebt",
  }) as Promise<bigint>;
