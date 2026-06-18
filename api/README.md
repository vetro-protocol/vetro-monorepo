# Vetro API

Service that provides data to the Vetro web application.

## Data endpoints

### `GET /prices`

Proxies the portal API token prices endpoint. Returns the upstream response as-is on success.

#### Sample response

```json
{
  "prices": {
    "ETH": "2450.12",
    "BTC": "65000.00",
    "USDT": "0.999881",
    "USDC": "1.00009"
  }
}
```

### `GET /analytics/pegged-token-backing/:gatewayAddress`

Get the total strategic reserves and the total surplus for a given gateway's pegged token.
`:gatewayAddress` must be a known gateway address. Returns `400` if malformed and `404` if the address is not a whitelisted gateway.

#### Sample response

```json
{
  "strategicReserves": "10000000000000000000",
  "surplus": "1424707358963452827"
}
```

### `GET /analytics/treasury/:gatewayAddress`

Get the composition of the treasury by whitelisted token for a given gateway.
`:gatewayAddress` must be a known gateway address. Returns `400` if malformed and `404` if the address is not a whitelisted gateway.

#### Sample Response

```json
[
  {
    "activeStrategies": [
      {
        "name": "Morpho SkyMoney USDT Savings",
        "totalDebt": "4021526891"
      }
    ],
    "latestPrice": "99987053",
    "priceDecimals": 8,
    "tokenAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "totalDebt": "4021526891",
    "withdrawable": "4032465582"
  },
  {
    "activeStrategies": [
      {
        "name": "Morpho AlphaPing USDC Core",
        "totalDebt": "234771834"
      }
    ],
    "latestPrice": "99991000",
    "priceDecimals": 8,
    "tokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "totalDebt": "234771834",
    "withdrawable": "260862058"
  }
]
```

### `GET /borrow/:marketId/apr-history/:period`

Returns the historical borrow APR for a given market and period.
Valid periods are: "1w", "1m", "3m" and "1y".
`:marketId` must be a known market id. Returns `400` if malformed and `404` if the market is unsupported.

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
`:marketId` must be a known market id. Returns `400` if malformed and `404` if the market is unsupported.

#### Sample Response

```json
{
  "collateralAssets": 219819281899
}
```

### `GET /variable-stake/cost-basis/:address`

Returns the user's cost basis (in the vault asset's native smallest unit; decimal precision depends on the underlying vault asset) for each known Vetro staking vault. Vaults where the user has no position return `"0"`.
`:address` must be a well-formed Ethereum address. Returns `404` if malformed.

#### Sample Response

```jsonc
{
  "0x476310E34D2810f7d79C43A74E4D79405bd7a925": "1500000000000000000", // sVUSD
  "0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e": "0", // sVetBTC, no position
}
```

### `GET /variable-stake/apy`

Returns the APY for each supported staking vault, indexed by staking vault address, calculated using the share value variations over the last 7 days. Each supported staking vault has an entry in the response; vaults with insufficient history return `{ "7d": 0 }`.

#### Sample Response

```jsonc
{
  "0x476310E34D2810f7d79C43A74E4D79405bd7a925": {
    "7d": 4.21,
  },
  "0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e": {
    "7d": 0,
  },
}
```

### `GET /variable-stake/share-value-history/:stakingVaultAddress/:period`

Returns the historical share value for a staking vault over the given period (Earn token vs underlying pegged token, e.g. sVUSD per VUSD). One entry per UTC day from the subgraph, plus a final point read live from the vault's on-chain `convertToAssets` (one whole share) at request time. The subgraph writes its history once per UTC day, so its latest point can lag the actual share value by up to ~24h; the appended live point keeps the last value in sync with the current exchange rate. Results across multiple subgraph pages are concatenated, so long windows return their full history (e.g. `"1y"` may include up to ~366 entries plus the live point). If the live read fails the series is returned without the appended point.
Valid periods are: `"1w"`, `"1m"`, `"3m"` and `"1y"`.
`:stakingVaultAddress` must be a known staking vault. Returns `400` if malformed and `404` if the address is not a known staking vault.
`shareValue` is a number already pre-scaled by the underlying asset's decimals to a human-readable exchange rate (e.g. `1.000412938421`). `timestamp` is in milliseconds (UTC day-start for subgraph entries, current time for the live point).

#### Sample Response for "1w"

```jsonc
[
  { "shareValue": 1.000412938421, "timestamp": 1707782400000 },
  { "shareValue": 1.000506129482, "timestamp": 1707868800000 },
  // ...more records...
]
```

### `GET /variable-stake/total-deposits-history/:stakingVaultAddress/:period`

Returns the historical total deposits for a staking vault over the given period — the vault's total underlying pegged token holdings (ERC4626 `totalAssets`), i.e. the same value shown as "Pool deposits" on the Earn page. One entry per UTC day from the subgraph, plus a final point read live from the vault's on-chain `totalAssets()` at request time. The subgraph writes its history once per UTC day, so its latest point can lag actual TVL by up to ~24h; the appended live point keeps the last value in sync with current TVL. Results across multiple subgraph pages are concatenated, so long windows return their full history (e.g. `"1y"` may include up to ~366 entries plus the live point). If the live read fails the series is returned without the appended point.
Valid periods are: `"1w"`, `"1m"`, `"3m"` and `"1y"`.
`:stakingVaultAddress` must be a known staking vault. Returns `400` if malformed and `404` if the address is not a known staking vault.
`totalDeposits` is the raw `uint256` amount in the pegged token's base units (not pre-scaled); format it with the token's decimals on the client. `timestamp` is in milliseconds.

#### Sample Response for "1w"

```jsonc
[
  { "totalDeposits": "5000000000000000000000", "timestamp": 1707782400000 },
  { "totalDeposits": "5100000000000000000000", "timestamp": 1707868800000 },
  // ...more records...
]
```

### `GET /variable-stake/rewards/:address`

Returns all user's rewards from the Merkl campaigns related to Vetro, indexed by staking vault address. Each supported staking vault has an entry in the response, with an empty array if the user has no rewards for that vault.

#### Sample Response

```jsonc
{
  "0x476310E34D2810f7d79C43A74E4D79405bd7a925": [
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
  ],
  "0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e": [],
}
```

### `GET /variable-stake/exit-queue/:gatewayAddress`

Returns a summary of the exit tickets queue for the gateway's staking vault: the total number of open exit tickets and their combined value in the vault's underlying asset (shares are converted via the vault's exchange rate).
`:gatewayAddress` must be a known gateway address. Returns `400` if malformed and `404` if the address is not a whitelisted gateway.

#### Sample Response

```jsonc
{
  "assets": "4200000000000000000", // pegged token
  "openTickets": 1,
}
```

### `GET /variable-stake/exit-tickets/:address`

Returns all user's variable stake exit tickets to i.e. allow claiming the withdrawn pegged token.

#### Sample Response

```jsonc
[
  {
    "id": "0x...",
    "requestId": "1",
    "requestTxHash": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "stakingVaultAddress": "0x0000000000000000000000000000000000000002",
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

| Variable                  | Description                                                                                           | Default                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------- |
| CUSTOM_RPC_URL_MAINNET    | Ethereum RPC node URL. Overrides `viem`'s default                                                     |                         |
| MERKL_OPPORTUNITY_SVETBTC | Merkl opportunity id for the sVetBTC staking vault. Optional; if unset, that vault yields no rewards. |                         |
| MERKL_OPPORTUNITY_SVUSD   | Merkl opportunity id for the sVUSD staking vault. Optional; if unset, that vault yields no rewards.   |                         |
| ORIGINS                   | Comma-separated list of allowed origins. (1)                                                          | `http://localhost:5173` |
| PORTAL_API_URL            | Upstream portal API base URL for token prices.                                                        | (see wrangler.jsonc)    |
| SUBGRAPH_API_KEY          | The subgraph API key.                                                                                 |                         |
| SUBGRAPH_ID               | The subgraph id.                                                                                      |                         |
| SUBGRAPH_URL_TEMPLATE     | The subgraph URL template. (2)                                                                        | (localhost)             |

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
