import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../src/components/base/button";
import { SectionHeader } from "../src/components/base/sectionHeader";

const meta = {
  component: SectionHeader,
  title: "Components/SectionHeader",
} satisfies Meta<typeof SectionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Exit tickets",
  },
};

export const WithActions: Story = {
  args: {
    children: (
      <div className="flex items-center gap-3">
        <Button size="small" variant="secondary">
          View settings
        </Button>
        <div className="h-3 w-0.5 rounded-full bg-gray-200" />
        <Button size="small">Withdraw all</Button>
      </div>
    ),
    title: "Exit tickets",
  },
};
