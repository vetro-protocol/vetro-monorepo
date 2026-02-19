import type { QueryClient } from "@tanstack/react-query";
import {
  getWithdrawalDelayEnabled,
  isInstantRedeemWhitelisted,
} from "@vetro/gateway/actions";
import type { Address, Client } from "viem";
import { describe, expect, it, vi } from "vitest";

vi.mock("@vetro/gateway/actions", () => ({
  getWithdrawalDelay: vi.fn(),
  getWithdrawalDelayEnabled: vi.fn(),
  isInstantRedeemWhitelisted: vi.fn(),
}));

// Import the function to test
import { fetchRedeemDelay } from "../../src/fetchers/fetchRedeemDelay";

describe("fetchRedeemDelay", function () {
  const mockAccount = "0x1234567890123456789012345678901234567890" as Address;
  const mockGatewayAddress =
    "0x0987654321098765432109876543210987654321" as Address;
  const mockClient = { chain: { id: 1 } } as unknown as Client;

  const createMockQueryClient = (delay: bigint) =>
    ({
      ensureQueryData: vi.fn().mockResolvedValue(delay),
    }) as unknown as QueryClient;

  const defaultParams = {
    account: mockAccount,
    client: mockClient,
    gatewayAddress: mockGatewayAddress,
    queryClient: createMockQueryClient(100n),
  };

  it("should return 0n when delay is not enabled", async function () {
    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(false);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(false);

    const result = await fetchRedeemDelay(defaultParams);

    expect(result).toBe(0n);
  });

  it("should return 0n when user is whitelisted", async function () {
    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(true);

    const result = await fetchRedeemDelay(defaultParams);

    expect(result).toBe(0n);
  });

  it("should return 0n when delay is 0", async function () {
    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(false);

    const result = await fetchRedeemDelay({
      ...defaultParams,
      queryClient: createMockQueryClient(0n),
    });

    expect(result).toBe(0n);
  });

  it("should return the delay when enabled, not whitelisted, and delay > 0", async function () {
    const expectedDelay = 3600n;

    vi.mocked(getWithdrawalDelayEnabled).mockResolvedValue(true);
    vi.mocked(isInstantRedeemWhitelisted).mockResolvedValue(false);

    const result = await fetchRedeemDelay({
      ...defaultParams,
      queryClient: createMockQueryClient(expectedDelay),
    });

    expect(result).toBe(expectedDelay);
  });
});
