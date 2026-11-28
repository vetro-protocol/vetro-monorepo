import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn } from "storybook/test";

import { Button } from "../src/components/base/button";
import { DrawerRetryFooter } from "../src/components/base/drawer/drawerRetryFooter";

const meta = {
  component: DrawerRetryFooter,
  title: "Components/DrawerRetryFooter",
} satisfies Meta<typeof DrawerRetryFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

const onRetry = fn();

export const Default: Story = {
  args: {
    onRetry,
  },
};

export const Interactive: Story = {
  render: function Render() {
    const [showRetry, setShowRetry] = useState(false);

    return (
      <div className="flex w-md flex-col gap-4">
        <Button
          onClick={() => setShowRetry((prev) => !prev)}
          variant="secondary"
        >
          {showRetry ? "Hide retry" : "Show retry"}
        </Button>
        <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200">
          <div className="px-6 py-4 text-sm text-gray-500">
            Transaction progress
          </div>
          <DrawerRetryFooter onRetry={showRetry ? onRetry : undefined} />
        </div>
      </div>
    );
  },
};
