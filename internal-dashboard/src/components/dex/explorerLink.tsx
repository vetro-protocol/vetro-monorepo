import { type Address } from "viem";
import { mainnet } from "viem/chains";

import { shortenAddress } from "../../lib/format";

type Props = {
  address: Address;
};

const explorerAddressUrl = (address: Address) =>
  `${mainnet.blockExplorers.default.url}/address/${address}`;

export const ExplorerLink = ({ address }: Props) => (
  <a
    className="font-medium text-blue-600 hover:underline"
    href={explorerAddressUrl(address)}
    rel="noopener noreferrer"
    target="_blank"
  >
    {shortenAddress(address)}
  </a>
);
