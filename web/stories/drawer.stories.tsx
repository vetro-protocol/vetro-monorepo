import type { Meta, StoryObj } from "@storybook/react";
import { Suspense, lazy } from "react";

import { Button } from "../src/components/base/button";
import { Drawer } from "../src/components/base/drawer";
import { DrawerLoader } from "../src/components/base/drawer/drawerLoader";
import { useDrawerState } from "../src/components/base/drawer/useDrawerState";

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
    const drawerState = useDrawerState();

    return (
      <>
        <Button onClick={drawerState.onOpen}>Open Drawer</Button>
        {drawerState.isDrawerOpen && (
          <Drawer {...drawerState}>
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

type LazyLoadedDrawerProps = {
  defaultOpen?: boolean;
  onAnimated?: VoidFunction;
  onClose: VoidFunction;
};

const LazyLoadedDrawer = lazy(
  () =>
    new Promise<{ default: React.ComponentType<LazyLoadedDrawerProps> }>(
      (resolve) =>
        setTimeout(
          () =>
            resolve({
              default: (props: LazyLoadedDrawerProps) => (
                <Drawer {...props}>
                  <div className="p-6">
                    <h2 className="mb-4 text-lg font-semibold">
                      Lazy Loaded Content
                    </h2>
                    <p className="text-sm text-gray-600">
                      This content was loaded lazily. Click outside or press
                      Escape to close.
                    </p>
                  </div>
                </Drawer>
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
    const drawerState = useDrawerState();

    return (
      <>
        <Button onClick={drawerState.onOpen}>Open Lazy Drawer</Button>
        {drawerState.isDrawerOpen && (
          <Suspense fallback={<DrawerLoader {...drawerState} />}>
            <LazyLoadedDrawer {...drawerState} />
          </Suspense>
        )}
      </>
    );
  },
};
