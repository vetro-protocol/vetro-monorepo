import type { Token } from "@vetro-protocol/core";
import { parseUnits, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { DisplayAmount } from "../../src/components/base/displayAmount";

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

describe("DisplayAmount", function () {
  it("truncates a long balance and shows the full value in the tooltip", async function () {
    const screen = await render(
      <DisplayAmount
        amount={parseUnits("0.236158167836923785", vusd.decimals)}
        token={vusd}
      />,
    );

    const amount = screen.getByText("0.236158...");
    await expect.element(amount).toBeVisible();
    await amount.hover();

    await expect
      .element(screen.getByText("0.236158167836923785 VUSD"))
      .toBeVisible();
  });

  it("rounds down instead of up", async function () {
    const screen = await render(
      <DisplayAmount
        amount={parseUnits("0.9999999", vusd.decimals)}
        token={vusd}
      />,
    );

    await expect.element(screen.getByText("0.999999...")).toBeVisible();
  });

  it("shows the smallest formatted number for a positive amount below it", async function () {
    const screen = await render(
      <DisplayAmount
        amount={parseUnits("0.00000042", wbtc.decimals)}
        token={wbtc}
      />,
    );

    const amount = screen.getByText("< 0.000001");
    await expect.element(amount).toBeVisible();
    await amount.hover();

    await expect.element(screen.getByText("0.00000042 WBTC")).toBeVisible();
  });

  it("shows an amount equal to the smallest formatted number", async function () {
    const screen = await render(
      <DisplayAmount
        amount={parseUnits("0.000001", wbtc.decimals)}
        token={wbtc}
      />,
    );

    await expect.element(screen.getByText("0.000001")).toBeVisible();
  });

  it("shows the smallest unit of a token with 6 decimals", async function () {
    const screen = await render(
      <DisplayAmount
        amount={parseUnits("0.000001", usdc.decimals)}
        token={usdc}
      />,
    );

    await expect.element(screen.getByText("0.000001")).toBeVisible();
  });

  it("drops the decimals of a large amount", async function () {
    const screen = await render(
      <DisplayAmount
        amount={parseUnits("1234567.891", vusd.decimals)}
        token={vusd}
      />,
    );

    await expect.element(screen.getByText("1,234,567")).toBeVisible();
  });

  it("shows zero without a tooltip", async function () {
    const screen = await render(
      <DisplayAmount amount={0n} showSymbol={false} token={vusd} />,
    );

    const amount = screen.getByText("0", { exact: true });
    await expect.element(amount).toBeVisible();
    await amount.hover();

    await expect.element(screen.getByText("0 VUSD")).not.toBeInTheDocument();
  });

  it("shows the token symbol after the amount", async function () {
    const screen = await render(
      <DisplayAmount amount={parseUnits("5", vusd.decimals)} token={vusd} />,
    );

    await expect.element(screen.container).toHaveTextContent("5 VUSD");
  });

  it("hides the token symbol when showSymbol is false", async function () {
    const screen = await render(
      <DisplayAmount
        amount={parseUnits("5", vusd.decimals)}
        showSymbol={false}
        token={vusd}
      />,
    );

    await expect.element(screen.getByText("5")).toBeVisible();
    await expect.element(screen.container).not.toHaveTextContent("VUSD");
  });
});
