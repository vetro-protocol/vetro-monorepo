import { unixNowTimestamp } from "utils/date";

import type { ExitTicket } from "../../types";

export function getTicketStatus(ticket: ExitTicket) {
  if (ticket.cancelTxHash) {
    return "cancelled";
  }
  if (ticket.claimTxHash) {
    return "withdrawn";
  }
  if (Number(ticket.claimableAt) <= unixNowTimestamp()) {
    return "ready";
  }
  return "cooldown";
}
