import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { SegmentedControl } from "../src/components/base/segmentedControl";

const meta: Meta<typeof SegmentedControl> = {
  component: SegmentedControl,
  title: "Components/SegmentedControl",
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  render: function Component() {
    const [value, setValue] = useState<"deposit" | "withdraw">("deposit");

    return (
      <div className="w-[400px]">
        <SegmentedControl
          onChange={setValue}
          options={[
            { label: "Deposit", value: "deposit" },
            { label: "Withdraw", value: "withdraw" },
          ]}
          value={value}
        />
      </div>
    );
  },
};

export const ThreeOptions: Story = {
  render: function Component() {
    const [value, setValue] = useState<"day" | "month" | "week">("week");

    return (
      <div className="w-[400px]">
        <SegmentedControl
          onChange={setValue}
          options={[
            { label: "Day", value: "day" },
            { label: "Week", value: "week" },
            { label: "Month", value: "month" },
          ]}
          value={value}
        />
      </div>
    );
  },
};
