import { getTicketStatus } from "pages/earn/components/exitTickets/getTicketStatus";
import type { ExitTicket } from "pages/earn/types";
import { describe, expect, it } from "vitest";

// 2025-01-01T00:00:00Z in unix seconds.
const now = 1735689600;

const buildTicket = (overrides: Partial<ExitTicket> = {}): ExitTicket => ({
  assets: "1000",
  cancelTxHash: null,
  claimableAt: String(now),
  claimTxHash: null,
  owner: "0x0000000000000000000000000000000000000001",
  requestId: "1",
  requestTxHash: "0xrequest",
  shares: "1000",
  stakingVaultAddress: "0x0000000000000000000000000000000000000002",
  ...overrides,
});

describe("getTicketStatus", function () {
  it("returns 'cancelled' when the ticket has a cancel tx", function () {
    expect(
      getTicketStatus({
        now,
        ticket: buildTicket({ cancelTxHash: "0xcancel" }),
      }),
    ).toBe("cancelled");
  });

  it("prefers 'cancelled' over 'withdrawn' when both txs are present", function () {
    expect(
      getTicketStatus({
        now,
        ticket: buildTicket({
          cancelTxHash: "0xcancel",
          claimTxHash: "0xclaim",
        }),
      }),
    ).toBe("cancelled");
  });

  it("returns 'withdrawn' when the ticket has a claim tx", function () {
    expect(
      getTicketStatus({ now, ticket: buildTicket({ claimTxHash: "0xclaim" }) }),
    ).toBe("withdrawn");
  });

  it("returns 'ready' when the claimable time has passed", function () {
    expect(
      getTicketStatus({
        now,
        ticket: buildTicket({ claimableAt: String(now - 100) }),
      }),
    ).toBe("ready");
  });

  it("returns 'ready' at the exact claimable time", function () {
    expect(getTicketStatus({ now, ticket: buildTicket() })).toBe("ready");
  });

  it("returns 'cooldown' when the claimable time is in the future", function () {
    expect(
      getTicketStatus({
        now,
        ticket: buildTicket({ claimableAt: String(now + 100) }),
      }),
    ).toBe("cooldown");
  });
});
