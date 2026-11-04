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
] as const;
