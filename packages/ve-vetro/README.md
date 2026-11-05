# @vetro-protocol/ve-vetro

Vetro Protocol veVETRO distribution actions for viem clients. The distributor gives veVETRO to the holders of veHEMI positions at the snapshot timestamp `getConfig(...).snapshotTimestamp`. veVETRO is a deployment of the veHEMI contract code, so the same vote-escrow actions read both tokens.

## Installation

```sh
npm add @vetro-protocol/ve-vetro viem
```

## Overview

- `veHemiSnapshotBlock` is the last block at or before the snapshot timestamp. The UI uses it to enumerate the veHEMI token ids. The veHEMI address is exported as `veHemiAddress`.
- To find the veHEMI token ids of an owner, read `getBalanceOf` at `veHemiSnapshotBlock`, then read `getTokenOfOwnerByIndex` for each index from `0n` to the balance minus `1n`, at the same block. The RPC must serve the state at the snapshot block. Some holders have many positions, and the public RPC limits requests. Create the client with `batch: { multicall: true }` so viem aggregates the `getTokenOfOwnerByIndex` calls at the same block. viem's `hemi` chain has no Multicall3 address, so add it to the chain, as in the example below.
- If the RPC cannot serve the state at the snapshot block, `getIdsOfRecord` reads the token ids of record from the distributor lens. It scans the ids from `fromId` to `toIdExclusive` (not included), and returns the ids of record that had weight at the snapshot, and `nextId`, the first id it did not scan. One call can stop before `toIdExclusive`, so call it again from `nextId` while `nextId` is less than `toIdExclusive`. The lens does not scan the ids above the last veHEMI token id.
- Ideally, the veHEMI reads come from the [ve-hemi-actions](https://github.com/hemilabs/ui-monorepo/tree/main/packages/ve-hemi-actions) package.
- `getClaimableSubset` reads the distributor lens. It filters the token ids to the ids that the claimant can still claim, and returns their total amount. A claim of `ids` reverts when `amount` is below `minClaimAmount` (10 $V). Send all the ids in one claim. The lens returns no ids while `isClaimOpen` is `false`. Check `isClaimOpen` first to tell "claims not open" from "nothing to claim".
- `previewClaim` reads the claim data of one veHEMI token id: the owner and the weight at the snapshot, the bucket, the share and whether the id is claimed. Use it to show each position. `share` keeps its value after the claim and after `claimEnd`.
- `isClaimOpen` tells whether the distributor accepts claims now. When `getConfig(...).requireTermsSignature` is `true`, the claim needs a signature of the terms. `verifyTermsSignature` checks that signature before the claim.
- To read the EIP-712 domain of the terms signature, use `getEip712Domain` from viem.
- `claim` claims the `ids` from `getClaimableSubset` in one transaction, and mints one veVETRO position to `recipient`.
- To read veVETRO positions, call the same vote-escrow actions (`getBalanceOf`, `getTokenOfOwnerByIndex`, `getLockedBalance`) with the veVETRO address and no `blockNumber`.

## Usage

```ts
import {
  minClaimAmount,
  veHemiAddress,
  veHemiSnapshotBlock,
} from "@vetro-protocol/ve-vetro";
import {
  claim,
  getBalanceOf,
  getClaimableSubset,
  getConfig,
  getIdsOfRecord,
  getLockedBalance,
  getTokenOfOwnerByIndex,
  isClaimOpen,
  previewClaim,
  verifyTermsSignature,
} from "@vetro-protocol/ve-vetro/actions";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  maxUint256,
} from "viem";
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

const walletClient = createWalletClient({
  account: owner,
  chain: hemi,
  transport: custom(window.ethereum),
});

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

// Alternative: veHEMI token ids of record of the owner, from the lens.
const idsOfRecord = await getIdsOfRecord(publicClient, {
  address: lensAddress,
  fromId: 0n,
  holder: owner,
  toIdExclusive: maxUint256,
});

// Token ids the owner can still claim, and their total amount.
const { amount, ids } = await getClaimableSubset(publicClient, {
  address: lensAddress,
  claimant: owner,
  tokenIds,
});

// A claim below the minimum amount reverts.
const canClaim = ids.length > 0 && amount >= minClaimAmount;

// Claim data of each veHEMI position, such as its share and whether it is claimed.
const previews = await Promise.all(
  tokenIds.map((tokenId) =>
    previewClaim(publicClient, { address: distributorAddress, tokenId }),
  ),
);

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

// Claim all the claimable ids in one transaction.
const { emitter, promise } = claim(walletClient, {
  address: distributorAddress,
  recipient: owner,
  signature: "0x...",
  tokenIds: ids,
});
emitter.on("claim-transaction-succeeded", (receipt) => {});
await promise;

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

## Events

`claim` returns `{ emitter, promise }`. The emitter sends:

- `claim-failed-validation` `[reason]` — the action sends no transaction.
- `pre-claim`, `user-signed-claim` `[hash]`, `user-signing-claim-error` `[error]`
- `claim-transaction-succeeded` `[receipt]`, `claim-transaction-reverted` `[receipt]`, `claim-failed` `[error]`
- `unexpected-error` `[error]`
- `claim-settled` — always sent last.

## API

- Public actions (reads), exported from `/actions`:
  - `getBalanceOf(client, { address, blockNumber?, owner })` — the number of positions that `owner` holds in the vote-escrow token at `address`. Pass `blockNumber` to read at that block. Without it, the action reads the latest block.
  - `getClaimableSubset(client, { address, claimant, tokenIds })` — reads the distributor lens at `address`. It returns `{ amount, ids }`: `ids` are the token ids in `tokenIds` that `claimant` can still claim, and `amount` is their total claimable amount. A claim of `ids` reverts when `amount` is below `minClaimAmount`. The lens returns no ids while `isClaimOpen` is `false`. Check `isClaimOpen` first to tell "claims not open" from "nothing to claim".
  - `getConfig(client, { address })` — the settings of the distributor at `address`: `snapshotTimestamp`, `claimEnd`, `unlockTimestamp`, `mintNonTransferable`, `splitByType`, `requireTermsSignature`, `totalAllocation`, `regularBps`, `lockedBps`, `forfeitableBps`, `shortfallAllowance`, `expectedTotalAtSnapshot` and `termsHash`.
  - `getLockedBalance(client, { address, tokenId })` — the `{ amount, end }` lock of the position `tokenId` in the vote-escrow token at `address`. It reads the latest block.
  - `getTokenOfOwnerByIndex(client, { address, blockNumber?, index, owner })` — the token id at position `index` in the list of positions that `owner` holds in the vote-escrow token at `address`. Pass `blockNumber` to read at that block. Without it, the action reads the latest block.
  - `isClaimOpen(client, { address })` — whether the distributor at `address` accepts claims now.
  - `previewClaim(client, { address, tokenId })` — reads the distributor at `address`. It returns `{ bucket, claimed, ownerOfRecord, share, weight }` for the veHEMI position `tokenId`: `ownerOfRecord` and `weight` at the snapshot (`zeroAddress` and `0n` when the id has no history, and for every id while the distributor is not configured), `bucket` (`0` regular, `1` locked, `2` forfeitable; always `0` when `splitByType` is `false`), `share` (the amount of this id, `0n` before claims open, kept after the claim) and `claimed`.
  - `verifyTermsSignature(client, { address, claimant, recipient, signature })` — whether `signature` is a valid signature of the terms for `claimant` and `recipient`, as the distributor at `address` checks it. `signature` is hex. `0x` is accepted.
- Wallet actions (writes), exported from `/actions`:
  - `claim(walletClient, { address, recipient, signature?, tokenIds })` — claims `tokenIds` for the wallet account on the distributor at `address`. `signature` is the terms signature. It is needed only when `getConfig(...).requireTermsSignature` is `true`, and the action checks it with `verifyTermsSignature` first. The action sends no transaction when claims are not open.
  - `encodeClaim({ address, recipient, signature?, tokenIds })` — returns the calldata of `claim(tokenIds, recipient, signature)`. `signature` defaults to `0x`. `address` is not part of the calldata. Unlike `claim`, it does not check the params, whether claims are open, or the terms signature.
- ABIs: `veHemiAbi`, `veVetroDistributorAbi` and `veVetroDistributorLensAbi` — the minimal ABI subsets used by the package. `veHemiAbi` also applies to veVETRO.
- Constants: `minClaimAmount` (the distributor's `MIN_TARGET_LOCK_AMOUNT`, 10 $V in base units: a claim below it reverts), `veHemiAddress`, `veHemiSnapshotBlock`, `veVetroContractsByChain`.
- `veVetroContractsByChain` — the `{ distributor, lens, snapshotBlock, veHemi }` addresses for each chain id, for Hemi (`43111`) and Hemi Sepolia (`743111`). Pass `snapshotBlock` as the `blockNumber` of the veHEMI reads. It is `undefined` on Hemi Sepolia, where the reads use the latest block: the testnet veHEMI has positions created after the snapshot with a past start. The Hemi `distributor` and `lens` are `zeroAddress` until the distributor is deployed.
