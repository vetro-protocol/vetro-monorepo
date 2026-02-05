import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MaxButton } from "../src/components/base/maxButton";
import { TokenDropdown } from "../src/components/tokenDropdown";
import { TokenInput } from "../src/components/tokenInput";
import { TokenSelectorReadOnly } from "../src/components/tokenSelectorReadOnly";
import { useAmount } from "../src/hooks/useAmount";
import type { Token } from "../src/types";

const meta = {
  component: TokenInput,
  title: "Components/TokenInput",
} satisfies Meta<typeof TokenInput>;

export default meta;

type Story = StoryObj<typeof meta>;

const tokens: Token[] = [
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    chainId: 1,
    decimals: 6,
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/usdc.svg",
    name: "USDCoin",
    symbol: "USDC",
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    chainId: 1,
    decimals: 6,
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/usdt.svg",
    name: "Tether USD",
    symbol: "USDT",
  },
];

export const SwitchToken: Story = {
  args: {
    balanceLabel: "Balance",
    balanceValue: "2",
    label: "You are swapping",
    maxButton: <MaxButton onClick={() => alert("max clicked")} />,
    onChange: () => ({}),
    tokenSelector: undefined,
    value: "0",
  },
  render: function Render(args) {
    const [amount, setAmount] = useAmount();
    const [selectedToken, setSelectedToken] = useState<Token>(tokens[0]);

    function handleTokenSelect(token: Token) {
      setSelectedToken(token);
    }

    return (
      <div className="w-[450px]">
        <TokenInput
          {...args}
          onChange={setAmount}
          tokenSelector={
            <TokenDropdown
              onChange={handleTokenSelect}
              tokens={tokens}
              value={selectedToken}
            />
          }
          value={amount}
        />
      </div>
    );
  },
};

export const ReadOnlyToken: Story = {
  args: {
    balanceLabel: "Available to withdraw",
    balanceValue: "200",
    label: "You will withdraw",
    maxButton: <MaxButton onClick={() => alert("max clicked")} />,
    onChange: () => ({}),
    tokenSelector: (
      <TokenSelectorReadOnly
        logoURI={tokens[0].logoURI}
        symbol={tokens[0].symbol}
      />
    ),
    value: "0",
  },
  render: function Render(args) {
    const [amount, setAmount] = useAmount();

    return (
      <div className="w-[450px]">
        <TokenInput {...args} onChange={setAmount} value={amount} />
      </div>
    );
  },
};

export const WithError: Story = {
  args: {
    balanceLabel: "Balance",
    balanceValue: "2",
    errorKey: "insufficient-balance",
    label: "You are swapping",
    maxButton: <MaxButton onClick={() => alert("max clicked")} />,
    onChange: () => ({}),
    tokenSelector: (
      <TokenSelectorReadOnly
        logoURI={tokens[0].logoURI}
        symbol={tokens[0].symbol}
      />
    ),
    value: "100",
  },
  render: function Render(args) {
    const [amount, setAmount] = useAmount(args.value);

    return (
      <div className="w-[450px]">
        <TokenInput {...args} onChange={setAmount} value={amount} />
      </div>
    );
  },
};
