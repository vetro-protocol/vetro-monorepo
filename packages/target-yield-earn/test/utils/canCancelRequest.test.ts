import { type Address, type WalletClient } from "viem";
import { readContract } from "viem/actions";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { getCancelableDepositRequest } from "../../src/actions/public/getCancelableDepositRequest.ts";
import { getCancelableRedeemRequest } from "../../src/actions/public/getCancelableRedeemRequest.ts";
import { canCancelRequest } from "../../src/utils/canCancelRequest.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

vi.mock("../../src/actions/public/getCancelableDepositRequest.ts", () => ({
  getCancelableDepositRequest: vi.fn(),
}));

vi.mock("../../src/actions/public/getCancelableRedeemRequest.ts", () => ({
  getCancelableRedeemRequest: vi.fn(),
}));

const mockWalletClient = {
  account: {
    address: "0x1111111111111111111111111111111111111111" as Address,
  },
  chain: sepolia,
} as unknown as WalletClient;

const address = "0x1234567890123456789012345678901234567890" as Address;

const account = mockWalletClient.account!.address;

const otherController = "0x3333333333333333333333333333333333333333" as Address;

const rpcError = new Error("RPC error");

describe.each([
  {
    getCancelableRequest: getCancelableDepositRequest,
    request: "deposit" as const,
  },
  {
    getCancelableRequest: getCancelableRedeemRequest,
    request: "redeem" as const,
  },
])(
  "canCancelRequest for a $request request",
  function ({ getCancelableRequest, request }) {
    it("should not allow the cancel if there is no cancelable request", async function () {
      vi.mocked(getCancelableRequest).mockResolvedValueOnce(BigInt(0));

      const result = await canCancelRequest({
        address,
        client: mockWalletClient,
        controller: account,
        request,
      });

      expect(result).toEqual({
        canCancelRequest: false,
        reason: `No cancelable ${request} request`,
      });
    });

    it("should not allow the cancel if the account is not the controller or its operator", async function () {
      vi.mocked(readContract).mockResolvedValueOnce(false);
      vi.mocked(getCancelableRequest).mockResolvedValueOnce(BigInt(1000));

      const result = await canCancelRequest({
        address,
        client: mockWalletClient,
        controller: otherController,
        request,
      });

      expect(readContract).toHaveBeenCalledExactlyOnceWith(mockWalletClient, {
        abi: expect.anything(),
        address,
        args: [otherController, account],
        functionName: "isOperator",
      });
      expect(result).toEqual({
        canCancelRequest: false,
        reason: "Account is not the controller or its operator",
      });
    });

    it("should read the cancelable request of the controller when the account is its operator", async function () {
      vi.mocked(readContract).mockResolvedValueOnce(true);
      vi.mocked(getCancelableRequest).mockResolvedValueOnce(BigInt(1000));

      const result = await canCancelRequest({
        address,
        client: mockWalletClient,
        controller: otherController,
        request,
      });

      expect(getCancelableRequest).toHaveBeenCalledExactlyOnceWith(
        mockWalletClient,
        { address, controller: otherController },
      );
      expect(result).toEqual({ canCancelRequest: true });
    });

    it("should not read the operator status when the account is the controller", async function () {
      vi.mocked(getCancelableRequest).mockResolvedValueOnce(BigInt(1000));

      const result = await canCancelRequest({
        address,
        client: mockWalletClient,
        controller: account,
        request,
      });

      expect(readContract).not.toHaveBeenCalled();
      expect(result).toEqual({ canCancelRequest: true });
    });

    it.each([
      {
        mockRead() {
          vi.mocked(readContract).mockRejectedValueOnce(rpcError);
          vi.mocked(getCancelableRequest).mockResolvedValueOnce(BigInt(1000));
        },
        name: "isOperator",
      },
      {
        mockRead() {
          vi.mocked(readContract).mockResolvedValueOnce(true);
          vi.mocked(getCancelableRequest).mockRejectedValueOnce(rpcError);
        },
        name: "cancelable request",
      },
    ])("should throw when the $name read fails", async function ({ mockRead }) {
      mockRead();

      await expect(
        canCancelRequest({
          address,
          client: mockWalletClient,
          controller: otherController,
          request,
        }),
      ).rejects.toThrow(rpcError);
    });
  },
);
