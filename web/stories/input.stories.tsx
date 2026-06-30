import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Input } from "../src/components/base/input";

const meta = {
  argTypes: {
    error: {
      control: "boolean",
    },
    errorMessage: {
      control: "text",
    },
  },
  component: Input,
  title: "Components/Input",
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

const label = "Your email address";
const placeholder = "john@email.com";

export const Default: Story = {
  args: {
    label,
    placeholder,
  },
  render: function Render(args) {
    const [value, setValue] = useState("");

    return (
      <div className="w-[352px]">
        <Input
          {...args}
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
      </div>
    );
  },
};

export const Filled: Story = {
  args: {
    label,
    placeholder,
  },
  render: function Render(args) {
    const [value, setValue] = useState("john@email.com");

    return (
      <div className="w-[352px]">
        <Input
          {...args}
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
      </div>
    );
  },
};

export const Error: Story = {
  args: {
    errorMessage: "Please enter a valid email address",
    label,
    placeholder,
  },
  render: function Render(args) {
    const [value, setValue] = useState("");

    return (
      <div className="w-[352px]">
        <Input
          {...args}
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
      </div>
    );
  },
};

export const States: Story = {
  render: function Render() {
    const [empty, setEmpty] = useState("");
    const [filled, setFilled] = useState("john@email.com");
    const [invalid, setInvalid] = useState("");

    return (
      <div className="flex w-[352px] flex-col gap-6">
        <div>
          <p className="text-xsm mb-2 font-medium text-gray-500">
            Default (hover and focus to see other states)
          </p>
          <Input
            label={label}
            onChange={(event) => setEmpty(event.target.value)}
            placeholder={placeholder}
            value={empty}
          />
        </div>
        <div>
          <p className="text-xsm mb-2 font-medium text-gray-500">
            Filled (with value)
          </p>
          <Input
            label={label}
            onChange={(event) => setFilled(event.target.value)}
            placeholder={placeholder}
            value={filled}
          />
        </div>
        <div>
          <p className="text-xsm mb-2 font-medium text-gray-500">
            Error (focus to see error + focus state)
          </p>
          <Input
            errorMessage="Please enter a valid email address"
            label={label}
            onChange={(event) => setInvalid(event.target.value)}
            placeholder={placeholder}
            value={invalid}
          />
        </div>
      </div>
    );
  },
};
