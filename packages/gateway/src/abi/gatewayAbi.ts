export const gatewayAbi = [
  {
    type: 'function',
    name: 'PEGGED_TOKEN',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'mintFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'redeemFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'previewDeposit',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenIn_', type: 'address' },
      { name: 'amountIn_', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'previewRedeem',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenOut_', type: 'address' },
      { name: 'peggedTokenIn_', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn_', type: 'address' },
      { name: 'amountIn_', type: 'uint256' },
      { name: 'minPeggedTokenOut_', type: 'uint256' },
      { name: 'receiver_', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'redeem',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenOut_', type: 'address' },
      { name: 'peggedTokenIn_', type: 'uint256' },
      { name: 'minAmountOut_', type: 'uint256' },
      { name: 'receiver_', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const
