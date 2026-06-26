import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { gateways } from "@vetro-protocol/gateway";
import { getPeggedToken } from "@vetro-protocol/gateway/actions";
import { getAddress, isAddressEqual } from "viem";
import { decimals, symbol } from "viem-erc20/actions";
import { asset } from "viem-erc4626/actions";

import { client } from "../lib/client";
import { type TrackedToken } from "../lib/types";

// Discovers the tracked tokens on-chain instead of hardcoding them: each gateway's
// pegged token, plus each staking vault (the vault address is the ERC4626 share
// token itself). Pegged tokens carry their gateway's peg base symbol (as
// extensions.priceSymbol); share tokens inherit it from the pegged token they hold.
// A share's underlying decimals are read on demand at pricing time (see
// fetchTokenPrices), not stored here. The gateway/vault address lists come from the
// shared @vetro-protocol packages, so new gateways/vaults are picked up
// automatically when those packages update.
export const fetchTrackedTokens = async function (): Promise<TrackedToken[]> {
  const peggedTokens = await Promise.all(
    gateways.map(async function (gateway) {
      const address = getAddress(
        await getPeggedToken(client, { address: gateway.address }),
      );
      const [tokenDecimals, tokenSymbol] = await Promise.all([
        decimals(client, { address }),
        symbol(client, { address }),
      ]);
      return {
        address,
        decimals: tokenDecimals,
        extensions: { priceSymbol: gateway.pegBaseSymbol },
        symbol: tokenSymbol,
      } satisfies TrackedToken;
    }),
  );

  const shareTokens = await Promise.all(
    stakingVaultAddresses.map(async function (vaultAddress) {
      const address = getAddress(vaultAddress);
      const [assetAddress, tokenDecimals, tokenSymbol] = await Promise.all([
        asset(client, { address }),
        decimals(client, { address }),
        symbol(client, { address }),
      ]);
      const underlying = peggedTokens.find((token) =>
        isAddressEqual(token.address, assetAddress),
      );
      if (!underlying) {
        throw new Error(`No tracked pegged token for vault ${vaultAddress}`);
      }
      return {
        address,
        decimals: tokenDecimals,
        extensions: {
          isVaultShare: true,
          priceSymbol: underlying.extensions?.priceSymbol,
        },
        symbol: tokenSymbol,
      } satisfies TrackedToken;
    }),
  );

  return [...peggedTokens, ...shareTokens];
};
