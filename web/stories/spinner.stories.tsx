import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../src/components/base/button";
import { Spinner } from "../src/components/base/spinner";

const meta: Meta<typeof Spinner> = {
  component: Spinner,
  title: "Components/Spinner",
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  render: () => <Spinner />,
};

export const SizeVariants: Story = {
  render: () => (
    <div className="flex items-center gap-x-3">
      <Spinner />
      <Spinner size="large" />
      <Spinner size="xLarge" />
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <Button>
      <Spinner />
      <span>Loading...</span>
    </Button>
  ),
};
