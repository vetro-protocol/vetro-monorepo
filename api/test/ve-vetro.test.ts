import { checksumAddress } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as graphql from "../src/graphql.ts";
import { getVeVetro } from "../src/ve-vetro.ts";

vi.mock("../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

const subgraph = { url: "http://localhost:8000/subgraphs/name/ve-vetro" };
const claimant = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const recipient = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";
const now = 1801353600;

const buildPosition = (
  overrides: Partial<{ status: string; transferableAfter: string }>,
) => ({
  amount: "1250000000000000000000",
  id: "42",
  status: "active",
  transferableAfter: "0",
  unlockTime: "1832889600",
  ...overrides,
});

const buildResponse = (
  overrides: Partial<{ claims: unknown[]; veVetroPositions: unknown[] }>,
) => ({
  _meta: { block: { number: 5700123 } },
  claims: [],
  veVetroPositions: [],
  ...overrides,
});

describe("ve-vetro/getVeVetro", function () {
  beforeEach(function () {
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it("queries by the lowercase address", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue(buildResponse({}));

    const result = await getVeVetro({
      address: checksumAddress(claimant),
      subgraph,
    });

    expect(result).toEqual({
      claims: [],
      indexedBlock: 5700123,
      positions: [],
    });
    expect(graphql.runQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        url: subgraph.url,
        variables: { address: claimant, first: 1000 },
      }),
    );
  });

  it("maps the claims and checksums their addresses", async function () {
    const transactionHash =
      "0x1111111111111111111111111111111111111111111111111111111111111111";
    vi.mocked(graphql.runQuery).mockResolvedValue(
      buildResponse({
        claims: [
          {
            amount: "1250000000000000000000",
            blockTimestamp: "1801353500",
            claimant,
            position: { id: "42" },
            recipient,
            transactionHash,
            veHemiPositions: [{ id: "1388" }, { id: "203" }],
          },
        ],
      }),
    );

    const { claims } = await getVeVetro({ address: claimant, subgraph });

    expect(claims).toEqual([
      {
        amount: "1250000000000000000000",
        claimant: checksumAddress(claimant),
        positionTokenId: "42",
        recipient: checksumAddress(recipient),
        timestamp: 1801353500,
        transactionHash,
        veHemiTokenIds: ["203", "1388"],
      },
    ]);
  });

  it("maps the positions", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue(
      buildResponse({
        veVetroPositions: [buildPosition({ status: "withdrawn" })],
      }),
    );

    const { positions } = await getVeVetro({ address: claimant, subgraph });

    expect(positions).toEqual([
      {
        amount: "1250000000000000000000",
        status: "withdrawn",
        tokenId: "42",
        transferable: true,
        unlockTime: 1832889600,
      },
    ]);
  });

  it("is transferable from transferableAfter on", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue(
      buildResponse({
        veVetroPositions: [
          buildPosition({ transferableAfter: String(now) }),
          buildPosition({ transferableAfter: String(now + 1) }),
        ],
      }),
    );

    const { positions } = await getVeVetro({ address: claimant, subgraph });

    expect(positions.map((position) => position.transferable)).toEqual([
      true,
      false,
    ]);
  });

  it("throws on an invalid subgraph response", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue(
      buildResponse({ claims: null }),
    );

    await expect(getVeVetro({ address: claimant, subgraph })).rejects.toThrow(
      `Invalid subgraph response for veVETRO of ${claimant}`,
    );
  });
});
