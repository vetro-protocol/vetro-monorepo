import { gatewayAbi, gatewayAddresses } from "@vetro-protocol/gateway";
import { getTreasury } from "@vetro-protocol/gateway/actions";
import {
  getKeeperRole,
  getTokenConfig,
} from "@vetro-protocol/treasury/actions";
import { parseArgs } from "node:util";
import {
  type Address,
  createPublicClient,
  createTestClient,
  http,
  isAddress,
  parseEther,
} from "viem";
import {
  impersonateAccount,
  readContract,
  setBalance,
  stopImpersonatingAccount,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";

import { confirmTransaction } from "./utils.ts";

const treasuryWriteAbi = [
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "active", type: "bool" },
    ],
    name: "setDepositActive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "active", type: "bool" },
    ],
    name: "setWithdrawActive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export type TokenActiveFlag = "deposit" | "withdraw";

export type SetTokenActiveParams = {
  active: boolean;
  forkUrl?: string;
  gateway?: Address;
  token: Address;
};

const setterNames = {
  deposit: "setDepositActive",
  withdraw: "setWithdrawActive",
} as const;

export async function setTokenActive({
  active,
  flag,
  forkUrl = "http://127.0.0.1:8545",
  gateway = gatewayAddresses[0],
  token,
}: SetTokenActiveParams & { flag: TokenActiveFlag }) {
  const transport = http(forkUrl);

  const publicClient = createPublicClient({ chain: mainnet, transport });
  const testClient = createTestClient({
    chain: mainnet,
    mode: "anvil",
    transport,
  });

  const [owner, treasury] = await Promise.all([
    readContract(publicClient, {
      abi: gatewayAbi,
      address: gateway,
      functionName: "owner",
    }),
    getTreasury(publicClient, { address: gateway }),
  ]);

  const readActive = async function () {
    const [, , , depositActive, withdrawActive] = await getTokenConfig(
      publicClient,
      { address: treasury, token },
    );
    return flag === "deposit" ? depositActive : withdrawActive;
  };

  const activeBefore = await readActive();

  if (activeBefore === active) {
    return { activeAfter: activeBefore, activeBefore };
  }

  await impersonateAccount(testClient, { address: owner });
  await setBalance(testClient, { address: owner, value: parseEther("1") });

  try {
    const keeperRole = await getKeeperRole(publicClient, { address: treasury });
    const ownerHasRole = await readContract(publicClient, {
      abi: treasuryWriteAbi,
      address: treasury,
      args: [keeperRole, owner],
      functionName: "hasRole",
    });

    if (!ownerHasRole) {
      const grantHash = await writeContract(testClient, {
        abi: treasuryWriteAbi,
        account: owner,
        address: treasury,
        args: [keeperRole, owner],
        functionName: "grantRole",
      });
      await confirmTransaction({ client: publicClient, hash: grantHash });
    }

    const hash = await writeContract(testClient, {
      abi: treasuryWriteAbi,
      account: owner,
      address: treasury,
      args: [token, active],
      functionName: setterNames[flag],
    });
    await confirmTransaction({ client: publicClient, hash });
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }

  return { activeAfter: await readActive(), activeBefore };
}

export async function runTokenActiveCli(flag: TokenActiveFlag) {
  const usage = `node web/scripts/${setterNames[flag]}.ts --token 0xTokenAddress --pause|--unpause`;

  const { values } = parseArgs({
    options: {
      "fork-url": { short: "f", type: "string" },
      gateway: { short: "g", type: "string" },
      pause: { type: "boolean" },
      token: { short: "t", type: "string" },
      unpause: { type: "boolean" },
    },
    strict: true,
  });

  if (values.gateway && !isAddress(values.gateway, { strict: false })) {
    console.error("Invalid --gateway. Must be a valid address.");
    process.exit(1);
  }

  if (!values.token || !isAddress(values.token, { strict: false })) {
    console.error(`Token is invalid. Usage: ${usage}`);
    process.exit(1);
  }

  if (values.pause === values.unpause) {
    console.error("Exactly one of --pause or --unpause must be provided.");
    process.exit(1);
  }

  const { activeAfter, activeBefore } = await setTokenActive({
    active: Boolean(values.unpause),
    flag,
    forkUrl: values["fork-url"],
    gateway: values.gateway as Address | undefined,
    token: values.token,
  });

  console.log(
    `${flag}Active for ${values.token}: ${activeBefore} -> ${activeAfter}`,
  );
}
