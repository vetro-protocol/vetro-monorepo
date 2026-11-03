import {
  getCooldownEnabled,
  getInstantWithdrawWhitelist,
} from "@vetro-protocol/earn/actions";
import { type Address, type Client } from "viem";
import { describe, expect, it, vi } from "vitest";

import { resolveIsInstant } from "../../src/actions/public/resolveIsInstant.ts";

vi.mock("@vetro-protocol/earn/actions", () => ({
  getCooldownEnabled: vi.fn(),
  getInstantWithdrawWhitelist: vi.fn(),
}));

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};
const address = "0x000000000000000000000000000000000000bEEF" as Address;
const caller = "0x000000000000000000000000000000000000dEaD" as Address;

describe("resolveIsInstant", function () {
  it("returns true when cooldown is disabled regardless of whitelist", async function () {
    vi.mocked(getCooldownEnabled).mockResolvedValue(false);
    vi.mocked(getInstantWithdrawWhitelist).mockResolvedValue(false);

    const result = await resolveIsInstant(client, { address, caller });

    expect(result).toBe(true);
    expect(getCooldownEnabled).toHaveBeenCalledWith(client, { address });
    expect(getInstantWithdrawWhitelist).toHaveBeenCalledWith(client, {
      account: caller,
      address,
    });
  });

  it("returns true when cooldown is disabled and caller is whitelisted", async function () {
    vi.mocked(getCooldownEnabled).mockResolvedValue(false);
    vi.mocked(getInstantWithdrawWhitelist).mockResolvedValue(true);

    const result = await resolveIsInstant(client, { address, caller });

    expect(result).toBe(true);
  });

  it("returns true when caller is whitelisted even with cooldown enabled", async function () {
    vi.mocked(getCooldownEnabled).mockResolvedValue(true);
    vi.mocked(getInstantWithdrawWhitelist).mockResolvedValue(true);

    const result = await resolveIsInstant(client, { address, caller });

    expect(result).toBe(true);
  });

  it("returns false for the default cooldown path (enabled + not whitelisted)", async function () {
    vi.mocked(getCooldownEnabled).mockResolvedValue(true);
    vi.mocked(getInstantWithdrawWhitelist).mockResolvedValue(false);

    const result = await resolveIsInstant(client, { address, caller });

    expect(result).toBe(false);
  });
});
