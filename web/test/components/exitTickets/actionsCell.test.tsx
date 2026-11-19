import type { ReactNode } from "react";
import type { TokenWithGateway } from "types";
import { formatAmount } from "utils/token";
import { zeroAddress, zeroHash } from "viem";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { ActionsCell } from "../../../src/pages/earn/components/exitTickets/actionsCell";
import type { ExitTicket } from "../../../src/pages/earn/types";

const mocked = vi.hoisted(() => ({
  peggedToken: undefined as { decimals: number; symbol: string } | undefined,
}));

vi.mock("components/requireWalletConnected", () => ({
  RequireWalletConnected: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("hooks/useActivityTracking", () => ({
  useActivityTracking: vi.fn(() => ({
    onCompleted: vi.fn(),
    onFailed: vi.fn(),
    onPending: vi.fn(),
    onTransactionHash: vi.fn(),
  })),
}));

vi.mock("hooks/useClaimWithdraw", () => ({
  useClaimWithdraw: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock("hooks/useVaultPeggedToken", async function (importOriginal) {
  const actual =
    await importOriginal<typeof import("hooks/useVaultPeggedToken")>();

  return {
    ...actual,
    useVaultPeggedToken: vi.fn(() => ({ data: mocked.peggedToken })),
  };
});

vi.mock("utils/geoRestriction", () => ({
  isGeoRestricted: () => false,
}));

vi.mock("utils/token", async function (importOriginal) {
  const actual = await importOriginal<typeof import("utils/token")>();

  return {
    ...actual,
    formatAmount: vi.fn(),
  };
});

const ticket = {
  assets: "1230000",
  claimableAt: "0",
  owner: zeroAddress,
  requestId: "1",
  requestTxHash: zeroHash,
  shares: "1",
  stakingVaultAddress: zeroAddress,
} satisfies ExitTicket;

const token = {
  address: zeroAddress,
  chainId: 1,
  decimals: 6,
  gatewayAddress: zeroAddress,
  logoURI: "",
  name: "Test token",
  symbol: "TEST",
} satisfies TokenWithGateway;

describe("ActionsCell", function () {
  it("disables ticket actions and skips formatting until the token is known", async function () {
    mocked.peggedToken = undefined;

    const screen = await render(<ActionsCell ticket={ticket} />);

    await expect
      .element(screen.getByRole("button", { name: /withdraw/i }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: /delete/i }))
      .toBeDisabled();

    expect(formatAmount).not.toHaveBeenCalled();
  });

  it("enables ticket actions and formats using the token decimals", async function () {
    mocked.peggedToken = token;
    vi.mocked(formatAmount).mockReturnValue("1.23");

    const screen = await render(<ActionsCell ticket={ticket} />);

    await expect
      .element(screen.getByRole("button", { name: /withdraw/i }))
      .not.toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: /delete/i }))
      .not.toBeDisabled();

    expect(formatAmount).toHaveBeenCalledWith({
      amount: BigInt(ticket.assets),
      decimals: token.decimals,
      isError: false,
    });
  });
});
