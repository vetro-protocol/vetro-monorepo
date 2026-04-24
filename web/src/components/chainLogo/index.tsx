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
  base: "size-4",
  small: "size-3",
};

type Props = {
  chain: Chain;
  size?: keyof typeof sizeClasses;
};

export const ChainLogo = function ({ chain, size = "small" }: Props) {
  const Icon = chainIcons[chain.id as keyof typeof chainIcons];
  if (!Icon) {
    return (
      <DefaultTokenLogo
        size={size}
        symbol={chain.name.charAt(0).toUpperCase()}
      />
    );
  }
  return (
    <div className={sizeClasses[size]} title={chain.name}>
      <Icon />
    </div>
  );
};
