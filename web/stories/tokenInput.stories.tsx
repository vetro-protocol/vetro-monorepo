import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MaxButton } from "../src/components/base/maxButton";
import { TokenDropdown } from "../src/components/tokenDropdown";
import { TokenInput } from "../src/components/tokenInput";
import { TokenSelectorReadOnly } from "../src/components/tokenSelectorReadOnly";
import { useAmount } from "../src/hooks/useAmount";
import type { Token } from "../src/types";
import { knownTokens } from "../src/utils/tokenList";

const meta = {
  component: TokenInput,
  title: "Components/TokenInput",
} satisfies Meta<typeof TokenInput>;

export default meta;

type Story = StoryObj<typeof meta>;

const storyTokens = ["USDC", "USDT"];
const tokens = knownTokens.filter((t) => storyTokens.includes(t.symbol));

export const SwitchToken: Story = {
  args: {
    balance: (
      <>
        <span className="text-gray-500">Balance:</span>
        <span className="mr-1 text-gray-900">2</span>
      </>
    ),
    fiatValue: "0.00",
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
    balance: (
      <>
        <span className="text-gray-500">Available to withdraw:</span>
        <span className="mr-1 text-gray-900">200</span>
      </>
    ),
    fiatValue: "0.00",
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
    balance: (
      <>
        <span className="text-gray-500">Balance:</span>
        <span className="mr-1 text-gray-900">2</span>
      </>
    ),
    errorKey: "insufficient-balance",
    fiatValue: "100.00",
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
