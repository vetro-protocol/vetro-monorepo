import {
  type Address,
  type Hash,
  encodeAbiParameters,
  keccak256,
  toHex,
} from "viem";

// Position mapping base slot in MorphoStorage.sol
const POSITION_SLOT = 2n;

// The borrow operation requires the user to have enough collateral for gas estimation
// to succeed, but if the user hasn't supplied collateral yet, the estimation call will
// revert due to insufficient collateral. This state override lets us set the collateral
// in Morpho's internal storage so the gas estimation can be calculated.
export function createMorphoCollateralStateOverride({
  collateralAmount,
  marketId,
  morphoAddress,
  user,
}: {
  collateralAmount: bigint;
  marketId: Hash;
  morphoAddress: Address;
  user: Address | undefined;
}) {
  if (!user) {
    return [];
  }
  // position mapping: mapping(Id => mapping(address => Position))
  const level1Slot = keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "uint256" }],
      [marketId, POSITION_SLOT],
    ),
  );
  const level2Slot = keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "bytes32" }],
      [user, level1Slot],
    ),
  );
  // supplyShares is uint256 (full slot 0)
  // borrowShares (uint128) + collateral (uint128) are packed in slot 1
  // collateral occupies the upper 128 bits
  const packedSlot = toHex(BigInt(level2Slot) + 1n, { size: 32 });
  return [
    {
      address: morphoAddress,
      stateDiff: [
        {
          slot: packedSlot,
          value: toHex(collateralAmount << 128n, { size: 32 }),
        },
      ],
    },
  ];
}
