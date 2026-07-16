import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createTestClient, http } from "viem";
import { getBlock, increaseTime, mine } from "viem/actions";
import { mainnet } from "viem/chains";

/**
 * Fast-forward the fork by `seconds` and return the fork's new block.timestamp.
 * Uses evm_increaseTime + a single mined block rather than mining one 12s block
 * per second, so it stays instant even for multi-day jumps (e.g. the Earn
 * unstake cooldown, which is a week — mining ~50k blocks would time out the
 * RPC). Useful for stepping past time-locked flows without waiting in real
 * time; returning the actual timestamp lets callers mirror it onto other clocks
 * instead of re-deriving an estimate.
 *
 * @returns The fork's new block.timestamp (unix seconds) after the jump.
 */
export async function fastForwardTime({
  forkUrl,
  seconds,
}: {
  forkUrl: string;
  seconds: number;
}) {
  const testClient = createTestClient({
    chain: mainnet,
    mode: "anvil",
    transport: http(forkUrl),
  });

  await increaseTime(testClient, { seconds });
  await mine(testClient, { blocks: 1 });

  const { timestamp } = await getBlock(testClient);
  return timestamp;
}

// Allow running as a standalone script:
//   node web/scripts/fastForwardTime.ts --fork-url http://127.0.0.1:8545 --seconds 120
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      "fork-url": { short: "f", type: "string" },
      seconds: { short: "s", type: "string" },
    },
    strict: true,
  });

  if (!values.seconds || !/^\d+$/.test(values.seconds)) {
    console.error(
      "Seconds is invalid. Usage: node web/scripts/fastForwardTime.ts --fork-url http://127.0.0.1:8545 --seconds 120",
    );
    process.exit(1);
  }

  if (!values["fork-url"]) {
    console.error(
      "Fork URL is required. Usage: node web/scripts/fastForwardTime.ts --fork-url http://127.0.0.1:8545 --seconds 120",
    );
    process.exit(1);
  }

  const timestamp = await fastForwardTime({
    forkUrl: values["fork-url"],
    seconds: Number(values.seconds),
  });

  console.log(
    `Fast-forwarded ${values.seconds}s on ${values["fork-url"]} (new block.timestamp: ${timestamp}).`,
  );
}
