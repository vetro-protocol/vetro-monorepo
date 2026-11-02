import { type ComponentProps, type ReactNode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { Dropdown } from "../../src/components/base/dropdown";

import { endTransition } from "./transitions";

type Fruit = {
  id: string;
  label: string;
};

const fruits: Fruit[] = [
  { id: "apple", label: "Apple" },
  { id: "banana", label: "Banana" },
  { id: "cherry", label: "Cherry" },
];

const renderTrigger: ComponentProps<typeof Dropdown<Fruit>>["renderTrigger"] = (
  _,
  triggerProps,
) => <button {...triggerProps}>Fruits</button>;

const sharedProps = {
  getItemKey: (item: Fruit) => item.id,
  renderItem: (item: Fruit) => item.label,
  renderTrigger,
  triggerId: "fruits-trigger",
};

function SingleSelect({ onChange }: { onChange: (item: Fruit) => void }) {
  const [value, setValue] = useState(fruits[0]);
  return (
    <>
      <button type="button">Outside</button>
      <Dropdown
        {...sharedProps}
        items={fruits}
        onChange={function (item) {
          setValue(item);
          onChange(item);
        }}
        value={value}
      />
    </>
  );
}

function MultiSelect({
  onChange,
}: {
  onChange: (item: Fruit, selected: boolean) => void;
}) {
  const [selectedValues, setSelectedValues] = useState(["banana"]);
  return (
    <Dropdown
      {...sharedProps}
      items={fruits}
      multiSelect
      onChange={function (item, selected) {
        setSelectedValues((prev) =>
          selected ? [...prev, item.id] : prev.filter((id) => id !== item.id),
        );
        onChange(item, selected);
      }}
      selectedValues={selectedValues}
    />
  );
}

async function openDropdown(ui: ReactNode) {
  const screen = await render(ui);
  const trigger = screen.getByRole("button", { name: "Fruits" });
  await trigger.click();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  return { screen, trigger };
}

async function openSingleSelect() {
  const onChange = vi.fn();
  const { screen, trigger } = await openDropdown(
    <SingleSelect onChange={onChange} />,
  );
  const listbox = screen.getByRole("listbox", { name: "Fruits" });
  return { listbox, onChange, screen, trigger };
}

describe("Dropdown", function () {
  it("opens a listbox named by its trigger and marks the selected option", async function () {
    const { screen } = await openSingleSelect();

    await expect
      .element(screen.getByRole("option", { name: "Apple" }))
      .toHaveAttribute("aria-selected", "true");
    await expect
      .element(screen.getByRole("option", { name: "Banana" }))
      .toHaveAttribute("aria-selected", "false");
  });

  it("renders a menu of menu items when no value is selected", async function () {
    const { screen, trigger } = await openDropdown(
      <Dropdown {...sharedProps} items={fruits} onChange={vi.fn()} />,
    );

    await expect.element(trigger).toHaveAttribute("aria-haspopup", "menu");
    await expect
      .element(screen.getByRole("menu", { name: "Fruits" }))
      .toBeInTheDocument();
    expect(screen.getByRole("menuitem").elements()).toHaveLength(3);
  });

  it("does not open when there are no items", async function () {
    const screen = await render(
      <Dropdown {...sharedProps} items={[]} onChange={vi.fn()} />,
    );
    const trigger = screen.getByRole("button", { name: "Fruits" });

    await trigger.click();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

    trigger.element().focus();
    await userEvent.keyboard("{Enter}");

    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  });

  it("calls onChange with the clicked option, closes, and focuses the trigger", async function () {
    const { onChange, screen, trigger } = await openSingleSelect();

    await screen.getByRole("option", { name: "Cherry" }).click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith(fruits[2]);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect.element(trigger).toHaveFocus();
  });

  it("removes the list after the close transition ends", async function () {
    const { listbox, screen, trigger } = await openSingleSelect();

    await screen.getByRole("option", { name: "Cherry" }).click();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    endTransition(listbox.element());

    await expect.element(listbox).not.toBeInTheDocument();
  });

  it("toggles the list when the trigger is clicked again", async function () {
    const { trigger } = await openSingleSelect();

    await trigger.click();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("moves focus with the arrow keys, stops at both ends, and selects with Enter", async function () {
    const { onChange, screen, trigger } = await openSingleSelect();
    const apple = screen.getByRole("option", { name: "Apple" });
    const banana = screen.getByRole("option", { name: "Banana" });
    const cherry = screen.getByRole("option", { name: "Cherry" });

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(apple).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(apple).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    await expect.element(cherry).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(banana).toHaveFocus();

    await userEvent.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledExactlyOnceWith(fruits[1]);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect.element(trigger).toHaveFocus();
  });

  it("selects the focused option with Space", async function () {
    const { onChange } = await openSingleSelect();

    await userEvent.keyboard("{ArrowDown}{ArrowDown} ");

    expect(onChange).toHaveBeenCalledExactlyOnceWith(fruits[1]);
  });

  it("closes on Escape and focuses the trigger", async function () {
    const { onChange, trigger } = await openSingleSelect();

    await userEvent.keyboard("{ArrowDown}{Escape}");

    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect.element(trigger).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closes on a click outside", async function () {
    const { onChange, screen, trigger } = await openSingleSelect();

    await screen.getByRole("button", { name: "Outside" }).click();

    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("opens from the keyboard with Enter", async function () {
    const screen = await render(<SingleSelect onChange={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Fruits" });

    trigger.element().focus();
    await userEvent.keyboard("{Enter}");

    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByRole("listbox", { name: "Fruits" }))
      .toBeInTheDocument();
  });

  it("toggles items in multi-select mode and stays open", async function () {
    const onChange = vi.fn();
    const { screen, trigger } = await openDropdown(
      <MultiSelect onChange={onChange} />,
    );
    const apple = screen.getByRole("menuitemcheckbox", { name: "Apple" });
    const banana = screen.getByRole("menuitemcheckbox", { name: "Banana" });

    await expect.element(apple).toHaveAttribute("aria-checked", "false");
    await expect.element(banana).toHaveAttribute("aria-checked", "true");

    await apple.click();
    await banana.click();

    expect(onChange).toHaveBeenNthCalledWith(1, fruits[0], true);
    expect(onChange).toHaveBeenNthCalledWith(2, fruits[1], false);
    await expect.element(apple).toHaveAttribute("aria-checked", "true");
    await expect.element(banana).toHaveAttribute("aria-checked", "false");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("navigates across sections with the keyboard", async function () {
    const onChange = vi.fn();
    const { screen } = await openDropdown(
      <Dropdown
        {...sharedProps}
        onChange={onChange}
        sections={[
          { items: fruits.slice(0, 2), label: "Common" },
          { items: fruits.slice(2), label: "Rare" },
        ]}
      />,
    );

    await expect.element(screen.getByText("Common")).toBeInTheDocument();
    await expect.element(screen.getByText("Rare")).toBeInTheDocument();

    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    await expect
      .element(screen.getByRole("menuitem", { name: "Cherry" }))
      .toHaveFocus();
    await userEvent.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledExactlyOnceWith(fruits[2]);
  });

  it("closes the menu from the footer", async function () {
    const { screen, trigger } = await openDropdown(
      <Dropdown
        {...sharedProps}
        items={fruits}
        renderFooter={(onClose) => (
          <button onClick={onClose} type="button">
            Done
          </button>
        )}
      />,
    );

    await screen.getByRole("button", { name: "Done" }).click();

    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect.element(trigger).toHaveFocus();
  });

  describe("navigation mode", function () {
    const openNavigation = (onItemClick: (id: string) => void) =>
      openDropdown(
        <Dropdown
          {...sharedProps}
          items={fruits}
          renderItemWrapper={(
            { item, onActivate, ref, tabIndex },
            children,
          ) => (
            <a
              href={`#${item.id}`}
              onClick={function (event) {
                event.preventDefault();
                onItemClick(item.id);
                onActivate();
              }}
              ref={ref}
              role="menuitem"
              tabIndex={tabIndex}
            >
              {children}
            </a>
          )}
        />,
      );

    it("closes after an item is clicked", async function () {
      const onItemClick = vi.fn();
      const { screen, trigger } = await openNavigation(onItemClick);

      await screen.getByRole("menuitem", { name: "Banana" }).click();

      expect(onItemClick).toHaveBeenCalledExactlyOnceWith("banana");
      await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("activates the focused link with Enter and with Space", async function () {
      const onItemClick = vi.fn();
      const { trigger } = await openNavigation(onItemClick);

      await userEvent.keyboard("{ArrowDown}{Enter}");
      expect(onItemClick).toHaveBeenLastCalledWith("apple");

      await trigger.click();
      await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
      await userEvent.keyboard("{ArrowDown}{ArrowDown} ");
      expect(onItemClick).toHaveBeenLastCalledWith("banana");
      expect(onItemClick).toHaveBeenCalledTimes(2);
    });
  });
});
