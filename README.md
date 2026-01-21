# Vetro Monorepo

A pnpm-based monorepo for the Vetro project.

## Prerequisites

- Node.js v24 (specified in `.nvmrc`)

## Setup

### 1. Enable Corepack

This project uses pnpm 10.28.1, which is automatically managed via Corepack (built into Node.js 16.13+). Simply enable Corepack:

```bash
corepack enable
```

This will ensure you use the correct pnpm version specified in `package.json`.

### 2. Install Dependencies

From the root of the monorepo, run:

```bash
pnpm install
```

This will install all dependencies for the entire monorepo, including all workspace packages.

## Workspace Structure

The monorepo contains the following workspaces:

- `packages/*` - Shared packages
- `web` - Web application
