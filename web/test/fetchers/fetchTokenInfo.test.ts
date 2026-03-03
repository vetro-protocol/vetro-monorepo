import type { Client } from "viem";
import { mainnet } from "viem/chains";
import { decimals, name, symbol } from "viem-erc20/actions";
import { describe, expect, it, vi } from "vitest";

import { fetchTokenInfo } from "../../src/fetchers/fetchTokenInfo";
import { knownTokens } from "../../src/utils/tokenList";

vi.mock("viem-erc20/actions", () => ({
  decimals: vi.fn(),
  name: vi.fn(),
  symbol: vi.fn(),
}));

// Import after mock setup

const client = { chain: mainnet } as unknown as Client;

describe("fetchTokenInfo", function () {
  it("returns known token without on-chain calls", async function () {
    const known = knownTokens[0];
    const result = await fetchTokenInfo({
      address: known.address,
      client,
    });

    expect(result).toEqual(known);
    expect(decimals).not.toHaveBeenCalled();
    expect(name).not.toHaveBeenCalled();
    expect(symbol).not.toHaveBeenCalled();
  });

  it("fetches on-chain when address is not known", async function () {
    vi.mocked(decimals).mockResolvedValue(18);
    vi.mocked(name).mockResolvedValue("Unknown Token");
    vi.mocked(symbol).mockResolvedValue("UNK");

    const address = "0x1234567890abcdef1234567890abcdef12345678" as const;
    const result = await fetchTokenInfo({ address, client });

    expect(result).toEqual({
      address,
      chainId: mainnet.id,
      decimals: 18,
      logoURI: "",
      name: "Unknown Token",
      symbol: "UNK",
    });
    expect(decimals).toHaveBeenCalledWith(client, { address });
    expect(name).toHaveBeenCalledWith(client, { address });
    expect(symbol).toHaveBeenCalledWith(client, { address });
  });
});
