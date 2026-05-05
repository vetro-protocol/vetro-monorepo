import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { SearchInput } from "../src/components/base/searchInput";

const meta = {
  component: SearchInput,
  title: "Components/SearchInput",
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

const placeholder = "Search token name or address...";

export const Default: Story = {
  args: {
    placeholder,
  },
  render: function Render(args) {
    const [value, setValue] = useState("");

    return (
      <div className="w-[352px]">
        <SearchInput {...args} onChange={setValue} value={value} />
      </div>
    );
  },
};

export const Filled: Story = {
  args: {
    placeholder,
  },
  render: function Render(args) {
    const [value, setValue] = useState("USDC");

    return (
      <div className="w-[352px]">
        <SearchInput {...args} onChange={setValue} value={value} />
      </div>
    );
  },
};

export const States: Story = {
  args: {
    placeholder,
  },
  render: function Render(args) {
    const [empty, setEmpty] = useState("");
    const [filled, setFilled] = useState("USDC");

    return (
      <div className="flex w-[352px] flex-col gap-6">
        <div>
          <p className="text-xsm mb-2 font-medium text-gray-500">
            Default (hover and focus to see other states)
          </p>
          <SearchInput {...args} onChange={setEmpty} value={empty} />
        </div>
        <div>
          <p className="text-xsm mb-2 font-medium text-gray-500">
            Filled (with value)
          </p>
          <SearchInput {...args} onChange={setFilled} value={filled} />
        </div>
      </div>
    );
  },
};
