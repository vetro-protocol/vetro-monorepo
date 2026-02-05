import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { ToggleButton } from "../src/components/base/toggleButton";

const meta: Meta<typeof ToggleButton> = {
  component: ToggleButton,
  title: "Components/ToggleButton",
};

export default meta;
type Story = StoryObj<typeof ToggleButton>;

export const Default: Story = {
  render: function Component() {
    const [active, setActive] = useState(false);

    return <ToggleButton active={active} onClick={() => setActive(!active)} />;
  },
};
