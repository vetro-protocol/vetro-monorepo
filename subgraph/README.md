# Vetro App Subgraph

This subgraph indexes the events in the Ethereum mainnet chain that will allow the [API](../api/README.md) provide information to the [web app](../web).

## Local dev & test

Set the `RPC_URL` in a `.env` and start the backend services:

```sh
docker compose up --detach
```

To locally deploy the subgraph, run:

```sh
pnpm run build && pnpm run test
pnpm run create-local && pnpm run deploy-local
docker compose logs --follow | tee out.log
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

The first deployment has to be done manually by @jcvernaleo.

Then, to trigger a new deployment, apply and push a `vetro-app-subgraph@[version]` tag by running `npm run tag`.
Once the subgraph is deployed and indexed, ask @jcvernaleo for publishing.
