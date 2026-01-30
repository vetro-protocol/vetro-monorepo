# Vetro Monorepo

A pnpm-based monorepo for the Vetro project.

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

- `packages/*` - Shared packages
- `web` - Web application
