import type { Token } from "@vetro-protocol/core";
import {
  type Address,
  encodeAbiParameters,
  keccak256,
  maxUint256,
  toHex,
} from "viem";

const getAddressMappingSlot = ({ key, slot }: { key: Address; slot: bigint }) =>
  keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }],
      [key, slot],
    ),
  );

// The operation requires the user to have enough allowance for gas estimation to succeed,
// but if the user needs to approve some amount (because they currently have no allowance),
// the estimation call will revert due to insufficient allowance.
// This state override lets us update the internal storage view so the user does not have to
// perform an approval transaction before the operation, and thus the gas estimation can be calculated.
export function createErc20AllowanceStateOverride({
  owner,
  spender,
  token,
}: {
  owner: Address | undefined;
  spender: Address;
  token: Token;
}) {
  if (!owner) {
    return [];
  }
  const ownerSlot = getAddressMappingSlot({
    key: owner,
    // 1n is the default allowance slot for ERC20 tokens using OpenZeppelin's implementation
    slot: token.extensions?.allowanceSlot ?? 1n,
  });
  const slot = keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "bytes32" }],
      [spender, ownerSlot],
    ),
  );
  return [
    {
      address: token.address,
      stateDiff: [
        {
          slot,
          value: toHex(maxUint256, { size: 32 }),
        },
      ],
    },
  ];
}

export const createErc20BalanceStateOverride = ({
  balance,
  owner,
  token,
}: {
  balance: bigint;
  owner: Address;
  token: Token;
}) => [
  {
    address: token.address,
    stateDiff: [
      {
        slot: getAddressMappingSlot({
          key: owner,
          // 0 is the default balance slot for ERC20 tokens using OpenZeppelin's implementation
          slot: BigInt(token.extensions?.balanceSlot ?? 0),
        }),
        value: toHex(balance, { size: 32 }),
      },
    ],
  },
];
