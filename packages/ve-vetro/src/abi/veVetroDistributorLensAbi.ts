export const veVetroDistributorLensAbi = [
  {
    inputs: [
      { name: "claimant", type: "address" },
      { name: "tokenIds", type: "uint256[]" },
    ],
    name: "claimableSubset",
    outputs: [
      { name: "ids", type: "uint256[]" },
      { name: "amount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "holder", type: "address" },
      { name: "fromId", type: "uint256" },
      { name: "toIdExclusive", type: "uint256" },
    ],
    name: "idsOfRecord",
    outputs: [
      { name: "ids", type: "uint256[]" },
      { name: "nextId", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
