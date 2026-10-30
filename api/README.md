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

Get the composition of the treasury by whitelisted token for a given gateway. Each item of `activeStrategies` has the strategy `address`, its `name`, its `totalDebt`, its `apy` (a percentage), and its `source` (the protocol position that it holds). The `apy` is the current native APY that the protocol of the strategy reports, plus the live APR of its incentives (Merkl campaigns and StakeDAO rewards). The `apy` is omitted when one of its sources fails, and the `source` is omitted when it is not known. Cached for 5 minutes.
`:gatewayAddress` must be a known gateway address. Returns `400` if malformed and `404` if the address is not a whitelisted gateway.

#### Sample Response

```json
[
  {
    "activeStrategies": [
      {
        "address": "0xe53c583767923E3e209ce6FD91f6C5D12AE9A308",
        "apy": 3.269585328484523,
        "name": "Morpho SkyMoney USDT Savings",
        "source": {
          "protocol": "morpho",
          "vaultAddress": "0x23f5E9c35820f4baB695Ac1F19c203cC3f8e1e11"
        },
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
        "address": "0x861a314511cCa4eDC279523De2aC1e1Ae9F6f799",
        "apy": 6.6709554609169555,
        "name": "Morpho AlphaPing USDC Core",
        "source": {
          "protocol": "morpho",
          "vaultAddress": "0x55C1B6e461a6334B567bAF0FEb5D728715446f05"
        },
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

### `GET /analytics/tvl-history/:gatewayAddress/:period`

Returns the daily TVL history for a gateway's pegged token: the circulating supply, plus the Treasury's withdrawable holdings per whitelisted token. One record per UTC day, plus a live point for today.
Valid periods are: `"1w"`, `"1m"`, `"3m"` and `"1y"`.
`:gatewayAddress` must be a known gateway address. Returns `400` if malformed or the period is invalid, and `404` if the address is not a whitelisted gateway.

#### Sample response

For the VUSD gateway, whose peg unit is USD:

```jsonc
[
  {
    "pegBaseUsdPrice": 1,
    "peggedTokenAddress": "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3",
    "timestamp": 1788998400000,
    "tokens": [
      {
        "price": "99991000",
        "tokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "unitPrice": "100000000",
        "withdrawable": "258609609875",
      },
      // ...one entry per whitelisted token...
    ],
    "totalSupply": "443736408129313428461563",
  },
  // ...one record per day...
]
```

The vetBTC gateway returns the same shape with that day's BTC price, e.g. `"pegBaseUsdPrice": 77248.73`.

`pegBaseUsdPrice` is `null` when the Portal price API fails for a gateway whose peg unit is not USD. A token's `price` and `unitPrice` are `null` for a day on which the oracle read failed.

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

### `GET /hemi-earn/cost-basis/:address`

Returns the cost basis of each Hemi Earn share token that the address holds. Cached for 30 seconds.
`:address` must be a well-formed Ethereum address. Returns `404` if malformed.
Returns `502` if the Hemi Earn indexer fails or is not configured.

The API replays the processed deposits and redeems of the address, and its share token transfers, in time order:

- A deposit adds its staked pegged amount when it is processed.
- A transfer in adds its value at the share-to-asset rate nearest in time to the transfer.
- A redeem or a transfer out reduces the cost basis in proportion to the shares that leave.

The keys are the checksummed share token addresses on Hemi. The values are decimal strings in the pegged token's base units. A value can have a fractional part after a proportional reduction. The response has only the share tokens with a balance above zero, so `costBasis` is `{}` when the address has no position.

#### Sample Response

```json
{
  "costBasis": {
    "0x0000000000000000000000000000000000000002": "1010000000000000000"
  }
}
```

### `GET /hemi-earn/requests/:address`

Returns the Hemi Earn requests (deposits and redeems) that the address initiated, newest first. Cached for 10 seconds.
`:address` must be a well-formed Ethereum address. Returns `404` if malformed.
Returns `502` if the Hemi Earn indexer fails or is not configured.

- `asset` and `receiver` are in the checksummed format.
- `automatic` is `true` when the indexer has no value for it yet.
- `status` is `FAILED` when `failed` is `true` and the request is `PENDING`. Otherwise, `status` is the Router status: `PENDING`, `FULFILLED`, `CANCELLED`, `FINALIZED` or `RECOVERED`.
- `failed` is the raw flag of the Agent. It can be `true` on a `CANCELLED` or `RECOVERED` request.
- The amounts and the timestamps are strings. The timestamps are in seconds.

`requests` is `[]` when the address has no request.

#### Sample Response

```json
{
  "requests": [
    {
      "amountIn": "1000000000000000000",
      "amountOut": "1000000000000000000",
      "asset": "0x0000000000000000000000000000000000000003",
      "automatic": true,
      "cancellationRequested": false,
      "claimableAt": "1759162900",
      "claimTxHash": "0x0000000000000000000000000000000000000000000000000000000000000002",
      "failed": false,
      "failureReason": null,
      "kind": "DEPOSIT",
      "processedAt": "1759162850",
      "processTxHash": "0x0000000000000000000000000000000000000000000000000000000000000003",
      "receivedAt": "1759162830",
      "receiver": "0x0000000000000000000000000000000000000001",
      "recoverTxHash": null,
      "requestedAt": "1759162804",
      "requestId": "6",
      "requestTxHash": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "retryCount": 0,
      "status": "FINALIZED"
    }
  ]
}
```

### `GET /hemi-earn/terms`

Returns the current Hemi Earn Terms, which a wallet must accept (by signing an EIP-712 message) before its first deposit, and again whenever the version changes.
The Terms are configured through the `HEMI_EARN_TERMS_*` variables, so publishing a new version needs no frontend change.
The response also has everything else needed to sign the acceptance (see `POST /hemi-earn/terms/acceptance`), so frontends don't need to hardcode it.
The response is never cached, so a version change applies immediately.

#### Sample Response

```jsonc
{
  "domain": {
    "chainId": 43111,
    "name": "Vetro Terms Acceptance",
    "version": "1",
  },
  "primaryType": "TermsAcceptance",
  "statement": "I agree to the Vetro Terms of Use, …",
  "termsHash": "0x1111111111111111111111111111111111111111111111111111111111111111", // keccak256 of the Terms document
  "termsUrl": "https://vetro.org/terms-of-use",
  "termsVersion": "1",
  "types": {
    "TermsAcceptance": [
      { "name": "statement", "type": "string" },
      { "name": "termsUrl", "type": "string" },
      { "name": "termsHash", "type": "bytes32" },
      { "name": "termsVersion", "type": "string" },
      { "name": "account", "type": "address" },
      { "name": "issuedAt", "type": "uint256" },
    ],
  },
}
```

### `GET /hemi-earn/terms/acceptance/:address`

Returns the version of the Terms that the account last accepted.
Compare it with `termsVersion` from `GET /hemi-earn/terms`: if they differ, the account must accept again.
Only the latest accepted version is kept. The response is never cached.

Returns `404` if the account has never accepted any version (or the address is malformed).

#### Sample Response

```jsonc
{
  "acceptedVersion": "1",
}
```

### `POST /hemi-earn/terms/acceptance`

Records that an account accepted the current Terms.
The API rebuilds the signed message from the request and the current Terms, verifies that `account` signed it, and stores the acceptance, along with a hash of the signed statement.
Only regular wallets (EOAs) are supported for now.

#### Request body

`application/json`:

```jsonc
{
  "account": "0x0000000000000000000000000000000000000001",
  "issuedAt": 1798000000, // Unix time in seconds
  "signature": "0x…",
  "termsVersion": "1",
}
```

The signed EIP-712 message has the `domain`, `primaryType` and `types` returned by `GET /hemi-earn/terms`, currently:

```ts
// Domain
{ chainId: 43111, name: "Vetro Terms Acceptance", version: "1" }

// Types, in this field order
TermsAcceptance: [
  { name: "statement", type: "string" },
  { name: "termsUrl", type: "string" },
  { name: "termsHash", type: "bytes32" },
  { name: "termsVersion", type: "string" },
  { name: "account", type: "address" },
  { name: "issuedAt", type: "uint256" },
]
```

`statement`, `termsUrl`, `termsHash` and `termsVersion` are the ones returned by `GET /hemi-earn/terms`. The `statement` is currently:

> I agree to the Vetro Terms of Use, including the Hemi Earn Terms. Hemi Earn is operated by Vetro Service & Support Corp. My agreement is solely with Vetro. Hemispheres Service & Support (BVI) Ltd., Hemi Labs, Inc. and their affiliates are not parties to it. I am not a U.S. person or otherwise a Restricted Person.

`chainId` is always `43111` (Hemi mainnet), the chain where Hemi Earn deposits are made.

#### Response

Returns `200` with the accepted version, as `GET /hemi-earn/terms/acceptance/:address` does.
Repeating the request for a version the account already accepted is idempotent: it keeps the original record and returns `200` as long as the request is still valid.

```jsonc
{
  "acceptedVersion": "1",
}
```

Errors:

- `400`: the body is not valid JSON or has missing or malformed fields (e.g. a `signature` that is not 65 bytes long).
- `401`: `signature` is not a valid signature of the message by `account`.
- `409`: `termsVersion` is not the current version.
- `413`: the body is too large.
- `422`: `issuedAt` is more than 10 minutes in the past or more than 1 minute in the future.

The API does not rate limit requests: configure a Cloudflare rate limiting rule per IP for `POST /hemi-earn/terms/acceptance` before deploying to production.

### `GET /liquidity/pools`

Returns the DEX pools that hold a VETRO token (a pegged token or its share token), on Curve, Uniswap and Sushi (Ethereum) and BrownFi (Hemi).

- `apr` is the pool APR from trading fees, as a percentage number (e.g. `1.8` means 1.8%). It is `null` when `tvlUsd` is `null`, or when `volumeUsd24h` is `null`.
- `coins` lists each coin of the pool, with its `amount` in the pool in token units (not in raw units). On a range row, `amount` is the part of the pool's liquidity inside the range.
- `tvlUsd` is `null` when a coin of the pool has no USD price.
- `volumeUsd24h` is the trading volume in USD. On Uniswap, Sushi and BrownFi, it covers the last 24 full hours. On a Sushi range row, it is the part of the volume that occurred inside the range. It is `null` when the pool has no USD price for its coins. On Uniswap and Sushi, it is also `null` when the subgraph has no data for the pool (the query failed, or the subgraph has not indexed the pool yet).
- `dexMetadata` is only on the Curve and BrownFi pools. On Curve, it has the `poolId`, the `gaugeAddress` (when the pool has a gauge) and the `lpTokenAddress`. Reward campaigns can target the pool, its gauge or its LP token. On BrownFi, it has `fee` and `overrideFee` as the subgraph gives them, in hundredths of a basis point (`3000` is 0.3%). An `overrideFee` of `0` means that the pool uses `fee`.
- `rewards` includes rewards from Curve gauges, StakeDAO strategies and Merkl campaigns.

By default, the response leaves out each pool with no `rewards` and a `tvlUsd` below 500 or `null`. A pool with any reward (Curve gauge, StakeDAO or Merkl) is always returned. With `includeRanges=true`, the range rows of a pool are returned only if its full-range row is.

Query params:

| Param           | Default | Description                                                                                                                                                                                                                                                 |
| --------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `includeLowTvl` | `false` | When `true`, the response has every pool, including the pools with no rewards and a `tvlUsd` below 500 or `null`. Returns `400` if it is not `true` or `false`.                                                                                             |
| `includeRanges` | `false` | When `true`, the response also has one row for each configured price range of a concentrated-liquidity pool (Sushi today). These rows have the same `address` as the full-range row, and they have a `range`. Returns `400` if it is not `true` or `false`. |

#### Sample Response

```jsonc
[
  {
    "address": "0xC4C5e8edB69100108C428E88329039b715E3AAd1",
    "apr": 5.28,
    "chainId": 1,
    "coins": [
      {
        "address": "0x476310E34D2810f7d79C43A74E4D79405bd7a925", // sVUSD
        "amount": 36894.62,
      },
      {
        "address": "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3", // VUSD
        "amount": 38189.11,
      },
    ],
    "dex": "curve",
    "dexMetadata": {
      "gaugeAddress": "0x737e7700e03A8c451C9B72103554a40760F1B57A",
      "lpTokenAddress": "0xC4C5e8edB69100108C428E88329039b715E3AAd1",
      "poolId": "factory-stable-ng-123",
    },
    "rewards": [
      {
        "apr": 19.07,
        "aprMax": 47.67,
        "source": "curveGauge",
        "sourceMetadata": {
          "gaugeAddress": "0x737e7700e03A8c451C9B72103554a40760F1B57A",
        },
        "tokens": [
          {
            "address": "0xD533a949740bb3306d119CC777fa900bA034cd52", // CRV
            "chainId": 1,
          },
        ],
      },
      {
        "apr": 21.62,
        "source": "stakeDao",
        "sourceMetadata": {
          "strategyKey": "1-0x102a475c8d660fde678d108dcc6d4a2227661af2",
        },
        "tokens": [
          {
            "address": "0xD533a949740bb3306d119CC777fa900bA034cd52",
            "chainId": 1,
          },
        ],
      },
    ],
    "tvlUsd": 73456.18,
    "volumeUsd24h": 0,
  },
  {
    "address": "0x6C2bd2F9711f204E595D334c6B7B672851b7d699",
    "apr": 0.07,
    "chainId": 1,
    "coins": [
      {
        "address": "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3", // VUSD
        "amount": 62755.39,
      },
      {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
        "amount": 40883.95,
      },
    ],
    "dex": "sushi",
    "rewards": [
      {
        "apr": 25.61,
        "source": "merkl",
        "sourceMetadata": {
          "campaignId": "0x4b4af9d20d2e20b9bcf7c85ef6d338b1ff25978b7fda9e77df0fd6f887696c3d",
          "opportunityId": "6762395071463233736",
        },
        "tokens": [
          {
            "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
            "chainId": 1,
          },
        ],
      },
    ],
    "tvlUsd": 110726.31,
    "volumeUsd24h": 442.56,
  },
  // Only with `includeRanges=true`
  {
    "address": "0x6C2bd2F9711f204E595D334c6B7B672851b7d699",
    "apr": 0.11,
    "chainId": 1,
    "coins": [
      {
        "address": "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3",
        "amount": 35104.2,
      },
      {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "amount": 35106.2,
      },
    ],
    "dex": "sushi",
    "range": { "lowerPrice": 0.96, "upperPrice": 1.04 },
    "rewards": [
      // The same rewards as the full-range row
    ],
    "tvlUsd": 70210.4,
    "volumeUsd24h": 442.56,
  },
]
```

### `GET /restricted-countries`

Returns the geo-restricted countries as ISO 3166-1 alpha-2 codes, sorted alphabetically. The Vetro web app blocks access from these countries. The response is not cached, so it always matches the deployed list.

#### Sample Response

```jsonc
{
  "countries": ["AT", "BE", "BG", /* … */ "SK", "US"],
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

Returns the APY for each supported staking vault, indexed by staking vault address. This is a forward-looking figure computed from each vault's `rewardRate` (read from its `YieldDistributor` contract), annualized over the vault's `totalAssets()` and expressed as a continuous-compounding APY. A vault whose drip has ended (or whose rate or total assets are zero) returns a genuine `{ "apy": 0 }`. A vault whose on-chain reads fail (e.g. RPC error or an unconfigured distributor) is **omitted** from the response rather than returned as `0`, so clients can render "-" for it — distinct from a real 0% APY. If every vault's reads fail, the response is `{}`.

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

Returns the historical APY for a staking vault over the given period — the same forward-looking, continuous-compounding figure as `GET /variable-stake/apy`, recorded over time. The subgraph stores one point per UTC day (the day's **maximum** APR, as the rate fluctuates intraday), which this endpoint converts to APY. A live point carrying the vault's current APY (the same value as `GET /variable-stake/apy`) is appended as the last entry so the latest value tracks the current rate rather than the subgraph's daily snapshot, which can lag by up to ~24h; if that value is unavailable, only the subgraph series is returned. The series never has two points on the same UTC day: a live point on a day the subgraph already covers replaces that day's point, or is dropped when the APY is unchanged. Long windows return their full history (`"1y"` is up to ~366 daily points plus the live one).
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

The `owner` and `stakingVaultAddress` fields are returned in the checksummed format.

The `cancelTxHash` and `claimTxHash` fields are optional and mutually exclusive: a
ticket in cooldown or ready to claim has neither, a cancelled ticket has
`cancelTxHash` and a claimed ticket has `claimTxHash`.

#### Sample Response

```jsonc
[
  {
    "requestId": "1",
    "requestTxHash": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "stakingVaultAddress": "0x0000000000000000000000000000000000000002",
    "owner": "0x0000000000000000000000000000000000000001",
    "assets": "1050000000000000000",
    "shares": "1000000000000000000",
    "claimableAt": 1700000000,
    "claimTxHash": "0x0000000000000000000000000000000000000000000000000000000000000004",
  },
]
```

### `POST /contact`

Submit a support request. The contents are emailed to the configured recipient
using the Cloudflare `send_email` binding (the recipient must be a verified
Email Routing destination; the sender address comes from `CONTACT_FORM_SENDER`).
A confirmation email is also sent to the submitter acknowledging their request;
its replies route back to `CONTACT_FORM_RECIPIENT`.

Protected by [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/):
the submission must include a `token` obtained from the widget on the web app,
which is verified server-side. Verification is skipped when `TURNSTILE_SECRET_KEY`
is unset (e.g. local development). Verification is **fail-closed**: if Cloudflare's
siteverify is unreachable or returns a non-OK/non-JSON response, the request is
rejected with `403` rather than let through. When `TURNSTILE_ALLOWED_HOSTNAMES` is
set, the hostname reported by siteverify must also match one of its entries.

#### Request body

`multipart/form-data` with these fields:

| Field      | Type | Notes                                                                             |
| ---------- | ---- | --------------------------------------------------------------------------------- |
| `category` | text | One of the known topics: `swap`, `bridge`, `earn`, `other`.                       |
| `email`    | text | Must be well-formed.                                                              |
| `message`  | text | Non-empty, at most 5000 characters.                                               |
| `token`    | text | Turnstile token; required (and verified) only when `TURNSTILE_SECRET_KEY` is set. |
| `files`    | file | Optional screenshots (repeat the field for multiple). See limits below.           |

Attachments are optional. Each file must be `image/png` or `image/jpeg`; at most
5 files may be attached, and their combined size must not exceed 3.5 MB. Valid
attachments are sent along with the support email as raw binary; the mail
binding base64-encodes them into the message (they are not included in the
submitter's confirmation email). The limit leaves headroom under Cloudflare's
5 MiB total-message cap once the content is base64-encoded.

#### Response

Returns `204 No Content` with an empty body once the support email is sent. The
confirmation email to the submitter is best-effort: if it fails, the failure is
reported to Sentry and the response is still `204`.

Returns `400` for an invalid body / email /
category / message, unsupported or oversized attachments (`Unsupported
attachment type`, `Too many attachments`, `Attachments too large`), or a missing
captcha token, `411` (`Length required`) when the `Content-Length` header is
missing or is not a number, `413` (`Request too large`) when the request body
exceeds the size limit, `403` when captcha verification fails (or cannot be completed —
fail-closed), and `500` if sending the support email fails.

## Configuration

Environment variables are configured in `wrangler.jsonc`.
Secrets are set separately using the Wrangler CLI.

| Variable                    | Description                                                                                                                                                                                                                                                                          | Default                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| CONTACT_FORM_RECIPIENT      | Destination address for contact form emails. Must be a verified Email Routing destination.                                                                                                                                                                                           | `support@vetro.org`       |
| CONTACT_FORM_SENDER         | `from` address for contact form emails. Its domain must be a verified Email Routing sending domain.                                                                                                                                                                                  | `noreply@forms.vetro.org` |
| CUSTOM_RPC_URL_HEMI         | Hemi RPC node URL(s). Overrides `viem`'s default. Several URLs joined by `+` become a fallback transport. `GET /hemi-earn/cost-basis` reads the Router on Hemi with it.                                                                                                              |                           |
| CUSTOM_RPC_URL_MAINNET      | Ethereum RPC node URL(s). Overrides `viem`'s default. Several URLs joined by `+` become a fallback transport.                                                                                                                                                                        |                           |
| HEMI_EARN_INDEXER_API_KEY   | API key of the Hemi Earn indexer. The API sends it as a Bearer token, only when it is set. Set it as a secret. (3)                                                                                                                                                                   |                           |
| HEMI_EARN_INDEXER_URL       | GraphQL URL of the [Hemi Earn indexer](../subgraphs/hemi-earn-indexer/README.md). `GET /hemi-earn/cost-basis/:address` and `GET /hemi-earn/requests/:address` return `502` when it is not set.                                                                                       | (localhost)               |
| HEMI_EARN_TERMS_HASH        | keccak256 hash (32-byte hex) of the current Hemi Earn Terms document. Required by the `/hemi-earn/terms` endpoints, which respond with `500` if it is unset or malformed.                                                                                                            |                           |
| HEMI_EARN_TERMS_URL         | URL of the current Hemi Earn Terms document. Required by the `/hemi-earn/terms` endpoints.                                                                                                                                                                                           |                           |
| HEMI_EARN_TERMS_VERSION     | Version of the current Hemi Earn Terms. Changing it makes every wallet accept again. Bump it whenever the Terms document (and so its hash) changes, or when a new acceptance is needed for any other reason (e.g. a statement change). Required by the `/hemi-earn/terms` endpoints. |                           |
| MERKL_OPPORTUNITY_SVETBTC   | Merkl opportunity id for the sVetBTC staking vault. Optional; if unset, that vault yields no rewards.                                                                                                                                                                                |                           |
| MERKL_OPPORTUNITY_SVUSD     | Merkl opportunity id for the sVUSD staking vault. Optional; if unset, that vault yields no rewards.                                                                                                                                                                                  |                           |
| ORIGINS                     | Comma-separated list of allowed origins. (1)                                                                                                                                                                                                                                         | `http://localhost:5173`   |
| PORTAL_API_URL              | Base URL of the portal API. `GET /analytics/tvl-history` reads the daily and current USD price of a non-USD peg unit (BTC) from it. `GET /liquidity/pools` uses its USD price for a coin of a Uniswap or Sushi pool when the DEX subgraph has no price for that coin.                | `http://localhost:3006`   |
| SENTRY_DSN                  | Sentry DSN. When unset, Sentry is disabled.                                                                                                                                                                                                                                          |                           |
| SUBGRAPH_API_KEY            | The Graph API key. Also used for the BrownFi, Sushi and Uniswap subgraphs of `GET /liquidity/pools`.                                                                                                                                                                                 |                           |
| SUBGRAPH_ID                 | The subgraph id.                                                                                                                                                                                                                                                                     |                           |
| SUBGRAPH_URL                | The VETRO subgraph URL. Use it for a local subgraph. When unset, the API uses The Graph gateway with `SUBGRAPH_API_KEY` and `SUBGRAPH_ID`.                                                                                                                                           | (localhost)               |
| TURNSTILE_ALLOWED_HOSTNAMES | Optional comma-separated hostname allowlist. When set, a Turnstile token whose siteverify `hostname` is not listed is rejected (`403`). Unset (local/staging) skips this check.                                                                                                      |                           |
| TURNSTILE_SECRET_KEY        | Cloudflare Turnstile secret key for verifying `POST /contact` tokens. When unset, verification is skipped. (2)                                                                                                                                                                       |                           |
| WEBSITE_URL                 | Public URL of the web app, referenced in the contact form confirmation email.                                                                                                                                                                                                        | `http://localhost:5173/`  |

(1) Globs with stars (`*`) are supported. I.e. `https://*.hemi.xyz` will match any subdomain or subdomain chain.
(2) Per environment: local (`.dev.vars`) and staging (`env.staging.vars`) use Cloudflare's always-passes [test secret](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) `1x0000000000000000000000000000000AA`, since it is public and non-sensitive. Production sets the real key as a Wrangler secret — it is intentionally absent from `env.production.vars` in `wrangler.jsonc`:

```sh
pnpm wrangler secret put TURNSTILE_SECRET_KEY --env production
```

The web app pairs this with the matching **site** key `VITE_TURNSTILE_SITE_KEY` (public; test key `1x00000000000000000000AA` committed in `web/.env` for local/staging, real key injected at build time for production).

The `POST /contact` endpoint also requires a `send_email` binding named `SEND_EMAIL`, configured in `wrangler.jsonc`. Sending only works once the domain is verified and the recipient is added as a destination in Cloudflare Email Routing.

The `/hemi-earn/terms` endpoints store acceptances in a [D1](https://developers.cloudflare.com/d1/) database bound as `DB` in `wrangler.jsonc` (one database per environment). Create the databases, set their ids in `wrangler.jsonc`, and apply the migrations in `migrations/` whenever they change:

```sh
pnpm wrangler d1 migrations apply DB --env staging --remote
pnpm wrangler d1 migrations apply DB --env production --remote
```

Without `--remote`, Wrangler applies them to the local database.

(3) Set the Hemi Earn indexer API key as a Wrangler secret:

```sh
pnpm wrangler secret put HEMI_EARN_INDEXER_API_KEY --env production
```

## Local development

Set secrets in a `.dev.vars` environment variables file.
Apply the migrations to the local database once, with `pnpm wrangler d1 migrations apply DB --local`.
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
