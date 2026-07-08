# Vetro Monorepo

A pnpm-based monorepo for the Vetro project.

## Documentation

New to the protocol? Start here:

- [`docs/DOMAIN.md`](./docs/DOMAIN.md) — what VETRO is and how each `web/` page works, including how the contracts fit together and how pricing works.
- [`docs/glossary.md`](./docs/glossary.md) — quick lookups for the core vocabulary.

## Prerequisites

- Node.js v24 (specified in `.nvmrc`)

## Setup

### 1. Enable Corepack

This project uses pnpm 10.28.1, which is automatically managed via Corepack (built into Node.js 16.13+). Simply enable Corepack:

```sh
corepack enable
```

This will ensure you use the correct pnpm version specified in `package.json`.

### 2. Install Dependencies

From the root of the monorepo, run:

```sh
pnpm install
```

This will install all dependencies for the entire monorepo, including all workspace packages.

### 3. Enable Figma MCP (Claude Users Only)

If you're using Claude Code, enable the Figma MCP server to access design files:

```sh
/mcp
```

Then authenticate with your Figma account when prompted. The MCP configuration is already set up in `.mcp.json`.

## Workspace Structure

The monorepo contains the following workspaces:

- `api` - Service that provides data to the Vetro web application
- `internal-dashboard` - Internal-facing dashboard for operational metrics
- `packages/*` - Shared packages
- `subgraph` - Subgraph indexing Ethereum mainnet events for the API
- `web` - Web application

In addition, it hosts these additional directories:

- `geo-block` - A static HTML page shown to users in sanctioned countries
