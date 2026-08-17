import { expect, test } from "@playwright/test";
import { gateways } from "@vetro-protocol/core";
import { getPeggedToken, getTreasury } from "@vetro-protocol/gateway/actions";
import { getWhitelistedTokens } from "@vetro-protocol/treasury/actions";
import { getAddress } from "viem";
import { asset } from "viem-erc4626/actions";

import { createEthereumClient } from "./anvil";

test.describe("the protocol graph agrees with the chain", function () {
  for (const gateway of gateways) {
    test(`gateway ${gateway.address}`, async function () {
      const client = createEthereumClient();

      const [peggedToken, treasury] = await Promise.all([
        getPeggedToken(client, { address: gateway.address }),
        getTreasury(client, { address: gateway.address }),
      ]);

      expect(
        getAddress(peggedToken),
        `Pegged token for gateway ${gateway.address} does not match`,
      ).toBe(gateway.peggedToken);
      expect(
        getAddress(treasury),
        `Treasury for gateway ${gateway.address} does not match`,
      ).toBe(gateway.treasury);

      const whitelistedTokens = await getWhitelistedTokens(client, {
        address: treasury,
      });
      expect(whitelistedTokens.map((token) => getAddress(token))).toEqual(
        gateway.whitelistedTokens,
      );

      if (gateway.stakingVault) {
        const vaultAsset = await asset(client, {
          address: gateway.stakingVault,
        });
        expect(
          getAddress(vaultAsset),
          `Staking vault ${gateway.stakingVault} for gateway ${gateway.address} does not match its asset and pegged token.`,
        ).toBe(gateway.peggedToken);
      }
    });
  }
});
