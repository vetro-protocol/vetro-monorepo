import {
  type Address,
  erc20Abi,
  isAddressEqual,
  type Log,
  parseEventLogs,
} from "viem";

/**
 * Reads the amount received by `account` from a transaction's logs, taken from
 * the first ERC-20 Transfer event whose recipient is `account`. Returns
 * undefined when no such transfer is present, letting callers fall back to
 * their own estimate (e.g. the preview).
 */
export function getReceivedAmount({
  account,
  logs,
}: {
  account: Address;
  logs: Log[];
}) {
  const transferLogs = parseEventLogs({
    abi: erc20Abi,
    eventName: "Transfer",
    logs,
  });
  return transferLogs.find((log) => isAddressEqual(log.args.to, account))?.args
    .value;
}
