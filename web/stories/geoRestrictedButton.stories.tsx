import type { Meta, StoryObj } from "@storybook/react";

import { GeoRestrictedButton } from "../src/components/geoRestrictedButton";

import { mockGeoRestricted } from "./mockGeoRestricted";

const meta: Meta<typeof GeoRestrictedButton> = {
  args: {
    children: "Claim",
    size: "small",
    variant: "primary",
  },
  component: GeoRestrictedButton,
  title: "Components/GeoRestrictedButton",
};

export default meta;
type Story = StoryObj<typeof GeoRestrictedButton>;

export const Default: Story = {};

export const GeoRestricted: Story = {
  beforeEach: mockGeoRestricted,
};

// The tooltip wraps the button in a `w-fit` element, so a parent's `*:flex-1`
// sizes the wrapper, not the button. `[&_button]:w-full` makes the button fill
// the wrapper again.
export const GeoRestrictedInFlexRow: Story = {
  beforeEach: mockGeoRestricted,
  render: (args) => (
    <div className="flex w-96 gap-x-2 *:flex-1 [&_button]:w-full">
      <GeoRestrictedButton {...args} />
      <GeoRestrictedButton {...args} variant="secondary">
        Cancel
      </GeoRestrictedButton>
    </div>
  ),
};
