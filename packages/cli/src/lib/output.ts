export function printResult(value: unknown) {
  const json = JSON.stringify(value ?? null, (_key, val) =>
    typeof val === "bigint" ? val.toString() : val,
  );
  process.stdout.write(`${json}\n`);
}

export function printError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${JSON.stringify({ error: message })}\n`);
  process.exitCode = 1;
}
