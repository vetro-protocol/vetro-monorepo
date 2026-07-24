import {
  type Address,
  encodeAbiParameters,
  encodeEventTopics,
  erc20Abi,
  type Log,
  zeroAddress,
} from "viem";
import { describe, expect, it } from "vitest";

import { getReceivedAmount } from "./receipt";

const account: Address = "0x1111111111111111111111111111111111111111";
const other: Address = "0x2222222222222222222222222222222222222222";
const token: Address = "0x3333333333333333333333333333333333333333";

const transferLog = ({
  from,
  to,
  value,
}: {
  from: Address;
  to: Address;
  value: bigint;
}) =>
  ({
    address: token,
    blockHash: `0x${"0".repeat(64)}`,
    blockNumber: 1n,
    data: encodeAbiParameters([{ type: "uint256" }], [value]),
    logIndex: 0,
    removed: false,
    topics: encodeEventTopics({
      abi: erc20Abi,
      args: { from, to },
      eventName: "Transfer",
    }),
    transactionHash: `0x${"0".repeat(64)}`,
    transactionIndex: 0,
  }) as Log;

describe("getReceivedAmount", function () {
  it("returns the value of the transfer to the account", function () {
    const logs = [transferLog({ from: zeroAddress, to: account, value: 500n })];
    expect(getReceivedAmount({ account, logs })).toBe(500n);
  });

  it("ignores transfers to other recipients", function () {
    const logs = [
      transferLog({ from: account, to: other, value: 999n }),
      transferLog({ from: zeroAddress, to: account, value: 500n }),
    ];
    expect(getReceivedAmount({ account, logs })).toBe(500n);
  });

  it("returns undefined when no transfer targets the account", function () {
    const logs = [transferLog({ from: account, to: other, value: 999n })];
    expect(getReceivedAmount({ account, logs })).toBeUndefined();
  });

  it("returns undefined when there are no logs", function () {
    expect(getReceivedAmount({ account, logs: [] })).toBeUndefined();
  });
});
