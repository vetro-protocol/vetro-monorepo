import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { expect } from "@playwright/test";
import type { Address } from "viem";
import { mainnet } from "viem/chains";
import { balanceOf } from "viem-erc20/actions";

import { knownTokens } from "../src/utils/tokenList.ts";

import type { createEthereumClient } from "./anvil";

export function getMainnetToken(symbol: string) {
  const token = knownTokens.find(
    (t) => t.chainId === mainnet.id && t.symbol === symbol,
  );
  if (!token) {
    throw new Error(`Token ${symbol} not found in tokenList for mainnet`);
  }
  return token;
}

/**
 * Polls the test account's on-chain balance of `token` until the chained matcher
 * passes (or 20s elapses). Returns the expect.poll proxy so the call site keeps
 * the meaningful assertion: `waitForBalance({ client, token }).toBe(x)` / `.toBeGreaterThan(x)`.
 */
export const waitForBalance = ({
  client,
  token,
}: {
  client: ReturnType<typeof createEthereumClient>;
  token: Address;
}) =>
  expect.poll(
    () => balanceOf(client, { account: TEST_ADDRESS, address: token }),
    { timeout: 20_000 },
  );
