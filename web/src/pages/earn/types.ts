import type { Hash } from "viem";

export type ExitTicket = {
  assets: string;
  cancelTxHash?: Hash;
  claimableAt: string;
  claimTxHash?: Hash;
  owner: string;
  receiver?: string;
  requestId: string;
  requestTxHash: Hash;
  shares: string;
};

export type ExitTicketStatus = "cooldown" | "ready" | "withdrawn";
