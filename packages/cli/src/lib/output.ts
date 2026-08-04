import { type Address, type Hex, numberToHex } from "viem";

export function printResult(value: unknown) {
  const json = JSON.stringify(value ?? null, (_key, val) =>
    typeof val === "bigint" ? val.toString() : val,
  );
  process.stdout.write(`${json}\n`);
}

export function printTransactionRequest({
  chainId,
  data,
  to,
}: {
  chainId: number;
  data: Hex;
  to: Address;
}) {
  printResult({
    chainId: numberToHex(chainId),
    data,
    to,
    value: "0x0",
  });
}

/**
 * Redacts option values from a usage error, which commander reports before the
 * endpoint is ever resolved. Only the quoted forms are replaced: the value is
 * whatever was typed, so a bare replace would rewrite the message around it.
 */
export const redactOptionValues = ({
  message,
  values,
}: {
  message: string;
  values: (string | undefined)[];
}) =>
  values.reduce<string>(
    (redacted, value) =>
      value
        ? redacted
            .replaceAll(`'${value}'`, "'[redacted]'")
            .replaceAll(`"${value}"`, '"[redacted]"')
        : redacted,
    message,
  );

export function printError({
  error,
  rpcUrl,
}: {
  error: unknown;
  rpcUrl?: string;
}) {
  const message = error instanceof Error ? error.message : String(error);
  const redacted = rpcUrl ? message.replaceAll(rpcUrl, "[redacted]") : message;
  process.stderr.write(`${JSON.stringify({ error: redacted })}\n`);
  process.exitCode = 1;
}
