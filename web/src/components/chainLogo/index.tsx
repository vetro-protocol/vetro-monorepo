import { DefaultTokenLogo } from "components/defaultTokenLogo";
import type { Chain } from "viem";
import { arbitrum, base, bsc, hemi, mainnet, optimism } from "viem/chains";

import { ArbitrumIcon } from "./arbitrumIcon";
import { BaseIcon } from "./baseIcon";
import { BnbIcon } from "./bnbIcon";
import { EthereumIcon } from "./ethereumIcon";
import { HemiIcon } from "./hemiIcon";
import { OptimismIcon } from "./optimismIcon";

const chainIcons = {
  [arbitrum.id]: ArbitrumIcon,
  [base.id]: BaseIcon,
  [bsc.id]: BnbIcon,
  [hemi.id]: HemiIcon,
  [mainnet.id]: EthereumIcon,
  [optimism.id]: OptimismIcon,
};

const sizeClasses = {
  base: "size-3",
  large: "size-5",
  medium: "size-4",
  small: "size-2.5",
  xLarge: "size-7",
};

const fallbackSizes = {
  base: "xSmall",
  large: "base",
  medium: "small",
  small: "xSmall",
  xLarge: "large",
} as const;

type Props = {
  chain: Chain;
  size?: keyof typeof sizeClasses;
};

export const ChainLogo = function ({ chain, size = "base" }: Props) {
  const Icon = chainIcons[chain.id as keyof typeof chainIcons];
  if (!Icon) {
    return (
      <DefaultTokenLogo
        size={fallbackSizes[size]}
        symbol={chain.name.charAt(0).toUpperCase()}
      />
    );
  }
  return (
    <div
      aria-label={chain.name}
      className={sizeClasses[size]}
      role="img"
      title={chain.name}
    >
      <Icon />
    </div>
  );
};
