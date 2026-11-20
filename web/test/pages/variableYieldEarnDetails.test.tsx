import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { VariableYieldEarnDetails } from "../../src/pages/variableYieldEarnDetails";

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

it("redirects a lowercase variable-yield address to the checksummed URL", async function () {
  const stakingVaultAddress = stakingVaultAddresses[0];
  const screen = await render(
    <MemoryRouter
      initialEntries={[
        `/en/earn/variable-yield/${stakingVaultAddress.toLowerCase()}?tab=positions#activity`,
      ]}
    >
      <Routes>
        <Route
          element={<VariableYieldEarnDetails />}
          path="/:lang/earn/variable-yield/:address"
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );

  await expect
    .element(
      screen.getByRole("heading", {
        exact: true,
        name: `/en/earn/variable-yield/${stakingVaultAddress}?tab=positions#activity`,
      }),
    )
    .toBeInTheDocument();
});

it("redirects an unknown variable-yield address to not found", async function () {
  const screen = await render(
    <MemoryRouter
      initialEntries={[
        "/en/earn/variable-yield/0x0000000000000000000000000000000000000000",
      ]}
    >
      <Routes>
        <Route
          element={<VariableYieldEarnDetails />}
          path="/:lang/earn/variable-yield/:address"
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
