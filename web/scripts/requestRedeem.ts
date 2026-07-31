import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  type Address,
  createPublicClient,
  createTestClient,
  http,
  isAddress,
  parseUnits,
} from "viem";
import {
  impersonateAccount,
  readContract,
  stopImpersonatingAccount,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";
import { approve, decimals } from "viem-erc20/actions";

import { gatewayAbi } from "../../packages/gateway/src/abi/gatewayAbi.ts";
import { gatewayAddresses } from "../../packages/gateway/src/gatewayAddresses.ts";

import { confirmTransaction } from "./utils.ts";

// Send `peggedTokenAmount` to the gateway's redeem queue on behalf of `address`
// by impersonating it, so a queued redeem can be set up without driving the
// two-step form. Returns the resulting request so callers can fast-forward past
// its cooldown.
export async function requestRedeem({
  address,
  forkUrl = "http://127.0.0.1:8545",
  gateway = gatewayAddresses[0],
  peggedTokenAmount,
}: {
  address: Address;
  forkUrl?: string;
  gateway?: Address;
  peggedTokenAmount: bigint;
}) {
  const transport = http(forkUrl);

  const publicClient = createPublicClient({ chain: mainnet, transport });
  const testClient = createTestClient({
    account: address,
    chain: mainnet,
    mode: "anvil",
    transport,
  });

  const peggedToken = await readContract(publicClient, {
    abi: gatewayAbi,
    address: gateway,
    functionName: "PEGGED_TOKEN",
  });

  await impersonateAccount(testClient, { address });

  try {
    const approveHash = await approve(testClient, {
      address: peggedToken,
      amount: peggedTokenAmount,
      spender: gateway,
    });
    await confirmTransaction({ client: publicClient, hash: approveHash });

    const requestHash = await writeContract(testClient, {
      abi: gatewayAbi,
      address: gateway,
      args: [peggedTokenAmount],
      functionName: "requestRedeem",
    });
    await confirmTransaction({ client: publicClient, hash: requestHash });
  } finally {
    await stopImpersonatingAccount(testClient, { address });
  }

  const [amountLocked, claimableAt] = await readContract(publicClient, {
    abi: gatewayAbi,
    address: gateway,
    args: [address],
    functionName: "getRedeemRequest",
  });

  return { amountLocked, claimableAt, peggedToken };
}

// Allow running as a standalone script:
//   node web/scripts/requestRedeem.ts --address 0x… --amount 2
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const usage =
    "node web/scripts/requestRedeem.ts --address 0xYourAddress --amount 2";

  const { values } = parseArgs({
    options: {
      address: { short: "a", type: "string" },
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

  if (!values.address || !isAddress(values.address, { strict: false })) {
    console.error(`Address is invalid. Usage: ${usage}`);
    process.exit(1);
  }

  if (!values.amount || !/^\d+(\.\d+)?$/.test(values.amount)) {
    console.error(`Amount is invalid. Usage: ${usage}`);
    process.exit(1);
  }

  const forkUrl = values["fork-url"] ?? "http://127.0.0.1:8545";
  const gateway = (values.gateway as Address) ?? gatewayAddresses[0];

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(forkUrl),
  });

  const peggedTokenAddress = await readContract(publicClient, {
    abi: gatewayAbi,
    address: gateway,
    functionName: "PEGGED_TOKEN",
  });

  const { amountLocked, claimableAt } = await requestRedeem({
    address: values.address,
    forkUrl,
    gateway,
    peggedTokenAmount: parseUnits(
      values.amount,
      await decimals(publicClient, { address: peggedTokenAddress }),
    ),
  });

  console.log(
    `Queued ${amountLocked} of ${peggedTokenAddress} for ${values.address} (claimable at ${claimableAt}).`,
  );
}
