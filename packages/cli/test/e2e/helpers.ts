import {
  TEST_ADDRESS,
  TEST_PRIVATE_KEY,
} from "@hemilabs/anvil-fork-setup/utils";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  type Address,
  type Hex,
  createPublicClient,
  createTestClient,
  createWalletClient,
  encodePacked,
  hexToBigInt,
  http,
  keccak256,
  pad,
  parseEther,
  parseUnits,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  sendTransaction,
  setBalance,
  setStorageAt,
  waitForTransactionReceipt,
} from "viem/actions";
import { mainnet } from "viem/chains";

const execFileAsync = promisify(execFile);

// The bundled bin is what actually ships, so the tests drive that rather than src.
const cliPath = fileURLToPath(new URL("../../_esm/cli.js", import.meta.url));

export const usdc = {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  // Slot of the `balances` mapping in the mainnet USDC contract.
  balanceSlot: 9,
  decimals: 6,
  symbol: "USDC",
} as const;

export const vusd = {
  address: "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3",
  decimals: 18,
  symbol: "VUSD",
} as const;

export type TransactionRequest = {
  chainId: Hex;
  data: Hex;
  to: Address;
  value: Hex;
};

export const runCliRaw = ({
  args,
  rpcUrl,
}: {
  args: string[];
  rpcUrl: string;
}) =>
  execFileAsync(process.execPath, [cliPath, ...args], {
    env: { ...process.env, RPC_URL: rpcUrl },
  }).then(
    ({ stderr, stdout }) => ({ exitCode: 0, stderr, stdout }),
    (error: { code: number; stderr: string; stdout: string }) => ({
      exitCode: error.code,
      stderr: error.stderr,
      stdout: error.stdout,
    }),
  );

export const runCli = async function <T = string>({
  args,
  rpcUrl,
}: {
  args: string[];
  rpcUrl: string;
}) {
  const { exitCode, stderr, stdout } = await runCliRaw({ args, rpcUrl });
  if (exitCode !== 0) {
    throw new Error(
      `vetro-cli ${args.join(" ")} exited ${exitCode}: ${stderr}`,
    );
  }
  return JSON.parse(stdout) as T;
};

export const createClients = function (rpcUrl: string) {
  const transport = http(rpcUrl);
  return {
    publicClient: createPublicClient({ chain: mainnet, transport }),
    testClient: createTestClient({ chain: mainnet, mode: "anvil", transport }),
    walletClient: createWalletClient({
      account: privateKeyToAccount(TEST_PRIVATE_KEY),
      chain: mainnet,
      transport,
    }),
  };
};

export const fundTestAccount = async function ({
  amount,
  rpcUrl,
}: {
  amount: string;
  rpcUrl: string;
}) {
  const { testClient } = createClients(rpcUrl);
  await setBalance(testClient, {
    address: TEST_ADDRESS,
    value: parseEther("10"),
  });
  await setStorageAt(testClient, {
    address: usdc.address,
    index: keccak256(
      encodePacked(
        ["bytes32", "bytes32"],
        [pad(TEST_ADDRESS), pad(toHex(usdc.balanceSlot))],
      ),
    ),
    value: pad(toHex(parseUnits(amount, usdc.decimals))),
  });
};

/** Broadcasts a TransactionRequest the CLI emitted, exactly as an agent would. */
export const sendTransactionRequest = async function ({
  request,
  rpcUrl,
}: {
  request: TransactionRequest;
  rpcUrl: string;
}) {
  const { publicClient, walletClient } = createClients(rpcUrl);
  const hash = await sendTransaction(walletClient, {
    data: request.data,
    to: request.to,
    value: hexToBigInt(request.value),
  });
  return waitForTransactionReceipt(publicClient, { hash });
};
