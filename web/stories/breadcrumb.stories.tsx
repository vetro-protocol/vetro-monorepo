import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { Breadcrumb } from "../src/components/base/breadcrumb";
import { Button, ButtonLink } from "../src/components/base/button";
import { ChevronIcon } from "../src/components/base/chevronIcon";
import { Dropdown } from "../src/components/base/dropdown";

const meta: Meta<typeof Breadcrumb> = {
  component: Breadcrumb,
  decorators: [
    (StoryComponent) => (
      <MemoryRouter initialEntries={["/en/borrow"]}>
        <Routes>
          <Route element={<StoryComponent />} path="/:lang/*" />
        </Routes>
      </MemoryRouter>
    ),
  ],
  title: "Components/Breadcrumb",
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [{ text: "Home" }, { text: "Products" }, { text: "Current Page" }],
  },
};

export const WithMenu: Story = {
  args: {
    items: [
      {
        menu: (
          <ButtonLink href="/borrow" size="xSmall" variant="tertiary">
            Borrow
          </ButtonLink>
        ),
      },
      {
        menu: (
          <Dropdown
            getItemKey={(item) => item}
            items={["WETH / VUSD"]}
            onChange={() => undefined}
            renderItem={(item) => <span>{item}</span>}
            renderTrigger={(isOpen, triggerProps) => (
              <Button {...triggerProps} size="xSmall" variant="tertiary">
                <div className="size-4 rounded-full bg-orange-300" />
                HemiBTC
                <ChevronIcon direction={isOpen ? "up" : "down"} />
              </Button>
            )}
            triggerId="breadcrumb-market-selector"
          />
        ),
      },
    ],
  },
};
