import { targetYieldVaultAddresses } from "@vetro-protocol/target-yield-earn/addresses";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router";
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
  const navigationType = useNavigationType();

  return (
    <>
      <h1>{`${pathname}${search}${hash}`}</h1>
      <output aria-label="Navigation type">{navigationType}</output>
    </>
  );
};

it.each(["lowercase", "uppercase"])(
  "redirects a %s fixed-term address to the checksummed URL",
  async function (letterCase) {
    const stakingVaultAddress = targetYieldVaultAddresses[0];
    const address =
      letterCase === "uppercase"
        ? stakingVaultAddress.toUpperCase()
        : stakingVaultAddress.toLowerCase();
    const lang = letterCase === "uppercase" ? "es" : "en";
    const screen = await render(
      <MemoryRouter
        initialEntries={[
          `/${lang}/earn/fixed-term/${address}?tab=positions#activity`,
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
          name: `/${lang}/earn/fixed-term/${stakingVaultAddress}?tab=positions#activity`,
        }),
      )
      .toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Navigation type"))
      .toHaveTextContent("REPLACE");
  },
);

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
  await expect
    .element(screen.getByLabelText("Navigation type"))
    .toHaveTextContent("REPLACE");
});
