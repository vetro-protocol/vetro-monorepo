import {
  type Chain,
  type Hex,
  type LocalAccount,
  type Transport,
  createWalletClient,
  isAddressEqual,
} from "viem";

export type RpcRequest = { method: string; params?: unknown[] };

// Methods that return a fixed value, independent of params. Keeping them out
// of the switch keeps request()'s complexity within the lint threshold.
const staticResponses: Record<string, unknown> = {
  wallet_getPermissions: [],
  wallet_requestPermissions: [{ parentCapability: "eth_accounts" }],
  wallet_revokePermissions: [{ parentCapability: "eth_accounts" }],
  // The fork is a single mainnet chain; accept switch requests so RainbowKit's
  // connect flow doesn't error, but do not actually move.
  wallet_switchEthereumChain: null,
};

export type CreateMockWalletProviderParams = {
  account: LocalAccount;
  chain: Chain;
  transports: Record<number, Transport>;
};

export type MockWalletProvider = {
  request: (request: RpcRequest) => Promise<unknown>;
};

// The EIP-1193 request handler shared by every host: it auto-approves accounts,
// signs messages, and submits transactions with a viem wallet client, passing
// every other method straight through to the transport. Runs unchanged wherever
// it is called — in Node behind Playwright's page.exposeFunction (E2E) or in the
// browser behind an injected EIP-6963 provider (dev wallet).
export function createMockWalletProvider({
  account,
  chain,
  transports,
}: CreateMockWalletProviderParams): MockWalletProvider {
  const transport = transports[chain.id];
  if (!transport) {
    // Never fall back to viem's default public RPC — a missing entry would
    // silently point the wallet at the real network instead of the fork.
    throw new Error(`No transport configured for chain ${chain.id}`);
  }
  const client = createWalletClient({
    account,
    chain,
    transport,
  });
  return {
    async request({ method, params }) {
      if (Object.hasOwn(staticResponses, method)) {
        return staticResponses[method];
      }
      switch (method) {
        case "eth_accounts":
        case "eth_requestAccounts":
          return client.getAddresses();
        case "personal_sign":
          return client.signMessage({
            message: { raw: (params as [Hex])[0] },
          });
        case "eth_sendTransaction": {
          const [tx] = params as [
            { data?: Hex; from: Hex; to: Hex; value?: Hex },
          ];
          if (!isAddressEqual(tx.from, account.address)) {
            throw new Error("Invalid from address");
          }
          return client.sendTransaction({
            data: tx.data,
            to: tx.to,
            value: tx.value ? BigInt(tx.value) : undefined,
          });
        }
        default:
          // @ts-expect-error EIP-1193 passthrough — viem's request() is typed
          // as a discriminated union of known methods.
          return client.request({ method, params });
      }
    },
  };
}
