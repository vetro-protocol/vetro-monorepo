import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { Breadcrumb } from "../src/components/base/breadcrumb";
import { BreadcrumbSelector } from "../src/components/base/breadcrumb/breadcrumbSelector";
import { ButtonLink } from "../src/components/base/button";

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
          <BreadcrumbSelector
            getItemKey={(item) => item}
            getItemUrl={(item) => `/borrow/${item}`}
            items={["WETH / VUSD"]}
            renderItem={(item) => <span>{item}</span>}
            trigger={
              <>
                <div className="size-4 rounded-full bg-orange-300" />
                HemiBTC
              </>
            }
            triggerId="breadcrumb-market-selector"
          />
        ),
      },
    ],
  },
};

export const WithMenuWithoutOptions: Story = {
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
          <BreadcrumbSelector
            getItemKey={(item) => item}
            getItemUrl={(item) => `/borrow/${item}`}
            items={[]}
            renderItem={(item) => <span>{item}</span>}
            trigger={
              <>
                <div className="size-4 rounded-full bg-orange-300" />
                HemiBTC
              </>
            }
            triggerId="breadcrumb-market-selector"
          />
        ),
      },
    ],
  },
};
