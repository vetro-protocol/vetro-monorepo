import type { Meta, StoryObj } from "@storybook/react";

import { ErrorBoundary } from "../src/components/base/errorBoundary";

const ThrowingComponent = function () {
  throw new Error("Test error");
};

const meta = {
  component: ErrorBoundary,
  title: "Components/ErrorBoundary",
} satisfies Meta<typeof ErrorBoundary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithFallback: Story = {
  args: {
    children: <ThrowingComponent />,
    fallback: <span>Something went wrong</span>,
  },
};

export const WithStringFallback: Story = {
  args: {
    children: <ThrowingComponent />,
    fallback: "-",
  },
};

export const NoError: Story = {
  args: {
    children: <span>Content renders normally</span>,
    fallback: <span>Something went wrong</span>,
  },
};
