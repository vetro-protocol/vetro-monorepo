import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { TextArea } from "../src/components/base/textarea";

const meta = {
  argTypes: {
    error: {
      control: "boolean",
    },
    errorMessage: {
      control: "text",
    },
    helperText: {
      control: "text",
    },
  },
  component: TextArea,
  title: "Components/TextArea",
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

const helperText = "Please enter as many details as you can.";
const label = "What happened?";
const placeholder =
  "Describe what happened. Include the operation type and transaction hash if you have them.";

export const Default: Story = {
  args: {
    helperText,
    label,
    placeholder,
  },
  render: function Render(args) {
    const [value, setValue] = useState("");

    return (
      <div className="w-[352px]">
        <TextArea
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
    helperText,
    label,
    placeholder,
  },
  render: function Render(args) {
    const [value, setValue] = useState(
      "I tried to redeem VUSD but the transaction is stuck.",
    );

    return (
      <div className="w-[352px]">
        <TextArea
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
    errorMessage: "Invalid input",
    helperText,
    label,
    placeholder,
  },
  render: function Render(args) {
    const [value, setValue] = useState("");

    return (
      <div className="w-[352px]">
        <TextArea
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
    const [filled, setFilled] = useState(
      "I tried to redeem VUSD but the transaction is stuck.",
    );
    const [invalid, setInvalid] = useState("");

    return (
      <div className="flex w-[352px] flex-col gap-6">
        <div>
          <p className="text-xsm mb-2 font-medium text-gray-500">
            Default with helper (hover and focus to see other states)
          </p>
          <TextArea
            helperText={helperText}
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
          <TextArea
            helperText={helperText}
            label={label}
            onChange={(event) => setFilled(event.target.value)}
            placeholder={placeholder}
            value={filled}
          />
        </div>
        <div>
          <p className="text-xsm mb-2 font-medium text-gray-500">
            Error (replaces the helper text; focus to see error + focus state)
          </p>
          <TextArea
            errorMessage="Please describe what happened."
            helperText={helperText}
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
