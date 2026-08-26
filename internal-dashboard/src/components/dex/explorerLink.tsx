import { type Address } from "viem";

import { getTrackedChain } from "../../config/chains";
import { shortenAddress } from "../../lib/format";

import { ExternalLink } from "./externalLink";

type Props = {
  address: Address;
  chainId: number;
};

export const ExplorerLink = function ({ address, chainId }: Props) {
  const explorerUrl = getTrackedChain(chainId)?.blockExplorers.default.url;

  if (!explorerUrl) {
    return <span className="text-neutral-600">{shortenAddress(address)}</span>;
  }

  return (
    <ExternalLink
      className="font-medium text-blue-600 hover:underline"
      href={`${explorerUrl}/address/${address}`}
    >
      {shortenAddress(address)}
    </ExternalLink>
  );
};
