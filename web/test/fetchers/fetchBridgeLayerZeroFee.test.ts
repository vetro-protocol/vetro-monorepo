import { previewBridgeQueryKey } from "hooks/usePreviewBridge";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import { type Address, type Client, parseUnits, zeroAddress } from "viem";
import { bsc, hemi, mainnet } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { fetchBridgeLayerZeroFee } from "../../src/fetchers/fetchBridgeLayerZeroFee";
import { createTestQueryClient } from "../utils";

vi.mock("hooks/useTokenPrices", () => ({
  tokenPricesOptions: vi.fn().mockReturnValue({
    queryFn: () => ({}),
    queryKey: ["token-prices"],
  }),
}));

const sourceChainId = mainnet.id;
const destinationChainId = hemi.id;
const oftAddress: Address = "0xFc8Acf5ef1E8839Ec94151740CfEd95D7E579Afb";

describe("fetchBridgeLayerZeroFee", function () {
  const mockRecipient = zeroAddress;

  function createPrepopulatedQueryClient(
    nativeFee: bigint,
    chainId: number = sourceChainId,
  ) {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      previewBridgeQueryKey({
        amount: 100n,
        destinationChainId,
        oftAddress,
        recipient: mockRecipient,
        sourceChainId: chainId,
      }),
      { lzTokenFee: 0n, nativeFee },
    );
    return queryClient;
  }

  function mockPrices(prices: Record<string, string>) {
    vi.mocked(tokenPricesOptions).mockReturnValue({
      queryFn: () => prices,
      queryKey: ["token-prices"],
    } as never);
  }

  it("returns the LayerZero native fee in USD priced by source chain native symbol", async function () {
    const nativeFee = 5_000_000_000_000_000n; // 0.005 ETH
    const queryClient = createPrepopulatedQueryClient(nativeFee);
    mockPrices({ ETH: "2000" });

    const result = await fetchBridgeLayerZeroFee({
      amount: 100n,
      client: { chain: mainnet } as unknown as Client,
      destinationChainId,
      oftAddress,
      queryClient,
      recipient: mockRecipient,
      sourceChainId,
    });

    // 0.005 ETH * $2000 = $10
    expect(result).toBeCloseTo(10);
  });

  it("prices in BNB on BSC source chain", async function () {
    const nativeFee = parseUnits("0.002", bsc.nativeCurrency.decimals);
    const queryClient = createPrepopulatedQueryClient(nativeFee, bsc.id);
    // ETH price intentionally set wildly different to prove BNB is used.
    mockPrices({ BNB: "300", ETH: "2000" });

    const result = await fetchBridgeLayerZeroFee({
      amount: 100n,
      client: { chain: bsc } as unknown as Client,
      destinationChainId,
      oftAddress,
      queryClient,
      recipient: mockRecipient,
      sourceChainId: bsc.id,
    });

    // 0.002 BNB * $300 = $0.6
    expect(result).toBeCloseTo(0.6);
  });

  it("throws when the native price is missing from the API", async function () {
    const queryClient = createPrepopulatedQueryClient(1n);
    mockPrices({ USDC: "1" });

    await expect(
      fetchBridgeLayerZeroFee({
        amount: 100n,
        client: { chain: mainnet } as unknown as Client,
        destinationChainId,
        oftAddress,
        queryClient,
        recipient: mockRecipient,
        sourceChainId,
      }),
    ).rejects.toThrow("Invalid ETH price");
  });
});
