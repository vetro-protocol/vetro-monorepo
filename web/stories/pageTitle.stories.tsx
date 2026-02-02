import type { Meta, StoryObj } from "@storybook/react";

import { PageTitle } from "../src/components/base/pageTitle";

const meta: Meta<typeof PageTitle> = {
  argTypes: {
    value: {
      control: "text",
    },
  },
  component: PageTitle,
  title: "Components/PageTitle",
};

export default meta;
type Story = StoryObj<typeof PageTitle>;

export const Default: Story = {
  args: {
    value: "Welcome to Vetro",
  },
};

export const Long: Story = {
  args: {
    value:
      "This is a very long page title that demonstrates how the component handles longer text content and ensures proper wrapping",
  },
};
