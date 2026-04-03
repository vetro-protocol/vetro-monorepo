import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { CollapsibleSection } from "../src/components/collapsibleSection";

const meta: Meta<typeof CollapsibleSection> = {
  argTypes: {
    children: {
      control: false,
    },
    show: {
      control: "boolean",
    },
  },
  component: CollapsibleSection,
  title: "Components/CollapsibleSection",
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const Default: Story = {
  args: {
    children: (
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-700">
          This content animates in and out. Toggle the <strong>show</strong>{" "}
          control to see the transition.
        </p>
      </div>
    ),
    show: true,
  },
};

export const Interactive: Story = {
  render: function Component() {
    const [show, setShow] = useState(false);

    return (
      <div className="flex w-80 flex-col gap-4">
        <input
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          onChange={(e) => setShow(e.target.value !== "")}
          placeholder="Type something to reveal content..."
          type="text"
        />
        <CollapsibleSection show={show}>
          <div className="flex flex-col gap-2 rounded border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Fees</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Network Fee</span>
              <span className="text-gray-900">$0.0001</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Protocol Fee</span>
              <span className="text-gray-900">0.003%</span>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    );
  },
};
