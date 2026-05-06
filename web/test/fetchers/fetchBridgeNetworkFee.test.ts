import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { previewBridgeQueryKey } from "hooks/usePreviewBridge";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import type { BridgeableToken } from "types";
import { type Address, type Client, parseEther, zeroAddress } from "viem";
import { estimateGas, readContract } from "viem/actions";
import { bsc, hemi, mainnet } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";
import { fetchBridgeNetworkFee } from "../../src/fetchers/fetchBridgeNetworkFee";
import { createTestQueryClient } from "../utils";

vi.mock("../../src/fetchers/estimateApprovalGasUnits", () => ({
  estimateApprovalGasUnits: vi.fn(),
}));

vi.mock("@vetro-protocol/bridge/actions", () => ({
  encodeSend: vi.fn().mockReturnValue("0x"),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
  readContract: vi.fn(),
}));

vi.mock("utils/erc20StateOverride", () => ({
  createErc20AllowanceStateOverride: vi.fn().mockReturnValue([]),
}));

vi.mock("@hemilabs/react-hooks/useEstimateFees", () => ({
  estimateFeesQueryOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
    queryKey: ["estimate-fees"],
  }),
}));

vi.mock("hooks/useTokenPrices", () => ({
  tokenPricesOptions: vi.fn().mockReturnValue({
    queryFn: () => ({}),
    queryKey: ["token-prices"],
  }),
}));

vi.mock("providers/web3Provider", () => ({
  config: {},
}));

const sourceChainId = mainnet.id;
const destinationChainId = hemi.id;
const oftAddress: Address = "0xFc8Acf5ef1E8839Ec94151740CfEd95D7E579Afb";

describe("fetchBridgeNetworkFee", function () {
  const mockOwner = zeroAddress;
  const mockRecipient = zeroAddress;
  const mockClient = {
    chain: mainnet,
  } as unknown as Client;
  // @ts-expect-error - only address and chainId are needed for these tests
  const mockToken = {
    address: zeroAddress,
    chainId: sourceChainId,
  } as BridgeableToken;

  function createPrepopulatedQueryClient({
    balance = 1000n,
    nativeFee = 5n,
  }: { balance?: bigint; nativeFee?: bigint } = {}) {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      tokenBalanceQueryKey(
        { address: zeroAddress, chainId: sourceChainId },
        mockOwner,
      ),
      balance,
    );
    queryClient.setQueryData(
      previewBridgeQueryKey({
        amount: 100n,
        destinationChainId,
        oftAddress,
        recipient: mockRecipient,
        sourceChainId,
      }),
      { lzTokenFee: 0n, nativeFee },
    );
    return queryClient;
  }

  function mockNetworkFeeAndPrices({
    networkFeeWei,
    prices,
  }: {
    networkFeeWei: bigint;
    prices: Record<string, string>;
  }) {
    vi.mocked(estimateFeesQueryOptions).mockReturnValue({
      queryFn: () => networkFeeWei,
      queryKey: ["estimate-fees"],
    } as never);
    vi.mocked(tokenPricesOptions).mockReturnValue({
      queryFn: () => prices,
      queryKey: ["token-prices"],
    } as never);
  }

  it("returns USD from approval and send gas when approval is required", async function () {
    const approvalGas = 46_000n;
    const sendGas = 250_000n;
    const networkFeeWei = parseEther("0.01");
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(readContract).mockResolvedValue(true);
    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(approvalGas);
    vi.mocked(estimateGas).mockResolvedValue(sendGas);
    mockNetworkFeeAndPrices({
      networkFeeWei,
      prices: { ETH: "2000" },
    });

    const result = await fetchBridgeNetworkFee({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      destinationChainId,
      oftAddress,
      owner: mockOwner,
      queryClient,
      recipient: mockRecipient,
      sourceChainId,
      sourceToken: mockToken,
    });

    // 0.01 ETH * $2000 = $20
    expect(result).toBeCloseTo(20);
    expect(estimateApprovalGasUnits).toHaveBeenCalledOnce();
    expect(estimateFeesQueryOptions).toHaveBeenCalledWith(
      expect.objectContaining({ gasUnits: approvalGas + sendGas }),
    );
  });

  it("skips approval gas when approval is not required", async function () {
    const sendGas = 200_000n;
    const networkFeeWei = parseEther("0.01");
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(readContract).mockResolvedValue(false);
    vi.mocked(estimateGas).mockResolvedValue(sendGas);
    mockNetworkFeeAndPrices({
      networkFeeWei,
      prices: { ETH: "2000" },
    });

    const result = await fetchBridgeNetworkFee({
      amount: 100n,
      approveAmount: undefined,
      client: mockClient,
      destinationChainId,
      oftAddress,
      owner: mockOwner,
      queryClient,
      recipient: mockRecipient,
      sourceChainId,
      sourceToken: mockToken,
    });

    expect(result).toBeCloseTo(20);
    expect(estimateApprovalGasUnits).not.toHaveBeenCalled();
    expect(estimateFeesQueryOptions).toHaveBeenCalledWith(
      expect.objectContaining({ gasUnits: sendGas }),
    );
  });

  it("forwards the LayerZero native fee as the send tx value", async function () {
    const nativeFee = 12_345n;
    const queryClient = createPrepopulatedQueryClient({ nativeFee });

    vi.mocked(readContract).mockResolvedValue(false);
    vi.mocked(estimateGas).mockResolvedValue(180_000n);
    mockNetworkFeeAndPrices({
      networkFeeWei: 0n,
      prices: { ETH: "2000" },
    });

    await fetchBridgeNetworkFee({
      amount: 100n,
      approveAmount: undefined,
      client: mockClient,
      destinationChainId,
      oftAddress,
      owner: mockOwner,
      queryClient,
      recipient: mockRecipient,
      sourceChainId,
      sourceToken: mockToken,
    });

    expect(estimateGas).toHaveBeenCalledWith(
      mockClient,
      expect.objectContaining({ to: oftAddress, value: nativeFee }),
    );
  });

  it("prices in BNB on BSC source chain", async function () {
    const sendGas = 200_000n;
    const networkFeeWei = parseEther("0.01");
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(readContract).mockResolvedValue(false);
    vi.mocked(estimateGas).mockResolvedValue(sendGas);
    mockNetworkFeeAndPrices({
      networkFeeWei,
      prices: { BNB: "300", ETH: "2000" },
    });

    const bscClient = { chain: bsc } as unknown as Client;
    const result = await fetchBridgeNetworkFee({
      amount: 100n,
      approveAmount: undefined,
      client: bscClient,
      destinationChainId,
      oftAddress,
      owner: mockOwner,
      queryClient,
      recipient: mockRecipient,
      sourceChainId,
      sourceToken: mockToken,
    });

    // 0.01 BNB * $300 = $3
    expect(result).toBeCloseTo(3);
  });

  it("throws when amount exceeds token balance", async function () {
    const queryClient = createPrepopulatedQueryClient({ balance: 50n });

    await expect(
      fetchBridgeNetworkFee({
        amount: 100n,
        approveAmount: 100n,
        client: mockClient,
        destinationChainId,
        oftAddress,
        owner: mockOwner,
        queryClient,
        recipient: mockRecipient,
        sourceChainId,
        sourceToken: mockToken,
      }),
    ).rejects.toThrow("Insufficient token balance");

    expect(readContract).not.toHaveBeenCalled();
    expect(estimateGas).not.toHaveBeenCalled();
    expect(estimateApprovalGasUnits).not.toHaveBeenCalled();
  });
});
