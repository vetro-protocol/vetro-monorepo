import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useRef, useState } from "react";

import { Badge } from "../src/components/base/badge";
import { Button } from "../src/components/base/button";
import { ChevronIcon } from "../src/components/base/chevronIcon";
import { type StackItem, Stack } from "../src/components/base/stack";

const meta: Meta<typeof Stack> = {
  component: Stack,
  parameters: {
    layout: "fullscreen",
  },
  title: "Components/Stack",
};

export default meta;

const marketPairs = ["HemiBTC / VUSD", "WETH / VUSD", "USDC / VUSD"];

function CustomContentStackDemo() {
  const [items, setItems] = useState<StackItem[]>([]);
  const counterRef = useRef(0);

  const handleAdd = useCallback(function handleAdd() {
    counterRef.current += 1;
    const label = marketPairs[(counterRef.current - 1) % marketPairs.length];
    setItems((prev) => [
      ...prev,
      {
        content: (
          <div className="mx-auto w-fit">
            <Button size="xLarge" type="button" variant="danger">
              <Badge variant="red">{label}</Badge>
              Position at risk
            </Button>
          </div>
        ),
        id: counterRef.current,
      },
    ]);
  }, []);

  const handleRemove = useCallback(function handleRemove(id: number | string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="flex flex-col items-start gap-4 p-8">
      <Button onClick={handleAdd} type="button" variant="primary">
        Add notification
      </Button>
      <p className="text-sm text-gray-500">
        Active notifications: {items.length}. Hover over the stack to expand.
      </p>
      <Stack items={items} onRemove={handleRemove} position="bottom-center" />
    </div>
  );
}

export const CustomContentStack: StoryObj = {
  render: () => <CustomContentStackDemo />,
};

function MixedContentStackDemo() {
  const [items, setItems] = useState<StackItem[]>([]);
  const counterRef = useRef(0);

  const handleAddLiquidation = useCallback(function handleAddLiquidation() {
    counterRef.current += 1;
    const label = marketPairs[(counterRef.current - 1) % marketPairs.length];
    setItems((prev) => [
      ...prev,
      {
        content: (
          <div className="mx-auto *:w-2xs *:border-2 *:border-rose-500">
            <Button
              size="xLarge"
              type="button"
              variant="danger"
              style={{ justifyItems: "flex-start" }}
            >
              <Badge variant="red">{label}</Badge>
              Position at risk
              <ChevronIcon direction="right" />
            </Button>
          </div>
        ),
        id: counterRef.current,
      },
    ]);
  }, []);

  const handleAddRedeem = useCallback(function handleAddRedeem() {
    counterRef.current += 1;
    setItems((prev) => [
      ...prev,
      {
        content: (
          <div className="mx-auto *:w-2xs *:border-2 *:border-blue-500">
            <Button size="xLarge" type="button" variant="primary">
              <Badge variant="blue">10,000 VUSD</Badge>
              Ready to redeem
              <ChevronIcon direction="right" />
            </Button>
          </div>
        ),
        id: counterRef.current,
      },
    ]);
  }, []);

  const handleRemove = useCallback(function handleRemove(id: number | string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="flex flex-col items-start gap-4 p-8">
      <div className="flex gap-2">
        <Button onClick={handleAddLiquidation} type="button" variant="danger">
          Add liquidation warning
        </Button>
        <Button onClick={handleAddRedeem} type="button" variant="primary">
          Add redeem notification
        </Button>
      </div>
      <p className="text-sm text-gray-500">
        Active notifications: {items.length}. Hover over the stack to expand.
      </p>
      <Stack items={items} onRemove={handleRemove} position="bottom-center" />
    </div>
  );
}

export const MixedContentStack: StoryObj = {
  render: () => <MixedContentStackDemo />,
};

function PositionsDemo() {
  const [centerItems, setCenterItems] = useState<StackItem[]>([]);
  const [rightItems, setRightItems] = useState<StackItem[]>([]);
  const counterRef = useRef(0);

  const handleAddCenter = useCallback(function handleAddCenter() {
    counterRef.current += 1;
    const label = marketPairs[(counterRef.current - 1) % marketPairs.length];
    setCenterItems((prev) => [
      ...prev,
      {
        content: (
          <div className="mx-auto w-fit">
            <Button size="xLarge" type="button" variant="danger">
              <Badge variant="red">{label}</Badge>
              Position at risk
            </Button>
          </div>
        ),
        id: counterRef.current,
      },
    ]);
  }, []);

  const handleAddRight = useCallback(function handleAddRight() {
    counterRef.current += 1;
    setRightItems((prev) => [
      ...prev,
      {
        content: (
          <div className="flex items-start gap-3 rounded-lg bg-gray-950 p-3 pr-4">
            <p className="text-sm leading-5 font-medium text-gray-50">
              Stake deposit confirmed
            </p>
          </div>
        ),
        id: counterRef.current,
      },
    ]);
  }, []);

  const handleRemoveCenter = useCallback(function handleRemoveCenter(
    id: number | string,
  ) {
    setCenterItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleRemoveRight = useCallback(function handleRemoveRight(
    id: number | string,
  ) {
    setRightItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="flex flex-col items-start gap-4 p-8">
      <div className="flex gap-2">
        <Button onClick={handleAddCenter} type="button" variant="danger">
          Add bottom-center
        </Button>
        <Button onClick={handleAddRight} type="button" variant="primary">
          Add bottom-right
        </Button>
      </div>
      <p className="text-sm text-gray-500">
        Center: {centerItems.length} / Right: {rightItems.length}. Both stacks
        can coexist.
      </p>
      <Stack
        items={centerItems}
        onRemove={handleRemoveCenter}
        position="bottom-center"
      />
      <Stack
        autoCloseMs={8000}
        items={rightItems}
        onRemove={handleRemoveRight}
        position="bottom-right"
      />
    </div>
  );
}

export const Positions: StoryObj = {
  render: () => <PositionsDemo />,
};
