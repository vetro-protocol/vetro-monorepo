import type { Meta, StoryObj } from "@storybook/react";

import { ButtonLink } from "../src/components/base/button";

const meta: Meta<typeof ButtonLink> = {
  argTypes: {
    children: {
      control: "text",
    },
    size: {
      control: "select",
      options: ["xSmall", "small", "xLarge"],
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
    },
  },
  component: ButtonLink,
  title: "Components/ButtonLink",
};

export default meta;
type Story = StoryObj<typeof ButtonLink>;

export const AbsoluteLink: Story = {
  args: {
    children: "Absolute Link",
    href: "https://vetro.org",
    size: "small",
    variant: "primary",
  },
};

export const RelativeLink: Story = {
  args: {
    children: "Relative link",
    href: "?path=/story/components-button--primary",
    size: "small",
    variant: "secondary",
  },
};
