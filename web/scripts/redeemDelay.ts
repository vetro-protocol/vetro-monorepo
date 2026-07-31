import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  type Address,
  createPublicClient,
  createTestClient,
  http,
  isAddress,
  keccak256,
  parseEther,
  stringToBytes,
} from "viem";
import {
  impersonateAccount,
  readContract,
  setBalance,
  stopImpersonatingAccount,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";

import { gatewayAbi } from "../../packages/gateway/src/abi/gatewayAbi.ts";
import { gatewayAddresses } from "../../packages/gateway/src/gatewayAddresses.ts";

import { confirmTransaction } from "./utils.ts";

const WITHDRAWAL_DELAY_SECONDS = 72n;

const MAINTAINER_ROLE = keccak256(stringToBytes("MAINTAINER_ROLE"));

const accessControlAbi = [
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
] as const;

// Enable or disable the gateway's withdrawal delay by impersonating its owner.
// When enabling, also remove the address from the instant-redeem whitelist so it
// is forced down the two-step (request → wait → claim) redeem path.
export async function setRedeemDelay({
  address,
  enableDelay,
  forkUrl,
  gateway = gatewayAddresses[0],
}: {
  address: Address;
  enableDelay: boolean;
  forkUrl: string;
  gateway?: Address;
}) {
  const transport = http(forkUrl);

  const publicClient = createPublicClient({ chain: mainnet, transport });
  const testClient = createTestClient({
    chain: mainnet,
    mode: "anvil",
    transport,
  });

  const [owner, treasury, delayEnabledBefore] = await Promise.all([
    readContract(publicClient, {
      abi: gatewayAbi,
      address: gateway,
      functionName: "owner",
    }),
    readContract(publicClient, {
      abi: gatewayAbi,
      address: gateway,
      functionName: "treasury",
    }),
    readContract(publicClient, {
      abi: gatewayAbi,
      address: gateway,
      functionName: "withdrawalDelayEnabled",
    }),
  ]);

  await impersonateAccount(testClient, { address: owner });
  await setBalance(testClient, { address: owner, value: parseEther("1") });

  try {
    const ownerHasRole = await readContract(publicClient, {
      abi: accessControlAbi,
      address: treasury,
      args: [MAINTAINER_ROLE, owner],
      functionName: "hasRole",
    });

    if (!ownerHasRole) {
      const grantHash = await writeContract(testClient, {
        abi: accessControlAbi,
        account: owner,
        address: treasury,
        args: [MAINTAINER_ROLE, owner],
        functionName: "grantRole",
      });
      await confirmTransaction({ client: publicClient, hash: grantHash });
    }

    if (enableDelay) {
      if (!delayEnabledBefore) {
        const hash = await writeContract(testClient, {
          abi: gatewayAbi,
          account: owner,
          address: gateway,
          args: [true],
          functionName: "setWithdrawalDelayEnabled",
        });
        await confirmTransaction({ client: publicClient, hash });
      }

      const [, isWhitelisted] = await Promise.all([
        writeContract(testClient, {
          abi: gatewayAbi,
          account: owner,
          address: gateway,
          args: [WITHDRAWAL_DELAY_SECONDS],
          functionName: "updateWithdrawalDelay",
        }).then((hash) => confirmTransaction({ client: publicClient, hash })),
        readContract(publicClient, {
          abi: gatewayAbi,
          address: gateway,
          args: [address],
          functionName: "isInstantRedeemWhitelisted",
        }),
      ]);

      if (isWhitelisted) {
        const hash = await writeContract(testClient, {
          abi: gatewayAbi,
          account: owner,
          address: gateway,
          args: [address],
          functionName: "removeFromInstantRedeemWhitelist",
        });
        await confirmTransaction({ client: publicClient, hash });
      }
    } else if (delayEnabledBefore) {
      const hash = await writeContract(testClient, {
        abi: gatewayAbi,
        account: owner,
        address: gateway,
        args: [false],
        functionName: "setWithdrawalDelayEnabled",
      });
      await confirmTransaction({ client: publicClient, hash });
    }

    const [delayEnabledAfter, delay] = await Promise.all([
      readContract(publicClient, {
        abi: gatewayAbi,
        address: gateway,
        functionName: "withdrawalDelayEnabled",
      }),
      readContract(publicClient, {
        abi: gatewayAbi,
        address: gateway,
        functionName: "withdrawalDelay",
      }),
    ]);

    return { delay, delayEnabledAfter, delayEnabledBefore };
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }
}

// Allow running as a standalone script:
//   node web/scripts/redeemDelay.ts --address 0xYourAddress --delay|--no-delay
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      address: { short: "a", type: "string" },
      delay: { type: "boolean" },
      "fork-url": { short: "f", type: "string" },
      gateway: { short: "g", type: "string" },
      "no-delay": { type: "boolean" },
    },
    strict: true,
  });

  if (values.gateway && !isAddress(values.gateway, { strict: false })) {
    console.error("Invalid --gateway. Must be a valid address.");
    process.exit(1);
  }

  if (!values.address || !isAddress(values.address, { strict: false })) {
    console.error(
      "Address is invalid. Usage: node web/scripts/redeemDelay.ts --address 0xYourAddress --delay|--no-delay",
    );
    process.exit(1);
  }

  if (values.delay === values["no-delay"]) {
    console.error("Exactly one of --delay or --no-delay must be provided.");
    process.exit(1);
  }

  const { delay, delayEnabledAfter, delayEnabledBefore } = await setRedeemDelay(
    {
      address: values.address,
      enableDelay: Boolean(values.delay),
      forkUrl: values["fork-url"] ?? "http://127.0.0.1:8545",
      gateway: values.gateway as Address | undefined,
    },
  );

  console.log(
    `withdrawalDelayEnabled: ${delayEnabledBefore} -> ${delayEnabledAfter}`,
  );
  console.log(`withdrawalDelay: ${delay}s`);
}
