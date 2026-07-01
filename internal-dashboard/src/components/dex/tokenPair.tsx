import { type Dex } from "../../config/dexes";
import { type PoolCoin } from "../../lib/types";

import { TokenIcon } from "./tokenIcon";

type Props = {
  coins: PoolCoin[];
  dex: Dex;
  name: string;
  size?: number;
};

export const TokenPair = ({ coins, dex, name, size }: Props) => (
  <div className="flex min-w-0 items-center gap-x-2">
    <div className="flex shrink-0 -space-x-2">
      {coins.map((coin) => (
        <TokenIcon
          address={coin.address}
          dex={dex}
          key={coin.address}
          size={size}
          symbol={coin.symbol}
        />
      ))}
    </div>
    <span className="truncate font-medium text-neutral-950">{name}</span>
  </div>
);
