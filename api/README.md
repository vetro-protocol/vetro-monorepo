# Vetro API

Service that provides data to the Vetro web application.

## Data endpoints

### `GET /variable-stake/apy`

Returns the APY of the Vetro vault calculated using the share value variations over the last 7 days.

#### Response

```jsonc
{
  "7d": 100, // 100 = 1%
}
```

### `GET /variable-stake/rewards/:address`

Returns all user's rewards from the Merkl campaigns related to Vetro.

#### Response

```jsonc
[
  {
    "amount": "1000000000000000000",
    "breakdowns": [
      // ...
    ],
    "claimed": "0",
    "distributionChainId": 1,
    "pending": "0",
    "proofs": [
      // ...
    ],
    "recipient": "0x0000000000000000000000000000000000000001",
    "root": "0x...",
    "token": {
      "symbol": "sVUSD",
      // All other token props
    },
  },
  // ...more rewards
]
```

### `GET /variable-stake/exit-tickets/:address`

Returns all user's variable stake exit tickets to i.e. allow claiming the withdrawn VUSD.

#### Response

```jsonc
[
  {
    "requestId": "1",
    "requestTxHash": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "owner": "0x0000000000000000000000000000000000000001",
    "assets": "1050000000000000000",
    "shares": "1000000000000000000",
    "claimableAt": 1700000000,
    // Optionally: cancelTxHash, claimTxHash and receiver address
  },
]
```

## Configuration

Environment variables are configured in `wrangler.jsonc`.
Secrets are set separately using the Wrangler CLI.

| Variable              | Description                                   | Default                 |
| --------------------- | --------------------------------------------- | ----------------------- |
| MERKL_OPPORTUNITY_ID  | The Merkl opportunity id to look for rewards. |                         |
| ORIGINS               | Comma-separated list of allowed origins. (1)  | `http://localhost:5173` |
| SUBGRAPH_API_KEY      | The subgraph API key.                         |                         |
| SUBGRAPH_ID           | The subgraph id.                              |                         |
| SUBGRAPH_URL_TEMPLATE | The subgraph URL template. (2)                | (localhost)             |

(1) Globs with stars (`*`) are supported. I.e. `https://*.hemi.xyz` will match any subdomain or subdomain chain.
(2) API key and id are replaced in the template at the `$API_KEY` and `$ID` positions.

## Local development

Set secrets in a `.dev.vars` environment variables file.
Then start the local Cloudflare Workers dev server:

```sh
pnpm dev
```

## Deployment

Set the production secret (once):

```sh
pnpm secret:set
```

Deploy to Cloudflare Workers:

```sh
pnpm deploy
```

View real-time logs:

```sh
pnpm logs
```
