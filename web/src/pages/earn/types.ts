export type ExitTicket = {
  assets: string;
  cancelTxHash: string | null;
  claimableAt: string;
  claimTxHash: string | null;
  owner: string;
  receiver: string | null;
  requestId: string;
  requestTxHash: string;
  shares: string;
};

export type ExitTicketStatus = "cooldown" | "ready" | "withdrawn";
