import type { Meta, StoryObj } from "@storybook/react";

const Header = function ({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const Tag = `h${level}` as const;
  return <Tag>Clear Money</Tag>;
};

const meta: Meta<typeof Header> = {
  component: Header,
  title: "Typography/Headers",
};

export default meta;
type Story = StoryObj<typeof Header>;

export const H1: Story = {
  args: {
    level: 1,
  },
};

export const H2: Story = {
  args: {
    level: 2,
  },
};

export const H3: Story = {
  args: {
    level: 3,
  },
};

export const H4: Story = {
  args: {
    level: 4,
  },
};

export const H5: Story = {
  args: {
    level: 5,
  },
};
