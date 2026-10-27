import {
  getCanEntry,
  getEntryGate,
} from "@vetro-protocol/target-yield-earn/actions";
import { type Address, type Client, zeroAddress } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCanEntry } from "../../src/fetchers/earn/targetYieldPool/fetchCanEntry";

vi.mock("@vetro-protocol/target-yield-earn/actions", () => ({
  getCanEntry: vi.fn(),
  getEntryGate: vi.fn(),
}));

const client = {} as Client;
const entryGate: Address = "0x1111111111111111111111111111111111111111";
const owner: Address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const stakingVaultAddress: Address =
  "0x1234567890123456789012345678901234567890";

describe("fetchCanEntry", function () {
  beforeEach(function () {
    vi.mocked(getCanEntry).mockReset();
    vi.mocked(getEntryGate).mockReset();
  });

  it("returns true without asking a gate when the vault has no entry gate", async function () {
    vi.mocked(getEntryGate).mockResolvedValue(zeroAddress);

    const canEntry = await fetchCanEntry({
      client,
      owner,
      stakingVaultAddress,
    });

    expect(canEntry).toBe(true);
    expect(getEntryGate).toHaveBeenCalledWith(client, {
      address: stakingVaultAddress,
    });
    expect(getCanEntry).not.toHaveBeenCalled();
  });

  it("returns the entry gate answer when the vault has an entry gate", async function () {
    vi.mocked(getEntryGate).mockResolvedValue(entryGate);
    vi.mocked(getCanEntry).mockResolvedValue(false);

    const canEntry = await fetchCanEntry({
      client,
      owner,
      stakingVaultAddress,
    });

    expect(canEntry).toBe(false);
    expect(getEntryGate).toHaveBeenCalledWith(client, {
      address: stakingVaultAddress,
    });
    expect(getCanEntry).toHaveBeenCalledWith(client, {
      address: entryGate,
      owner,
      vault: stakingVaultAddress,
    });
  });
});
