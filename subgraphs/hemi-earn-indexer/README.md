# hemi-earn-indexer

A multichain [Envio HyperIndex](https://docs.envio.dev) indexer for the Hemi Earn cross-chain request flow.

## What it indexes

A deposit or a redeem is a request that uses contracts on two chains:

| Chain          | Contract     | Role                                                                          |
| -------------- | ------------ | ----------------------------------------------------------------------------- |
| Hemi (`43111`) | `Router`     | Creates the `requestId`, emits `*Requested`, tracks the lifecycle.            |
| Hemi (`43111`) | `ShareToken` | Share OFTs. Their `Transfer` events feed the fair-market-value (FMV) pricing. |
| Ethereum (`1`) | `Agent`      | Stakes and unstakes, emits `*Processed` with the amounts.                     |

All events have the same `requestId`. The `requestId` is the `Request` entity id, thus each event updates the same entity. The first event that the indexer gets, from either chain, creates a partial entity. The subsequent events add their fields to it (see `src/mappings/eventHandlers.ts`). Envio processes the events of the two chains in no fixed order, so the handlers guard `status`. It never goes back to an earlier status.

The `Request` entity (see `schema.graphql`) has:

- The parties and the asset: `initiator`, `receiver`, `asset`, `kind`.
- The amounts: `amountIn`, `amountOut`, and `stakedAmount`. `stakedAmount` is the pegged amount that a deposit staked, and it is the cost basis of the earned value.
- The lifecycle `status`, and the timestamp and transaction hash of each step.

### Fair-market-value data

Two more entities support the FMV cost basis of share tokens that a wallet gets without a deposit (see `schema.graphql`):

- **`ShareTransfer`**: wallet-to-wallet share OFT transfers on Hemi. The handler skips mints, burns, and the transfers to and from the Router.
- **`RateSnapshot`**: the share-to-asset rate (`rateNumerator`/`rateDenominator`) of each processed deposit and redeem. It gives an approximate vault `convertToAssets` value at a past timestamp, without a read on the other chain.

### `initiator`

The Router `*Requested` events do not include `msg.sender`. The indexer reads the initiator from the transaction (`event.transaction.from`, set in `field_selection` in `config.yaml`). This is the EOA that sent the transaction. For a direct call, this is the user. For a Safe, this is the owner that executed the transaction. For an ERC-4337 smart account, this is the bundler.

### Addresses

The indexer stores all addresses in lowercase.

## Prerequisites

- **Node** (the version in the repo `.nvmrc`) and **pnpm**.
- **Docker**. Envio runs a local Postgres and Hasura (GraphQL) in Docker. The Envio CLI manages these containers.
- The dependencies: run `pnpm install` from the repo root.
- **An Envio API token** for HyperSync, to run the indexer. Get a free token at <https://envio.dev/app/api-tokens>. Then run `cp .env.example .env` and set `ENVIO_API_TOKEN` in `.env`.

## RPCs

The indexer reads Ethereum from HyperSync, and Hemi from an RPC. These optional env variables set the RPC URLs:

- `ENVIO_RPC_URL_ETH`: the Ethereum fallback RPC. Envio uses it only when HyperSync stops in real-time indexing. The default is `https://ethereum.reth.rs/rpc`.
- `ENVIO_RPC_URL_HEMI`: the Hemi RPC. The default is `https://rpc.hemi.network/rpc`. The public Hemi RPC has a rate limit, so the historical sync is slow with it. Set a private RPC for production.

To set an RPC, set the URL in `.env`.

## Commands

Run these commands from this folder (`subgraphs/hemi-earn-indexer`):

```sh
pnpm dev       # run the indexer locally (codegen → Docker → migrate → index)
pnpm dev -r    # clear the local database and index again from the start block
pnpm stop      # stop the local containers and delete the local database
pnpm codegen   # make the types from config.yaml and schema.graphql (no Docker)
pnpm test      # run the handler tests
```

When the indexer runs, use the GraphQL console to see the data:

- Console: <http://localhost:8080> (default admin secret `testing`)
- Endpoint: `http://localhost:8080/v1/graphql`

## Tests

`pnpm test` runs the handlers in memory with the Envio test indexer. It does not need Docker, a token, or network access.
