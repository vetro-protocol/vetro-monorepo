import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useRef, useState } from "react";

import { Button } from "../src/components/base/button";
import { Toast, type ToastData, Toaster } from "../src/components/base/toast";

const meta: Meta<typeof Toast> = {
  component: Toast,
  parameters: {
    layout: "fullscreen",
  },
  title: "Components/Toast",
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const WithDescription: Story = {
  args: {
    description: "Your funds are now staked and earning yield.",
    title: "Stake deposit confirmed",
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Stake deposit confirmed",
  },
};

export const Closable: Story = {
  args: {
    closable: true,
    title: "Stake deposit confirmed",
  },
};

export const ClosableWithDescription: Story = {
  args: {
    closable: true,
    description: "Your 7-day cooldown has started.",
    title: "Withdrawal request confirmed",
  },
};

export const Error: Story = {
  args: {
    description: "Your request wasn't sent. Try again.",
    title: "Something went wrong",
    variant: "error",
  },
};

function MultipleToastsDemo() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counterRef = useRef(0);

  const handleAdd = useCallback(function handleAdd() {
    counterRef.current += 1;
    // Odd toasts show the error variant, even toasts show success.
    const isError = counterRef.current % 2 === 1;
    setToasts((prev) => [
      ...prev,
      isError
        ? {
            closable: true,
            description: "Your request wasn't sent. Try again.",
            id: counterRef.current,
            title: "Something went wrong",
            variant: "error",
          }
        : {
            closable: true,
            description: "Your funds are now staked and earning yield.",
            id: counterRef.current,
            title: "Stake deposit confirmed",
            variant: "success",
          },
    ]);
  }, []);

  const handleClose = useCallback(function handleClose(id: number | string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="flex flex-col items-start gap-4 p-8">
      <Button onClick={handleAdd} type="button" variant="primary">
        Add toast
      </Button>
      <p className="text-sm text-gray-500">
        Active toasts: {toasts.length}. Even are successes, odd are errors.
        Hover over the stack to expand.
      </p>
      <Toaster autoCloseMs={8000} onClose={handleClose} toasts={toasts} />
    </div>
  );
}

export const MultipleToasts: StoryObj = {
  render: () => <MultipleToastsDemo />,
};
