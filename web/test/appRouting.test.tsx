import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { defaultPage, LanguageRouting } from "../src/appRouting";

const CurrentLocation = function () {
  const { hash, pathname, search } = useLocation();

  return (
    <output aria-label="Current location">{`${pathname}${search}${hash}`}</output>
  );
};

const StubLanguageRoutes = () => (
  <>
    <CurrentLocation />
    <Routes>
      <Route element={<Navigate replace to={defaultPage} />} index />
      <Route element={<p>Swap page</p>} path="swap" />
      <Route element={<p>Contact page</p>} path="contact" />
      <Route element={<p>Borrow market page</p>} path="borrow/:marketId" />
      <Route element={<p>Not found page</p>} path="*" />
    </Routes>
  </>
);

afterEach(function () {
  vi.unstubAllGlobals();
});

it.each([
  { entry: "/", expected: "/en/swap", page: "Swap page" },
  { entry: "/en", expected: "/en/swap", page: "Swap page" },
  { entry: "/contact", expected: "/en/contact", page: "Contact page" },
  { entry: "/borrow/0", expected: "/en/borrow/0", page: "Borrow market page" },
  {
    entry: "/this-page-does-not-exist?foo=bar#section",
    expected: "/en/this-page-does-not-exist?foo=bar#section",
    page: "Not found page",
  },
  { entry: "/fr", expected: "/en/fr", page: "Not found page" },
  { entry: "/fr/swap", expected: "/en/fr/swap", page: "Not found page" },
])("routes $entry to $expected", async function ({ entry, expected, page }) {
  vi.stubGlobal("localStorage", { getItem: () => null });
  vi.stubGlobal("navigator", { languages: ["en-US"] });

  const screen = await render(
    <MemoryRouter initialEntries={[entry]}>
      <LanguageRouting languageRoutes={<StubLanguageRoutes />} />
    </MemoryRouter>,
  );

  await expect
    .element(screen.getByLabelText("Current location"))
    .toHaveTextContent(expected);
  await expect.element(screen.getByText(page, { exact: true })).toBeVisible();
});
