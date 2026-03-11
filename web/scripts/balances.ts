import { parseArgs } from "node:util";
import {
  createPublicClient,
  formatEther,
  formatUnits,
  http,
  isAddress,
} from "viem";
import { getBalance } from "viem/actions";
import { mainnet } from "viem/chains";
import { balanceOf } from "viem-erc20/actions";

import { knownTokens } from "../src/utils/tokenList.ts";

const { values } = parseArgs({
  options: {
    address: { short: "a", type: "string" },
    "fork-url": { short: "f", type: "string" },
  },
  strict: true,
});

const forkUrl = values["fork-url"] ?? "http://127.0.0.1:8545";

if (!values.address || !isAddress(values.address, { strict: false })) {
  console.error(
    "Address is invalid. Usage: node web/scripts/balances.ts --address 0xYourAddress",
  );
  process.exit(1);
}

const { address } = values;

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(forkUrl),
});

const nativeBalance = await getBalance(publicClient, { address });
console.log(`ETH: ${formatEther(nativeBalance)}`);

for (const token of knownTokens) {
  const balance = await balanceOf(publicClient, {
    account: address,
    address: token.address,
  });

  console.log(`${token.symbol}: ${formatUnits(balance, token.decimals)}`);
}
