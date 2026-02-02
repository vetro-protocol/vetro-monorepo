import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { TokenDropdown } from "../src/components/tokenDropdown";
import type { Token } from "../src/types";

const meta = {
  args: {},
  component: TokenDropdown,
  title: "Components/TokenDropdown",
} satisfies Meta<typeof TokenDropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

const tokens: Token[] = [
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    chainId: 1,
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    name: "USDCoin",
    symbol: "USDC",
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    chainId: 1,
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
    name: "Tether USD",
    symbol: "USDT",
  },
];

export const Default: Story = {
  args: {
    onChange: () => ({}),
    tokens,
    value: tokens[0],
  },
  render: function Render(args) {
    const [selectedToken, setSelectedToken] = useState<Token>(args.value);

    function handleTokenSelect(token: Token) {
      setSelectedToken(token);
    }

    return (
      <div className="w-[120px]">
        <TokenDropdown
          onChange={handleTokenSelect}
          tokens={args.tokens}
          value={selectedToken}
        />
      </div>
    );
  },
};
