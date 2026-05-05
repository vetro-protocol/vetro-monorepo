import { parseArgs } from "node:util";
import {
  type Address,
  createPublicClient,
  createTestClient,
  http,
  isAddress,
  keccak256,
  parseEther,
  toHex,
} from "viem";
import {
  impersonateAccount,
  readContract,
  setBalance,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";

import { gatewayAbi } from "../../packages/gateway/src/abi/gatewayAbi.ts";
import { gatewayAddresses } from "../../packages/gateway/src/gatewayAddresses.ts";

const grantRoleAbi = [
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
] as const;

const { values } = parseArgs({
  options: {
    fee: { short: "f", type: "string" },
    gateway: { short: "g", type: "string" },
    "rpc-url": { default: "http://127.0.0.1:8545", short: "r", type: "string" },
    token: { short: "t", type: "string" },
  },
  strict: true,
});

if (values.gateway && !isAddress(values.gateway, { strict: false })) {
  console.error("Invalid --gateway. Must be a valid address.");
  process.exit(1);
}

const gateway = (values.gateway as Address) ?? gatewayAddresses[0];
const token = values.token;
if (!token || !isAddress(token, { strict: false })) {
  console.error("Invalid --token. Must be a valid address.");
  process.exit(1);
}

const fee = Number(values.fee);
if (!values.fee || !Number.isInteger(fee) || fee < 0 || fee > 500) {
  console.error("Invalid --fee. Must be an integer between 0 and 500 (BPS).");
  process.exit(1);
}

const transport = http(values["rpc-url"]);

const publicClient = createPublicClient({
  chain: mainnet,
  transport,
});

const testClient = createTestClient({
  chain: mainnet,
  mode: "anvil",
  transport,
});

const [admin, treasury] = await Promise.all([
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
]);

await impersonateAccount(testClient, { address: admin });
await setBalance(testClient, { address: admin, value: parseEther("1") });

const MAINTAINER_ROLE = keccak256(toHex("MAINTAINER_ROLE"));

const grantRoleHash = await writeContract(testClient, {
  abi: grantRoleAbi,
  account: admin,
  address: treasury,
  args: [MAINTAINER_ROLE, admin],
  functionName: "grantRole",
});

await waitForTransactionReceipt(publicClient, { hash: grantRoleHash });

console.log(`Admin: ${admin}`);
console.log(`Gateway: ${gateway}`);
console.log(`Token: ${token}`);

const currentFee = await readContract(publicClient, {
  abi: gatewayAbi,
  address: gateway,
  args: [token],
  functionName: "mintFee",
});

console.log(`Current mint fee: ${currentFee} BPS`);
console.log(`New mint fee: ${fee} BPS`);

const hash = await writeContract(testClient, {
  abi: gatewayAbi,
  account: admin,
  address: gateway,
  args: [token, BigInt(fee)],
  functionName: "updateMintFee",
});

console.log(`Transaction hash: ${hash}`);

const receipt = await waitForTransactionReceipt(publicClient, { hash });

console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
console.log(`Mint fee updated: ${currentFee} -> ${fee} BPS`);
