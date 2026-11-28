import { act, type ReactNode } from "react";
import { zeroAddress, zeroHash } from "viem";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { ExitTickets } from "../../../src/pages/earn/components/exitTickets";
import type { ExitTicket } from "../../../src/pages/earn/types";

const mocked = vi.hoisted(() => ({ tickets: [] as ExitTicket[] }));

vi.mock("pages/earn/hooks/useExitTickets", async function (importOriginal) {
  const actual =
    await importOriginal<typeof import("pages/earn/hooks/useExitTickets")>();
  return {
    ...actual,
    useExitTickets: () => ({ data: mocked.tickets, isLoading: false }),
  };
});

vi.mock("pages/earn/hooks/useCooldownDuration", () => ({
  useCooldownDuration: () => ({ data: 1, status: "success" }),
}));

vi.mock("components/requireWalletConnected", () => ({
  RequireWalletConnected: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("hooks/useVaultPeggedToken", async function (importOriginal) {
  const actual =
    await importOriginal<typeof import("hooks/useVaultPeggedToken")>();
  return {
    ...actual,
    useVaultPeggedToken: () => ({
      data: {
        address: zeroAddress,
        chainId: 1,
        decimals: 6,
        gatewayAddress: zeroAddress,
        logoURI: "",
        name: "Test token",
        symbol: "TEST",
      },
      status: "success",
    }),
  };
});

vi.mock("hooks/useActivityTracking", () => ({
  useActivityTracking: () => ({
    onCompleted: vi.fn(),
    onFailed: vi.fn(),
    onPending: vi.fn(),
    onTransactionHash: vi.fn(),
  }),
}));

vi.mock("hooks/useClaimWithdraw", () => ({
  useClaimWithdraw: () => ({ mutate: vi.fn() }),
}));

vi.mock("hooks/useCancelWithdraw", () => ({
  useCancelWithdraw: () => ({ mutate: vi.fn() }),
}));

vi.mock("utils/geoRestriction", () => ({
  isGeoRestricted: () => false,
}));

const now = 1735689600;

const ticket = ({
  claimableAt,
  requestId,
}: {
  claimableAt: number;
  requestId: string;
}): ExitTicket => ({
  assets: "1000",
  cancelTxHash: null,
  claimableAt: String(claimableAt),
  claimTxHash: null,
  owner: zeroAddress,
  requestId,
  requestTxHash: zeroHash,
  shares: "1000",
  stakingVaultAddress: zeroAddress,
});

describe("ExitTickets", function () {
  afterEach(function () {
    vi.useRealTimers();
    mocked.tickets = [];
  });

  it("keeps another ticket's delete dialog open when a cooldown ends", async function () {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(now * 1000);
    mocked.tickets = [
      ticket({ claimableAt: now - 1, requestId: "1" }),
      ticket({ claimableAt: now + 2, requestId: "2" }),
    ];
    const screen = await render(<ExitTickets />);
    const deleteButtons = screen.getByRole("button", {
      name: "Delete exit ticket",
    });

    await act(async function () {
      (deleteButtons.elements()[0] as HTMLElement).click();
    });
    expect(
      screen.getByRole("dialog", { name: "Delete exit ticket" }).query(),
    ).not.toBeNull();
    expect(screen.getByText("Cooldown in progress").query()).not.toBeNull();

    await act(async function () {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText("Cooldown in progress").query()).toBeNull();
    expect(screen.getByText("Ready to withdraw").elements()).toHaveLength(2);
    expect(
      screen.getByRole("dialog", { name: "Delete exit ticket" }).query(),
    ).not.toBeNull();
  });
});
