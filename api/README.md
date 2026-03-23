# Vetro API

Service that provides data to the Vetro web application.

## Data endpoints

### `GET /analytics/totals`

Get the total VUSD minted and staked to calculate the TVL in the protocol.

#### Sample Response

```json
{
  "vusdMinted": "3087191980362376717819",
  "vusdStaked": "916500000000000000000"
}
```

### `GET /analytics/treasury`

Get the composition of the treasury by whitelisted token.

#### Sample Response

```json
[
  {
    "activeStrategies": [
      {
        "name": "Morpho SkyMoney USDT Savings",
        "totalDebt": "5853032"
      }
    ],
    "latestPrice": "100010000",
    "tokenAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "totalDebt": "5853032",
    "withdrawable": "3029900000"
  },
  {
    "activeStrategies": [
      {
        "name": "Morpho AlphaPing USDC Core",
        "totalDebt": "60029"
      }
    ],
    "latestPrice": "99991000",
    "tokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "totalDebt": "60029",
    "withdrawable": "73000000"
  }
]
```

### `GET /borrow/:marketId/apr-history/:period`

Returns the historical borrow APR for a given market and period.
Valid periods are: "1w", "1m", "3m" and "1y".

#### Sample Response for "1m"

```jsonc
[
  {
    "apr": 0.030876974516304074,
    "timestamp": 1773670127000,
  },
  {
    "apr": 0.030186349361423972,
    "timestamp": 1773619200000,
  },
  // ...more records...
  {
    "apr": 0.03401449317460798,
    "timestamp": 1771113600000,
  },
]
```

### `GET /borrow/:marketId/collateral-assets`

Gets the amount of collateral assets in a given Morpho market.

#### Sample Response

```json
{
  "collateralAssets": 219819281899
}
```

### `GET /variable-stake/apy`

Returns the APY of the Vetro vault calculated using the share value variations over the last 7 days.

#### Sample Response

```jsonc
{
  "7d": 100, // 100 = 1%
}
```

### `GET /variable-stake/rewards/:address`

Returns all user's rewards from the Merkl campaigns related to Vetro.

#### Sample Response

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

### `GET /variable-stake/exit-queue`

Returns a summary of the exit tickets queue: the total number of open exit tickets and their combined shares.

#### Sample Response

```jsonc
{
  "openTickets": 1,
  "shares": "4000000000000000000", // sVUSD
}
```

### `GET /variable-stake/exit-tickets/:address`

Returns all user's variable stake exit tickets to i.e. allow claiming the withdrawn VUSD.

#### Sample Response

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

| Variable               | Description                                       | Default                 |
| ---------------------- | ------------------------------------------------- | ----------------------- |
| CUSTOM_RPC_URL_MAINNET | Ethereum RPC node URL. Overrides `viem`'s default |                         |
| MERKL_OPPORTUNITY_ID   | The Merkl opportunity id to look for rewards.     |                         |
| ORIGINS                | Comma-separated list of allowed origins. (1)      | `http://localhost:5173` |
| SUBGRAPH_API_KEY       | The subgraph API key.                             |                         |
| SUBGRAPH_ID            | The subgraph id.                                  |                         |
| SUBGRAPH_URL_TEMPLATE  | The subgraph URL template. (2)                    | (localhost)             |

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
