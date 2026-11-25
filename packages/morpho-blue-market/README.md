# @vetro-protocol/morpho-blue-market

Morpho Blue market actions for viem clients. Wraps a single Morpho Blue market — supply collateral, borrow, repay and withdraw — behind the market id, so callers never assemble `MarketParams` themselves.

## Installation

```sh
pnpm add @vetro-protocol/morpho-blue-market viem
```

## Overview

- Every action takes the Morpho Blue contract `address` plus the `marketId`; the market's `MarketParams` struct is read on-chain from `idToMarketParams` and passed to the contract call.
- Writes emit their progress through an `EventEmitter` and return `{ emitter, promise }`.
- `supplyCollateral` and `repayAssets` handle the ERC-20 approval themselves: they read the current allowance — of the collateral token and the loan token respectively — and approve only when it falls short. `approveAmount` defaults to `amount`; pass a larger value to approve once for several operations.
- `supplyCollateralAndBorrow` runs both steps against one emitter and skips the borrow if the supply doesn't succeed. Its event map is the union of both, with a single `supply-collateral-and-borrow-settled` at the end.
- The `encode*` helpers return the calldata for their contract call without sending anything — useful for gas estimation or for batching into a multicall. They take `marketParams` directly, since there is no client to read them with.

## Usage

```ts
import {
  getMarketParams,
  marketIds,
  morphoBlueAddress,
} from "@vetro-protocol/morpho-blue-market";
import { supplyCollateralAndBorrow } from "@vetro-protocol/morpho-blue-market/actions";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { mainnet } from "viem/chains";

const publicClient = createPublicClient({ chain: mainnet, transport: http() });
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
});

const morphoAddress = morphoBlueAddress;
const [marketId] = marketIds;

// Collateral token, loan token, oracle, IRM and LLTV of the market.
const marketParams = await getMarketParams({
  address: morphoAddress,
  client: publicClient,
  marketId,
});

// Supply collateral and borrow against it in one flow (approval included).
const { emitter, promise } = supplyCollateralAndBorrow(walletClient, {
  address: morphoAddress,
  borrowAmount: 500_000_000_000_000_000_000n,
  collateralAmount: 1_000_000_000_000_000_000n,
  marketId,
  onBehalf: "0x...",
  receiver: "0x...",
});

emitter.on("user-signed-supply-collateral", (hash) =>
  console.log("supply tx:", hash),
);
emitter.on("borrow-assets-transaction-succeeded", (receipt) =>
  console.log("borrowed:", receipt),
);

await promise;
```

The same actions are also available via `.extend()` factories (`morphoBluePublicActions()`, `morphoBlueWalletActions()`) for callers who prefer viem's extension pattern.

## API

From `@vetro-protocol/morpho-blue-market/actions`:

- Public actions (reads):
  - `getMarketParams({ address, client, marketId })` — the market's `MarketParams`: `collateralToken`, `irm`, `lltv`, `loanToken` and `oracle`.
- Wallet actions (writes): each returns `{ emitter, promise }`. Every one takes the Morpho Blue contract `address` and the `marketId`. `approveAmount` is optional and defaults to the amount being supplied or repaid.
  - `borrowAssets(walletClient, { address, amount, marketId, onBehalf, receiver })` — borrows `amount` of the loan token against `onBehalf`'s collateral and sends it to `receiver`.
  - `repayAssets(walletClient, { address, amount, approveAmount?, marketId, onBehalf })` — repays `amount` of the loan token for `onBehalf`, approving it first if needed.
  - `supplyCollateral(walletClient, { address, amount, approveAmount?, marketId, onBehalf })` — supplies `amount` of the collateral token for `onBehalf`, approving it first if needed.
  - `supplyCollateralAndBorrow(walletClient, { address, approveAmount?, borrowAmount, collateralAmount, marketId, onBehalf, receiver })` — supplies `collateralAmount`, then borrows `borrowAmount` and sends it to `receiver`. `approveAmount` defaults to `collateralAmount`.
  - `withdrawCollateral(walletClient, { address, amount, marketId, onBehalf, receiver })` — withdraws `amount` of `onBehalf`'s collateral to `receiver`.
- Calldata encoders: each returns the calldata of one write without sending anything. They take `marketParams` instead of `address` and `marketId`.
  - `encodeBorrowAssets({ amount, marketParams, onBehalf, receiver })` — `borrow`.
  - `encodeRepayAssets({ amount, marketParams, onBehalf })` — `repay`.
  - `encodeSupplyCollateral({ amount, marketParams, onBehalf })` — `supplyCollateral`.
  - `encodeWithdrawCollateral({ amount, marketParams, onBehalf, receiver })` — `withdrawCollateral`.

From `@vetro-protocol/morpho-blue-market`:

- `getMarketParams` — the same read, also exported from the root.
- `marketIds` — the ids of the markets that Vetro enables, on Ethereum mainnet.
- `morphoBlueAddress` — the address of the Morpho Blue contract on Ethereum mainnet.
- `morphoBluePublicActions()` / `morphoBlueWalletActions()` — viem extension factories that wire the same actions onto a client via `.extend()`.
- `morphoBlueAbi` — the minimal ABI subset used by the package.
- Types: `BorrowAssetsEvents`, `MarketParams`, `RepayAssetsEvents`, `SupplyCollateralAndBorrowEvents`, `SupplyCollateralEvents`, `WithdrawCollateralEvents`.
