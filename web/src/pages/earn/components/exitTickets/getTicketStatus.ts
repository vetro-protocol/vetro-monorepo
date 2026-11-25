import type { ExitTicket } from "../../types";

export function getTicketStatus({
  now,
  ticket,
}: {
  now: number;
  ticket: ExitTicket;
}) {
  if (ticket.cancelTxHash) {
    return "cancelled";
  }
  if (ticket.claimTxHash) {
    return "withdrawn";
  }
  if (Number(ticket.claimableAt) <= now) {
    return "ready";
  }
  return "cooldown";
}
