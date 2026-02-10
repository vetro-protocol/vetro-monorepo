import type { Token } from "types";
import {
  type Address,
  encodeAbiParameters,
  keccak256,
  maxUint256,
  toHex,
} from "viem";

// The operation requires the user to have enough allowance for gas estimation to succeed,
// but if the user needs to approve some amount (because they currently have no allowance),
// the estimation call will revert due to insufficient allowance.
// This state override lets us update the internal storage view so the user does not have to
// perform an approval transaction before the operation, and thus the gas estimation can be calculated.
// Thanks, Claude!
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
  const ownerSlot = keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }],
      // 1n is the default allowance slot for ERC20 tokens using OpenZeppelin's implementation
      [owner, token.extensions?.allowanceSlot ?? 1n],
    ),
  );
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
