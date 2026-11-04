export const veVetroDistributorAbi = [
  {
    inputs: [],
    name: "config",
    outputs: [
      {
        components: [
          { name: "snapshotTimestamp", type: "uint64" },
          { name: "claimEnd", type: "uint64" },
          { name: "unlockTimestamp", type: "uint64" },
          { name: "mintNonTransferable", type: "bool" },
          { name: "splitByType", type: "bool" },
          { name: "requireTermsSignature", type: "bool" },
          { name: "totalAllocation", type: "uint128" },
          { name: "regularBps", type: "uint16" },
          { name: "lockedBps", type: "uint16" },
          { name: "forfeitableBps", type: "uint16" },
          { name: "shortfallAllowance", type: "uint128" },
          { name: "expectedTotalAtSnapshot", type: "uint128" },
          { name: "termsHash", type: "bytes32" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isClaimOpen",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "claimant", type: "address" },
      { name: "recipient", type: "address" },
      { name: "signature", type: "bytes" },
    ],
    name: "verifyTermsSignature",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
