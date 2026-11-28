import {
  TEST_ADDRESS,
  TEST_PRIVATE_KEY,
} from "@hemilabs/anvil-fork-setup/utils";
import { blueAbi, blueOracleAbi } from "@morpho-org/blue-sdk-viem";
import { stakingVaultAbi } from "@vetro-protocol/earn";
import { gatewayAbi as vetroGatewayAbi } from "@vetro-protocol/gateway";
import {
  getMaxMint,
  getMintFee,
  getTreasury,
  getWithdrawalDelayEnabled,
  isInstantRedeemWhitelisted,
} from "@vetro-protocol/gateway/actions";
import { morphoBlueAddress } from "@vetro-protocol/morpho-blue-market";
import { getKeeperRole } from "@vetro-protocol/treasury/actions";
import { type Command, CommanderError } from "commander";
import {
  type Address,
  type Client,
  type Hash,
  type Hex,
  createPublicClient,
  createTestClient,
  createWalletClient,
  encodePacked,
  formatUnits,
  hexToBigInt,
  http,
  isAddressEqual,
  keccak256,
  maxUint256,
  pad,
  parseAbi,
  parseEther,
  parseEventLogs,
  parseUnits,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  getBlock,
  impersonateAccount,
  increaseTime,
  mine,
  readContract,
  revert,
  sendTransaction,
  setBalance,
  setNextBlockTimestamp,
  setStorageAt,
  snapshot,
  stopImpersonatingAccount,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";
import { approve } from "viem-erc20/actions";
import { deposit } from "viem-erc4626/actions";
import {
  defaultAdmin,
  grantRole,
  hasRole,
} from "viem-oz-access-control/actions";

import { type GlobalOptions } from "../../src/lib/client.ts";
import { printError } from "../../src/lib/output.ts";
import { createProgram } from "../../src/program.ts";

export const hemiBtc = {
  address: "0x06ea695B91700071B161A434fED42D1DcbAD9f00",
  balanceSlot: 5,
  decimals: 8,
  symbol: "hemiBTC",
} as const;

export const usdc = {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  // Slot of the `balances` mapping in the mainnet USDC contract.
  balanceSlot: 9,
  decimals: 6,
  symbol: "USDC",
} as const;

export const vetBtc = {
  address: "0xf196C68233464A16CFDa319a47c21f4cECa62001",
  balanceSlot: 0,
  decimals: 18,
  symbol: "vetBTC",
} as const;

export const vusd = {
  address: "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3",
  balanceSlot: 0,
  decimals: 18,
  symbol: "VUSD",
} as const;

export const weth = {
  address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  balanceSlot: 3,
  decimals: 18,
  symbol: "WETH",
} as const;

export type TransactionRequest = {
  chainId: Hex;
  data: Hex;
  to: Address;
  value: Hex;
};

export type RedeemRequest = {
  amountLocked: string;
  claimableAt: string;
  status: "cooldown" | "none" | "ready";
};

export const depositAbi = parseAbi([
  "function deposit(address tokenIn, uint256 amountIn, uint256 minPeggedTokenOut, address receiver)",
]);

export const redeemAbi = parseAbi([
  "function redeem(address tokenOut, uint256 peggedTokenIn, uint256 minAmountOut, address receiver)",
]);

export const requestRedeemAbi = parseAbi([
  "function requestRedeem(uint256 peggedTokenAmount)",
]);

export const withdrawClaimedAbi = parseAbi([
  "event WithdrawClaimed(address indexed owner, address indexed receiver, uint256 indexed requestId, uint256 assets)",
]);

export const swapAmount = "100";
export const slippage = "0.5";

export const mintArgs = (extra: string[] = []) => [
  "swap",
  "mint",
  "--from",
  usdc.symbol,
  "--amount",
  swapAmount,
  "--receiver",
  TEST_ADDRESS,
  ...extra,
];

export const sendToQueueArgs = (extra: string[] = []) => [
  "swap",
  "send-to-queue",
  "--from",
  vusd.symbol,
  "--amount",
  swapAmount,
  ...extra,
];

export const redeemArgs = (extra: string[] = []) => [
  "swap",
  "redeem",
  "--to",
  usdc.symbol,
  "--amount",
  swapAmount,
  "--receiver",
  TEST_ADDRESS,
  ...extra,
];

export const requestArgs = (extra: string[] = []) => [
  "swap",
  "request",
  ...extra,
];

export const cancelRedeemArgs = (extra: string[] = []) => [
  "swap",
  "cancel-redeem",
  ...extra,
];

export const approveArgs = ({
  extra = [],
  token,
}: {
  extra?: string[];
  token: string;
}) => ["swap", "approve", "--token", token, "--amount", swapAmount, ...extra];

const captureStream = function (stream: NodeJS.WriteStream) {
  const chunks: string[] = [];
  const original = stream.write;
  stream.write = function (chunk: unknown) {
    chunks.push(String(chunk));
    return true;
  } as NodeJS.WriteStream["write"];
  return {
    read: () => chunks.join(""),
    restore() {
      stream.write = original;
    },
  };
};

// Commander copies these to subcommands as they are created, so the root alone
// would still let a subcommand call process.exit and take the test run with it.
const withExitOverride = function (command: Command) {
  command.exitOverride();
  command.commands.forEach(withExitOverride);
  return command;
};

/**
 * Runs the CLI in this process, mirroring how `src/cli.ts` reports failures:
 * commander prints its own usage errors, anything else goes through
 * `printError`. Driving `createProgram` in this process, rather than spawning
 * the bundled bin, is what lets coverage see these runs.
 */
export const runCliRaw = async function (args: string[]) {
  const stdout = captureStream(process.stdout);
  const stderr = captureStream(process.stderr);
  const previousExitCode = process.exitCode;

  process.exitCode = 0;

  const program = withExitOverride(createProgram());

  try {
    await program.parseAsync(args, { from: "user" });
  } catch (error) {
    if (error instanceof CommanderError) {
      process.exitCode = error.exitCode;
    } else {
      printError({ error, rpcUrl: program.opts<GlobalOptions>().rpcUrl });
    }
  } finally {
    stdout.restore();
    stderr.restore();
  }

  const exitCode = process.exitCode ?? 0;
  // Leaving this set would fail the vitest run itself.
  process.exitCode = previousExitCode;

  return { exitCode, stderr: stderr.read(), stdout: stdout.read() };
};

export const runCli = async function <T = string>(args: string[]) {
  const { exitCode, stderr, stdout } = await runCliRaw(args);
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

export const fastForward = async function ({
  rpcUrl,
  seconds,
}: {
  rpcUrl: string;
  seconds: bigint;
}) {
  const { testClient } = createClients(rpcUrl);
  await increaseTime(testClient, { seconds: Number(seconds) });
  await mine(testClient, { blocks: 1 });
};

export const withSnapshot = async function ({
  rpcUrl,
  run,
}: {
  rpcUrl: string;
  run: () => Promise<void>;
}) {
  const { testClient } = createClients(rpcUrl);
  const id = await snapshot(testClient);
  try {
    await run();
  } finally {
    await revert(testClient, { id });
  }
};

export const fundTestAccount = async function ({
  amount,
  rpcUrl,
  token = usdc,
}: {
  amount: string;
  rpcUrl: string;
  token?: { address: Address; balanceSlot: number; decimals: number };
}) {
  const { testClient } = createClients(rpcUrl);
  await setBalance(testClient, {
    address: TEST_ADDRESS,
    value: parseEther("10"),
  });
  await setStorageAt(testClient, {
    address: token.address,
    index: keccak256(
      encodePacked(
        ["bytes32", "bytes32"],
        [pad(TEST_ADDRESS), pad(toHex(token.balanceSlot))],
      ),
    ),
    value: pad(toHex(parseUnits(amount, token.decimals))),
  });
};

export const setMaxMint = async function ({
  gateway,
  maxMint,
  rpcUrl,
}: {
  gateway: Address;
  maxMint: bigint;
  rpcUrl: string;
}) {
  const { publicClient, testClient } = createClients(rpcUrl);

  const [owner, mintLimit, maxMintBefore] = await Promise.all([
    readContract(publicClient, {
      abi: vetroGatewayAbi,
      address: gateway,
      functionName: "owner",
    }),
    readContract(publicClient, {
      abi: vetroGatewayAbi,
      address: gateway,
      functionName: "mintLimit",
    }),
    getMaxMint(publicClient, { address: gateway }),
  ]);

  await impersonateAccount(testClient, { address: owner });
  await setBalance(testClient, { address: owner, value: parseEther("1") });

  try {
    const hash = await writeContract(testClient, {
      abi: vetroGatewayAbi,
      account: owner,
      address: gateway,
      args: [mintLimit - maxMintBefore + maxMint],
      functionName: "updateMintLimit",
    });
    await waitForTransactionReceipt(publicClient, { hash });
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }

  const maxMintAfter = await getMaxMint(publicClient, { address: gateway });

  return { maxMintAfter, maxMintBefore };
};

export const setMintFee = async function ({
  gateway,
  mintFee,
  rpcUrl,
  token,
}: {
  gateway: Address;
  mintFee: bigint;
  rpcUrl: string;
  token: Address;
}) {
  const { publicClient, testClient } = createClients(rpcUrl);

  const [mintFeeBefore, owner] = await Promise.all([
    getMintFee(publicClient, { address: gateway, token }),
    readContract(publicClient, {
      abi: vetroGatewayAbi,
      address: gateway,
      functionName: "owner",
    }),
  ]);

  await impersonateAccount(testClient, { address: owner });
  await setBalance(testClient, { address: owner, value: parseEther("1") });

  try {
    const hash = await writeContract(testClient, {
      abi: vetroGatewayAbi,
      account: owner,
      address: gateway,
      args: [token, mintFee],
      functionName: "updateMintFee",
    });
    await waitForTransactionReceipt(publicClient, { hash });
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }

  const mintFeeAfter = await getMintFee(publicClient, {
    address: gateway,
    token,
  });

  return { mintFeeAfter, mintFeeBefore };
};

export const confirmWrite = async function ({
  client,
  hash,
}: {
  client: Client;
  hash: Hex;
}) {
  const { status } = await waitForTransactionReceipt(client, { hash });
  if (status !== "success") {
    throw new Error("write reverted");
  }
};

export const stake = async function ({
  amount,
  rpcUrl,
  token,
  vault,
}: {
  amount: bigint;
  rpcUrl: string;
  token: Address;
  vault: Address;
}) {
  const { publicClient, walletClient } = createClients(rpcUrl);
  await confirmWrite({
    client: publicClient,
    hash: await approve(walletClient, {
      address: token,
      amount,
      spender: vault,
    }),
  });
  await confirmWrite({
    client: publicClient,
    hash: await deposit(walletClient, {
      address: vault,
      assets: amount,
      receiver: TEST_ADDRESS,
    }),
  });
};

const treasuryAbi = parseAbi([
  "function setDepositActive(address token, bool active)",
  "function setWithdrawActive(address token, bool active)",
]);

type SetTokenActiveParams = {
  active: boolean;
  gateway: Address;
  rpcUrl: string;
  token: Address;
};

const setTokenActive = async function ({
  active,
  functionName,
  gateway,
  rpcUrl,
  token,
}: SetTokenActiveParams & {
  functionName: "setDepositActive" | "setWithdrawActive";
}) {
  const { publicClient, testClient } = createClients(rpcUrl);

  const treasury = await readContract(publicClient, {
    abi: vetroGatewayAbi,
    address: gateway,
    functionName: "treasury",
  });
  const [admin, keeperRole] = await Promise.all([
    defaultAdmin(publicClient, { address: treasury }),
    getKeeperRole(publicClient, { address: treasury }),
  ]);

  await impersonateAccount(testClient, { address: admin });
  await setBalance(testClient, { address: admin, value: parseEther("1") });

  try {
    const isKeeper = await hasRole(publicClient, {
      account: admin,
      address: treasury,
      role: keeperRole,
    });
    if (!isKeeper) {
      await confirmWrite({
        client: publicClient,
        hash: await grantRole(
          createWalletClient({
            account: admin,
            chain: mainnet,
            transport: http(rpcUrl),
          }),
          { account: admin, address: treasury, role: keeperRole },
        ),
      });
    }
    await confirmWrite({
      client: publicClient,
      hash: await writeContract(testClient, {
        abi: treasuryAbi,
        account: admin,
        address: treasury,
        args: [token, active],
        functionName,
      }),
    });
  } finally {
    await stopImpersonatingAccount(testClient, { address: admin });
  }
};

export const setDepositActive = (params: SetTokenActiveParams) =>
  setTokenActive({ ...params, functionName: "setDepositActive" });

export const setWithdrawActive = (params: SetTokenActiveParams) =>
  setTokenActive({ ...params, functionName: "setWithdrawActive" });

const maintainerRoleAbi = parseAbi([
  "function MAINTAINER_ROLE() view returns (bytes32)",
]);

const impersonateMaintainer = async function ({
  gateway,
  rpcUrl,
}: {
  gateway: Address;
  rpcUrl: string;
}) {
  const { publicClient, testClient } = createClients(rpcUrl);

  const [maintainerRole, treasury] = await Promise.all([
    readContract(publicClient, {
      abi: maintainerRoleAbi,
      address: gateway,
      functionName: "MAINTAINER_ROLE",
    }),
    getTreasury(publicClient, { address: gateway }),
  ]);
  const admin = await defaultAdmin(publicClient, { address: treasury });

  await impersonateAccount(testClient, { address: admin });
  await setBalance(testClient, { address: admin, value: parseEther("1") });

  try {
    const isMaintainer = await hasRole(publicClient, {
      account: admin,
      address: treasury,
      role: maintainerRole,
    });
    if (!isMaintainer) {
      await confirmWrite({
        client: publicClient,
        hash: await grantRole(
          createWalletClient({
            account: admin,
            chain: mainnet,
            transport: http(rpcUrl),
          }),
          { account: admin, address: treasury, role: maintainerRole },
        ),
      });
    }
  } catch (error) {
    await stopImpersonatingAccount(testClient, { address: admin });
    throw error;
  }
  return admin;
};

export const setWithdrawalDelay = async function ({
  delay,
  enabled,
  gateway,
  rpcUrl,
}: {
  delay?: bigint;
  enabled: boolean;
  gateway: Address;
  rpcUrl: string;
}) {
  const { publicClient, testClient } = createClients(rpcUrl);
  const maintainer = await impersonateMaintainer({ gateway, rpcUrl });

  try {
    // updateWithdrawalDelay reverts on 0, so only write a delay the caller gave.
    if (delay !== undefined) {
      await confirmWrite({
        client: publicClient,
        hash: await writeContract(testClient, {
          abi: vetroGatewayAbi,
          account: maintainer,
          address: gateway,
          args: [delay],
          functionName: "updateWithdrawalDelay",
        }),
      });
    }
    await confirmWrite({
      client: publicClient,
      hash: await writeContract(testClient, {
        abi: vetroGatewayAbi,
        account: maintainer,
        address: gateway,
        args: [enabled],
        functionName: "setWithdrawalDelayEnabled",
      }),
    });
  } finally {
    await stopImpersonatingAccount(testClient, { address: maintainer });
  }
};

/** Adds an account to the gateway's instant-redeem whitelist, or removes it. */
export const setInstantRedeemWhitelisted = async function ({
  account,
  gateway,
  rpcUrl,
  whitelisted,
}: {
  account: Address;
  gateway: Address;
  rpcUrl: string;
  whitelisted: boolean;
}) {
  const { publicClient, testClient } = createClients(rpcUrl);
  // Both writes revert when the account is already in the wanted state.
  const isWhitelisted = await isInstantRedeemWhitelisted(publicClient, {
    account,
    address: gateway,
  });
  if (isWhitelisted === whitelisted) {
    return;
  }

  const maintainer = await impersonateMaintainer({ gateway, rpcUrl });
  try {
    await confirmWrite({
      client: publicClient,
      hash: await writeContract(testClient, {
        abi: vetroGatewayAbi,
        account: maintainer,
        address: gateway,
        args: [account],
        functionName: whitelisted
          ? "addToInstantRedeemWhitelist"
          : "removeFromInstantRedeemWhitelist",
      }),
    });
  } finally {
    await stopImpersonatingAccount(testClient, { address: maintainer });
  }
};

/** Turns the gateway's redeem queue on or off, and returns a restore for its previous state. */
export const setRedeemQueueEnabled = async function ({
  enabled,
  gateway,
  rpcUrl,
}: {
  enabled: boolean;
  gateway: Address;
  rpcUrl: string;
}) {
  const { publicClient } = createClients(rpcUrl);
  const enabledBefore = await getWithdrawalDelayEnabled(publicClient, {
    address: gateway,
  });
  await setWithdrawalDelay({ enabled, gateway, rpcUrl });
  return () => setWithdrawalDelay({ enabled: enabledBefore, gateway, rpcUrl });
};

const updateCooldownDurationAbi = parseAbi([
  "function updateCooldownDuration(uint256 duration_)",
]);

const impersonateVaultOwner = async function ({
  rpcUrl,
  vault,
}: {
  rpcUrl: string;
  vault: Address;
}) {
  const { publicClient, testClient } = createClients(rpcUrl);
  const owner = await readContract(publicClient, {
    abi: stakingVaultAbi,
    address: vault,
    functionName: "owner",
  });

  await impersonateAccount(testClient, { address: owner });
  await setBalance(testClient, { address: owner, value: parseEther("1") });
  return owner;
};

/** Turns the staking vault's unstake cooldown on or off, and sets its duration when given. */
export const setStakingCooldown = async function ({
  duration,
  enabled,
  rpcUrl,
  vault,
}: {
  duration?: bigint;
  enabled: boolean;
  rpcUrl: string;
  vault: Address;
}) {
  const { publicClient, testClient } = createClients(rpcUrl);
  const owner = await impersonateVaultOwner({ rpcUrl, vault });
  try {
    if (duration !== undefined) {
      await confirmWrite({
        client: publicClient,
        hash: await writeContract(testClient, {
          abi: updateCooldownDurationAbi,
          account: owner,
          address: vault,
          args: [duration],
          functionName: "updateCooldownDuration",
        }),
      });
    }
    await confirmWrite({
      client: publicClient,
      hash: await writeContract(testClient, {
        abi: stakingVaultAbi,
        account: owner,
        address: vault,
        args: [enabled],
        functionName: "updateCooldownEnabled",
      }),
    });
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }
};

export const setInstantWithdrawWhitelisted = async function ({
  account,
  rpcUrl,
  vault,
  whitelisted,
}: {
  account: Address;
  rpcUrl: string;
  vault: Address;
  whitelisted: boolean;
}) {
  const { publicClient, testClient } = createClients(rpcUrl);
  const owner = await impersonateVaultOwner({ rpcUrl, vault });
  try {
    await confirmWrite({
      client: publicClient,
      hash: await writeContract(testClient, {
        abi: stakingVaultAbi,
        account: owner,
        address: vault,
        args: [account, whitelisted],
        functionName: "updateInstantWithdrawWhitelist",
      }),
    });
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }
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

/** Opens an exit ticket of TEST_ADDRESS. It first moves the clock 60 seconds, so the gas estimate and the mined transaction both see the vault's yield drip. */
export const requestWithdraw = async function ({
  assets,
  rpcUrl,
  vault,
}: {
  assets: bigint;
  rpcUrl: string;
  vault: Address;
}) {
  const { publicClient, walletClient } = createClients(rpcUrl);
  await fastForward({ rpcUrl, seconds: 60n });
  const hash = await writeContract(walletClient, {
    abi: stakingVaultAbi,
    address: vault,
    args: [assets, TEST_ADDRESS],
    functionName: "requestWithdraw",
  });
  const { logs, status } = await waitForTransactionReceipt(publicClient, {
    hash,
  });
  if (status !== "success") {
    throw new Error("requestWithdraw reverted");
  }
  const [{ args }] = parseEventLogs({
    abi: stakingVaultAbi,
    eventName: "WithdrawRequested",
    logs,
  });
  return args;
};

export const readMarketParams = async function ({
  client,
  marketId,
}: {
  client: Client;
  marketId: Hash;
}) {
  const [loanToken, collateralToken, oracle, irm, lltv] = await readContract(
    client,
    {
      abi: blueAbi,
      address: morphoBlueAddress,
      args: [marketId],
      functionName: "idToMarketParams",
    },
  );
  return { collateralToken, irm, lltv, loanToken, oracle };
};

/** The collateral must already be in TEST_ADDRESS. */
export const openBorrowPosition = async function ({
  borrowAssets,
  collateral,
  liquidity,
  marketId,
  rpcUrl,
}: {
  borrowAssets: bigint;
  collateral: bigint;
  liquidity: bigint;
  marketId: Hash;
  rpcUrl: string;
}) {
  const { publicClient, walletClient } = createClients(rpcUrl);
  const marketParams = await readMarketParams({
    client: publicClient,
    marketId,
  });
  if (liquidity > 0n) {
    const loanToken = [vetBtc, vusd].find((candidate) =>
      isAddressEqual(candidate.address, marketParams.loanToken),
    );
    if (!loanToken) {
      throw new Error(`Unknown loan token ${marketParams.loanToken}`);
    }
    await fundTestAccount({
      amount: formatUnits(liquidity, loanToken.decimals),
      rpcUrl,
      token: loanToken,
    });
    await confirmWrite({
      client: publicClient,
      hash: await approve(walletClient, {
        address: marketParams.loanToken,
        amount: liquidity,
        spender: morphoBlueAddress,
      }),
    });
    // Without a clock step, the gas estimate skips interest accrual and the supply and borrow run out of gas.
    await fastForward({ rpcUrl, seconds: 60n });
    await confirmWrite({
      client: publicClient,
      hash: await writeContract(walletClient, {
        abi: blueAbi,
        address: morphoBlueAddress,
        args: [marketParams, liquidity, 0n, TEST_ADDRESS, "0x"],
        functionName: "supply",
      }),
    });
  }
  if (collateral > 0n) {
    await confirmWrite({
      client: publicClient,
      hash: await approve(walletClient, {
        address: marketParams.collateralToken,
        amount: collateral,
        spender: morphoBlueAddress,
      }),
    });
    await confirmWrite({
      client: publicClient,
      hash: await writeContract(walletClient, {
        abi: blueAbi,
        address: morphoBlueAddress,
        args: [marketParams, collateral, TEST_ADDRESS, "0x"],
        functionName: "supplyCollateral",
      }),
    });
  }
  if (borrowAssets > 0n) {
    await fastForward({ rpcUrl, seconds: 60n });
    await confirmWrite({
      client: publicClient,
      hash: await writeContract(walletClient, {
        abi: blueAbi,
        address: morphoBlueAddress,
        args: [marketParams, borrowAssets, 0n, TEST_ADDRESS, TEST_ADDRESS],
        functionName: "borrow",
      }),
    });
  }
};

/** Mines at the timestamp of the latest block, so the on-chain state matches what the CLI computed for that block. */
export const accrueInterestAtLatestBlock = async function ({
  marketParams,
  rpcUrl,
}: {
  marketParams: Awaited<ReturnType<typeof readMarketParams>>;
  rpcUrl: string;
}) {
  const { publicClient, testClient, walletClient } = createClients(rpcUrl);
  const latest = await getBlock(publicClient);
  await setBalance(testClient, {
    address: TEST_ADDRESS,
    value: parseEther("1"),
  });
  await setNextBlockTimestamp(testClient, { timestamp: latest.timestamp });
  await confirmWrite({
    client: publicClient,
    hash: await writeContract(walletClient, {
      abi: blueAbi,
      address: morphoBlueAddress,
      args: [marketParams],
      functionName: "accrueInterest",
    }),
  });
};

export type BorrowPosition = {
  borrowAssets: string;
  borrowShares: string;
  collateral: string;
  healthFactor: string | null;
  liquidationPrice: string | null;
  ltv: string | null;
  marketId: Hash;
  maxBorrow: string | null;
  withdrawableCollateral: string | null;
};

type MulDivParams = { denominator: bigint; x: bigint; y: bigint };

const mulDivDown = ({ denominator, x, y }: MulDivParams) =>
  (x * y) / denominator;
const mulDivUp = ({ denominator, x, y }: MulDivParams) =>
  (x * y + denominator - 1n) / denominator;
const wad = 10n ** 18n;
const oraclePriceScale = 10n ** 36n;

/** Copies the @morpho-org/blue-sdk formulas, so the expected values do not come from the code under test. */
export const readExpectedPosition = async function ({
  marketId,
  rpcUrl,
}: {
  marketId: Hash;
  rpcUrl: string;
}) {
  const { publicClient } = createClients(rpcUrl);
  const params = await readMarketParams({ client: publicClient, marketId });
  await accrueInterestAtLatestBlock({ marketParams: params, rpcUrl });

  const [
    [, borrowShares, collateral],
    [totalSupplyAssets, , totalBorrowAssets, totalBorrowShares],
    price,
  ] = await Promise.all([
    readContract(publicClient, {
      abi: blueAbi,
      address: morphoBlueAddress,
      args: [marketId, TEST_ADDRESS],
      functionName: "position",
    }),
    readContract(publicClient, {
      abi: blueAbi,
      address: morphoBlueAddress,
      args: [marketId],
      functionName: "market",
    }),
    readContract(publicClient, {
      abi: blueOracleAbi,
      address: params.oracle,
      functionName: "price",
    }).catch(() => null),
  ]);

  const borrowAssets = mulDivUp({
    denominator: totalBorrowShares + 1_000_000n,
    x: borrowShares,
    y: totalBorrowAssets + 1n,
  });
  const hasDebt = borrowShares > 0n;
  const liquidity = totalSupplyAssets - totalBorrowAssets;
  const collateralPower = mulDivDown({
    denominator: wad,
    x: collateral,
    y: params.lltv,
  });
  const liquidationPrice = !hasDebt
    ? null
    : collateralPower === 0n
      ? maxUint256
      : mulDivUp({
          denominator: collateralPower,
          x: borrowAssets,
          y: oraclePriceScale,
        });

  const withPrice = function (oraclePrice: bigint) {
    const collateralValue = mulDivDown({
      denominator: oraclePriceScale,
      x: collateral,
      y: oraclePrice,
    });
    const maxBorrowAssets = mulDivDown({
      denominator: wad,
      x: collateralValue,
      y: params.lltv,
    });
    const maxBorrowable =
      maxBorrowAssets > borrowAssets ? maxBorrowAssets - borrowAssets : 0n;
    const required =
      oraclePrice === 0n
        ? collateral
        : mulDivUp({
            denominator: params.lltv,
            x: mulDivUp({
              denominator: oraclePrice,
              x: borrowAssets,
              y: oraclePriceScale,
            }),
            y: wad,
          });
    return {
      healthFactor: hasDebt
        ? mulDivDown({ denominator: borrowAssets, x: maxBorrowAssets, y: wad })
        : null,
      ltv: !hasDebt
        ? null
        : collateralValue === 0n
          ? maxUint256
          : mulDivUp({ denominator: collateralValue, x: borrowAssets, y: wad }),
      maxBorrow: maxBorrowable < liquidity ? maxBorrowable : liquidity,
      maxBorrowAssets,
      withdrawableCollateral:
        collateral > required ? collateral - required : 0n,
    };
  };
  const priced = price === null ? null : withPrice(price);
  const toNullableString = (value: bigint | null | undefined) =>
    value?.toString() ?? null;

  return {
    liquidity,
    maxBorrowAssets: priced?.maxBorrowAssets ?? null,
    position: {
      borrowAssets: borrowAssets.toString(),
      borrowShares: borrowShares.toString(),
      collateral: collateral.toString(),
      healthFactor: toNullableString(priced?.healthFactor),
      liquidationPrice: toNullableString(liquidationPrice),
      ltv: toNullableString(priced?.ltv),
      marketId,
      maxBorrow: toNullableString(priced?.maxBorrow),
      withdrawableCollateral: hasDebt
        ? toNullableString(priced?.withdrawableCollateral)
        : collateral.toString(),
    } satisfies BorrowPosition,
  };
};
