import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { FeeDetails } from "../../src/components/feeDetails";
import { FeesContainer } from "../../src/components/feesContainer";
import feesSvg from "../../src/components/icons/fees.svg";
import gasSvg from "../../src/components/icons/gas.svg";

const networkFee = <FeeDetails label="Network fee" value="$0.10" />;
const protocolFee = <FeeDetails label="Protocol fee" value="$0.50" />;

async function renderContainer(
  props: Partial<Parameters<typeof FeesContainer>[0]> = {},
) {
  const screen = await render(
    <FeesContainer label="Fees" totalFees="$0.60" {...props}>
      {props.children ?? [networkFee, protocolFee]}
    </FeesContainer>,
  );
  return {
    screen,
    toggle: screen.getByRole("button", { name: /^Fees/ }),
  };
}

describe("FeesContainer", function () {
  it("starts collapsed and shows the total fees", async function () {
    const { screen, toggle } = await renderContainer();

    await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByText("$0.60")).toBeInTheDocument();
  });

  it("expands and collapses on click", async function () {
    const { screen, toggle } = await renderContainer();

    await toggle.click();

    await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
    await expect.element(screen.getByText("$0.60")).not.toBeInTheDocument();

    await toggle.click();

    await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByText("$0.60")).toBeInTheDocument();
  });

  it.for([
    { key: "{Enter}", name: "Enter" },
    { key: " ", name: "Space" },
  ])("toggles when the user presses $name", async function ({ key }) {
    const { toggle } = await renderContainer();

    await userEvent.tab();
    await expect.element(toggle).toHaveFocus();

    await userEvent.keyboard(key);
    await expect.element(toggle).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard(key);
    await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("hides the fee list from assistive technology and focus when collapsed", async function () {
    const { screen, toggle } = await renderContainer({
      children: (
        <FeeDetails label="Protocol fee" value={<a href="#fee">$0.50</a>} />
      ),
    });
    const link = screen.getByText("$0.50");
    const focusLink = () => (link.element() as HTMLElement).focus();

    await expect
      .element(screen.getByRole("link", { name: "$0.50" }))
      .not.toBeInTheDocument();
    focusLink();
    await expect.element(link).not.toHaveFocus();

    await toggle.click();

    await expect
      .element(screen.getByRole("link", { name: "$0.50" }))
      .toBeInTheDocument();
    focusLink();
    await expect.element(link).toHaveFocus();
  });

  it("shows the gas icon when the network fee is the only fee", async function () {
    const { screen } = await renderContainer({
      children: [networkFee, false, null],
    });

    await expect
      .element(screen.getByRole("img", { name: "Fees icon" }))
      .toHaveAttribute("src", gasSvg);
  });

  it("shows the fees icon when there are many fees", async function () {
    const { screen } = await renderContainer();

    await expect
      .element(screen.getByRole("img", { name: "Fees icon" }))
      .toHaveAttribute("src", feesSvg);
  });

  it("shows a dash when the total fees fail to load", async function () {
    const { screen } = await renderContainer({
      fetchStatus: "fetching",
      isError: true,
      totalFees: undefined,
    });

    await expect
      .element(screen.getByText("-", { exact: true }))
      .toBeInTheDocument();
  });
});
