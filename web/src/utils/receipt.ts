import {
  type Address,
  erc20Abi,
  isAddressEqual,
  type Log,
  parseEventLogs,
} from "viem";

/**
 * Reads the amount received by `account` from a transaction's logs, taken from
 * the first ERC-20 Transfer event whose recipient is `account`, optionally
 * emitted by `token` only. Returns undefined when no such transfer is present,
 * letting callers fall back to their own estimate (e.g. the preview).
 */
export function getReceivedAmount({
  account,
  logs,
  token,
}: {
  account: Address;
  logs: Log[];
  token?: Address;
}) {
  const transferLogs = parseEventLogs({
    abi: erc20Abi,
    eventName: "Transfer",
    logs,
  });
  return transferLogs.find(
    (log) =>
      isAddressEqual(log.args.to, account) &&
      (token === undefined || isAddressEqual(log.address, token)),
  )?.args.value;
}
