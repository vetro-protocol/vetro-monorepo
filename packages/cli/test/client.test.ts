import { numberToHex } from "viem";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createVetroClient } from "../src/lib/client.ts";

const rpcUrl = "https://rpc.example";

// The transport batches, so it sends a JSON-RPC array and expects one back.
const stubEndpointOnChain = (chainId: number) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async function (_url: string, { body }: RequestInit) {
      const request = JSON.parse(String(body)) as
        | { id: number }[]
        | { id: number };
      const respond = ({ id }: { id: number }) => ({
        id,
        jsonrpc: "2.0",
        result: numberToHex(chainId),
      });
      return new Response(
        JSON.stringify(
          Array.isArray(request) ? request.map(respond) : respond(request),
        ),
        { headers: { "Content-Type": "application/json" } },
      );
    }),
  );

describe("createVetroClient", function () {
  afterEach(function () {
    vi.unstubAllGlobals();
  });

  it("accepts Ethereum mainnet", async function () {
    stubEndpointOnChain(1);
    const { chainId } = await createVetroClient({ rpcUrl });
    expect(chainId).toBe(1);
  });

  it("accepts a local fork on the anvil/Hardhat default", async function () {
    stubEndpointOnChain(31337);
    const { chainId } = await createVetroClient({ rpcUrl });
    expect(chainId).toBe(31337);
  });

  it("rejects a chain Vetro is not deployed on", async function () {
    stubEndpointOnChain(8453);
    await expect(createVetroClient({ rpcUrl })).rejects.toThrow(
      "The RPC endpoint is on chain 8453, but Vetro is only deployed on Ethereum mainnet (1)",
    );
  });
});
