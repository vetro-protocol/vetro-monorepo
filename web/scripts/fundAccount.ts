import {
  type Address,
  createPublicClient,
  createTestClient,
  encodePacked,
  formatEther,
  http,
  keccak256,
  pad,
  parseEther,
  toHex,
} from "viem";
import { getBalance, setBalance, setStorageAt } from "viem/actions";
import { mainnet } from "viem/chains";
import { balanceOf } from "viem-erc20/actions";

import { knownTokens } from "../src/utils/tokenList.ts";

export const defaultSetupSymbols = [
  "cbBTC",
  "frxUSD",
  "hemiBTC",
  "USDC",
  "USDT",
  "vetBTC",
  "VUSD",
  "WBTC",
  "WETH",
];

type FundableToken = {
  address: Address;
  balanceSlot: number;
  decimals: number;
  symbol: string;
};

const getDefaultTokens = (): FundableToken[] =>
  knownTokens
    .filter(
      (t) => t.chainId === mainnet.id && defaultSetupSymbols.includes(t.symbol),
    )
    .map((t) => ({
      address: t.address,
      balanceSlot: t.extensions!.balanceSlot!,
      decimals: t.decimals,
      symbol: t.symbol,
    }));

export async function fundAccount({
  address,
  amount = 100n,
  forkUrl = "http://127.0.0.1:8545",
  tokens = getDefaultTokens(),
}: {
  address: Address;
  amount?: bigint;
  forkUrl?: string;
  tokens?: FundableToken[];
}) {
  const transport = http(forkUrl);

  const publicClient = createPublicClient({ chain: mainnet, transport });
  const testClient = createTestClient({
    chain: mainnet,
    mode: "anvil",
    transport,
  });

  const ethBalanceBefore = await getBalance(publicClient, { address });
  await setBalance(testClient, { address, value: parseEther("1") });
  const ethBalanceAfter = await getBalance(publicClient, { address });
  console.log(
    `ETH: ${formatEther(ethBalanceBefore)} -> ${formatEther(ethBalanceAfter)}`,
  );

  for (const token of tokens) {
    const balanceBefore = await balanceOf(publicClient, {
      account: address,
      address: token.address,
    });

    const value = amount * 10n ** BigInt(token.decimals);

    const storageKey = keccak256(
      encodePacked(
        ["bytes32", "bytes32"],
        [pad(address), pad(toHex(token.balanceSlot))],
      ),
    );

    await setStorageAt(testClient, {
      address: token.address,
      index: storageKey,
      value: pad(toHex(value)),
    });

    const balanceAfter = await balanceOf(publicClient, {
      account: address,
      address: token.address,
    });

    console.log(
      `${token.symbol}: ${balanceBefore} -> ${balanceAfter} (${amount} tokens)`,
    );
  }
}
