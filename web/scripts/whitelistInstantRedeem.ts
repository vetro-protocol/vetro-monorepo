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
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";

import { gatewayAbi } from "../../packages/gateway/src/abi/gatewayAbi.ts";
import { gatewayAddresses } from "../../packages/gateway/src/gatewayAddresses.ts";

// Whitelisting for instant redeem is `onlyRole(MAINTAINER_ROLE)`, and the
// gateway delegates role checks to its Treasury (`Treasury.hasRole`). The
// treasury owner holds DEFAULT_ADMIN_ROLE, which administers MAINTAINER_ROLE,
// so we impersonate the owner, grant it MAINTAINER_ROLE on the treasury, then
// whitelist the account on the gateway.
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

export async function whitelistInstantRedeem({
  address,
  forkUrl = "http://127.0.0.1:8545",
  gateway = gatewayAddresses[0],
}: {
  address: Address;
  forkUrl?: string;
  gateway?: Address;
}) {
  const transport = http(forkUrl);

  const publicClient = createPublicClient({ chain: mainnet, transport });
  const testClient = createTestClient({
    chain: mainnet,
    mode: "anvil",
    transport,
  });

  const [owner, treasury, isWhitelisted] = await Promise.all([
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
      args: [address],
      functionName: "isInstantRedeemWhitelisted",
    }),
  ]);

  if (isWhitelisted) {
    console.log(`${address} is already whitelisted for instant redeem.`);
    return;
  }

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
      await waitForTransactionReceipt(publicClient, { hash: grantHash });
    }

    const whitelistHash = await writeContract(testClient, {
      abi: gatewayAbi,
      account: owner,
      address: gateway,
      args: [address],
      functionName: "addToInstantRedeemWhitelist",
    });
    await waitForTransactionReceipt(publicClient, { hash: whitelistHash });
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }

  console.log(
    `${address} whitelisted for instant redeem on gateway ${gateway}.`,
  );
}

// Allow running as a standalone script for consumers:
//   node web/scripts/whitelistInstantRedeem.ts --address 0x… [--fork-url …] [--gateway …]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      address: { short: "a", type: "string" },
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
    console.error(
      "Address is invalid. Usage: node web/scripts/whitelistInstantRedeem.ts --address 0xYourAddress",
    );
    process.exit(1);
  }

  await whitelistInstantRedeem({
    address: values.address,
    forkUrl: values["fork-url"],
    gateway: (values.gateway as Address) ?? gatewayAddresses[0],
  });
}
