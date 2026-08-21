import { type Address } from "viem";
import { mainnet } from "viem/chains";

import { shortenAddress } from "../../lib/format";

import { ExternalLink } from "./externalLink";

type Props = {
  address: Address;
};

const explorerAddressUrl = (address: Address) =>
  `${mainnet.blockExplorers.default.url}/address/${address}`;

export const ExplorerLink = ({ address }: Props) => (
  <ExternalLink
    className="font-medium text-blue-600 hover:underline"
    href={explorerAddressUrl(address)}
  >
    {shortenAddress(address)}
  </ExternalLink>
);
