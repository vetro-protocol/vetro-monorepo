import type { Meta, StoryObj } from "@storybook/react";
import { ComponentProps } from "react";

const meta: Meta<ComponentProps<"div">> = {
  argTypes: {
    className: {
      control: "select",
      options: [
        "shadow-bs",
        "shadow-sm",
        "shadow-md",
        "shadow-lg",
        "shadow-xl",
      ],
    },
  },
  component: (props: ComponentProps<"div">) => (
    <div {...props} style={{ height: 128, width: 256 }} />
  ),
  title: "Styles/Shadow",
};

export default meta;
type Story = StoryObj<ComponentProps<"div">>;

export const Shadow: Story = {
  args: {
    className: "shadow-bs",
  },
};
