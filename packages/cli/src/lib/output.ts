export function printResult(value: unknown) {
  const json = JSON.stringify(value ?? null, (_key, val) =>
    typeof val === "bigint" ? val.toString() : val,
  );
  process.stdout.write(`${json}\n`);
}

function sanitize(message: string) {
  let sanitized = message;
  // TODO extend custom RPC https://github.com/vetro-protocol/vetro-monorepo/issues/445#issuecomment-5062771972
  const rpcUrl = process.env.RPC_URL;
  if (rpcUrl) {
    sanitized = sanitized.replaceAll(rpcUrl, "[redacted]");
  }
  return sanitized;
}

export function printError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${JSON.stringify({ error: sanitize(message) })}\n`);
  process.exitCode = 1;
}
