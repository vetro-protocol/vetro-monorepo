import type { Meta, StoryObj } from "@storybook/react";

import { OracleTooltip } from "../src/components/oracleTooltip";

const meta: Meta<typeof OracleTooltip> = {
  argTypes: {
    variant: {
      control: "select",
      options: ["chainlink", "oracle"],
    },
  },
  component: OracleTooltip,
  decorators: [
    (Story) => (
      <div className="px-20 py-8">
        <Story />
      </div>
    ),
  ],
  title: "Components/OracleTooltip",
};

export default meta;
type Story = StoryObj<typeof OracleTooltip>;

const oracle = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

export const Chainlink: Story = {
  args: {
    oracle,
    variant: "chainlink",
  },
};

export const Oracle: Story = {
  args: {
    oracle,
    variant: "oracle",
  },
};
