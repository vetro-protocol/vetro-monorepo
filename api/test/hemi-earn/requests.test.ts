import { checksumAddress } from "viem";
import { describe, expect, it, vi } from "vitest";

import * as graphql from "../../src/graphql.ts";
import { getRequests } from "../../src/hemi-earn/requests.ts";

vi.mock("../../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

const indexer = { url: "http://localhost:8080/v1/graphql" };
const asset = "0x3adf21a6cbc9ce6d5a3ea401e7bae9499d391298";
const receiver = "0x7f9a7dd6e1c7f9a8c0e4e5c3f2b1a0d9e8c7b6a5";

const buildRow = (
  overrides: Partial<{
    automatic: boolean | null;
    failed: boolean;
    status: "CANCELLED" | "FINALIZED" | "PENDING";
  }>,
) => ({
  amountIn: "1000000",
  amountOut: null,
  asset,
  automatic: true,
  cancellationRequested: false,
  claimableAt: null,
  claimTxHash: null,
  failed: false,
  failureReason: null,
  kind: "DEPOSIT",
  processedAt: null,
  processTxHash: null,
  receivedAt: null,
  receiver,
  recoverTxHash: null,
  requestedAt: "1759162804",
  requestId: "6",
  requestTxHash:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  retryCount: 0,
  status: "PENDING",
  ...overrides,
});

describe("hemi-earn/requests/getRequests", function () {
  it("queries by the lowercase initiator", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({ Request: [] });

    const result = await getRequests({
      address: "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01",
      indexer,
    });

    expect(result).toEqual([]);
    expect(graphql.runQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: indexer.url,
        variables: {
          initiator: "0xabcdef0123456789abcdef0123456789abcdef01",
          limit: 100,
          offset: 0,
        },
      }),
    );
  });

  it("checksums the addresses and defaults automatic to true", async function () {
    const row = buildRow({ automatic: null });
    vi.mocked(graphql.runQuery).mockResolvedValue({ Request: [row] });

    const [request] = await getRequests({ address: receiver, indexer });

    expect(request).toEqual({
      ...row,
      asset: checksumAddress(asset),
      automatic: true,
      receiver: checksumAddress(receiver),
    });
  });

  it("returns FAILED for a failed pending request", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      Request: [buildRow({ failed: true, status: "PENDING" })],
    });

    const [request] = await getRequests({ address: receiver, indexer });

    expect(request.failed).toBe(true);
    expect(request.status).toBe("FAILED");
  });

  it("keeps the terminal status of a failed request", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      Request: [buildRow({ failed: true, status: "CANCELLED" })],
    });

    const [request] = await getRequests({ address: receiver, indexer });

    expect(request.failed).toBe(true);
    expect(request.status).toBe("CANCELLED");
  });
});
