import { bridgeLayerZeroFeeOptions } from "hooks/useBridgeLayerZeroFee";
import { bridgeNetworkFeeOptions } from "hooks/useBridgeNetworkFee";
import type { BridgeableToken } from "types";
import { type Address, type Client, zeroAddress } from "viem";
import { describe, expect, it, vi } from "vitest";

import { fetchTotalBridgeSendFees } from "../../src/fetchers/fetchTotalBridgeSendFees";
import { createTestQueryClient } from "../utils";

vi.mock("hooks/useBridgeLayerZeroFee", () => ({
  bridgeLayerZeroFeeOptions: vi.fn(),
}));

vi.mock("hooks/useBridgeNetworkFee", () => ({
  bridgeNetworkFeeOptions: vi.fn(),
}));

const sourceChainId = 1;
const destinationChainId = 43111;
const oftAddress: Address = "0xFc8Acf5ef1E8839Ec94151740CfEd95D7E579Afb";

describe("fetchTotalBridgeSendFees", function () {
  const mockOwner = zeroAddress;
  const mockRecipient = zeroAddress;
  const mockClient = {} as unknown as Client;
  // @ts-expect-error - only address and chainId are needed for these tests
  const mockToken = {
    address: zeroAddress,
    chainId: sourceChainId,
  } as BridgeableToken;

  it("returns the sum of LayerZero and network fees in USD", async function () {
    const layerZeroFeeUsd = 0.42;
    const networkFeeUsd = 1.18;

    vi.mocked(bridgeLayerZeroFeeOptions).mockReturnValue({
      queryFn: () => layerZeroFeeUsd,
      queryKey: ["bridge-layerzero-fee"],
    } as never);
    vi.mocked(bridgeNetworkFeeOptions).mockReturnValue({
      queryFn: () => networkFeeUsd,
      queryKey: ["bridge-network-fee"],
    } as never);

    const result = await fetchTotalBridgeSendFees({
      amount: 100n,
      approveAmount: undefined,
      client: mockClient,
      destinationChainId,
      oftAddress,
      owner: mockOwner,
      queryClient: createTestQueryClient(),
      recipient: mockRecipient,
      sourceChainId,
      sourceToken: mockToken,
    });

    expect(result).toBeCloseTo(layerZeroFeeUsd + networkFeeUsd);
  });

  it("propagates errors from the network fee fetcher", async function () {
    vi.mocked(bridgeLayerZeroFeeOptions).mockReturnValue({
      queryFn: () => 1,
      queryKey: ["bridge-layerzero-fee"],
    } as never);
    vi.mocked(bridgeNetworkFeeOptions).mockReturnValue({
      queryFn: () => Promise.reject(new Error("Insufficient token balance")),
      queryKey: ["bridge-network-fee"],
    } as never);

    await expect(
      fetchTotalBridgeSendFees({
        amount: 100n,
        approveAmount: undefined,
        client: mockClient,
        destinationChainId,
        oftAddress,
        owner: mockOwner,
        queryClient: createTestQueryClient(),
        recipient: mockRecipient,
        sourceChainId,
        sourceToken: mockToken,
      }),
    ).rejects.toThrow("Insufficient token balance");
  });
});
