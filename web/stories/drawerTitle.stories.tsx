import type { Meta, StoryObj } from "@storybook/react";

import { Drawer } from "../src/components/base/drawer";
import { DrawerTitle } from "../src/components/base/drawer/drawerTitle";

const meta = {
  component: DrawerTitle,
  decorators: [
    (Story) => (
      <Drawer onClose={() => undefined}>
        <Story />
      </Drawer>
    ),
  ],
  title: "Components/Drawer/DrawerTitle",
} satisfies Meta<typeof DrawerTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Swap in progress",
  },
};

export const LongTitle: Story = {
  args: {
    children:
      "Manage your stake position with ease and confidence, all in one place",
  },
};
