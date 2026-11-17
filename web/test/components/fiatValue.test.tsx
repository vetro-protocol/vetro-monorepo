import type { Token } from "@vetro-protocol/core";
import { parseUnits, zeroAddress } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { RenderFiatValue } from "../../src/components/base/fiatValue";
import { formatFiatNumberRoundDown } from "../../src/utils/format";

const mocks = vi.hoisted(() => ({
  prices: {
    data: undefined as Record<string, string> | undefined,
    status: "success" as "error" | "pending" | "success",
  },
}));

vi.mock("hooks/usePrices", () => ({
  usePrices: () => mocks.prices,
}));

const createToken = ({
  decimals,
  symbol,
}: Pick<Token, "decimals" | "symbol">): Token => ({
  address: zeroAddress,
  chainId: 1,
  decimals,
  logoURI: "",
  name: symbol,
  symbol,
});

const vusd = createToken({ decimals: 18, symbol: "VUSD" });
const usdc = createToken({ decimals: 6, symbol: "USDC" });
const wbtc = createToken({ decimals: 8, symbol: "WBTC" });

const renderFiatValue = async function ({
  amount,
  roundDown = false,
  token,
}: {
  amount: string;
  roundDown?: boolean;
  token: Token;
}) {
  const screen = await render(
    <span data-testid="fiat">
      <RenderFiatValue
        customFormatter={roundDown ? formatFiatNumberRoundDown : undefined}
        token={token}
        value={parseUnits(amount, token.decimals)}
      />
    </span>,
  );
  return screen.getByTestId("fiat");
};

describe("RenderFiatValue", function () {
  beforeEach(function () {
    mocks.prices = {
      data: { USDC: "1", VUSD: "1", WBTC: "76800.5" },
      status: "success",
    };
  });

  it("keeps an exact-cent value when it rounds down", async function () {
    const fiat = await renderFiatValue({
      amount: "0.29",
      roundDown: true,
      token: vusd,
    });

    await expect.element(fiat).toHaveTextContent("0.29");
  });

  it("keeps an exact-cent value of a 6-decimal token when it rounds down", async function () {
    const fiat = await renderFiatValue({
      amount: "2.3",
      roundDown: true,
      token: usdc,
    });

    await expect.element(fiat).toHaveTextContent("2.30");
  });

  it("rounds a value below the next cent down", async function () {
    const fiat = await renderFiatValue({
      amount: "0.999008",
      roundDown: true,
      token: vusd,
    });

    await expect.element(fiat).toHaveTextContent("0.99");
  });

  it("rounds a value to the nearest cent by default", async function () {
    const fiat = await renderFiatValue({ amount: "0.999008", token: vusd });

    await expect.element(fiat).toHaveTextContent("1.00");
  });

  it("multiplies the amount of an 8-decimal token by a non-integer price", async function () {
    const fiat = await renderFiatValue({ amount: "0.5", token: wbtc });

    await expect.element(fiat).toHaveTextContent("38,400.25");
  });

  it("shows a dash when the prices fail to load", async function () {
    mocks.prices = { data: undefined, status: "error" };
    const fiat = await renderFiatValue({ amount: "1", token: vusd });

    await expect.element(fiat).toHaveTextContent("-");
  });

  it("shows a skeleton while the prices load", async function () {
    mocks.prices = { data: undefined, status: "pending" };
    const fiat = await renderFiatValue({ amount: "1", token: vusd });

    await expect
      .poll(() => fiat.element().querySelector('[aria-busy="true"]'))
      .not.toBeNull();
    expect(fiat.element()).not.toHaveTextContent("-");
  });

  it("shows a skeleton while the value loads", async function () {
    const screen = await render(
      <span data-testid="fiat">
        <RenderFiatValue queryStatus="pending" token={vusd} value={undefined} />
      </span>,
    );
    const fiat = screen.getByTestId("fiat");

    await expect
      .poll(() => fiat.element().querySelector('[aria-busy="true"]'))
      .not.toBeNull();
    expect(fiat.element()).not.toHaveTextContent("-");
  });
});
