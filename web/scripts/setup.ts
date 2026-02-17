import { parseArgs } from "node:util";
import {
  createPublicClient,
  createTestClient,
  erc20Abi,
  encodePacked,
  formatEther,
  http,
  isAddress,
  keccak256,
  pad,
  parseEther,
  toHex,
} from "viem";
import { mainnet } from "viem/chains";

const tokens = [
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    balanceSlot: 9,
    decimals: 6,
    symbol: "USDC",
  },
  {
    address: "0xB94724aa74A0296447D13a63A35B050b7F137C6d",
    balanceSlot: 0,
    decimals: 18,
    symbol: "TestUSD",
  },
  {
    address: "0x677ddbd918637E5F2c79e164D402454dE7dA8619",
    balanceSlot: 0,
    decimals: 18,
    symbol: "VUSD",
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    balanceSlot: 2,
    decimals: 6,
    symbol: "USDT",
  },
] as const;

const amount = 100n;

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
    "Address is invalid. Usage: node web/scripts/setup.ts --address 0xYourAddress",
  );
  process.exit(1);
}

const { address } = values;

const transport = http(forkUrl);

const publicClient = createPublicClient({
  chain: mainnet,
  transport,
});

const testClient = createTestClient({
  chain: mainnet,
  mode: "anvil",
  transport,
});

// Fund 1 ETH for gas
const ethBalanceBefore = await publicClient.getBalance({ address });
await testClient.setBalance({ address, value: parseEther("1") });
const ethBalanceAfter = await publicClient.getBalance({ address });
console.log(
  `ETH: ${formatEther(ethBalanceBefore)} -> ${formatEther(ethBalanceAfter)}`,
);

for (const token of tokens) {
  const balanceBefore = await publicClient.readContract({
    abi: erc20Abi,
    address: token.address,
    args: [address],
    functionName: "balanceOf",
  });

  const value = amount * 10n ** BigInt(token.decimals);

  // keccak256(abi.encode(address, slot)) - standard Solidity mapping layout
  const storageKey = keccak256(
    encodePacked(
      ["bytes32", "bytes32"],
      [pad(address), pad(toHex(token.balanceSlot))],
    ),
  );

  await testClient.setStorageAt({
    address: token.address,
    index: storageKey,
    value: pad(toHex(value)),
  });

  const balanceAfter = await publicClient.readContract({
    abi: erc20Abi,
    address: token.address,
    args: [address],
    functionName: "balanceOf",
  });

  console.log(
    `${token.symbol}: ${balanceBefore} -> ${balanceAfter} (${amount} tokens)`,
  );
}
