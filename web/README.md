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
