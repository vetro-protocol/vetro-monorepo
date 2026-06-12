import type { Page } from "@playwright/test";
import {
  type Chain,
  type Hex,
  type LocalAccount,
  type Transport,
  createWalletClient,
} from "viem";

const REQUEST_BINDING = "__mockWalletRequest";

type RpcRequest = { method: string; params?: unknown[] };

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

type CreateWalletParams = {
  account: LocalAccount;
  chain: Chain;
  transports: Record<number, Transport>;
};

type MockWallet = {
  request: (request: RpcRequest) => Promise<unknown>;
};

function createWallet({
  account,
  chain,
  transports,
}: CreateWalletParams): MockWallet {
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
          if (tx.from.toLowerCase() !== account.address.toLowerCase()) {
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

type InstallMockWalletParams = CreateWalletParams & { page: Page };

export async function installMockWallet({
  page,
  ...walletParams
}: InstallMockWalletParams) {
  const wallet = createWallet(walletParams);

  await page.exposeFunction(REQUEST_BINDING, (request: RpcRequest) =>
    wallet.request(request),
  );

  await page.addInitScript(
    function ({ bindingName }: { bindingName: string }) {
      const request = (window as unknown as Record<string, unknown>)[
        bindingName
      ] as (req: { method: string; params?: unknown[] }) => Promise<unknown>;
      const provider = {
        on() {},
        removeListener() {},
        request,
      };
      const info = {
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'/>",
        name: "Mock Wallet",
        rdns: "com.example.mock-wallet",
        uuid: crypto.randomUUID(),
      };
      const detail = Object.freeze({ info, provider });
      function announce() {
        window.dispatchEvent(
          new CustomEvent("eip6963:announceProvider", { detail }),
        );
      }
      announce();
      window.addEventListener("eip6963:requestProvider", announce);
      window.addEventListener("DOMContentLoaded", announce);
    },
    { bindingName: REQUEST_BINDING },
  );
}
