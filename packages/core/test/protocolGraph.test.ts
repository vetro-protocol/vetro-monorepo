import { type Address, getAddress, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { gateways } from "../src/protocolGraph.ts";
import { stakingVaultAddresses } from "../src/stakingVaultAddresses.ts";
import { knownTokens } from "../src/tokens.ts";

const isKnownOnMainnet = (address: Address) =>
  knownTokens.some(
    (token) =>
      token.chainId === mainnet.id && isAddressEqual(token.address, address),
  );

describe("gateways", function () {
  // This test is just to ensure we don't break the default gateway
  // which is the first one on the list.
  it("should list the VUSD gateway first", function () {
    expect(gateways[0].pegBaseSymbol).toBe("USD");
  });

  it.for(gateways)(
    "$address should hold checksummed addresses",
    function (gateway) {
      const addresses = [
        gateway.address,
        gateway.peggedToken,
        gateway.treasury,
        ...gateway.whitelistedTokens,
        ...(gateway.stakingVault ? [gateway.stakingVault] : []),
      ];
      expect(addresses).toEqual(
        addresses.map((address) => getAddress(address)),
      );
    },
  );

  it.for(gateways.filter((gateway) => gateway.stakingVault !== undefined))(
    "$address should point at a known staking vault",
    function (gateway) {
      expect(stakingVaultAddresses).toContain(gateway.stakingVault);
    },
  );

  it.for(gateways)(
    "$address should list each whitelisted token once",
    function (gateway) {
      expect(new Set(gateway.whitelistedTokens).size).toBe(
        gateway.whitelistedTokens.length,
      );
    },
  );

  // The app builds `placeholderData` out of the graph plus `knownTokens`: the
  // token selector from the pegged and whitelisted tokens, the Analytics share
  // token from the staking vault. A token missing from `knownTokens` has no
  // metadata, so that query falls back to reading the chain and the graph
  // gains nothing.
  it.for(gateways)(
    "$address should have metadata for every token",
    function (gateway) {
      expect(
        [
          gateway.peggedToken,
          ...gateway.whitelistedTokens,
          ...(gateway.stakingVault ? [gateway.stakingVault] : []),
        ].filter((address) => !isKnownOnMainnet(address)),
      ).toEqual([]);
    },
  );
});
