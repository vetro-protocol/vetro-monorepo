import { zeroAddress, zeroHash } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { CooldownCell } from "../../../src/pages/earn/components/exitTickets/cooldownCell";
import type { ExitTicket } from "../../../src/pages/earn/types";

const now = 1735689600;

describe("CooldownCell", function () {
  beforeEach(function () {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(now * 1000);
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it.each([
    { elapsed: 1, initial: "1 Day", remaining: 86400, updated: "23 Hours" },
    { elapsed: 1, initial: "1 Hour", remaining: 3600, updated: "59 Minutes" },
    { elapsed: 59, initial: "1 Minute", remaining: 59, updated: "0 Minutes" },
  ])(
    "shows $updated when a parent renders before the cell timer fires",
    async function ({ elapsed, initial, remaining, updated }) {
      const ticket = {
        assets: "1000",
        cancelTxHash: null,
        claimableAt: String(now + remaining),
        claimTxHash: null,
        owner: zeroAddress,
        requestId: "1",
        requestTxHash: zeroHash,
        shares: "1000",
        stakingVaultAddress: zeroAddress,
      } satisfies ExitTicket;
      const screen = await render(<CooldownCell ticket={ticket} />);
      expect(screen.container.textContent).toBe(initial);

      // Advance the clock without running the cell's pending timer.
      vi.setSystemTime((now + elapsed) * 1000);
      await screen.rerender(<CooldownCell ticket={ticket} />);

      expect(screen.container.textContent).toBe(updated);
    },
  );
});
