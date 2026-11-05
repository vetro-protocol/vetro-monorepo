# Subgraphs

This folder contains the indexers of the monorepo:

- [`hemi-earn-indexer`](./hemi-earn-indexer/README.md) - Envio indexer for the Hemi Earn cross-chain requests
- [`ve-vetro-subgraph`](./ve-vetro-subgraph/README.md) - Subgraph indexing the veVETRO positions and claims on Hemi
- [`vetro-app-subgraph`](./vetro-app-subgraph/README.md) - Subgraph indexing Ethereum mainnet events for the API

The Envio indexer has its own setup; see its README. The rest of this document applies to the subgraphs.

## Local graph-node

The `docker-compose.yml` file in this folder starts a [graph-node](https://github.com/graphprotocol/graph-node), a PostgreSQL instance, and an IPFS node. Set the chain to index, in a `.env` file in this folder or in the environment, and start the services:

```sh
# NETWORK_NAME must match the network of the subgraph to deploy (default: mainnet)
# ETHEREUM_RPC_URL defaults to a local node at http://host.docker.internal:8545
NETWORK_NAME=mainnet ETHEREUM_RPC_URL=<rpc-url> docker compose up --detach
```

`POSTGRES_USER` and `POSTGRES_PASSWORD` are also available. The services store their data in `data/`. Delete `data/postgres` to index a different chain, or a chain that was restarted (e.g. anvil), because the genesis block changes.

From the folder of a subgraph, create and deploy it:

```sh
pnpm run create-local
pnpm run deploy-local
docker compose --file ../docker-compose.yml logs --follow
```

The GraphQL explorer of each subgraph is at `http://localhost:8000/subgraphs/name/<subgraph-name>`.

## Release

The subgraphs are deployed to the Subgraph Studio when a `<subgraph-name>@<version>` release is published (see [`subgraph-deployment.yml`](../.github/workflows/subgraph-deployment.yml)). The version label of the deployment is the `version` of the `package.json`, so bump it first.

After the version bump is merged to `master`, sign the tag on the merge commit by running `pnpm run tag` in the subgraph folder, push it, and publish a release from it.
