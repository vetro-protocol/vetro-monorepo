import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { ButtonLink } from "../src/components/base/button";
import borrowSvg from "../src/components/icons/borrow.svg";

const meta: Meta<typeof ButtonLink> = {
  argTypes: {
    children: {
      control: "text",
    },
    size: {
      control: "select",
      options: ["xSmall", "small", "xLarge"],
    },
  },
  component: ButtonLink,
  title: "Components/ButtonLink",
};

export default meta;
type Story = StoryObj<typeof ButtonLink>;

export const InactiveLink: Story = {
  args: {
    children: "Inactive Link",
    href: "/swap",
  },
  decorators: [
    (StoryComponent) => (
      <MemoryRouter initialEntries={["/en/earn"]}>
        <Routes>
          <Route element={<StoryComponent />} path="/:lang/*" />
        </Routes>
      </MemoryRouter>
    ),
  ],
};

export const ActiveLink: Story = {
  args: {
    children: (
      <>
        <img alt="Borrow Icon" height="16" src={borrowSvg} width="16" />
        <span>Active Link</span>
      </>
    ),
    href: "/swap",
  },
  decorators: [
    (StoryComponent) => (
      <MemoryRouter initialEntries={["/en/swap"]}>
        <Routes>
          <Route element={<StoryComponent />} path="/:lang/*" />
        </Routes>
      </MemoryRouter>
    ),
  ],
};
