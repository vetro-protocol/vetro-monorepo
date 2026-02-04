import type { Token } from "types";

import { TokenDisplay } from "../tokenDisplay";

type Props = Pick<Token, "logoURI" | "symbol">;

export const TokenSelectorReadOnly = ({ logoURI, symbol }: Props) => (
  <div className="flex items-center gap-1.5 py-1.5 pr-3 pl-1.5">
    <TokenDisplay logoURI={logoURI} symbol={symbol} />
  </div>
);
