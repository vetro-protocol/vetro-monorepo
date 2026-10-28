import type { Meta, StoryObj } from "@storybook/react";
import { Suspense, lazy, useState } from "react";

import { Button } from "../src/components/base/button";
import { Drawer } from "../src/components/base/drawer";
import { DrawerLoader } from "../src/components/base/drawer/drawerLoader";

const meta = {
  component: Drawer,
  title: "Components/Drawer",
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // @ts-expect-error no need to specify args
  args: {},
  render: function Render() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsDrawerOpen(true)}>Open Drawer</Button>
        {isDrawerOpen && (
          <Drawer ariaLabel="Drawer" onClose={() => setIsDrawerOpen(false)}>
            <div className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Drawer Content</h2>
              <p className="text-sm text-gray-600">
                Click outside or press Escape to close.
              </p>
            </div>
          </Drawer>
        )}
      </>
    );
  },
};

const LazyDrawerContent = lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((resolve) =>
      setTimeout(
        () =>
          resolve({
            default: () => (
              <div className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Lazy Loaded Content
                </h2>
                <p className="text-sm text-gray-600">
                  This content was loaded lazily. Click outside or press Escape
                  to close.
                </p>
              </div>
            ),
          }),
        5000,
      ),
    ),
);

export const LazyLoading: Story = {
  // @ts-expect-error no need to specify args
  args: {},
  render: function Render() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsDrawerOpen(true)}>Open Lazy Drawer</Button>
        {isDrawerOpen && (
          <Drawer
            ariaLabel="Lazy drawer"
            onClose={() => setIsDrawerOpen(false)}
          >
            <Suspense fallback={<DrawerLoader />}>
              <LazyDrawerContent />
            </Suspense>
          </Drawer>
        )}
      </>
    );
  },
};

function TitleStory({ title }: { title: string }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsDrawerOpen(true)}>Open Drawer</Button>
      {isDrawerOpen && (
        <Drawer onClose={() => setIsDrawerOpen(false)} title={title}>
          <p className="px-6 text-sm text-gray-600">
            Click outside or press Escape to close.
          </p>
        </Drawer>
      )}
    </>
  );
}

export const WithTitle: Story = {
  // @ts-expect-error no need to specify args
  args: {},
  render: () => <TitleStory title="Swap in progress" />,
};

export const LongTitle: Story = {
  // @ts-expect-error no need to specify args
  args: {},
  render: () => (
    <TitleStory title="Manage your stake position with ease and confidence, all in one place" />
  ),
};
