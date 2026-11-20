import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { marketIds } from "../../src/constants/borrow";
import { BorrowMarketDetails } from "../../src/pages/borrowMarketDetails";

vi.mock("../../src/hooks/borrow/useMarketData", () => ({
  marketDataOptions: vi.fn(),
  marketDataQueryKey: vi.fn(),
  useMarketData: () => ({
    data: undefined,
    fetchStatus: "fetching",
    isError: false,
  }),
}));

const CurrentLocation = function () {
  const { hash, pathname, search } = useLocation();

  return (
    <output aria-label="Current location">{`${pathname}${search}${hash}`}</output>
  );
};

const renderBorrowMarketDetails = async (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          element={
            <>
              <BorrowMarketDetails />
              <CurrentLocation />
            </>
          }
          path="/:lang/borrow/:marketId"
        />
        <Route
          element={
            <>
              <h1>Not found</h1>
              <CurrentLocation />
            </>
          }
          path="/:lang/not-found"
        />
      </Routes>
    </MemoryRouter>,
  );

it("canonicalizes uppercase market IDs and preserves the query and hash", async function () {
  const [marketId] = marketIds;
  const uppercaseMarketId = `0x${marketId.slice(2).toUpperCase()}`;
  const screen = await renderBorrowMarketDetails(
    `/en/borrow/${uppercaseMarketId}?source=deep-link#details`,
  );

  await expect
    .element(screen.getByLabelText("Current location"))
    .toHaveTextContent(`/en/borrow/${marketId}?source=deep-link#details`);
});

it("redirects valid but unsupported market IDs to not-found", async function () {
  const unsupportedMarketId = `0x${"0".repeat(64)}`;
  const screen = await renderBorrowMarketDetails(
    `/en/borrow/${unsupportedMarketId}`,
  );

  await expect
    .element(screen.getByRole("heading", { name: "Not found" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByLabelText("Current location"))
    .toHaveTextContent("/en/not-found");
});
