import type { Meta, StoryObj } from "@storybook/react";

import { DollarSign } from "../src/components/base/dollarSign";

const meta: Meta<typeof DollarSign> = {
  component: DollarSign,
  title: "Components/DollarSign",
};

export default meta;
type Story = StoryObj<typeof DollarSign>;

export const Default: Story = {};

export const InText: Story = {
  render: () => (
    <p className="text-b-regular text-gray-500">
      <DollarSign />
      1,234.56
    </p>
  ),
};

export const InFlexRow: Story = {
  render: () => (
    <div className="flex items-center">
      <DollarSign />
      <span>1,234.56</span>
    </div>
  ),
};
