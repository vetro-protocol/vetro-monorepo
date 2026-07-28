# Web

Vetro is a DeFi web application built on the [Hemi](https://hemi.xyz) network. It provides a unified interface for swapping tokens, earning yield, borrowing, and bridging assets.

Built with React, Viem, Wagmi, and Tailwind CSS.

## Environment Variables

Vite only exposes variables prefixed with `VITE_` to the client bundle. Set these in `web/.env` (or a `.env.local` override) before running `dev` or `build`.

| Variable                         | Required | Description                                                                                                 |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `VITE_ANALYTICS_URL`             | No       | Umami tracker script URL. Analytics (page views) is enabled only when this and the website ID are both set. |
| `VITE_ANALYTICS_WEBSITE_ID`      | No       | Umami website ID.                                                                                           |
| `VITE_DEPLOY_ENV`                | No       | Set to `"production"` to hide source maps from browsers. Any other value serves them publicly.              |
| `VITE_PORTAL_API_URL`            | Yes      | Hemi Portal API base URL (used for token prices).                                                           |
| `VITE_RPC_URL_MAINNET`           | No       | RPC URL for Ethereum mainnet. Falls back to viem's default when unset.                                      |
| `VITE_SENTRY_DSN`                | No       | Sentry DSN. When unset, Sentry is disabled.                                                                 |
| `VITE_WALLET_CONNECT_PROJECT_ID` | No       | WalletConnect project ID.                                                                                   |
| `VITE_VETRO_API_URL`             | Yes      | Vetro backend API base URL (analytics, APR history, exit tickets, rewards, etc.).                           |

The following variables are read at build time (not baked into the bundle) and only matter in CI/CD:

| Variable            | Required | Description                                                                  |
| ------------------- | -------- | ---------------------------------------------------------------------------- |
| `SENTRY_AUTH_TOKEN` | No       | Sentry auth token. Required for source map uploads to Sentry during `build`. |

## Scripts

### Local Fork Setup

Fund a test address with some ETH and 100 units of relevant tokens for testing using a local Anvil fork.

**Prerequisites:** A running Anvil fork of Ethereum mainnet.

```bash
anvil --fork-url <mainnet-rpc-url>
```

**Usage:**

```bash
node web/scripts/setup.ts --address 0xYourAddress
```

Options:

| Flag         | Short | Description                       | Default                 |
| ------------ | ----- | --------------------------------- | ----------------------- |
| `--address`  | `-a`  | Target address to fund (required) | —                       |
| `--fork-url` | `-f`  | Anvil RPC URL                     | `http://127.0.0.1:8545` |

### Token Balances

Print the ETH and token balances of an address on a local Anvil fork.

**Usage:**

```bash
node web/scripts/balances.ts --address 0xYourAddress
```

Options:

| Flag         | Short | Description                 | Default                 |
| ------------ | ----- | --------------------------- | ----------------------- |
| `--address`  | `-a`  | Address to check (required) | —                       |
| `--fork-url` | `-f`  | Anvil RPC URL               | `http://127.0.0.1:8545` |

### Update Mint Fee

Update the mint fee for a token on the Gateway contract using a local Anvil fork. Impersonates the contract admin to grant the maintainer role and set the new fee.

**Usage:**

```bash
node web/scripts/updateMintFee.ts --token 0xTokenAddress --fee 100
```

Options:

| Flag        | Short | Description                           | Default                 |
| ----------- | ----- | ------------------------------------- | ----------------------- |
| `--token`   | `-t`  | Token address (required)              | —                       |
| `--fee`     | `-f`  | New mint fee in BPS, 0–500 (required) | —                       |
| `--rpc-url` | `-r`  | Anvil RPC URL                         | `http://127.0.0.1:8545` |

### Update Redeem Fee

Update the redeem fee for a token on the Gateway contract using a local Anvil fork. Impersonates the contract admin to grant the maintainer role and set the new fee.

**Usage:**

```bash
node web/scripts/updateRedeemFee.ts --token 0xTokenAddress --fee 100
```

Options:

| Flag        | Short | Description                             | Default                 |
| ----------- | ----- | --------------------------------------- | ----------------------- |
| `--token`   | `-t`  | Token address (required)                | —                       |
| `--fee`     | `-f`  | New redeem fee in BPS, 0–500 (required) | —                       |
| `--rpc-url` | `-r`  | Anvil RPC URL                           | `http://127.0.0.1:8545` |

### Redeem Delay

Toggle the withdrawal delay for an address on the Gateway contract using a local Anvil fork. Impersonates the contract owner to enable/disable the delay and manage the instant redeem whitelist.

**Usage:**

```bash
node web/scripts/redeemDelay.ts --address 0xYourAddress --delay
node web/scripts/redeemDelay.ts --address 0xYourAddress --no-delay
```

Options:

| Flag         | Short | Description                              | Default                 |
| ------------ | ----- | ---------------------------------------- | ----------------------- |
| `--address`  | `-a`  | Target address (required)                | —                       |
| `--delay`    |       | Enable withdrawal delay for the address  | —                       |
| `--no-delay` |       | Disable withdrawal delay for the address | —                       |
| `--fork-url` | `-f`  | Anvil RPC URL                            | `http://127.0.0.1:8545` |

### Pause or Resume Deposits

Flip a whitelisted token's `depositActive` flag on the gateway's Treasury using a local Anvil fork. Impersonates the treasury owner to grant itself `KEEPER_ROLE`, then sets the flag. While paused, minting from that token is blocked and the Swap CTA reads "Swaps are paused for this token".

**Usage:**

```bash
node web/scripts/setDepositActive.ts --token 0xTokenAddress --pause
node web/scripts/setDepositActive.ts --token 0xTokenAddress --unpause
```

Options (exactly one of `--pause` / `--unpause` is required):

| Flag         | Short | Description                          | Default                  |
| ------------ | ----- | ------------------------------------ | ------------------------ |
| `--token`    | `-t`  | Whitelisted token address (required) | —                        |
| `--pause`    |       | Pause deposits for the token         | —                        |
| `--unpause`  |       | Resume deposits for the token        | —                        |
| `--gateway`  | `-g`  | Gateway address                      | first configured gateway |
| `--fork-url` | `-f`  | Anvil RPC URL                        | `http://127.0.0.1:8545`  |

### Pause or Resume Redeems

Same as above for a whitelisted token's `withdrawActive` flag, which controls whether the Treasury can pay that token out. While paused, the one-step redeem CTA reads "Swaps are paused for this token" and the Redeem Queue's claim drawer reads "Redeems are paused for this token"; sending to the queue is unaffected. The queue row's Redeem button only locks once **every** whitelisted token on the gateway is paused.

**Usage:**

```bash
node web/scripts/setWithdrawActive.ts --token 0xTokenAddress --pause
node web/scripts/setWithdrawActive.ts --token 0xTokenAddress --unpause
```

Options (exactly one of `--pause` / `--unpause` is required):

| Flag         | Short | Description                          | Default                  |
| ------------ | ----- | ------------------------------------ | ------------------------ |
| `--token`    | `-t`  | Whitelisted token address (required) | —                        |
| `--pause`    |       | Pause redeems to the token           | —                        |
| `--unpause`  |       | Resume redeems to the token          | —                        |
| `--gateway`  | `-g`  | Gateway address                      | first configured gateway |
| `--fork-url` | `-f`  | Anvil RPC URL                        | `http://127.0.0.1:8545`  |

### Send a Redeem to the Queue

Queue a redeem of the gateway's pegged token for an address using a local Anvil fork. Impersonates the address to approve the gateway and call `requestRedeem`, so the Redeem Queue can be populated without going through the Swap form. Prints the request's `claimableAt`, which `fastForwardTime.ts` can then be used to step past.

**Usage:**

```bash
node web/scripts/requestRedeem.ts --address 0xYourAddress --amount 2
```

Options:

| Flag         | Short | Description                                | Default                  |
| ------------ | ----- | ------------------------------------------ | ------------------------ |
| `--address`  | `-a`  | Address to queue the redeem for (required) | —                        |
| `--amount`   |       | Pegged token amount to queue (required)    | —                        |
| `--gateway`  | `-g`  | Gateway address                            | first configured gateway |
| `--fork-url` | `-f`  | Anvil RPC URL                              | `http://127.0.0.1:8545`  |
