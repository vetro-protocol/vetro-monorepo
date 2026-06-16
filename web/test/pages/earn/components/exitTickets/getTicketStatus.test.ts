import { getTicketStatus } from "pages/earn/components/exitTickets/getTicketStatus";
import type { ExitTicket } from "pages/earn/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 2025-01-01T00:00:00Z in unix seconds.
const now = 1735689600;

const buildTicket = (overrides: Partial<ExitTicket> = {}): ExitTicket => ({
  assets: "1000",
  claimableAt: String(now),
  owner: "0x0000000000000000000000000000000000000001",
  requestId: "1",
  requestTxHash: "0xrequest",
  shares: "1000",
  stakingVaultAddress: "0x0000000000000000000000000000000000000002",
  ...overrides,
});

describe("getTicketStatus", function () {
  beforeEach(function () {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it("returns 'cancelled' when the ticket has a cancel tx", function () {
    expect(getTicketStatus(buildTicket({ cancelTxHash: "0xcancel" }))).toBe(
      "cancelled",
    );
  });

  it("prefers 'cancelled' over 'withdrawn' when both txs are present", function () {
    expect(
      getTicketStatus(
        buildTicket({ cancelTxHash: "0xcancel", claimTxHash: "0xclaim" }),
      ),
    ).toBe("cancelled");
  });

  it("returns 'withdrawn' when the ticket has a claim tx", function () {
    expect(getTicketStatus(buildTicket({ claimTxHash: "0xclaim" }))).toBe(
      "withdrawn",
    );
  });

  it("returns 'ready' when the claimable time has passed", function () {
    expect(
      getTicketStatus(buildTicket({ claimableAt: String(now - 100) })),
    ).toBe("ready");
  });

  it("returns 'ready' at the exact claimable time", function () {
    expect(getTicketStatus(buildTicket({ claimableAt: String(now) }))).toBe(
      "ready",
    );
  });

  it("returns 'cooldown' when the claimable time is in the future", function () {
    expect(
      getTicketStatus(buildTicket({ claimableAt: String(now + 100) })),
    ).toBe("cooldown");
  });
});
