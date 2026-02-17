import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "../src/components/base/button";
import { Modal } from "../src/components/base/modal";

const meta = {
  component: Modal,
  title: "Components/Modal",
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // @ts-expect-error no need to specify args
  args: {},
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        {isOpen && (
          <Modal onClose={() => setIsOpen(false)}>
            <div className="flex w-sm flex-col gap-6 rounded-lg bg-white p-6 shadow-xl">
              <div className="flex flex-col gap-2">
                <h4 className="text-base font-semibold text-gray-900">
                  Modal Title
                </h4>
                <p className="text-xsm font-normal text-gray-500">
                  Click outside or press Escape to close.
                </p>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                size="xSmall"
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </Modal>
        )}
      </>
    );
  },
};
