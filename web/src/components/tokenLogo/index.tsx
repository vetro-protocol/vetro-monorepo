import { useEffect, useState } from "react";
import type { Token } from "types";

type Props = Pick<Token, "logoURI" | "symbol">;

export const TokenLogo = function ({ logoURI, symbol }: Props) {
  const [hasError, setHasError] = useState(false);

  useEffect(
    function resetOnUrlChange() {
      setHasError(false);
    },
    [logoURI],
  );

  if (!logoURI || hasError) {
    return (
      <div className="flex size-5 items-center justify-center overflow-hidden rounded-full border border-solid border-white bg-neutral-50 text-[8px] font-semibold text-neutral-700">
        {symbol}
      </div>
    );
  }

  return (
    <img
      alt={`${symbol} logo`}
      className="size-5 rounded-full"
      onError={() => setHasError(true)}
      src={logoURI}
    />
  );
};
