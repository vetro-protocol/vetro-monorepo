import { expect, test } from "@playwright/test";
import { marketIds } from "@vetro-protocol/morpho-blue-market";

const notFoundTitle = "Page not found";
const notFoundDescription = "The page you're trying to access does not exist.";

test("renders the 404 page on an unknown path", async function ({ page }) {
  await page.goto("/en/this-page-does-not-exist");

  await expect(
    page.getByRole("heading", { name: notFoundTitle }),
  ).toBeVisible();
  await expect(page.getByText(notFoundDescription)).toBeVisible();
  await expect(page).toHaveURL(/\/en\/this-page-does-not-exist$/);
});

test("renders the 404 page on an unknown path with no language prefix", async function ({
  page,
}) {
  await page.goto("/this-page-does-not-exist?foo=bar#section");

  await expect(
    page.getByRole("heading", { name: notFoundTitle }),
  ).toBeVisible();
  await expect(page).toHaveURL(
    /\/en\/this-page-does-not-exist\?foo=bar#section$/,
  );
});

test("renders the requested page when the path has no language prefix", async function ({
  page,
}) {
  await page.goto("/contact");

  await expect(page).toHaveURL(/\/en\/contact$/);
  await expect(
    page.getByRole("heading", {
      name: "Tell us what happened so we can help",
    }),
  ).toBeVisible();
});

test("preserves a deep link when the path has no language prefix", async function ({
  page,
}) {
  const marketId = marketIds[1];

  await page.goto(`/borrow/${marketId}`);

  await expect(page).toHaveURL(new RegExp(`/en/borrow/${marketId}$`));
});

test("renders the 404 page on an unsupported language", async function ({
  page,
}) {
  await page.goto("/fr/swap");

  await expect(
    page.getByRole("heading", { name: notFoundTitle }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/en\/fr\/swap$/);
});

test("the root path redirects to swap", async function ({ page }) {
  await page.goto("/");

  await expect(page).toHaveURL(/\/en\/swap$/);
  await expect(
    page.getByRole("heading", { name: "Swap your tokens with Vetro assets" }),
  ).toBeVisible();
});

test("the 404 page links back to swap", async function ({ page }) {
  await page.goto("/en/this-page-does-not-exist");

  await page.getByRole("link", { name: "Take me back to swap" }).click();

  await expect(page).toHaveURL(/\/en\/swap$/);
});
