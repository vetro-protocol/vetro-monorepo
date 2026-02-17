import type { ExitTicket } from "../../types";

export function getTicketStatus(ticket: ExitTicket) {
  if (ticket.cancelTxHash) {
    return "cancelled";
  }
  if (ticket.claimTxHash) {
    return "withdrawn";
  }
  const now = Math.floor(Date.now() / 1000);
  if (Number(ticket.claimableAt) <= now) {
    return "ready";
  }
  return "cooldown";
}
