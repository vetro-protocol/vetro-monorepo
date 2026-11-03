# veVETRO Subgraph

This subgraph indexes the veVETRO positions, their transfers, and the claims of the veVETRO distributor that minted them, on Hemi and Hemi Sepolia. veVETRO runs the [veHEMI](https://github.com/hemilabs/veHEMI) 2.0.0 code, so it emits the same events.

## Entities

- `VeVetroPosition` (id: veVETRO tokenId): the position, its current `owner` and `status` (`active` or `withdrawn`), and the `claim` that minted it, if any. `unlockTime` is the lock end as the contract stores it, rounded down to `SIX_DAYS` (not the effective end under auto-relock). A position is transferable when `transferableAfter <= now`.
- `PositionTransfer`: a transfer of a position between two accounts. Mints, burns and self-transfers are not recorded.
- `Claim` (id: transaction hash and log index): a claim of the distributor, with the veVETRO position it minted and the veHEMI positions it paid.
- `ClaimedVeHemiPosition` (id: veHEMI tokenId): a veHEMI position paid by a claim, with its weight and share.

## Local dev & test

Run the unit tests:

```sh
pnpm run test
```

To test against a local deployment of the contracts, start an anvil node on port 8545 with chain id 31337, deploy the contracts, and start the graph-node of [`subgraph`](../../subgraph/README.md) (`docker compose up --detach` in that folder). Then add a `mainnet` entry to `networks.json` with the deployed addresses and blocks, and deploy:

```sh
pnpm run create-local
pnpm run deploy-local --network mainnet
```

Do not commit the `mainnet` entry, or the addresses that `--network` writes into `subgraph.yaml`. After restarting anvil, delete `subgraph/data/postgres`, because the new chain has a different genesis block.

Use the GraphQL explorer at `http://localhost:8000/subgraphs/name/ve-vetro-subgraph`.

Sample query:

```graphql
query {
  claims(where: { claimant: "0x0000000000000000000000000000000000000001" }) {
    amount
    position {
      id
      owner
      unlockTime
    }
    transactionHash
    veHemiPositions {
      id
      share
    }
  }
}
```

## Release

Deploying to the Subgraph Studio projects `ve-vetro-subgraph-hemi` and `ve-vetro-subgraph-hemi-sepolia` runs on `ve-vetro-subgraph@<version>` releases. After merging a version bump, sign the tag on the merge commit with `pnpm run tag` and publish a release from it.
