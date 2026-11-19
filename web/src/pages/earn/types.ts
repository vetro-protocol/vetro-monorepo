import type { Address, Hash } from "viem";

export type ExitTicket = {
  assets: string;
  cancelTxHash: Hash | null;
  claimableAt: string;
  claimTxHash: Hash | null;
  owner: string;
  requestId: string;
  requestTxHash: Hash;
  shares: string;
  stakingVaultAddress: Address;
};
