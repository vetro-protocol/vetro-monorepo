import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { SegmentedControl } from "../src/components/base/segmentedControl";
import { TokenDisplay } from "../src/components/tokenDisplay";
import { knownTokens } from "../src/utils/tokenList";

const meta: Meta<typeof SegmentedControl> = {
  component: SegmentedControl,
  title: "Components/SegmentedControl",
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  render: function Component() {
    const [value, setValue] = useState<"deposit" | "withdraw">("deposit");

    return (
      <div className="w-[400px]">
        <SegmentedControl
          onChange={setValue}
          options={[
            { label: "Deposit", value: "deposit" },
            { label: "Withdraw", value: "withdraw" },
          ]}
          value={value}
        />
      </div>
    );
  },
};

export const ThreeOptions: Story = {
  render: function Component() {
    const [value, setValue] = useState<"day" | "month" | "week">("week");

    return (
      <div className="w-[400px] border-y border-gray-200 bg-gray-50 px-6 py-3">
        <SegmentedControl
          onChange={setValue}
          options={[
            { label: "Day", value: "day" },
            { label: "Week", value: "week" },
            { label: "Month", value: "month" },
          ]}
          value={value}
        />
      </div>
    );
  },
};

const tokenSymbols = ["USDC", "USDT"] as const;
type TokenSymbol = (typeof tokenSymbols)[number];
const labeledTokens = tokenSymbols
  .map((symbol) => knownTokens.find((token) => token.symbol === symbol))
  .filter((token) => !!token);

export const WithTokenLabels: Story = {
  render: function Component() {
    const [value, setValue] = useState<TokenSymbol>(labeledTokens[0].symbol);

    return (
      <div className="flex justify-center">
        <SegmentedControl
          onChange={setValue}
          options={labeledTokens.map((token) => ({
            label: (
              <span className="flex items-center gap-1.5">
                <TokenDisplay logoURI={token.logoURI} symbol={token.symbol} />
              </span>
            ),
            value: token.symbol as TokenSymbol,
          }))}
          value={value}
          variant="pill"
        />
      </div>
    );
  },
};

export const SizeXs: Story = {
  render: function Component() {
    const [bar, setBar] = useState<"deposit" | "withdraw">("deposit");
    const [pill, setPill] = useState<"1m" | "1w" | "1y" | "3m">("1w");

    return (
      <div className="flex flex-col gap-4">
        <div className="w-[400px] border-y border-gray-200 bg-gray-50 px-6 py-3">
          <SegmentedControl
            onChange={setBar}
            options={[
              { label: "Deposit", value: "deposit" },
              { label: "Withdraw", value: "withdraw" },
            ]}
            size="xs"
            value={bar}
          />
        </div>
        <div className="w-[400px]">
          <SegmentedControl
            onChange={setPill}
            options={[
              { label: "1W", value: "1w" },
              { label: "1M", value: "1m" },
              { label: "3M", value: "3m" },
              { label: "1Y", value: "1y" },
            ]}
            size="xs"
            value={pill}
            variant="pill"
          />
        </div>
      </div>
    );
  },
};
