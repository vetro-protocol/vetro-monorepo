# Vetro API

Service that provides data to the Vetro web application.

## Data endpoints

### `GET /analytics/collateralization-ratio/:gatewayAddress`

Get the collateralization ratio for a given gateway's pegged token: the total backing value divided by the circulating supply. The backing is the sum of the strategic reserves, the protocol surplus and the liquid Treasury reserves (whitelisted holdings valued in the pegged token). Cached for 5 minutes.
`:gatewayAddress` must be a known gateway address. Returns `400` if malformed and `404` if the address is not a whitelisted gateway.
The monetary fields (`strategicReserves`, `supply`, `surplus`, `total`, `treasuryTotal`) are raw `uint256` amounts in the pegged token's base units (not pre-scaled); format them with the token's decimals on the client. `ratio` is a number: the percentage `(total / supply) * 100` (e.g. `100.04`), or `0` when supply is `0`.

#### Sample response

```json
{
  "ratio": 100.04,
  "strategicReserves": "10000000000000000000",
  "supply": "11425000000000000000000000",
  "surplus": "1424707358963452827",
  "total": "11430000004707358963452827",
  "treasuryTotal": "11429988580000000000000000"
}
```

### `GET /analytics/tvl/:gatewayAddress`

Get the TVL for a given gateway's pegged token: its circulating supply (the minted total supply).
`:gatewayAddress` must be a known gateway address. Returns `400` if malformed and `404` if the address is not a whitelisted gateway.
`minted` is a raw `uint256` amount in the pegged token's base units (not pre-scaled).

#### Sample response

```json
{
  "minted": "11425000000000000000000000"
}
```

### `GET /analytics/staked/:gatewayAddress`

Get the staked total for a given gateway's pegged token: the amount deposited into its staking vault (the vault's ERC4626 total assets).
`:gatewayAddress` must be a known gateway address. Returns `400` if malformed and `404` if the address is not a whitelisted gateway.
`staked` is a raw `uint256` amount in the pegged token's base units (not pre-scaled).

#### Sample response

```json
{
  "staked": "4200000000000000000000000"
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

Returns the APY for each supported staking vault, indexed by staking vault address. This is a forward-looking figure computed from the current `rewardRate` read directly from each vault's `YieldDistributor` contract, annualized over the vault's `totalAssets()` and expressed as a continuous-compounding APY. A vault whose drip has ended (or whose rate or total assets are zero) returns a genuine `{ "apy": 0 }`. A vault whose on-chain reads fail (e.g. RPC error or an unconfigured distributor) is **omitted** from the response rather than returned as `0`, so clients can render "-" for it — distinct from a real 0% APY. If every vault's reads fail, the response is `{}`.

#### Sample Response

```jsonc
{
  "0x476310E34D2810f7d79C43A74E4D79405bd7a925": {
    "apy": 9.95,
  },
  "0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e": {
    "apy": 0,
  },
}
```

### `GET /variable-stake/apy-history/:stakingVaultAddress/:period`

Returns the historical APY for a staking vault over the given period — the same forward-looking, continuous-compounding figure as `GET /variable-stake/apy`, recorded over time. The subgraph stores one point per UTC day (the day's **maximum** APR, as the rate fluctuates intraday), which this endpoint converts to APY. A live on-chain point is appended as the last entry so the latest value tracks the current rate rather than the subgraph's daily snapshot, which can lag by up to ~24h; if that read fails, only the subgraph series is returned. The series never has two points on the same UTC day: a live point on a day the subgraph already covers replaces that day's point, or is dropped when the APY is unchanged. Long windows return their full history (`"1y"` is up to ~366 daily points plus the live one).
Valid periods are: `"1w"`, `"1m"`, `"3m"` and `"1y"`.
`:stakingVaultAddress` must be a known staking vault. Returns `400` if malformed and `404` if the address is not a known staking vault.
`apy` is a percentage number (e.g. `9.95` means 9.95%), the same unit as `GET /variable-stake/apy`. `timestamp` is in milliseconds (UTC day-start for subgraph entries, current time for the live point).

#### Sample Response for "1w"

```jsonc
[
  { "apy": 9.81, "timestamp": 1707782400000 },
  { "apy": 9.95, "timestamp": 1707868800000 },
  // ...more records...
]
```

### `GET /variable-stake/share-value-history/:stakingVaultAddress/:period`

Returns the historical share value for a staking vault over the given period (Earn token vs underlying pegged token, e.g. sVUSD per VUSD). One entry per UTC day from the subgraph, plus a final point read live from the vault's on-chain `convertToAssets` (one whole share) at request time. The subgraph writes its history once per UTC day, so its latest point can lag the actual share value by up to ~24h; the appended live point keeps the last value in sync with the current exchange rate. When the subgraph already has a point for the current UTC day, the live point is not added as a duplicate: it is skipped if its share value matches that day's point, or it replaces that day's point if the share value differs, so the series never has two points on the same day. Results across multiple subgraph pages are concatenated, so long windows return their full history (e.g. `"1y"` may include up to ~366 entries plus the live point). If the live read fails the series is returned without the appended point.
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

Returns the historical total deposits for a staking vault over the given period — the vault's total underlying pegged token holdings (ERC4626 `totalAssets`), i.e. the same value shown as "Pool deposits" on the Earn page. One entry per UTC day from the subgraph, plus a final point read live from the vault's on-chain `totalAssets()` at request time. The subgraph writes its history once per UTC day, so its latest point can lag actual TVL by up to ~24h; the appended live point keeps the last value in sync with current TVL. When the subgraph already has a point for the current UTC day, the live point is not added as a duplicate: it is skipped if its total deposits match that day's point, or it replaces that day's point if they differ, so the series never has two points on the same day. Results across multiple subgraph pages are concatenated, so long windows return their full history (e.g. `"1y"` may include up to ~366 entries plus the live point). If the live read fails the series is returned without the appended point.
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

### `POST /contact`

Submit a support request. The contents are emailed to the configured recipient
using the Cloudflare `send_email` binding (the recipient must be a verified
Email Routing destination; the sender address comes from `CONTACT_FORM_SENDER`).

Gated by the `CONTACT_FORM_ENABLED` feature toggle: when it is not `"true"` the
endpoint behaves as if it does not exist and returns `404`.

#### Request body

```json
{
  "category": "swap",
  "email": "user@example.com",
  "message": "Describe what happened (max 5000 characters)."
}
```

`category` must be one of the known topics (`swap`, `bridge`, `earn`,
`other`). `email` must be well-formed. `message` must be non-empty and at most
5000 characters.

#### Response

Returns `204 No Content` with an empty body once the email is sent.

Returns `404` when the feature is disabled, `400` for an invalid body / email /
category / message, and `500` if sending fails.

## Configuration

Environment variables are configured in `wrangler.jsonc`.
Secrets are set separately using the Wrangler CLI.

| Variable                  | Description                                                                                                   | Default                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------- |
| CONTACT_FORM_ENABLED      | Feature toggle for `POST /contact`. When not `"true"`, the endpoint returns `404`.                            | `"false"`               |
| CONTACT_FORM_RECIPIENT    | Destination address for contact form emails. Must be a verified Email Routing destination.                    | `support@vetro.org`     |
| CONTACT_FORM_SENDER       | `from` address for contact form emails. Its domain must be a verified Email Routing sending domain.           | `noreply@vetro.org`     |
| CUSTOM_RPC_URL_MAINNET    | Ethereum RPC node URL(s). Overrides `viem`'s default. Several URLs joined by `+` become a fallback transport. |                         |
| MERKL_OPPORTUNITY_SVETBTC | Merkl opportunity id for the sVetBTC staking vault. Optional; if unset, that vault yields no rewards.         |                         |
| MERKL_OPPORTUNITY_SVUSD   | Merkl opportunity id for the sVUSD staking vault. Optional; if unset, that vault yields no rewards.           |                         |
| ORIGINS                   | Comma-separated list of allowed origins. (1)                                                                  | `http://localhost:5173` |
| SENTRY_DSN                | Sentry DSN. When unset, Sentry is disabled.                                                                   |                         |
| SUBGRAPH_API_KEY          | The subgraph API key.                                                                                         |                         |
| SUBGRAPH_ID               | The subgraph id.                                                                                              |                         |
| SUBGRAPH_URL_TEMPLATE     | The subgraph URL template. (2)                                                                                | (localhost)             |

(1) Globs with stars (`*`) are supported. I.e. `https://*.hemi.xyz` will match any subdomain or subdomain chain.
(2) API key and id are replaced in the template at the `$API_KEY` and `$ID` positions.

The `POST /contact` endpoint also requires a `send_email` binding named `SEND_EMAIL`, configured in `wrangler.jsonc`. Sending only works once the domain is verified and the recipient is added as a destination in Cloudflare Email Routing.

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
