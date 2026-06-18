import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createTestClient, http } from "viem";
import { getBlock, mine } from "viem/actions";
import { mainnet } from "viem/chains";

// Mainnet's ~12s block time. Each mined block advances the fork's
// block.timestamp by this many seconds.
const SECONDS_PER_BLOCK = 12;

// Fast-forward the fork by at least `seconds` (mining enough 12s blocks to cover
// it, always at least one) and return the fork's new block.timestamp. Useful for
// stepping past time-locked gateway flows (e.g. the withdrawal delay on a
// two-step redeem) without waiting in real time. Returning the actual timestamp
// lets callers mirror it onto other clocks instead of re-deriving an estimate.
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

  const blocks = Math.max(1, Math.ceil(seconds / SECONDS_PER_BLOCK));
  await mine(testClient, { blocks, interval: SECONDS_PER_BLOCK });

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
