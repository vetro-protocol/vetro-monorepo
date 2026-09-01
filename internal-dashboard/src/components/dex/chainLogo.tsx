import { type ComponentType } from "react";
import { hemi, mainnet } from "viem/chains";

import { getTrackedChain, type TrackedChainId } from "../../config/chains";
import { EthereumIcon } from "../icons/ethereumIcon";
import { HemiIcon } from "../icons/hemiIcon";

const icons: Record<TrackedChainId, ComponentType<{ size?: number }>> = {
  [hemi.id]: HemiIcon,
  [mainnet.id]: EthereumIcon,
};

type Props = {
  chainId: number;
  size?: number;
};

export const ChainLogo = function ({ chainId, size }: Props) {
  const chain = getTrackedChain(chainId);
  if (!chain) {
    return null;
  }

  const Icon = icons[chain.id];
  return (
    <span
      aria-label={chain.name}
      className="inline-flex shrink-0"
      role="img"
      title={chain.name}
    >
      <Icon size={size} />
    </span>
  );
};
