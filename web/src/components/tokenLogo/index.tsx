import { DefaultTokenLogo } from "components/defaultTokenLogo";
import { useEffect, useState } from "react";
import type { Token } from "types";

const sizeClasses = {
  base: "size-5",
  large: "size-8",
  medium: "size-6",
  small: "size-4",
  xLarge: "size-11",
};

type Props = Pick<Token, "logoURI" | "symbol"> & {
  size?: keyof typeof sizeClasses;
};

export const TokenLogo = function ({ logoURI, size = "base", symbol }: Props) {
  const [hasError, setHasError] = useState(false);

  useEffect(
    function resetOnUrlChange() {
      setHasError(false);
    },
    [logoURI],
  );

  if (!logoURI || hasError) {
    return <DefaultTokenLogo size={size} symbol={symbol} />;
  }

  return (
    <img
      alt={`${symbol} logo`}
      className={`${sizeClasses[size]} rounded-full`}
      onError={() => setHasError(true)}
      src={logoURI}
    />
  );
};
