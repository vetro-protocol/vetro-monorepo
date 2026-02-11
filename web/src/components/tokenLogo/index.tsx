import { useEffect, useState } from "react";
import type { Token } from "types";

const sizeClasses = {
  base: "size-5",
  large: "size-8",
};

type Props = Pick<Token, "logoURI" | "symbol"> & {
  size?: keyof typeof sizeClasses;
};

export const TokenLogo = function ({ logoURI, size = "base", symbol }: Props) {
  const sizeClass = sizeClasses[size];
  const [hasError, setHasError] = useState(false);

  useEffect(
    function resetOnUrlChange() {
      setHasError(false);
    },
    [logoURI],
  );

  if (!logoURI || hasError) {
    return (
      <div
        className={`flex ${sizeClass} items-center justify-center overflow-hidden rounded-full border border-solid border-white bg-neutral-50 text-[8px] font-semibold text-neutral-700`}
      >
        {symbol}
      </div>
    );
  }

  return (
    <img
      alt={`${symbol} logo`}
      className={`${sizeClass} rounded-full`}
      onError={() => setHasError(true)}
      src={logoURI}
    />
  );
};
