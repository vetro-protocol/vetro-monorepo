import { targetYieldVaultAddresses } from "@vetro-protocol/target-yield-earn/addresses";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { FixedTermEarnDetails } from "../../src/pages/fixedTermEarnDetails";

vi.mock("../../src/hooks/useShareToken", () => ({
  useShareToken: () => ({ data: undefined, isError: false }),
}));

vi.mock("../../src/hooks/useVaultPeggedToken", () => ({
  useVaultPeggedToken: () => ({ data: undefined, isError: false }),
  vaultPeggedTokenQueryOptions: vi.fn(),
}));

const LocationProbe = function () {
  const { hash, pathname, search } = useLocation();

  return <h1>{`${pathname}${search}${hash}`}</h1>;
};

it("redirects a lowercase fixed-term address to the checksummed URL", async function () {
  const stakingVaultAddress = targetYieldVaultAddresses[0];
  const screen = await render(
    <MemoryRouter
      initialEntries={[
        `/en/earn/fixed-term/${stakingVaultAddress.toLowerCase()}?tab=positions#activity`,
      ]}
    >
      <Routes>
        <Route
          element={<FixedTermEarnDetails />}
          path="/:lang/earn/fixed-term/:address"
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );

  await expect
    .element(
      screen.getByRole("heading", {
        exact: true,
        name: `/en/earn/fixed-term/${stakingVaultAddress}?tab=positions#activity`,
      }),
    )
    .toBeInTheDocument();
});

it("redirects an unknown fixed-term address to not found", async function () {
  const screen = await render(
    <MemoryRouter
      initialEntries={[
        "/en/earn/fixed-term/0x0000000000000000000000000000000000000000",
      ]}
    >
      <Routes>
        <Route
          element={<FixedTermEarnDetails />}
          path="/:lang/earn/fixed-term/:address"
        />
        <Route element={<LocationProbe />} path="/:lang/not-found" />
      </Routes>
    </MemoryRouter>,
  );

  await expect
    .element(
      screen.getByRole("heading", {
        exact: true,
        name: "/en/not-found",
      }),
    )
    .toBeInTheDocument();
});
