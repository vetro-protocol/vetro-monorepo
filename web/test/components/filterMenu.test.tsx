import { type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { FilterMenu } from "../../src/components/base/filterMenu";

const sections = [
  {
    label: "Fruits",
    options: [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
    ],
  },
  {
    label: "Vegetables",
    options: [
      { label: "Carrot", value: "carrot" },
      { label: "Leek", value: "leek" },
    ],
  },
];

type Props = Pick<
  ComponentProps<typeof FilterMenu>,
  "onChange" | "selectedValues"
>;

const filterMenu = (props: Props) => (
  <FilterMenu label="Filters" sections={sections} {...props} />
);

async function openFilterMenu(props: Props) {
  const screen = await render(filterMenu(props));
  const trigger = screen.getByRole("button", { name: "Filters" });
  await trigger.click();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  return screen;
}

describe("FilterMenu", function () {
  it("calls onChange with the full selection after an option is added or removed", async function () {
    const onChange = vi.fn();
    const screen = await openFilterMenu({
      onChange,
      selectedValues: ["apple", "banana", "carrot"],
    });

    await screen.getByRole("menuitemcheckbox", { name: "Leek" }).click();
    await screen.getByRole("menuitemcheckbox", { name: "Banana" }).click();

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, [
      "apple",
      "banana",
      "carrot",
      "leek",
    ]);
    expect(onChange).toHaveBeenNthCalledWith(2, ["apple", "carrot"]);
  });

  it("checks the checkboxes of the selected values and updates them when the selection changes", async function () {
    const onChange = vi.fn();
    const screen = await openFilterMenu({
      onChange,
      selectedValues: ["banana", "carrot"],
    });
    const getCheckbox = (name: string) =>
      screen
        .getByRole("menuitemcheckbox", { name })
        .element()
        .querySelector<HTMLInputElement>("input[type=checkbox]");

    expect(getCheckbox("Apple")?.checked).toBe(false);
    expect(getCheckbox("Banana")?.checked).toBe(true);
    expect(getCheckbox("Carrot")?.checked).toBe(true);
    expect(getCheckbox("Leek")?.checked).toBe(false);

    await screen.rerender(
      filterMenu({ onChange, selectedValues: ["apple", "carrot"] }),
    );

    expect(getCheckbox("Apple")?.checked).toBe(true);
    expect(getCheckbox("Banana")?.checked).toBe(false);
    expect(getCheckbox("Carrot")?.checked).toBe(true);
    expect(getCheckbox("Leek")?.checked).toBe(false);
  });
});
