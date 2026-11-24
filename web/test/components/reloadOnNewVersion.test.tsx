import { Link, MemoryRouter, useLocation } from "react-router";
import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { ReloadOnNewVersion } from "../../src/components/reloadOnNewVersion";
import { reloadForNewBuild } from "../../src/utils/reloadForNewBuild";

vi.mock("../../src/hooks/useLiveVersion", () => ({
  useLiveVersion: () => ({ data: `${import.meta.env.VITE_BUILD_VERSION}-new` }),
}));

vi.mock("../../src/utils/reloadForNewBuild", () => ({
  reloadForNewBuild: vi.fn(),
}));

function Navigation() {
  const { pathname } = useLocation();

  return (
    <>
      <Link to="/es/contact">Switch to Spanish</Link>
      <Link to="/es/faq">Open FAQ</Link>
      <h1>{pathname}</h1>
    </>
  );
}

it("reloads for a new build on page navigation but not on a language switch", async function () {
  const screen = await render(
    <MemoryRouter initialEntries={["/en/contact"]}>
      <ReloadOnNewVersion />
      <Navigation />
    </MemoryRouter>,
  );

  await screen.getByRole("link", { name: "Switch to Spanish" }).click();
  await expect
    .element(screen.getByRole("heading"))
    .toHaveTextContent("/es/contact");
  expect(reloadForNewBuild).not.toHaveBeenCalled();

  await screen.getByRole("link", { name: "Open FAQ" }).click();
  await expect
    .element(screen.getByRole("heading"))
    .toHaveTextContent("/es/faq");
  expect(reloadForNewBuild).toHaveBeenCalledTimes(1);
});
