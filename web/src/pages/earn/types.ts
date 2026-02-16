import type { Hash } from "viem";

export type ExitTicket = {
  assets: string;
  cancelTxHash: Hash | null | undefined;
  claimableAt: string;
  claimTxHash: Hash | null | undefined;
  owner: string;
  receiver: string | null | undefined;
  requestId: string;
  requestTxHash: Hash;
  shares: string;
};

export type ExitTicketStatus = "cooldown" | "ready" | "withdrawn";
