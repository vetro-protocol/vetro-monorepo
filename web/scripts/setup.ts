import { parseArgs } from "node:util";
import { isAddress } from "viem";

import { fundAccount } from "./fundAccount.ts";

const { values } = parseArgs({
  options: {
    address: { short: "a", type: "string" },
    "fork-url": { short: "f", type: "string" },
  },
  strict: true,
});

if (!values.address || !isAddress(values.address, { strict: false })) {
  console.error(
    "Address is invalid. Usage: node web/scripts/setup.ts --address 0xYourAddress",
  );
  process.exit(1);
}

await fundAccount({
  address: values.address,
  forkUrl: values["fork-url"],
});
