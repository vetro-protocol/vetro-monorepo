import { isAddressValid } from "@vetro-protocol/core";
import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  encodeFunctionData,
  type Hex,
  isHex,
  type TransactionReceipt,
  type WalletClient,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

import { veVetroDistributorAbi } from "../../abi/veVetroDistributorAbi.ts";
import type { ClaimEvents } from "../../types.ts";
import { getConfig } from "../public/getConfig.ts";
import { isClaimOpen } from "../public/isClaimOpen.ts";
import { verifyTermsSignature } from "../public/verifyTermsSignature.ts";

export type ClaimParams = {
  address: Address;
  recipient: Address;
  signature?: Hex;
  tokenIds: readonly bigint[];
};

const canClaim = async function ({
  address,
  client,
  recipient,
  signature,
  tokenIds,
}: ClaimParams & { client: WalletClient }): Promise<{
  canClaim: boolean;
  reason?: string;
}> {
  if (!client) {
    return { canClaim: false, reason: "Client is not defined" };
  }
  if (!client.chain) {
    return { canClaim: false, reason: "Chain is not defined on wallet client" };
  }
  if (!client.account) {
    return { canClaim: false, reason: "Client must have an account" };
  }
  if (!isAddressValid(address)) {
    return { canClaim: false, reason: "Invalid distributor address" };
  }
  if (!isAddressValid(recipient)) {
    return { canClaim: false, reason: "Invalid recipient address" };
  }
  if (signature !== undefined && !isHex(signature)) {
    return { canClaim: false, reason: "Signature must be hex" };
  }
  if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
    return { canClaim: false, reason: "Token ids must not be empty" };
  }
  if (tokenIds.some((tokenId) => typeof tokenId !== "bigint")) {
    return { canClaim: false, reason: "Token ids must be bigints" };
  }
  if (new Set(tokenIds).size !== tokenIds.length) {
    return { canClaim: false, reason: "Token ids must not repeat" };
  }

  const [claimOpen, { requireTermsSignature }] = await Promise.all([
    isClaimOpen(client, { address }),
    getConfig(client, { address }),
  ]);

  if (!claimOpen) {
    return { canClaim: false, reason: "Claims are not open" };
  }

  if (
    requireTermsSignature &&
    !(await verifyTermsSignature(client, {
      address,
      claimant: client.account.address,
      recipient,
      signature: signature ?? "0x",
    }))
  ) {
    return { canClaim: false, reason: "Invalid terms signature" };
  }

  return { canClaim: true };
};

const getClaimArgs = ({ recipient, signature = "0x", tokenIds }: ClaimParams) =>
  [tokenIds, recipient, signature] as const;

const runClaim = (walletClient: WalletClient, params: ClaimParams) =>
  async function (emitter: EventEmitter<ClaimEvents>) {
    try {
      const { address, recipient, signature, tokenIds } = params;
      const { canClaim: canClaimFlag, reason } = await canClaim({
        address,
        client: walletClient,
        recipient,
        signature,
        tokenIds,
      });

      if (!canClaimFlag) {
        emitter.emit("claim-failed-validation", reason!);
        return;
      }

      emitter.emit("pre-claim");

      const claimHash = await writeContract(walletClient, {
        abi: veVetroDistributorAbi,
        account: walletClient.account!,
        address,
        args: getClaimArgs(params),
        chain: walletClient.chain,
        functionName: "claim",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-claim-error", error);
      });

      if (!claimHash) {
        return;
      }

      emitter.emit("user-signed-claim", claimHash);

      const claimReceipt = await waitForTransactionReceipt(walletClient, {
        hash: claimHash,
      }).catch(function (error: Error) {
        emitter.emit("claim-failed", error);
      });

      if (!claimReceipt) {
        return;
      }

      const claimEventMap: Record<
        TransactionReceipt["status"],
        keyof ClaimEvents
      > = {
        reverted: "claim-transaction-reverted",
        success: "claim-transaction-succeeded",
      };

      emitter.emit(claimEventMap[claimReceipt.status], claimReceipt);
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("claim-settled");
    }
  };

export const claim = (...args: Parameters<typeof runClaim>) =>
  toPromiseEvent<ClaimEvents>(runClaim(...args));

export const encodeClaim = (params: ClaimParams) =>
  encodeFunctionData({
    abi: veVetroDistributorAbi,
    args: getClaimArgs(params),
    functionName: "claim",
  });
