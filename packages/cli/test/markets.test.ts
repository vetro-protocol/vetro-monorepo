import { knownTokens } from "@vetro-protocol/core";
import { type Address, type Hash, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { selectMarket } from "../src/lib/markets.ts";

const mainnetToken = function (symbol: string) {
  const { address, decimals } = knownTokens.find(
    (token) => token.chainId === mainnet.id && token.symbol === symbol,
  )!;
  return { address, decimals, symbol };
};

const weth = mainnetToken("WETH");
const vusd = mainnetToken("VUSD");
const vetBtc = mainnetToken("vetBTC");

const createMarket = ({
  collateralToken,
  loanToken,
  marketId,
}: {
  collateralToken: { address: Address; decimals: number; symbol: string };
  loanToken: { address: Address; decimals: number; symbol: string };
  marketId: Hash;
}) => ({
  collateralToken,
  irm: zeroAddress,
  lltv: 860000000000000000n,
  loanToken,
  marketId,
  oracle: zeroAddress,
  pair: `${collateralToken.symbol}/${loanToken.symbol}`,
});

const wethVusd = createMarket({
  collateralToken: weth,
  loanToken: vusd,
  marketId: `0x${"1".repeat(64)}`,
});
const wethVetBtc = createMarket({
  collateralToken: weth,
  loanToken: vetBtc,
  marketId: `0x${"2".repeat(64)}`,
});
const vetBtcVusd = createMarket({
  collateralToken: vetBtc,
  loanToken: vusd,
  marketId: `0x${"a".repeat(64)}`,
});
const vetBtcVusdDuplicate = createMarket({
  collateralToken: vetBtc,
  loanToken: vusd,
  marketId: `0x${"b".repeat(64)}`,
});

const markets = [wethVusd, wethVetBtc, vetBtcVusd, vetBtcVusdDuplicate];

describe("selectMarket", function () {
  it("selects a market by the symbols of its pair", function () {
    expect(
      selectMarket({
        markets,
        selector: { collateral: "WETH", loan: "VUSD", value: "WETH/VUSD" },
      }),
    ).toBe(wethVusd);
  });

  it("selects a market by the addresses of its pair", function () {
    const value = `${weth.address.toLowerCase()}/${vetBtc.address.toLowerCase()}`;
    expect(
      selectMarket({
        markets,
        selector: {
          collateral: weth.address.toLowerCase(),
          loan: vetBtc.address.toLowerCase(),
          value,
        },
      }),
    ).toBe(wethVetBtc);
  });

  it("selects a market by a mixed-case pair", function () {
    expect(
      selectMarket({
        markets,
        selector: { collateral: "wEtH", loan: "VETbtc", value: "wEtH/VETbtc" },
      }),
    ).toBe(wethVetBtc);
  });

  it("selects one of two markets with the same pair by its id", function () {
    const marketId: Hash = `0x${"B".repeat(64)}`;
    expect(
      selectMarket({ markets, selector: { marketId, value: marketId } }),
    ).toBe(vetBtcVusdDuplicate);
  });

  it("throws with the enabled pairs when no market matches", function () {
    expect(() =>
      selectMarket({
        markets,
        selector: { collateral: "VUSD", loan: "WETH", value: "VUSD/WETH" },
      }),
    ).toThrow(
      `Not an enabled market: "VUSD/WETH". Enabled markets: WETH/VUSD (0x${"1".repeat(64)}), WETH/vetBTC (0x${"2".repeat(64)}), vetBTC/VUSD (0x${"a".repeat(64)}), vetBTC/VUSD (0x${"b".repeat(64)})`,
    );
  });

  it("throws with the market ids when a pair matches more than one market", function () {
    expect(() =>
      selectMarket({
        markets,
        selector: {
          collateral: "vetBTC",
          loan: "VUSD",
          value: "vetBTC/VUSD",
        },
      }),
    ).toThrow(
      `Ambiguous market "vetBTC/VUSD": it matches the market ids ${vetBtcVusd.marketId}, ${vetBtcVusdDuplicate.marketId}. Pass one of them as --market`,
    );
  });
});
