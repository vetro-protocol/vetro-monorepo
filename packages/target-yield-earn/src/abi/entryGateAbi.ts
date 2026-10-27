// Not building an entire package just to call this method
export const entryGateAbi = [
  {
    inputs: [
      { name: "vault_", type: "address" },
      { name: "owner_", type: "address" },
    ],
    name: "canEntry",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
