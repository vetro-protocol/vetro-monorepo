import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  type Address,
  createPublicClient,
  createTestClient,
  http,
  isAddress,
  parseEther,
  parseUnits,
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
import { decimals } from "viem-erc20/actions";

import { gatewayAbi } from "../../packages/gateway/src/abi/gatewayAbi.ts";
import { gatewayAddresses } from "../../packages/gateway/src/gatewayAddresses.ts";

export async function setMaxMint({
  forkUrl,
  gateway = gatewayAddresses[0],
  maxMint,
}: {
  forkUrl: string;
  gateway?: Address;
  maxMint: bigint;
}) {
  const transport = http(forkUrl);

  const publicClient = createPublicClient({ chain: mainnet, transport });
  const testClient = createTestClient({
    chain: mainnet,
    mode: "anvil",
    transport,
  });

  const [owner, mintLimitBefore, maxMintBefore] = await Promise.all([
    readContract(publicClient, {
      abi: gatewayAbi,
      address: gateway,
      functionName: "owner",
    }),
    readContract(publicClient, {
      abi: gatewayAbi,
      address: gateway,
      functionName: "mintLimit",
    }),
    readContract(publicClient, {
      abi: gatewayAbi,
      address: gateway,
      functionName: "maxMint",
    }),
  ]);

  await impersonateAccount(testClient, { address: owner });
  await setBalance(testClient, { address: owner, value: parseEther("1") });

  try {
    const userSupply = mintLimitBefore - maxMintBefore;
    const mintLimitAfter = userSupply + maxMint;

    const hash = await writeContract(testClient, {
      abi: gatewayAbi,
      account: owner,
      address: gateway,
      args: [mintLimitAfter],
      functionName: "updateMintLimit",
    });
    await waitForTransactionReceipt(publicClient, { hash });

    const maxMintAfter = await readContract(publicClient, {
      abi: gatewayAbi,
      address: gateway,
      functionName: "maxMint",
    });

    return { maxMintAfter, maxMintBefore, mintLimitAfter, mintLimitBefore };
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }
}

// Allow running as a standalone script:
//   node web/scripts/setMaxMint.ts --amount 5
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const usage = "node web/scripts/setMaxMint.ts --amount 5";

  const { values } = parseArgs({
    options: {
      amount: { type: "string" },
      "fork-url": { short: "f", type: "string" },
      gateway: { short: "g", type: "string" },
    },
    strict: true,
  });

  if (values.gateway && !isAddress(values.gateway, { strict: false })) {
    console.error("Invalid --gateway. Must be a valid address.");
    process.exit(1);
  }

  if (!values.amount || !/^\d+(\.\d+)?$/.test(values.amount)) {
    console.error(`Invalid --amount. Usage: ${usage}`);
    process.exit(1);
  }

  const forkUrl = values["fork-url"] ?? "http://127.0.0.1:8545";
  const gateway =
    (values.gateway as Address | undefined) ?? gatewayAddresses[0];

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(forkUrl),
  });

  const peggedToken = await readContract(publicClient, {
    abi: gatewayAbi,
    address: gateway,
    functionName: "PEGGED_TOKEN",
  });

  const { maxMintAfter, maxMintBefore, mintLimitAfter, mintLimitBefore } =
    await setMaxMint({
      forkUrl,
      gateway,
      maxMint: parseUnits(
        values.amount,
        await decimals(publicClient, { address: peggedToken }),
      ),
    });

  console.log(`mintLimit: ${mintLimitBefore} -> ${mintLimitAfter}`);
  console.log(`maxMint: ${maxMintBefore} -> ${maxMintAfter}`);
}
