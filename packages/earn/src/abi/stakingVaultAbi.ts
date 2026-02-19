export const stakingVaultAbi = [
  // StakingVault Specific View Functions
  {
    inputs: [],
    name: "cooldownDuration",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cooldownEnabled",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAssetsInCooldown",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account_", type: "address" }],
    name: "instantWithdrawWhitelist",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account_", type: "address" }],
    name: "getActiveRequestIds",
    outputs: [{ type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account_", type: "address" }],
    name: "getClaimableRequests",
    outputs: [
      { name: "requestIds_", type: "uint256[]" },
      { name: "assets_", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account_", type: "address" }],
    name: "getPendingRequests",
    outputs: [
      { name: "requestIds_", type: "uint256[]" },
      { name: "assets_", type: "uint256[]" },
      { name: "claimableAt_", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "requestId_", type: "uint256" }],
    name: "getRequestDetails",
    outputs: [
      {
        components: [
          { name: "owner", type: "address" },
          { name: "assets", type: "uint256" },
          { name: "claimableAt", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // ERC4626 Write Functions
  {
    inputs: [
      { name: "assets_", type: "uint256" },
      { name: "receiver_", type: "address" },
    ],
    name: "deposit",
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // StakingVault Specific Write Functions
  {
    inputs: [{ name: "requestId_", type: "uint256" }],
    name: "cancelWithdraw",
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "requestId_", type: "uint256" },
      { name: "receiver_", type: "address" },
    ],
    name: "claimWithdraw",
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "requestIds_", type: "uint256[]" },
      { name: "receiver_", type: "address" },
    ],
    name: "claimWithdrawBatch",
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "shares_", type: "uint256" },
      { name: "owner_", type: "address" },
    ],
    name: "requestRedeem",
    outputs: [
      { name: "requestId", type: "uint256" },
      { name: "assets", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "assets_", type: "uint256" },
      { name: "owner_", type: "address" },
    ],
    name: "requestWithdraw",
    outputs: [
      { name: "requestId", type: "uint256" },
      { name: "shares", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "requestId", type: "uint256" },
      { indexed: false, name: "shares", type: "uint256" },
      { indexed: false, name: "assets", type: "uint256" },
      { indexed: false, name: "claimableAt", type: "uint256" },
    ],
    name: "WithdrawRequested",
    type: "event",
  },
] as const;
