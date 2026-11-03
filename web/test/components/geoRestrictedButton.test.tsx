import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { GeoRestrictedButton } from "../../src/components/geoRestrictedButton";

function setGeoRestricted(restricted: boolean) {
  document.cookie = `geo-restricted=${restricted ? "1" : "0"}; path=/`;
}

describe("GeoRestrictedButton", function () {
  afterEach(function () {
    setGeoRestricted(false);
  });

  it("calls onClick when the user is not geo-restricted", async function () {
    const onClick = vi.fn();
    const screen = await render(
      <GeoRestrictedButton onClick={onClick}>Claim</GeoRestrictedButton>,
    );
    const button = screen.getByRole("button", { name: "Claim" });

    await expect.element(button).toBeEnabled();
    await button.click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps the disabled prop when the user is not geo-restricted", async function () {
    const screen = await render(
      <GeoRestrictedButton disabled>Claim</GeoRestrictedButton>,
    );

    await expect
      .element(screen.getByRole("button", { name: "Claim" }))
      .toBeDisabled();
  });

  it("disables the button and ignores clicks when the user is geo-restricted", async function () {
    setGeoRestricted(true);
    const onClick = vi.fn();
    const screen = await render(
      <GeoRestrictedButton onClick={onClick}>Claim</GeoRestrictedButton>,
    );
    const button = screen.getByRole("button", { name: "Claim" });

    await expect.element(button).toBeDisabled();
    await button.click({ force: true });

    expect(onClick).not.toHaveBeenCalled();
  });

  it("ignores clicks when the user becomes geo-restricted after render", async function () {
    const onClick = vi.fn();
    const screen = await render(
      <GeoRestrictedButton onClick={onClick}>Claim</GeoRestrictedButton>,
    );
    setGeoRestricted(true);

    await screen.getByRole("button", { name: "Claim" }).click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows the tooltip prop when the user is not geo-restricted", async function () {
    const screen = await render(
      <GeoRestrictedButton tooltip="Redeems paused">Claim</GeoRestrictedButton>,
    );

    await screen.getByRole("button", { name: "Claim" }).hover();

    await expect.element(screen.getByText("Redeems paused")).toBeVisible();
  });

  it("shows the geo-restriction text instead of the tooltip prop when the user is geo-restricted", async function () {
    setGeoRestricted(true);
    const screen = await render(
      <GeoRestrictedButton tooltip="Redeems paused">Claim</GeoRestrictedButton>,
    );

    await screen.getByRole("button", { name: "Claim" }).hover();

    await expect
      .element(screen.getByText("Vetro isn't available in your country"))
      .toBeVisible();
    expect(screen.getByText("Redeems paused").query()).toBeNull();
  });
});
