import { useState } from "react";
import { type Address } from "viem";

import { dexTokenIconUrl } from "../../config/chain";
import { type Dex } from "../../config/dexes";
import { tokenListLogoUrl } from "../../config/tokenList";

type Props = {
  address: Address;
  dex?: Dex;
  size?: number;
  symbol: string;
};

// Token logo, preferring the Hemilabs token list (same as web). Falls back to the
// pool's venue asset CDN (Curve / Sushi) when a token isn't in the list, then to
// an initials badge when no image resolves.
export const TokenIcon = function ({ address, dex, size = 24, symbol }: Props) {
  const sources = [
    tokenListLogoUrl(symbol),
    dex ? dexTokenIconUrl({ address, dex }) : undefined,
  ].filter((source): source is string => source !== undefined);

  const [stage, setStage] = useState(0);
  const dimensions = { height: size, width: size };
  const source = sources[stage];

  if (source === undefined) {
    return (
      <span
        className="text-3xs inline-flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-700 ring-2 ring-white"
        style={dimensions}
        title={symbol}
      >
        {symbol.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      alt={symbol}
      className="shrink-0 rounded-full bg-white ring-2 ring-white"
      key={source}
      loading="lazy"
      onError={() => setStage((current) => current + 1)}
      src={source}
      style={dimensions}
      title={symbol}
    />
  );
};
