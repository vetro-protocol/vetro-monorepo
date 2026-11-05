# Vetro App Subgraph

This subgraph indexes the events in the Ethereum mainnet chain that will allow the [API](../../api/README.md) provide information to the [web app](../../web).

## Local dev & test

Run the unit tests:

```sh
pnpm run test
```

To deploy the subgraph locally, start the [local graph-node](../README.md#local-graph-node) with an Ethereum mainnet RPC in `ETHEREUM_RPC_URL`, and run:

```sh
pnpm run create-local
pnpm run deploy-local
```

Use the GraphQL explorer at `http://localhost:8000/subgraphs/name/vetro-app-subgraph`.

Sample query:

```graphql
query {
  _meta {
    block {
      number
    }
  }
  exitTickets {
    owner
    assets
    claimableAt
  }
}
```

Sample response:

```jsonc
{
  "data": {
    "_meta": {
      "block": {
        "number": 24000000,
      },
    },
    "exitTickets": [
      {
        "owner": "0x0000000000000000000000000000000000000001",
        "assets": "1000000000000000000",
        "claimableAt": "1769731200",
      },
      // ...many more events...
    ],
  },
}
```

## Deployment

The first deployment was done manually by [@jcvernaleo](https://github.com/jcvernaleo).

For subsequent deployments, publish a `vetro-app-subgraph@<version>` release as described in the [subgraphs README](../README.md#release).
Once the subgraph is deployed, ask [@jcvernaleo](https://github.com/jcvernaleo) to publish it.
