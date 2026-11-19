import { useActivityTracking } from "hooks/useActivityTracking";
import type { ReactNode } from "react";
import type { TokenWithGateway } from "types";
import { formatUnits, zeroAddress, zeroHash } from "viem";
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

const ticket = {
  assets: "1230000",
  cancelTxHash: null,
  claimableAt: "0",
  claimTxHash: null,
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
  it("disables ticket actions until the token is known", async function () {
    mocked.peggedToken = undefined;

    const screen = await render(<ActionsCell ticket={ticket} />);

    await expect
      .element(screen.getByRole("button", { name: /withdraw/i }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: /delete/i }))
      .toBeDisabled();

    expect(useActivityTracking).toHaveBeenCalledWith(
      expect.objectContaining({ text: "" }),
    );
  });

  it("enables ticket actions and formats activity text using the token decimals", async function () {
    mocked.peggedToken = token;

    const screen = await render(<ActionsCell ticket={ticket} />);

    await expect
      .element(screen.getByRole("button", { name: /withdraw/i }))
      .not.toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: /delete/i }))
      .not.toBeDisabled();

    expect(useActivityTracking).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(
          `${formatUnits(BigInt(ticket.assets), token.decimals)} ${token.symbol}`,
        ),
      }),
    );
  });
});
