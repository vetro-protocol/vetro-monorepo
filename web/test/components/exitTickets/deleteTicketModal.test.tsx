import { useCancelWithdraw } from "hooks/useCancelWithdraw";
import { act, type ReactNode } from "react";
import type { TokenWithGateway } from "types";
import { zeroAddress, zeroHash } from "viem";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { DeleteTicketModal } from "../../../src/pages/earn/components/exitTickets/deleteTicketModal";
import type { ExitTicket } from "../../../src/pages/earn/types";

const mocked = vi.hoisted(() => ({
  mutate: vi.fn(),
  onCompleted: vi.fn(),
  onFailed: vi.fn(),
  onPending: vi.fn(),
  onTransactionHash: vi.fn(),
}));

vi.mock("components/requireWalletConnected", () => ({
  RequireWalletConnected: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("hooks/useActivityTracking", () => ({
  useActivityTracking: vi.fn(() => ({
    onCompleted: mocked.onCompleted,
    onFailed: mocked.onFailed,
    onPending: mocked.onPending,
    onTransactionHash: mocked.onTransactionHash,
  })),
}));

vi.mock("hooks/useCancelWithdraw", () => ({
  useCancelWithdraw: vi.fn(() => ({ mutate: mocked.mutate })),
}));

const stakingVaultAddress = "0x1111111111111111111111111111111111111111";

const ticket = {
  assets: "1230000",
  cancelTxHash: null,
  claimableAt: "0",
  claimTxHash: null,
  owner: zeroAddress,
  requestId: "7",
  requestTxHash: zeroHash,
  shares: "1",
  stakingVaultAddress,
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

type Status = Parameters<
  Parameters<typeof useCancelWithdraw>[0]["onStatusChange"]
>[0];

function setGeoRestricted(restricted: boolean) {
  document.cookie = `geo-restricted=${restricted ? "1" : "0"}; path=/`;
}

async function emitStatus(status: Status) {
  const { onStatusChange } = vi.mocked(useCancelWithdraw).mock.lastCall![0];
  await act(async function () {
    onStatusChange(status);
  });
}

async function renderModal({ onSuccess }: { onSuccess?: VoidFunction } = {}) {
  const onClose = vi.fn();
  const screen = await render(
    <DeleteTicketModal
      onClose={onClose}
      onSuccess={onSuccess}
      peggedToken={token}
      ticket={ticket}
    />,
  );
  return {
    cancelButton: screen.getByRole("button", { exact: true, name: "Cancel" }),
    deleteButton: screen.getByRole("button", { exact: true, name: "Delete" }),
    onClose,
    screen,
  };
}

describe("DeleteTicketModal", function () {
  afterEach(function () {
    setGeoRestricted(false);
  });

  it("sends one cancel and disables both buttons while the cancel is in progress", async function () {
    const { cancelButton, deleteButton, screen } = await renderModal();

    await deleteButton.click();

    const deletingButton = screen.getByRole("button", { name: "Deleting..." });
    await expect.element(deletingButton).toBeDisabled();
    await expect.element(cancelButton).toBeDisabled();
    expect(mocked.mutate).toHaveBeenCalledOnce();
  });

  it("enables both buttons again and does not close when the cancel fails", async function () {
    const onSuccess = vi.fn();
    const { cancelButton, deleteButton, onClose } = await renderModal({
      onSuccess,
    });

    await deleteButton.click();
    await emitStatus("failed");

    await expect.element(deleteButton).toBeEnabled();
    await expect.element(cancelButton).toBeEnabled();
    expect(mocked.onFailed).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("closes and calls onSuccess when the cancel completes", async function () {
    const onSuccess = vi.fn();
    const { deleteButton, onClose } = await renderModal({ onSuccess });

    await deleteButton.click();
    await emitStatus("completed");

    expect(mocked.onCompleted).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("closes when the cancel completes without an onSuccess callback", async function () {
    const { deleteButton, onClose } = await renderModal();

    await deleteButton.click();
    await emitStatus("completed");

    expect(mocked.onCompleted).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("tracks the activity as pending when the user signs the cancel", async function () {
    const { deleteButton } = await renderModal();

    await deleteButton.click();
    await emitStatus("cancelling");

    expect(mocked.onPending).toHaveBeenCalledOnce();
  });

  it("disables Delete when the user is geo-restricted", async function () {
    setGeoRestricted(true);
    const { deleteButton } = await renderModal();

    await expect.element(deleteButton).toBeDisabled();
  });
});
