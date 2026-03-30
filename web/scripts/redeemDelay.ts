import { parseArgs } from "node:util";
import {
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
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";

import { gatewayAbi } from "../../packages/gateway/src/abi/gatewayAbi.ts";
import { getGatewayAddress } from "../../packages/gateway/src/getGatewayAddress.ts";

const gateway = getGatewayAddress(mainnet.id);

const { values } = parseArgs({
  options: {
    address: { short: "a", type: "string" },
    delay: { type: "boolean" },
    "fork-url": { short: "f", type: "string" },
    "no-delay": { type: "boolean" },
  },
  strict: true,
});

const forkUrl = values["fork-url"] ?? "http://127.0.0.1:8545";

if (!values.address || !isAddress(values.address, { strict: false })) {
  console.error(
    "Address is invalid. Usage: node web/scripts/redeemDelay.ts --address 0xYourAddress --delay|--no-delay",
  );
  process.exit(1);
}

if (!values.delay && !values["no-delay"]) {
  console.error("Exactly one of --delay or --no-delay must be provided.");
  process.exit(1);
}

if (values.delay && values["no-delay"]) {
  console.error("Exactly one of --delay or --no-delay must be provided.");
  process.exit(1);
}

const { address } = values;
const enableDelay = Boolean(values.delay);

const WITHDRAWAL_DELAY_SECONDS = 72n;

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

const [owner, delayEnabledBefore] = await Promise.all([
  readContract(publicClient, {
    abi: gatewayAbi,
    address: gateway,
    functionName: "owner",
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
  if (enableDelay) {
    if (!delayEnabledBefore) {
      const hash = await writeContract(testClient, {
        abi: gatewayAbi,
        account: owner,
        address: gateway,
        args: [true],
        functionName: "setWithdrawalDelayEnabled",
      });
      await waitForTransactionReceipt(publicClient, { hash });
    }

    const [, isWhitelisted] = await Promise.all([
      writeContract(testClient, {
        abi: gatewayAbi,
        account: owner,
        address: gateway,
        args: [WITHDRAWAL_DELAY_SECONDS],
        functionName: "updateWithdrawalDelay",
      }).then((hash) => waitForTransactionReceipt(publicClient, { hash })),
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
      await waitForTransactionReceipt(publicClient, { hash });
    }
  } else {
    if (delayEnabledBefore) {
      const hash = await writeContract(testClient, {
        abi: gatewayAbi,
        account: owner,
        address: gateway,
        args: [false],
        functionName: "setWithdrawalDelayEnabled",
      });
      await waitForTransactionReceipt(publicClient, { hash });
    }
  }

  const [delayEnabledAfter, withdrawalDelay] = await Promise.all([
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

  console.log(
    `withdrawalDelayEnabled: ${delayEnabledBefore} -> ${delayEnabledAfter}`,
  );
  console.log(`withdrawalDelay: ${withdrawalDelay}s`);
} finally {
  await stopImpersonatingAccount(testClient, { address: owner });
}
