import type { Gateway } from "@vetro-protocol/gateway";
import { oraclePricesOptions } from "hooks/useOraclePrices";
import { tokenPricesOptions } from "hooks/useTokenPrices";
import type { Address, Client } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { fetchPrices } from "../../src/fetchers/fetchPrices";
import { createTestQueryClient } from "../utils";

const client = { chain: mainnet } as unknown as Client;

const vusdGateway: Gateway = {
  address: "0x0000000000000000000000000000000000000001" as Address,
  pegBaseSymbol: "USD",
};
const vetBtcGateway: Gateway = {
  address: "0x0000000000000000000000000000000000000002" as Address,
  pegBaseSymbol: "BTC",
};
const vetEthGateway: Gateway = {
  address: "0x0000000000000000000000000000000000000003" as Address,
  pegBaseSymbol: "ETH",
};

const seed = function (
  queryClient: ReturnType<typeof createTestQueryClient>,
  {
    oraclesByGateway,
    portal,
  }: {
    oraclesByGateway: Record<Address, Record<string, string>>;
    portal: Record<string, string>;
  },
) {
  queryClient.setQueryData(tokenPricesOptions().queryKey, portal);
  Object.entries(oraclesByGateway).forEach(function ([gatewayAddress, dict]) {
    queryClient.setQueryData(
      oraclePricesOptions({
        client,
        gatewayAddress: gatewayAddress as Address,
        queryClient,
      }).queryKey,
      dict,
    );
  });
};

describe("fetchPrices", function () {
  it("returns portal-only entries when no gateways are provided", async function () {
    const queryClient = createTestQueryClient();
    seed(queryClient, {
      oraclesByGateway: {},
      portal: { BTC: "76800", ETH: "2288", USDT: "1" },
    });

    const result = await fetchPrices({
      client,
      gateways: [],
      queryClient,
    });

    expect(result).toEqual({ BTC: "76800", ETH: "2288", USDT: "1" });
  });

  it("passes USD-pegged oracle entries through unchanged", async function () {
    const queryClient = createTestQueryClient();
    seed(queryClient, {
      oraclesByGateway: {
        [vusdGateway.address]: { USDC: "0.999", USDT: "1.001" },
      },
      portal: { USDC: "1", USDT: "1" },
    });

    const result = await fetchPrices({
      client,
      gateways: [vusdGateway],
      queryClient,
    });

    // Oracle overrides portal for USDC/USDT, no multiplication for USD-pegged.
    expect(result.USDC).toBe("0.999");
    expect(result.USDT).toBe("1.001");
  });

  it("multiplies BTC-pegged oracle entries by portal['BTC']", async function () {
    const queryClient = createTestQueryClient();
    seed(queryClient, {
      oraclesByGateway: {
        // 1 WBTC = 0.998 BTC, 1 cbBTC = 1.0001 BTC
        [vetBtcGateway.address]: { CBBTC: "1.0001", WBTC: "0.998" },
      },
      portal: { BTC: "76800", USDT: "1", WBTC: "76580" },
    });

    const result = await fetchPrices({
      client,
      gateways: [vetBtcGateway],
      queryClient,
    });

    // WBTC is overwritten by oracle×BTC: 0.998 × 76800 = 76646.4
    expect(Number(result.WBTC)).toBeCloseTo(76646.4, 4);
    // cbBTC: 1.0001 × 76800 = 76807.68
    expect(Number(result.CBBTC)).toBeCloseTo(76807.68, 4);
    // Portal BTC entry survives untouched.
    expect(result.BTC).toBe("76800");
  });

  it("multiplies ETH-pegged oracle entries by portal['ETH']", async function () {
    const queryClient = createTestQueryClient();
    seed(queryClient, {
      oraclesByGateway: {
        // 1 WETH = 1.0 ETH, 1 stETH = 1.005 ETH
        [vetEthGateway.address]: { STETH: "1.005", WETH: "1" },
      },
      portal: { ETH: "2288", USDT: "1" },
    });

    const result = await fetchPrices({
      client,
      gateways: [vetEthGateway],
      queryClient,
    });

    // WETH: 1 × 2288 = 2288
    expect(Number(result.WETH)).toBeCloseTo(2288, 4);
    // stETH: 1.005 × 2288 = 2299.44
    expect(Number(result.STETH)).toBeCloseTo(2299.44, 4);
    expect(result.ETH).toBe("2288");
  });

  it("composes multiple gateways simultaneously", async function () {
    const queryClient = createTestQueryClient();
    seed(queryClient, {
      oraclesByGateway: {
        [vetBtcGateway.address]: { WBTC: "0.998" },
        [vusdGateway.address]: { USDC: "1.0001" },
      },
      portal: { BTC: "76800", HEMI: "0.0086", USDT: "1" },
    });

    const result = await fetchPrices({
      client,
      gateways: [vusdGateway, vetBtcGateway],
      queryClient,
    });

    // VUSD gateway: USDC pass-through.
    expect(result.USDC).toBe("1.0001");
    // vetBTC gateway: WBTC × BTC.
    expect(Number(result.WBTC)).toBeCloseTo(76646.4, 4);
    // Portal-only entries survive.
    expect(result.BTC).toBe("76800");
    expect(result.HEMI).toBe("0.0086");
  });

  it("zeros out a gateway's tokens when its peg base is missing from portal", async function () {
    const queryClient = createTestQueryClient();
    seed(queryClient, {
      oraclesByGateway: {
        [vetBtcGateway.address]: { CBBTC: "1.0001", WBTC: "0.998" },
      },
      // Portal returned without BTC entry — degraded source.
      portal: { ETH: "2288", USDT: "1" },
    });

    const result = await fetchPrices({
      client,
      gateways: [vetBtcGateway],
      queryClient,
    });

    expect(result.WBTC).toBe("0");
    expect(result.CBBTC).toBe("0");
    // Other portal entries unaffected.
    expect(result.ETH).toBe("2288");
  });

  it("handles a gateway with an empty oracle dict", async function () {
    const queryClient = createTestQueryClient();
    seed(queryClient, {
      oraclesByGateway: {
        [vetBtcGateway.address]: {},
      },
      portal: { BTC: "76800", WBTC: "76580" },
    });

    const result = await fetchPrices({
      client,
      gateways: [vetBtcGateway],
      queryClient,
    });

    // Nothing to override; portal passes through.
    expect(result).toEqual({ BTC: "76800", WBTC: "76580" });
  });

  it("oracle entries override portal entries on collision", async function () {
    const queryClient = createTestQueryClient();
    seed(queryClient, {
      oraclesByGateway: {
        // Oracle says 1 WBTC = 0.998 BTC → USD price 76646.4
        [vetBtcGateway.address]: { WBTC: "0.998" },
      },
      // Portal disagrees on WBTC USD price.
      portal: { BTC: "76800", WBTC: "99999" },
    });

    const result = await fetchPrices({
      client,
      gateways: [vetBtcGateway],
      queryClient,
    });

    // Oracle wins.
    expect(Number(result.WBTC)).toBeCloseTo(76646.4, 4);
  });
});
