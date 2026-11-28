import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Breadcrumb } from "../../src/components/base/breadcrumb";
import { BreadcrumbSelector } from "../../src/components/base/breadcrumb/breadcrumbSelector";

const earnItems = [{ text: "Earn" }, { text: "Vaults" }, { text: "sVUSD" }];

type Market = {
  id: string;
  name: string;
};

const markets: Market[] = [
  { id: "btc", name: "BTC market" },
  { id: "eth", name: "ETH market" },
];

function CurrentPath() {
  const { pathname } = useLocation();
  return <output aria-label="Current path">{pathname}</output>;
}

const renderWithRouter = (ui: ReactNode) =>
  render(
    <MemoryRouter initialEntries={["/en/markets/btc"]}>
      <Routes>
        <Route
          element={
            <>
              {ui}
              <CurrentPath />
            </>
          }
          path="/:lang/*"
        />
      </Routes>
    </MemoryRouter>,
  );

const Selector = ({ items = markets }: { items?: Market[] }) => (
  <BreadcrumbSelector
    getItemKey={(item) => item.id}
    getItemUrl={(item) => `/markets/${item.id}`}
    items={items}
    renderItem={(item) => item.name}
    trigger="Markets"
    triggerId="markets-trigger"
  />
);

describe("Breadcrumb", function () {
  it("renders the items in order inside a breadcrumb navigation", async function () {
    const screen = await render(<Breadcrumb items={earnItems} />);

    const navigation = screen.getByRole("navigation", { name: "breadcrumb" });
    await expect.element(navigation).toBeInTheDocument();
    expect(
      navigation
        .getByRole("listitem")
        .elements()
        .map((element) => element.textContent),
    ).toEqual(["Earn", "Vaults", "sVUSD"]);
  });

  it("marks only the last item as the current page", async function () {
    const screen = await render(<Breadcrumb items={earnItems} />);

    await expect
      .element(screen.getByRole("listitem").nth(0))
      .not.toHaveAttribute("aria-current");
    await expect
      .element(screen.getByRole("listitem").nth(1))
      .not.toHaveAttribute("aria-current");
    await expect
      .element(screen.getByRole("listitem").nth(2))
      .toHaveAttribute("aria-current", "page");
  });

  it("marks a single item as the current page", async function () {
    const screen = await render(<Breadcrumb items={[{ text: "Earn" }]} />);

    await expect
      .element(screen.getByRole("listitem"))
      .toHaveAttribute("aria-current", "page");
  });

  it("renders the icon of an item next to its text", async function () {
    const screen = await render(
      <Breadcrumb
        items={[
          {
            icon: <svg aria-label="sVUSD icon" role="img" />,
            text: "sVUSD",
          },
        ]}
      />,
    );

    const item = screen.getByRole("listitem");
    await expect
      .element(item.getByRole("img", { name: "sVUSD icon" }))
      .toBeInTheDocument();
    await expect.element(item).toHaveTextContent("sVUSD");
  });

  it("renders the menu of an item in place of its text", async function () {
    const screen = await render(
      <Breadcrumb
        items={[
          { text: "Earn" },
          { menu: <button type="button">Vaults menu</button> },
        ]}
      />,
    );

    await expect
      .element(
        screen.getByRole("listitem").nth(1).getByRole("button", {
          name: "Vaults menu",
        }),
      )
      .toBeInTheDocument();
  });
});

describe("BreadcrumbSelector", function () {
  it("renders the trigger as plain text when there are no items", async function () {
    const screen = await renderWithRouter(<Selector items={[]} />);

    await expect.element(screen.getByText("Markets")).toBeInTheDocument();
    await expect.element(screen.getByRole("button")).not.toBeInTheDocument();
  });

  it("opens a menu with a localized link for each item", async function () {
    const screen = await renderWithRouter(<Selector />);
    const trigger = screen.getByRole("button", { name: "Markets" });

    await trigger.click();

    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByRole("menu", { name: "Markets" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("menuitem", { name: "BTC market" }))
      .toHaveAttribute("href", "/en/markets/btc");
    await expect
      .element(screen.getByRole("menuitem", { name: "ETH market" }))
      .toHaveAttribute("href", "/en/markets/eth");
  });

  it("navigates to the clicked item and closes the menu", async function () {
    const screen = await renderWithRouter(<Selector />);
    const trigger = screen.getByRole("button", { name: "Markets" });

    await trigger.click();
    await screen.getByRole("menuitem", { name: "ETH market" }).click();

    await expect
      .element(screen.getByRole("status", { name: "Current path" }))
      .toHaveTextContent("/en/markets/eth");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("navigates to the focused item with the keyboard", async function () {
    const screen = await renderWithRouter(<Selector />);
    const trigger = screen.getByRole("button", { name: "Markets" });

    trigger.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    await expect
      .element(screen.getByRole("status", { name: "Current path" }))
      .toHaveTextContent("/en/markets/eth");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
