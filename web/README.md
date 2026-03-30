# Web

Vetro is a DeFi web application built on the [Hemi](https://hemi.xyz) network. It provides a unified interface for swapping tokens, earning yield, borrowing, and bridging assets.

Built with React, Viem, Wagmi, and Tailwind CSS.

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
