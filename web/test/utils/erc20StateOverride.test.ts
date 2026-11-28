import type { Token } from "@vetro-protocol/core";
import {
  type Address,
  encodeAbiParameters,
  keccak256,
  maxUint256,
  toHex,
} from "viem";
import { describe, expect, it } from "vitest";

import { createErc20SpendStateOverride } from "../../src/utils/erc20StateOverride";

const owner: Address = "0x1111111111111111111111111111111111111111";
const spender: Address = "0x2222222222222222222222222222222222222222";
const token = {
  address: "0x3333333333333333333333333333333333333333",
  chainId: 1,
  decimals: 18,
  extensions: { allowanceSlot: 4n, balanceSlot: 3n },
  logoURI: "",
  name: "Token",
  symbol: "TKN",
} as Token;

const mappingSlot = (key: Address, slot: bigint) =>
  keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }],
      [key, slot],
    ),
  );

const allowanceDiff = {
  slot: keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "bytes32" }],
      [spender, mappingSlot(owner, 4n)],
    ),
  ),
  value: toHex(maxUint256, { size: 32 }),
};

describe("createErc20SpendStateOverride", function () {
  it("overrides only the allowance when the balance covers the amount", function () {
    expect(
      createErc20SpendStateOverride({
        amount: 100n,
        balance: 100n,
        owner,
        spender,
        token,
      }),
    ).toEqual([{ address: token.address, stateDiff: [allowanceDiff] }]);
  });

  it("also sets the balance to the amount when the balance is lower", function () {
    expect(
      createErc20SpendStateOverride({
        amount: 100n,
        balance: 50n,
        owner,
        spender,
        token,
      }),
    ).toEqual([
      {
        address: token.address,
        stateDiff: [
          allowanceDiff,
          { slot: mappingSlot(owner, 3n), value: toHex(100n, { size: 32 }) },
        ],
      },
    ]);
  });
});
