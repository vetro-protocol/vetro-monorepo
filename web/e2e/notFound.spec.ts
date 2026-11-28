import { expect, test } from "@playwright/test";
const notFoundTitle = "Page not found";
const notFoundDescription = "The page you're trying to access does not exist.";

test("renders the 404 page on an unknown path and links back to swap", async function ({
  page,
}) {
  await page.goto("/en/this-page-does-not-exist");

  await expect(
    page.getByRole("heading", { name: notFoundTitle }),
  ).toBeVisible();
  await expect(page.getByText(notFoundDescription)).toBeVisible();
  await expect(page).toHaveURL(/\/en\/this-page-does-not-exist$/);

  await page.getByRole("link", { name: "Take me back to swap" }).click();

  await expect(page).toHaveURL(/\/en\/swap$/);
});
