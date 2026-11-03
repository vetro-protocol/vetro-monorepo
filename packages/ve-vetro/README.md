# @vetro-protocol/ve-vetro

Vetro Protocol veVETRO distribution actions for viem clients. The distributor gives veVETRO to the holders of veHEMI positions at the snapshot timestamp `getConfig(...).snapshotTimestamp`. veVETRO is a deployment of the veHEMI contract code, so the same vote-escrow actions read both tokens.

## Installation

```sh
npm add @vetro-protocol/ve-vetro viem
```

## Overview

- `veHemiSnapshotBlock` is the last block at or before the snapshot timestamp. The UI uses it to enumerate the veHEMI token ids. The veHEMI address is exported as `veHemiAddress`.
- To find the veHEMI token ids of an owner, read `getBalanceOf` at `veHemiSnapshotBlock`, then read `getTokenOfOwnerByIndex` for each index from `0n` to the balance minus `1n`, at the same block. The RPC must serve the state at the snapshot block. Some holders have many positions, and the public RPC limits requests. Create the client with `batch: { multicall: true }` so viem aggregates the `getTokenOfOwnerByIndex` calls at the same block. viem's `hemi` chain has no Multicall3 address, so add it to the chain, as in the example below.
- Ideally, the veHEMI reads come from the [ve-hemi-actions](https://github.com/hemilabs/ui-monorepo/tree/main/packages/ve-hemi-actions) package.
- `getClaimableSubset` reads the distributor lens. It filters the token ids to the ids that the claimant can still claim, and returns their total amount. A claim of `ids` can still revert when `amount` is below the minimum lock amount of the target. To check the full claim, call `previewClaimBatch` on the lens. The lens returns no ids while `isClaimOpen` is `false`. Check `isClaimOpen` first to tell "claims not open" from "nothing to claim".
- `isClaimOpen` tells whether the distributor accepts claims now. When `getConfig(...).requireTermsSignature` is `true`, the claim needs a signature of the terms. `verifyTermsSignature` checks that signature before the claim.
- To read the EIP-712 domain of the terms signature, use `getEip712Domain` from viem.
- To read veVETRO positions, call the same vote-escrow actions (`getBalanceOf`, `getTokenOfOwnerByIndex`, `getLockedBalance`) with the veVETRO address and no `blockNumber`.

## Usage

```ts
import { veHemiAddress, veHemiSnapshotBlock } from "@vetro-protocol/ve-vetro";
import {
  getBalanceOf,
  getClaimableSubset,
  getConfig,
  getLockedBalance,
  getTokenOfOwnerByIndex,
  isClaimOpen,
  verifyTermsSignature,
} from "@vetro-protocol/ve-vetro/actions";
import { createPublicClient, http } from "viem";
import { hemi } from "viem/chains";

const publicClient = createPublicClient({
  batch: { multicall: true },
  chain: {
    ...hemi,
    contracts: {
      multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
    },
  },
  transport: http(),
});

const distributorAddress = "0x...";
const lensAddress = "0x...";
const owner = "0x...";
const veVetroAddress = "0x...";

// Number of veHEMI positions of the owner at the snapshot block.
const balance = await getBalanceOf(publicClient, {
  address: veHemiAddress,
  blockNumber: veHemiSnapshotBlock,
  owner,
});

// veHEMI token ids of the owner at the snapshot block.
const tokenIds = await Promise.all(
  Array.from({ length: Number(balance) }, (_, index) =>
    getTokenOfOwnerByIndex(publicClient, {
      address: veHemiAddress,
      blockNumber: veHemiSnapshotBlock,
      index: BigInt(index),
      owner,
    }),
  ),
);

// Token ids the owner can still claim, and their total amount.
const { amount, ids } = await getClaimableSubset(publicClient, {
  address: lensAddress,
  claimant: owner,
  tokenIds,
});

// Whether the distributor accepts claims now.
const claimOpen = await isClaimOpen(publicClient, {
  address: distributorAddress,
});

// Distributor settings, such as the claim end and the terms signature rule.
const config = await getConfig(publicClient, { address: distributorAddress });

// Whether the signature of the terms is valid for this claimant and recipient.
const signatureValid = await verifyTermsSignature(publicClient, {
  address: distributorAddress,
  claimant: owner,
  recipient: owner,
  signature: "0x...",
});

// First veVETRO position of the owner, at the latest block.
const veVetroTokenId = await getTokenOfOwnerByIndex(publicClient, {
  address: veVetroAddress,
  index: 0n,
  owner,
});

// Locked amount and lock end of that veVETRO position.
const lockedBalance = await getLockedBalance(publicClient, {
  address: veVetroAddress,
  tokenId: veVetroTokenId,
});
```

## API

- Public actions (reads), exported from `/actions`:
  - `getBalanceOf(client, { address, blockNumber?, owner })` — the number of positions that `owner` holds in the vote-escrow token at `address`. Pass `blockNumber` to read at that block. Without it, the action reads the latest block.
  - `getClaimableSubset(client, { address, claimant, tokenIds })` — reads the distributor lens at `address`. It returns `{ amount, ids }`: `ids` are the token ids in `tokenIds` that `claimant` can still claim, and `amount` is their total claimable amount. A claim of `ids` can still revert when `amount` is below the minimum lock amount of the target. To check the full claim, call `previewClaimBatch` on the lens. The lens returns no ids while `isClaimOpen` is `false`. Check `isClaimOpen` first to tell "claims not open" from "nothing to claim".
  - `getConfig(client, { address })` — the settings of the distributor at `address`: `snapshotTimestamp`, `claimEnd`, `unlockTimestamp`, `mintNonTransferable`, `splitByType`, `requireTermsSignature`, `totalAllocation`, `regularBps`, `lockedBps`, `forfeitableBps`, `shortfallAllowance`, `expectedTotalAtSnapshot` and `termsHash`.
  - `getLockedBalance(client, { address, tokenId })` — the `{ amount, end }` lock of the position `tokenId` in the vote-escrow token at `address`. It reads the latest block.
  - `getTokenOfOwnerByIndex(client, { address, blockNumber?, index, owner })` — the token id at position `index` in the list of positions that `owner` holds in the vote-escrow token at `address`. Pass `blockNumber` to read at that block. Without it, the action reads the latest block.
  - `isClaimOpen(client, { address })` — whether the distributor at `address` accepts claims now.
  - `verifyTermsSignature(client, { address, claimant, recipient, signature })` — whether `signature` is a valid signature of the terms for `claimant` and `recipient`, as the distributor at `address` checks it. `signature` is hex. `0x` is accepted.
- ABIs: `veHemiAbi`, `veVetroDistributorAbi` and `veVetroDistributorLensAbi` — the minimal ABI subsets used by the package. `veHemiAbi` also applies to veVETRO.
- Constants: `veHemiAddress`, `veHemiSnapshotBlock`.
