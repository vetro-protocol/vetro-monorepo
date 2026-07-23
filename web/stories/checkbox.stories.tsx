import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox } from "../src/components/base/checkbox";

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: "Components/Checkbox",
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox checked onChange={() => ({})} />
      <Checkbox checked={false} onChange={() => ({})} />
      <Checkbox disabled />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <label className="flex cursor-pointer items-center gap-2 text-gray-900">
      <Checkbox defaultChecked />I understand and accept the risk
    </label>
  ),
};
