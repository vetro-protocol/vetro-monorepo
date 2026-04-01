---
name: react-query-use-query
description: Create, modify, or validate React Query useQuery hooks following project best practices below. Handles creating new hooks, updating existing ones, and validating hooks against standards. Use this skill whenever working with useQuery hooks, even for multiple hooks at once.
---

# React Query useQuery Hook Skill

## Overview

This skill helps you CREATE, MODIFY, and VALIDATE React Query `useQuery` hooks following the project's best practices. Use this skill whenever working with useQuery hooks, even for multiple hooks at once. It operates in three modes:

- **CREATE MODE**: Generate new hooks with proper structure, types, and fetchers when needed
- **MODIFY MODE**: Update existing hooks while preserving patterns and maintaining compliance
- **VALIDATE MODE**: Check hooks against best practices and report violations with fixes

**Scope**: Only `useQuery` hooks (not mutations)
**Target directory**: `web/src/hooks/`
**Fetchers directory**: `web/src/fetchers/`

## Best Practices Reference

These practices MUST be followed:

1. **Use @tanstack/react-query**: Custom hooks use `useQuery` and return the output directly for flexibility
2. **One file, one function, one useQuery**: Each file contains only one function with one `useQuery` call, unless input depends on other hooks
3. **Single object parameter**: Hooks accept one parameter which is an object containing all needed variables
4. **queryKey naming**: Keys start with a kebab-case string representing the key name, sorted from generic to specific
   - Example: `['user-balance', listVariable, detailVariable, filterVariable]`
5. **Exportable queryKey function**: Always create a `queryKey` function for consistency. Export it only if it will be used elsewhere (e.g., for query invalidation with `queryClient` in mutations)
6. **Always use arrays**: Use arrays for `queryKey` even if only one parameter
7. **Simple queryFn**: Keep `queryFn` simple (one inline call). Complex logic goes in `web/src/fetchers/`

## Mode Detection

Detect the mode based on user's request:

- **CREATE**: Keywords like "create", "add", "new", "implement", "build", "write" + hook/query/useQuery mention
- **MODIFY**: Keywords like "update", "modify", "change", "fix", "refactor" + existing file reference
- **VALIDATE**: Keywords like "check", "validate", "review", "lint"

## TypeScript Templates

### Template A: Simple Hook (No Dependencies)

Use when the hook doesn't depend on data from other hooks. Note: In web3/blockchain contexts, most hooks need at least a client hook (like `usePublicClient`), which would make them Template B.

```typescript
import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

export const [hookName]QueryKey = ({ [params] }: { [params]: [Type] }) => [
  '[kebab-case-name]',
  [params],
]

export const [hookName] = ({ [params] }: { [params]: [Type] }) =>
  useQuery({
    queryKey: [hookName]QueryKey({ [params] }),
    queryFn: () => [fetcherCall]([params]),
  })
```

### Template B: Hook with Dependencies

Use when the hook needs data from other hooks (e.g., `usePublicClient`, `useAccount`). Most web3 hooks follow this pattern.

```typescript
import { useQuery } from '@tanstack/react-query'
import { [dependencyHook] } from 'hooks/[dependencyHook]'

export const [hookName]QueryKey = ({
  [params],
  [dependentData]
}: {
  [params]: [Type]
  [dependentData]: [Type]
}) => [
  '[kebab-case-name]',
  [params],
  [dependentData],
]

export const [hookName] = function({ [params] }: { [params]: [Type] }) {
  const { data: [dependentData] } = [dependencyHook]()

  return useQuery({
    queryKey: [hookName]QueryKey({ [params], [dependentData]: [dependentData]! }),
    queryFn: () => [fetcherCall]({ [params], [dependentData]: [dependentData]! }),
    enabled: !![dependentData],
  })
}
```

### Template C: Fetcher (Complex Logic)

Use when queryFn would be too complex. Place in `web/src/fetchers/[fetcherName].ts`.

```typescript
import type { Address, Client } from 'viem'

export const [fetcherName] = async function({
  client,
  [params],
}: {
  client: Client
  [params]: [Type]
}) {
  // Complex logic: multiple operations, data transformations
  return result
}
```

## Implementation Workflows

### CREATE Mode Workflow

1. **Gather Requirements** (if not provided, ask):
   - Hook name (e.g., "useMintFee")
   - Data source (e.g., gateway action, API endpoint)
   - Parameters needed (e.g., gatewayAddress, chainId)
   - Dependencies on other hooks (e.g., usePublicClient)

2. **Determine Fetcher Need**:
   - Simple call → Use Template A or B
   - Multiple operations or transformations → Create fetcher with Template C

3. **Create Fetcher** (if needed):
   - File: `web/src/fetchers/[fetcherName].ts`
   - Use proper TypeScript types
   - Handle multiple async operations
   - Return transformed data

4. **Create Hook**:
   - File: `web/src/hooks/[hookName].ts`
   - Generate exportable `queryKey` function
   - Use correct template based on dependencies
   - Apply proper TypeScript types
   - Add `enabled` conditions for optional dependencies

### MODIFY Mode Workflow

1. **Read Existing Hook**: Use Read tool to get current implementation
2. **Identify Changes**: Understand what needs modification
3. **Preserve Patterns**: Keep existing naming conventions and structure
4. **Ensure Exportability**: Maintain or add exportable `queryKey` function
5. **Re-validate**: Check against all best practices
6. **Apply Changes**: Use Edit tool for precise modifications

### VALIDATE Mode Workflow

1. **Read Hook File(s)**: Read specified files or scan `web/src/hooks/`
2. **Check Each Practice**:
   - ✓ Import from '@tanstack/react-query'
   - ✓ Returns `useQuery` result directly
   - ✓ One `useQuery` per file
   - ✓ Single object parameter
   - ✓ queryKey array starts with kebab-case string
   - ✓ queryKey ordered generic to specific
   - ✓ Exportable queryKey function exists
   - ✓ queryFn is simple inline call
3. **Report Violations**: List issues with line references
4. **Suggest Fixes**: Provide specific code changes

## Naming Conventions

| Element             | Pattern                         | Example                 |
| ------------------- | ------------------------------- | ----------------------- |
| Hook name           | `use[Feature][Action]`          | `useMintFee`            |
| Query key function  | `[Feature][Action]QueryKey`     | `mintFeeQueryKey`       |
| Fetcher name        | `fetch[Feature][Action]`        | `fetchUserPortfolio`    |
| Query key string    | `[feature]-[action]` kebab-case | `'mint-fee'`            |
| File name (hook)    | `use[Feature][Action].ts`       | `useMintFee.ts`         |
| File name (fetcher) | `fetch[Feature][Action].ts`     | `fetchUserPortfolio.ts` |

## Examples

### Example 1: Hook with Another Hook Dependency

```typescript
// File: web/src/hooks/useMintFee.ts
import { useQuery } from "@tanstack/react-query";
import { getMintFee } from "@vetro-protocol/gateway/actions";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";

export const mintFeeQueryKey = ({
  gatewayAddress,
}: {
  gatewayAddress: Address;
}) => ["mint-fee", gatewayAddress];

export const useMintFee = function ({
  gatewayAddress,
}: {
  gatewayAddress: Address;
}) {
  const client = usePublicClient();

  return useQuery({
    enabled: !!client,
    queryKey: mintFeeQueryKey({ gatewayAddress }),
    queryFn: () => getMintFee(client!, { address: gatewayAddress }),
  });
};
```

### Example 2: Hook with Complex Logic (Needs Fetcher)

```typescript
// File: web/src/fetchers/fetchUserPortfolio.ts
import { getMintFee, getRedeemFee } from "@vetro-protocol/gateway/actions";
import type { Address, PublicClient } from "viem";

export const fetchUserPortfolio = async function ({
  client,
  gatewayAddress,
}: {
  client: PublicClient;
  gatewayAddress: Address;
}) {
  const mintFee = await getMintFee(client, { address: gatewayAddress });
  const redeemFee = await getRedeemFee(client, {
    address: gatewayAddress,
    mintFee,
  });

  return { mintFee, redeemFee };
};

// File: web/src/hooks/useUserPortfolio.ts
import { useQuery } from "@tanstack/react-query";
import { fetchUserPortfolio } from "fetchers/fetchUserPortfolio";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";

export const useUserPortfolioQueryKey = ({
  gatewayAddress,
}: {
  gatewayAddress: Address;
}) => ["user-portfolio", gatewayAddress];

export const useUserPortfolio = function ({
  gatewayAddress,
}: {
  gatewayAddress: Address;
}) {
  const client = usePublicClient();

  return useQuery({
    queryKey: useUserPortfolioQueryKey({ gatewayAddress }),
    queryFn: () =>
      fetchUserPortfolio({
        client: client!,
        gatewayAddress,
      }),
    enabled: !!client,
  });
};
```

### Example 3: Hook with Dependencies

```typescript
// File: web/src/hooks/useUserBalanceDetails.ts
import { useQuery } from "@tanstack/react-query";
import { getBalanceDetails } from "@vetro-protocol/gateway/actions";
import type { Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";

export const useUserBalanceDetailsQueryKey = ({
  account,
  gatewayAddress,
}: {
  account: Address;
  gatewayAddress: Address;
}) => ["user-balance-details", gatewayAddress, account];

export const useUserBalanceDetails = ({
  gatewayAddress,
}: {
  gatewayAddress: Address;
}) => {
  const { address: account } = useAccount();
  const client = usePublicClient();

  return useQuery({
    queryKey: useUserBalanceDetailsQueryKey({
      account: account!,
      gatewayAddress,
    }),
    queryFn: () =>
      getBalanceDetails(client!, {
        address: gatewayAddress,
        args: [account!],
      }),
    enabled: !!client && !!account,
  });
};
```

## Validation Checklist

Use this checklist when validating hooks:

- [ ] Import from '@tanstack/react-query'
- [ ] Hook returns `useQuery` result directly (not destructured)
- [ ] Only one `useQuery` per file (or dependencies justified)
- [ ] Single object parameter with typed properties
- [ ] `queryKey` is an array starting with kebab-case string
- [ ] `queryKey` ordered generic to specific
- [ ] `queryKey` function exists (named `[hookName]QueryKey`). Always create it for consistency, export it only if used elsewhere for query invalidation.
- [ ] `queryFn` is single inline call (or fetcher created for complex logic)
- [ ] Proper TypeScript types (import from 'viem', etc.)
- [ ] Proper `enabled` conditions for optional dependencies
- [ ] File named: `use[Feature][Action].ts`

## Edge Cases & Guidelines

### When to Create a Fetcher

Create a fetcher in `web/src/fetchers/` when:

- Need multiple async operations that are run in sequence (one depends on another)
- Data transformation/mapping required
- Complex conditional logic
- Multiple API/contract calls that need to be combined or processed

Keep `queryFn` simple when:

- Single contract read
- Single API call
- Direct data return with no transformation
- Only a few independent calls that can run all in parallel (e.g., `Promise.all([call1(), call2()])` with simple return)

### Handling Optional Parameters

Use `enabled` condition:

```typescript
return useQuery({
  enabled: !!value, // Only run when value exists
  queryKey: useMyHookQueryKey({ value: value! }),
  queryFn: () => fetchData(value!),
});
```

### Dependent Queries

When query depends on data from another hook:

```typescript
const { data: dependency } = useDependency();

return useQuery({
  queryKey: useMyHookQueryKey({ dependency: dependency! }),
  queryFn: () => fetchData(dependency!),
  enabled: !!dependency, // Wait for dependency
});
```

### Error Handling

- **Don't add custom error handling**: React Query handles errors via its return values
- Users can destructure `{ error, isError }` from the hook
- Let React Query manage retry logic

### Query Options

- **Don't set `staleTime`** unless user explicitly requests it
- **Don't set `refetchInterval`** unless user explicitly requests it
- **Do set `enabled`** for conditional queries with dependencies

### Common Dependencies

Frequently used hooks from wagmi:

- `usePublicClient()`: For read operations
- `useWalletClient()`: For write operations (but not in useQuery)
- `useAccount()`: For user address
- `useChainId()`: For current chain

### Common Types

Import from `viem`:

```typescript
import type { Address, PublicClient, WalletClient, Client } from "viem";
```

### Wagmi Hooks

Import from `wagmi`:

```typescript
import { usePublicClient, useAccount, useChainId } from "wagmi";
```

### Base URL Imports

The project has baseUrl configured in tsconfig, which allows importing from configured paths without relative paths.

**ALWAYS use clean imports:**

```typescript
// ✓ Correct - use baseUrl imports
import { fetchUserPortfolio } from "fetchers/fetchUserPortfolio";
import { useMintFee } from "hooks/useMintFee";

// ✗ Wrong - don't use relative paths
import { fetchUserPortfolio } from "../fetchers/fetchUserPortfolio";
import { useMintFee } from "./useMintFee";
```

## Instructions for Agent

When this skill is invoked:

1. **Detect Mode**: Identify whether this is CREATE, MODIFY, or VALIDATE based on user request

2. **CREATE Mode**:
   - Ask for missing information (hook name, data source, parameters, dependencies)
   - Determine if fetcher is needed
   - Create fetcher file first if needed at `web/src/fetchers/[name].ts`
   - Create hook file at `web/src/hooks/[hookName].ts`
   - Follow template structure
   - Ensure all best practices are met
   - Use proper naming conventions
   - Apply project code style

3. **MODIFY Mode**:
   - Read the existing hook file
   - Understand requested changes
   - Preserve existing patterns
   - Make minimal changes
   - Ensure compliance with best practices
   - Re-validate after changes

4. **VALIDATE Mode**:
   - Read specified file(s) or scan hooks directory
   - Check against all 7 best practices
   - Report violations with file:line references
   - Suggest specific fixes with code examples
   - Provide severity (error vs warning)

5. **Always**:
   - Use Read tool before Write/Edit
   - Use proper TypeScript types
   - Follow project style (no semicolons, single quotes)
   - Create queryKey functions always, export only if needed for query invalidation

## Example Invocations

**CREATE Examples**:

- "Create a hook for getting mint fee from gateway"
- "Add a hook that fetches user balance with address and gateway address"
- "Create useRedeemFee hook"

**MODIFY Examples**:

- "Update useMintFee to also accept chainId parameter"
- "Change useUserBalance to use a fetcher instead"
- "Modify useGatewayInfo to export its queryKey"

**VALIDATE Examples**:

- "Validate all hooks in web/src/hooks/"
- "Check if useMintFee follows best practices"
- "Review useUserBalance and suggest improvements"
